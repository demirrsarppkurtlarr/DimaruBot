import { FastifyInstance } from 'fastify';
import { prisma } from '@dmb/prisma';
import { requireAuth } from '../middleware/auth';
import { executeTransfer, TransferError } from '../services/economy';
import { claimDailyReward, RewardError } from '../services/rewards';

export async function economyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/guilds/:guildId/balance', async (req) => {
    const { guildId } = req.params as { guildId: string };
    const userId = req.user!.sub;

    const account = await prisma.dimaCoinAccount.findUnique({
      where: { guildId_userId: { guildId: BigInt(guildId), userId: BigInt(userId) } },
    });

    if (!account) {
      return { guildId, wallet: 0, bank: 0 };
    }

    return {
      guildId,
      userId,
      wallet: account.wallet.toString(),
      bank: account.bank.toString(),
      totalEarned: account.totalEarned.toString(),
      totalSpent: account.totalSpent.toString(),
      trustScore: account.trustScore,
    };
  });

  app.get('/guilds/:guildId/transactions', async (req) => {
    const { guildId } = req.params as { guildId: string };
    const userId = req.user!.sub;
    const { limit = '20', offset = '0' } = req.query as { limit?: string; offset?: string };

    const [transactions, total] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: {
          guildId: BigInt(guildId),
          OR: [{ senderId: BigInt(userId) }, { recipientId: BigInt(userId) }],
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.coinTransaction.count({
        where: {
          guildId: BigInt(guildId),
          OR: [{ senderId: BigInt(userId) }, { recipientId: BigInt(userId) }],
        },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        amount: t.amount.toString(),
        fee: t.fee.toString(),
      })),
      total,
    };
  });

  app.post('/guilds/:guildId/transfer', async (req, reply) => {
    const { guildId } = req.params as { guildId: string };
    const userId = req.user!.sub;
    const { recipientId, amount, note } = req.body as {
      recipientId: string;
      amount: string;
      note?: string;
    };

    try {
      const result = await executeTransfer({
        guildId,
        senderId: userId,
        recipientId,
        amount,
        note,
      });

      return reply.send({
        transactionId: result.transactionId,
        senderWallet: result.senderWallet.toString(),
        recipientWallet: result.recipientWallet.toString(),
        fee: result.fee.toString(),
        amount: result.amount.toString(),
      });
    } catch (err) {
      const code = err instanceof TransferError ? err.code : 'TransferFailed';
      const status = code === 'InsufficientFunds' || code === 'SelfTransfer' ? 400 : 403;
      return reply.status(status).send({ error: code, message: (err as Error).message });
    }
  });

  app.post('/guilds/:guildId/daily', async (req, reply) => {
    const { guildId } = req.params as { guildId: string };
    const userId = req.user!.sub;

    try {
      const result = await claimDailyReward(guildId, userId);
      return reply.send({
        amount: result.amount.toString(),
        streak: result.streak,
        total: result.total.toString(),
      });
    } catch (err) {
      const code = err instanceof RewardError ? err.code : 'DailyFailed';
      return reply.status(400).send({ error: code, message: (err as Error).message });
    }
  });

  app.post('/games/:gameType/bet', async (req, reply) => {
    const { gameType } = req.params as { gameType: string };
    const userId = req.user!.sub;
    const { guildId, amount, choice } = req.body as { guildId: string; amount: string; choice?: string };

    // TODO: call game engine with RNG seed
    return reply.status(501).send({
      error: 'NotImplemented',
      message: `Game engine for ${gameType} will be implemented in next phase.`,
    });
  });
}
