import { prisma } from '@dmb/prisma';
import { generateRoll } from './rng';
import { contributeToJackpot } from './jackpot';
import { createHash, randomUUID } from 'crypto';

export class GameError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

export interface GameResult {
  won: boolean;
  payout: bigint;
  roll: number;
  metadata: Record<string, unknown>;
  transactionId: string;
}

export async function placeBet(
  guildId: string,
  userId: string,
  gameType: string,
  amount: string,
  choice?: string,
  clientSeed?: string
): Promise<GameResult> {
  const guildIdBig = BigInt(guildId);
  const userIdBig = BigInt(userId);
  const amountBig = BigInt(amount);

  if (amountBig <= 0n) {
    throw new GameError('InvalidAmount', 'Amount must be positive');
  }

  const settings = await prisma.economyAdvancedSettings.findUnique({
    where: { guildId: guildIdBig },
  });

  if (!settings || !settings.casinoEnabled) {
    throw new GameError('CasinoDisabled', 'Casino is disabled for this guild');
  }

  const account = await prisma.dimaCoinAccount.findUnique({
    where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
  });

  if (!account || account.isFrozen) {
    throw new GameError('AccountFrozen', 'Account is frozen or missing');
  }
  if (account.wallet < amountBig) {
    throw new GameError('InsufficientFunds', 'Insufficient wallet balance');
  }

  const houseEdge = toNumber(settings.houseEdgeDefault);
  const contribution = (amountBig * 1n) / 100n; // 1% to jackpot

  const rollResult = await generateRoll(guildId, clientSeed, 100);
  const roll = rollResult.roll;

  let won = false;
  let payout = 0n;
  const metadata: Record<string, unknown> = {
    ...rollResult,
    gameType,
    choice: choice ?? null,
  };

  if (gameType === 'slot') {
    const combos = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
    const reels = [
      combos[Math.floor((roll / 100) * combos.length) % combos.length],
      combos[Math.floor(((roll * 7) / 100) * combos.length) % combos.length],
      combos[Math.floor(((roll * 13) / 100) * combos.length) % combos.length],
    ];
    won = reels[0] === reels[1] && reels[1] === reels[2];
    if (won) payout = amountBig * 5n;
    metadata.reels = reels;
  } else if (gameType === 'roulette') {
    const number = roll % 37;
    const color = number === 0 ? 'green' : number % 2 === 0 ? 'black' : 'red';
    won = choice === color || choice === number.toString();
    payout = won ? amountBig * 2n : 0n;
    metadata.number = number;
    metadata.color = color;
  } else if (gameType === 'blackjack') {
    const player = Math.min(21, 12 + (roll % 10));
    const dealer = Math.min(21, 12 + ((roll * 3) % 10));
    won = player > dealer && player <= 21;
    payout = won ? amountBig * 2n : 0n;
    metadata.player = player;
    metadata.dealer = dealer;
  } else {
    throw new GameError('UnknownGame', `Unknown game type: ${gameType}`);
  }

  // Apply house edge to net payout for the platform
  const netPayout = won ? (payout * BigInt(Math.round((1 - houseEdge) * 100))) / 100n : 0n;

  const transactionId = randomUUID();
  const securityHash = createHash('sha256')
    .update(`${transactionId}:${guildId}:${userId}:${gameType}:${amountBig}:${roll}`)
    .digest('hex');

  await prisma.$transaction([
    prisma.dimaCoinAccount.update({
      where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
      data: {
        wallet: { decrement: amountBig },
        totalSpent: { increment: amountBig },
      },
    }),
    ...(won
      ? [
          prisma.dimaCoinAccount.update({
            where: { guildId_userId: { guildId: guildIdBig, userId: userIdBig } },
            data: {
              wallet: { increment: netPayout },
              totalEarned: { increment: netPayout },
            },
          }),
        ]
      : []),
    prisma.coinTransaction.create({
      data: {
        transactionId,
        guildId: guildIdBig,
        senderId: userIdBig,
        recipientId: userIdBig,
        type: `game_${gameType}`,
        amount: amountBig,
        fee: won ? payout - netPayout : 0n,
        senderBalanceAfter: account.wallet - amountBig + (won ? netPayout : 0n),
        recipientBalanceAfter: account.wallet - amountBig + (won ? netPayout : 0n),
        securityHash,
        metadata,
      },
    }),
  ]);

  await contributeToJackpot(guildId, 'casino', contribution);

  return { won, payout: netPayout, roll, metadata, transactionId };
}

function toNumber(value: { toNumber(): number } | number | bigint): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return value.toNumber();
}
