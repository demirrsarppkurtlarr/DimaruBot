import { prisma } from '@dmb/prisma';
import { createHash, randomUUID } from 'crypto';
import { redis } from '../services/redis';
import { getTierByTrust, getTransferFeeRate } from './trust';

const TRANSFER_LOCK_TTL = 10;
const TRANSFER_COOLDOWN_SECONDS = 5;

export interface TransferResult {
  transactionId: string;
  senderWallet: bigint;
  recipientWallet: bigint;
  fee: bigint;
  amount: bigint;
}

export interface TransferOptions {
  guildId: string;
  senderId: string;
  recipientId: string;
  amount: string;
  note?: string;
  skipCooldown?: boolean;
}

export class TransferError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export async function executeTransfer(options: TransferOptions): Promise<TransferResult> {
  const { guildId, senderId, recipientId, amount, note, skipCooldown } = options;

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

  if (!skipCooldown) {
    const cooldownKey = `transfer:cooldown:${guildId}:${senderId}`;
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      throw new TransferError('Cooldown', 'Transfer cooldown is active');
    }
  }

  const lockKey = `transfer:lock:${guildId}:${senderId}:${recipientId}`;
  const lock = await redis.set(lockKey, '1', 'EX', TRANSFER_LOCK_TTL, 'NX');
  if (!lock) {
    throw new TransferError('ConcurrentTransfer', 'Another transfer is in progress');
  }

  try {
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

    if (!skipCooldown) {
      await redis.setex(`transfer:cooldown:${guildId}:${senderId}`, TRANSFER_COOLDOWN_SECONDS, '1');
    }

    await redis.del(lockKey);

    return {
      transactionId,
      senderWallet: updatedSender.wallet,
      recipientWallet: updatedRecipient.wallet,
      fee,
      amount: amountBig,
    };
  } catch (err) {
    await redis.del(lockKey);
    throw err;
  }
}

function getTransferLimit(
  tier: 'new' | 'standard' | 'trusted' | 'premium',
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
    default:
      return settings.transferLimitNew;
  }
}
