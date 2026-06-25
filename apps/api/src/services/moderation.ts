import { prisma } from '@dmb/prisma';

export class ModerationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function createWarning(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string
) {
  return prisma.warning.create({
    data: {
      guildId: BigInt(guildId),
      userId: BigInt(userId),
      moderatorId: BigInt(moderatorId),
      reason,
      points: 1,
    },
  });
}

export async function createPunishment(
  guildId: string,
  userId: string,
  moderatorId: string,
  type: string,
  reason: string,
  duration?: number
) {
  return prisma.punishment.create({
    data: {
      guildId: BigInt(guildId),
      userId: BigInt(userId),
      moderatorId: BigInt(moderatorId),
      type,
      reason,
      duration,
      expiresAt: duration ? new Date(Date.now() + duration * 60 * 1000) : null,
    },
  });
}

export async function getHistory(guildId: string, userId: string) {
  const [warnings, punishments] = await Promise.all([
    prisma.warning.findMany({
      where: { guildId: BigInt(guildId), userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.punishment.findMany({
      where: { guildId: BigInt(guildId), userId: BigInt(userId) },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { warnings, punishments, total: warnings.length + punishments.length };
}

export async function getGuildCases(guildId: string, limit = 20, offset = 0) {
  const [warnings, punishments] = await Promise.all([
    prisma.warning.findMany({
      where: { guildId: BigInt(guildId) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.punishment.findMany({
      where: { guildId: BigInt(guildId) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return { warnings, punishments };
}
