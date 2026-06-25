import { prisma } from '@dmb/prisma';
import { GuildMember, TextChannel, Guild, EmbedBuilder, User } from 'discord.js';
import { DmbClient } from '../core/client';

export class ModerationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface ModerationResult {
  action: string;
  userId: string;
  moderatorId: string;
  reason: string;
  duration?: number;
}

async function logAction(
  _client: DmbClient,
  guild: Guild,
  data: {
    action: string;
    target: User;
    moderator: User;
    reason: string;
    duration?: number;
  }
) {
  const settings = await prisma.securitySettings.findUnique({
    where: { guildId: BigInt(guild.id) },
  });

  if (!settings?.logChannelId) return;

  const channel = guild.channels.cache.get(settings.logChannelId.toString()) as TextChannel | undefined;
  if (!channel?.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle(`Moderation: ${data.action}`)
    .setColor(data.action === 'warn' ? 0xffff00 : 0xff0000)
    .addFields(
      { name: 'User', value: `<@${data.target.id}> (${data.target.username})`, inline: true },
      { name: 'Moderator', value: `<@${data.moderator.id}> (${data.moderator.username})`, inline: true },
      { name: 'Reason', value: data.reason || 'No reason provided' }
    )
    .setTimestamp();

  if (data.duration) {
    embed.addFields({ name: 'Duration', value: `${data.duration} minutes` });
  }

  await channel.send({ embeds: [embed] }).catch(() => null);
}

export async function warnUser(
  client: DmbClient,
  guild: Guild,
  target: User,
  moderator: User,
  reason: string
): Promise<ModerationResult> {
  await prisma.warning.create({
    data: {
      guildId: BigInt(guild.id),
      userId: BigInt(target.id),
      moderatorId: BigInt(moderator.id),
      reason,
      points: 1,
    },
  });

  await logAction(client, guild, { action: 'warn', target, moderator, reason });
  return { action: 'warn', userId: target.id, moderatorId: moderator.id, reason };
}

export async function kickUser(
  client: DmbClient,
  guild: Guild,
  target: GuildMember,
  moderator: User,
  reason: string
): Promise<ModerationResult> {
  if (!target.kickable) {
    throw new ModerationError('NotKickable', 'Target cannot be kicked');
  }

  await target.kick(reason);

  await prisma.punishment.create({
    data: {
      guildId: BigInt(guild.id),
      userId: BigInt(target.id),
      moderatorId: BigInt(moderator.id),
      type: 'kick',
      reason,
    },
  });

  await logAction(client, guild, { action: 'kick', target: target.user, moderator, reason });
  return { action: 'kick', userId: target.id, moderatorId: moderator.id, reason };
}

export async function banUser(
  client: DmbClient,
  guild: Guild,
  target: User,
  moderator: User,
  reason: string,
  deleteMessagesDays = 0
): Promise<ModerationResult> {
  const member = await guild.members.fetch(target.id).catch(() => null);
  if (member && !member.bannable) {
    throw new ModerationError('NotBannable', 'Target cannot be banned');
  }

  await guild.bans.create(target.id, { reason, deleteMessageDays: deleteMessagesDays });

  await prisma.punishment.create({
    data: {
      guildId: BigInt(guild.id),
      userId: BigInt(target.id),
      moderatorId: BigInt(moderator.id),
      type: 'ban',
      reason,
    },
  });

  await logAction(client, guild, { action: 'ban', target, moderator, reason });
  return { action: 'ban', userId: target.id, moderatorId: moderator.id, reason };
}

export async function timeoutUser(
  client: DmbClient,
  guild: Guild,
  target: GuildMember,
  moderator: User,
  reason: string,
  durationMinutes: number
): Promise<ModerationResult> {
  if (!target.moderatable) {
    throw new ModerationError('NotModeratable', 'Target cannot be timed out');
  }

  await target.timeout(durationMinutes * 60 * 1000, reason);

  await prisma.punishment.create({
    data: {
      guildId: BigInt(guild.id),
      userId: BigInt(target.id),
      moderatorId: BigInt(moderator.id),
      type: 'timeout',
      reason,
      duration: durationMinutes,
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
    },
  });

  await logAction(client, guild, { action: 'timeout', target: target.user, moderator, reason, duration: durationMinutes });
  return {
    action: 'timeout',
    userId: target.id,
    moderatorId: moderator.id,
    reason,
    duration: durationMinutes,
  };
}

export async function getUserHistory(guildId: string, userId: string) {
  const guildIdBig = BigInt(guildId);
  const userIdBig = BigInt(userId);

  const [warnings, punishments] = await Promise.all([
    prisma.warning.findMany({
      where: { guildId: guildIdBig, userId: userIdBig },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.punishment.findMany({
      where: { guildId: guildIdBig, userId: userIdBig },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { warnings, punishments };
}
