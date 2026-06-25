import { prisma, Level } from '@dmb/prisma';

function generateMemberId(guildId: string, userId: string): bigint {
  return BigInt(guildId + userId);
}

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
  return { level, nextLevelXp, currentLevelXp: xpForLevel(level) };
}

export async function getLeaderboard(limit = 10) {
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

export async function getLevelRewards(guildId: string) {
  return prisma.levelReward.findMany({
    where: { guildId: BigInt(guildId) },
    orderBy: { level: 'asc' },
  });
}
