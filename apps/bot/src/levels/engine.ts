import { prisma, Level } from '@dmb/prisma';
import { GuildMember } from 'discord.js';

const XP_COOLDOWN_MS = 60_000;
const XP_PER_MESSAGE = 15;
const XP_VARIANCE = 10;

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function calculateLevel(xp: number): { level: number; nextLevelXp: number; currentLevelXp: number } {
  let level = 0;
  let nextLevelXp = xpForLevel(level + 1);
  while (xp >= nextLevelXp) {
    level++;
    nextLevelXp = xpForLevel(level + 1);
  }
  const currentLevelXp = xpForLevel(level);
  return { level, nextLevelXp, currentLevelXp };
}

export function generateMemberId(guildId: string, userId: string): bigint {
  return BigInt(guildId + userId);
}

export async function addMessageXp(
  guildId: string,
  userId: string
): Promise<{ level: number; xp: number; leveledUp: boolean }> {
  const memberId = generateMemberId(guildId, userId);
  const now = new Date();

  const existing = await prisma.level.findUnique({ where: { memberId } });
  if (existing?.lastAwardedAt && now.getTime() - new Date(existing.lastAwardedAt).getTime() < XP_COOLDOWN_MS) {
    return { level: existing.level, xp: existing.xp, leveledUp: false };
  }

  const gained = XP_PER_MESSAGE + Math.floor(Math.random() * (XP_VARIANCE + 1));
  const newXp = (existing?.xp ?? 0) + gained;
  const newMessages = (existing?.messages ?? 0) + 1;
  const { level: newLevel } = calculateLevel(newXp);
  const leveledUp = newLevel > (existing?.level ?? 0);

  const updated = await prisma.level.upsert({
    where: { memberId },
    create: {
      memberId,
      xp: newXp,
      level: newLevel,
      messages: newMessages,
      lastAwardedAt: now,
    },
    update: {
      xp: newXp,
      level: newLevel,
      messages: newMessages,
      lastAwardedAt: now,
    },
  });

  return { level: updated.level, xp: updated.xp, leveledUp };
}

export async function applyLevelRewards(member: GuildMember, newLevel: number): Promise<string[]> {
  const guildId = BigInt(member.guild.id);
  const rewards = await prisma.levelReward.findMany({
    where: { guildId, level: { lte: newLevel } },
  });

  const applied: string[] = [];
  for (const reward of rewards) {
    const role = member.guild.roles.cache.get(reward.roleId.toString());
    if (!role) continue;
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role).catch(() => null);
      applied.push(role.name);
    }
  }
  return applied;
}

export async function getLeaderboard(_guildId: string, limit = 10) {
  const rows = await prisma.level.findMany({
    orderBy: [{ xp: 'desc' }, { messages: 'desc' }],
    take: limit,
  });

  return rows.map((row: Level, index: number) => ({
    rank: index + 1,
    memberId: row.memberId.toString(),
    level: row.level,
    xp: row.xp,
    messages: row.messages,
  }));
}

export async function getMemberLevel(guildId: string, userId: string) {
  const memberId = generateMemberId(guildId, userId);
  const row = await prisma.level.findUnique({ where: { memberId } });
  if (!row) return null;

  const { nextLevelXp, currentLevelXp } = calculateLevel(row.xp);
  return {
    memberId: row.memberId.toString(),
    level: row.level,
    xp: row.xp,
    messages: row.messages,
    nextLevelXp,
    currentLevelXp,
  };
}
