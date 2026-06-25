import { prisma } from '@dmb/prisma';
import { createHash, randomUUID } from 'crypto';

export class JackpotError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function contributeToJackpot(
  guildId: string,
  poolType: string,
  amount: bigint
): Promise<void> {
  const guildIdBig = BigInt(guildId);
  await prisma.jackpotPool.upsert({
    where: { guildId_name: { guildId: guildIdBig, name: poolType } },
    create: {
      guildId: guildIdBig,
      name: poolType,
      poolType,
      balance: amount,
    },
    update: {
      balance: { increment: amount },
    },
  });
}

export async function awardJackpot(
  guildId: string,
  poolType: string,
  winnerId: string
): Promise<{ amount: bigint; transactionId: string }> {
  const guildIdBig = BigInt(guildId);
  const winnerIdBig = BigInt(winnerId);

  const pool = await prisma.jackpotPool.findUnique({
    where: { guildId_name: { guildId: guildIdBig, name: poolType } },
  });

  if (!pool || pool.balance <= 0n) {
    throw new JackpotError('EmptyPool', 'Jackpot pool is empty');
  }

  const amount = pool.balance;
  const transactionId = randomUUID();
  const securityHash = createHash('sha256')
    .update(`${transactionId}:${guildId}:${winnerId}:${amount}:${Date.now()}`)
    .digest('hex');

  await prisma.$transaction([
    prisma.jackpotPool.update({
      where: { guildId_name: { guildId: guildIdBig, name: poolType } },
      data: {
        balance: 0,
        lastWinnerId: winnerIdBig,
        lastWonAt: new Date(),
      },
    }),
    prisma.dimaCoinAccount.update({
      where: { guildId_userId: { guildId: guildIdBig, userId: winnerIdBig } },
      data: {
        wallet: { increment: amount },
        totalEarned: { increment: amount },
      },
    }),
    prisma.coinTransaction.create({
      data: {
        transactionId,
        guildId: guildIdBig,
        recipientId: winnerIdBig,
        type: 'jackpot_win',
        amount,
        fee: 0n,
        recipientBalanceAfter: 0n,
        securityHash,
        metadata: { poolType },
      },
    }),
  ]);

  return { amount, transactionId };
}
