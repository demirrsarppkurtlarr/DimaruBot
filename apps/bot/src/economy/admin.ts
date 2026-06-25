import { prisma } from '@dmb/prisma';
import { logAdminAction, logEconomyChange } from './audit';
import { updateTrustScore } from './trust';
import { FastifyRequest } from 'fastify';

export class AdminEconomyError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface AdminActionContext {
  adminId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function grantCoins(
  guildId: string,
  userId: string,
  amount: string,
  reason: string,
  context: AdminActionContext
) {
  const guildIdBig = BigInt(guildId);
  const userIdBig = BigInt(userId);
  const amountBig = BigInt(amount);

  if (amountBig <= 0n) {
    throw new AdminEconomyError('InvalidAmount', 'Amount must be positive');
  }

  const account = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
  });

  if (account?.isFrozen) {
    throw new AdminEconomyError('AccountFrozen', 'Target account is frozen');
  }

  const updated = await prisma.dimaCoinAccount.upsert({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
    create: {
      guildId: guildIdBig,
      userId: userIdBig,
      wallet: amountBig,
      totalEarned: amountBig,
    },
    update: {
      wallet: { increment: amountBig },
      totalEarned: { increment: amountBig },
      trustScore: updateTrustScore(account?.trustScore ?? 0, 2),
    },
  });

  await logAdminAction(
    'grant',
    { guildId, adminId: context.adminId, targetUserId: userId, amount: amountBig, reason },
    context
  );
  await logEconomyChange('grant', { wallet: updated.wallet.toString(), amount: amount.toString() }, context);

  return { amount: amountBig, wallet: updated.wallet };
}

export async function deductCoins(
  guildId: string,
  userId: string,
  amount: string,
  reason: string,
  context: AdminActionContext
) {
  const guildIdBig = BigInt(guildId);
  const userIdBig = BigInt(userId);
  const amountBig = BigInt(amount);

  if (amountBig <= 0n) {
    throw new AdminEconomyError('InvalidAmount', 'Amount must be positive');
  }

  const account = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
  });

  if (!account || account.isFrozen) {
    throw new AdminEconomyError('AccountFrozen', 'Target account is frozen or missing');
  }

  if (account.wallet < amountBig) {
    throw new AdminEconomyError('InsufficientFunds', 'Insufficient wallet balance');
  }

  const updated = await prisma.dimaCoinAccount.update({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
    data: {
      wallet: { decrement: amountBig },
      totalSpent: { increment: amountBig },
    },
  });

  await logAdminAction(
    'deduct',
    { guildId, adminId: context.adminId, targetUserId: userId, amount: amountBig, reason },
    context
  );
  await logEconomyChange('deduct', { wallet: updated.wallet.toString(), amount: amount.toString() }, context);

  return { amount: amountBig, wallet: updated.wallet };
}

export async function freezeAccount(
  guildId: string,
  userId: string,
  reason: string,
  context: AdminActionContext
) {
  const guildIdBig = BigInt(guildId);
  const userIdBig = BigInt(userId);

  const account = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
  });

  if (!account) {
    throw new AdminEconomyError('AccountNotFound', 'Account not found');
  }
  if (account.isFrozen) {
    throw new AdminEconomyError('AlreadyFrozen', 'Account is already frozen');
  }

  const updated = await prisma.dimaCoinAccount.update({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
    data: {
      isFrozen: true,
      frozenReason: reason,
      frozenAt: new Date(),
      frozenBy: BigInt(context.adminId),
    },
  });

  await logAdminAction(
    'freeze',
    { guildId, adminId: context.adminId, targetUserId: userId, reason },
    context
  );
  await logEconomyChange('freeze', { isFrozen: true, reason }, context);

  return { isFrozen: updated.isFrozen };
}

export function extractRequestContext(req: FastifyRequest, adminId: string): AdminActionContext {
  return {
    adminId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}
