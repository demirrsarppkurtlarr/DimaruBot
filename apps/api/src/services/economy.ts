import { prisma, Prisma } from '@dmb/prisma';
import { createHash, randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

export type TrustTier = 'new' | 'standard' | 'trusted' | 'premium';

export function getTierByTrust(score: number): TrustTier {
  if (score >= 80) return 'premium';
  if (score >= 50) return 'trusted';
  if (score >= 20) return 'standard';
  return 'new';
}

export function getTransferFeeRate(
  trustScore: number,
  settings: {
    transferFeeMin: number | bigint | DecimalLike;
    transferFeeMax: number | bigint | DecimalLike;
    transferFeeTrusted: number | bigint | DecimalLike;
  }
): number {
  if (trustScore >= 80) return toNumber(settings.transferFeeTrusted);
  if (trustScore >= 50) return toNumber(settings.transferFeeMin);
  return toNumber(settings.transferFeeMax);
}

type DecimalLike = { toNumber(): number } | number | bigint;

function toNumber(value: DecimalLike): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return value.toNumber();
}

export function getTransferLimit(
  tier: TrustTier,
  settings: {
    transferLimitNew: bigint;
    transferLimitStandard: bigint;
    transferLimitTrusted: bigint;
    transferLimitPremium: bigint;
  }
): bigint {
  switch (tier) {
    case 'new':
      return settings.transferLimitNew;
    case 'standard':
      return settings.transferLimitStandard;
    case 'trusted':
      return settings.transferLimitTrusted;
    case 'premium':
      return settings.transferLimitPremium;
  }
}

export class TransferError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface TransferResult {
  transactionId: string;
  senderWallet: bigint;
  recipientWallet: bigint;
  fee: bigint;
  amount: bigint;
}

export async function executeTransfer(options: {
  guildId: string;
  senderId: string;
  recipientId: string;
  amount: string;
  note?: string;
}): Promise<TransferResult> {
  const { guildId, senderId, recipientId, amount, note } = options;

  if (senderId === recipientId) {
    throw new TransferError('SelfTransfer', 'Cannot transfer to yourself');
  }

  const guildIdBig = BigInt(guildId);
  const senderIdBig = BigInt(senderId);
  const recipientIdBig = BigInt(recipientId);
  const amountBig = BigInt(amount);

  if (amountBig <= 0n) {
    throw new TransferError('InvalidAmount', 'Amount must be positive');
  }

  const settings = await prisma.economyAdvancedSettings.findUnique({
    where: { guildId: guildIdBig },
  });

  if (!settings || !settings.transfersEnabled) {
    throw new TransferError('TransfersDisabled', 'Transfers are disabled for this guild');
  }

  const sender = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: senderIdBig } },
  });

  const recipient = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: recipientIdBig } },
  });

  if (!sender || sender.isFrozen) {
    throw new TransferError('SenderFrozen', 'Sender account is frozen');
  }
  if (!recipient || recipient.isFrozen) {
    throw new TransferError('RecipientFrozen', 'Recipient account is frozen');
  }

  const tier = getTierByTrust(sender.trustScore);
  const limit = getTransferLimit(tier, settings);
  if (amountBig > limit) {
    throw new TransferError('LimitExceeded', `Transfer limit exceeded for tier ${tier}`);
  }

  if (sender.wallet < amountBig) {
    throw new TransferError('InsufficientFunds', 'Insufficient wallet balance');
  }

  const feeRate = getTransferFeeRate(sender.trustScore, settings);
  const fee = (amountBig * BigInt(Math.round(feeRate * 100))) / 10000n;
  const recipientAmount = amountBig - fee;

  const transactionId = randomUUID();
  const securityHash = createHash('sha256')
    .update(`${transactionId}:${guildId}:${senderId}:${recipientId}:${amountBig}:${Date.now()}`)
    .digest('hex');

  const [updatedSender, updatedRecipient] = await prisma.$transaction([
    prisma.dimaCoinAccount.update({
      where: { guildId_userId: { guildId: guildIdBig, userId: senderIdBig } },
      data: {
        wallet: { decrement: amountBig },
        totalSpent: { increment: amountBig },
      },
    }),
    prisma.dimaCoinAccount.update({
      where: { guildId_userId: { guildId: guildIdBig, userId: recipientIdBig } },
      data: {
        wallet: { increment: recipientAmount },
        totalEarned: { increment: recipientAmount },
      },
    }),
    prisma.coinTransaction.create({
      data: {
        transactionId,
        guildId: guildIdBig,
        senderId: senderIdBig,
        recipientId: recipientIdBig,
        type: 'transfer',
        amount: amountBig,
        fee,
        senderBalanceAfter: sender.wallet - amountBig,
        recipientBalanceAfter: recipient.wallet + recipientAmount,
        securityHash,
        metadata: { note: note ?? null, feeRate },
      },
    }),
  ]);

  return {
    transactionId,
    senderWallet: updatedSender.wallet,
    recipientWallet: updatedRecipient.wallet,
    fee,
    amount: amountBig,
  };
}

export type AuditAction =
  | 'grant'
  | 'deduct'
  | 'freeze'
  | 'unfreeze'
  | 'transfer'
  | 'daily_claim'
  | 'settings_update';

export interface AdminActionContext {
  adminId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminEconomyError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function logAdminAction(
  action: AuditAction,
  data: {
    guildId?: string;
    adminId: string;
    targetUserId?: string;
    amount?: bigint;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
  context?: AdminActionContext
) {
  await prisma.adminAction.create({
    data: {
      guildId: data.guildId ? BigInt(data.guildId) : null,
      adminId: BigInt(data.adminId),
      targetUserId: data.targetUserId ? BigInt(data.targetUserId) : null,
      actionType: action,
      amount: data.amount ?? null,
      reason: data.reason ?? '',
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    },
  });
}

export async function logEconomyChange(
  action: AuditAction,
  changes: Record<string, unknown>,
  context?: AdminActionContext & { guildId?: string; userId?: string }
) {
  await prisma.economyAuditLog.create({
    data: {
      guildId: context?.guildId ? BigInt(context.guildId) : null,
      userId: context?.userId ? BigInt(context.userId) : null,
      action,
      entity: 'DimaCoinAccount',
      adminId: context?.adminId ? BigInt(context.adminId) : null,
      changes: changes as Prisma.InputJsonValue,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    },
  });
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
      trustScore: Math.min(100, (account?.trustScore ?? 0) + 2),
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
