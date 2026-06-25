import { prisma } from '@dmb/prisma';

const DAILY_STREAK_MAX = 7;

export interface DailyRewardResult {
  amount: bigint;
  streak: number;
  total: bigint;
}

export class RewardError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function claimDailyReward(
  guildId: string,
  userId: string
): Promise<DailyRewardResult> {
  const guildIdBig = BigInt(guildId);
  const userIdBig = BigInt(userId);

  const account = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
  });

  if (account?.isFrozen) {
    throw new RewardError('AccountFrozen', 'Account is frozen');
  }

  const settings = await prisma.economyAdvancedSettings.findUnique({
    where: { guildId: guildIdBig },
  });

  if (!settings) {
    throw new RewardError('SettingsMissing', 'Economy settings not found for this guild');
  }

  const now = new Date();
  let streak = 1;

  if (account?.lastDailyAt) {
    const last = new Date(account.lastDailyAt);
    const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      throw new RewardError('DailyCooldown', 'Daily reward already claimed');
    }
    if (diffHours < 48) {
      streak = Math.min((account.dailyStreak ?? 0) + 1, DAILY_STREAK_MAX);
    }
  }

  const base = BigInt(settings.dailyBase);
  const bonus = BigInt(settings.dailyStreakBonus) * BigInt(streak - 1);
  const total = base + bonus;

  await prisma.dimaCoinAccount.upsert({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
    create: {
      guildId: guildIdBig,
      userId: userIdBig,
      wallet: total,
      totalEarned: total,
      lastDailyAt: now,
      dailyStreak: streak,
    },
    update: {
      wallet: { increment: total },
      totalEarned: { increment: total },
      lastDailyAt: now,
      dailyStreak: streak,
    },
  });

  return { amount: base, streak, total };
}
