import { FastifyInstance } from 'fastify';
import { prisma, DimaCoinAccount } from '@dmb/prisma';
import { requireAuth } from '../middleware/auth';
import { requireGodMode } from '../middleware/admin';
import {
  grantCoins,
  deductCoins,
  freezeAccount,
  logEconomyChange,
  AdminEconomyError,
  extractRequestContext,
} from '../services/economy';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requireGodMode);

  app.get('/economy/accounts', async (req) => {
    const { guildId, limit = '20', offset = '0' } = req.query as {
      guildId: string;
      limit?: string;
      offset?: string;
    };

    const [accounts, total] = await Promise.all([
      prisma.dimaCoinAccount.findMany({
        where: { guildId: BigInt(guildId) },
        orderBy: { wallet: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      }),
      prisma.dimaCoinAccount.count({ where: { guildId: BigInt(guildId) } }),
    ]);

    return {
      accounts: accounts.map((a: DimaCoinAccount) => ({
        ...a,
        wallet: a.wallet.toString(),
        bank: a.bank.toString(),
        totalEarned: a.totalEarned.toString(),
        totalSpent: a.totalSpent.toString(),
      })),
      total,
    };
  });

  app.post('/economy/grant', async (req, reply) => {
    const { guildId, userId, amount, reason } = req.body as {
      guildId: string;
      userId: string;
      amount: string;
      reason?: string;
    };

    try {
      const result = await grantCoins(
        guildId,
        userId,
        amount,
        reason ?? '',
        extractRequestContext(req, req.user!.sub)
      );
      return reply.send({ success: true, amount: result.amount.toString(), wallet: result.wallet.toString() });
    } catch (err) {
      const code = err instanceof AdminEconomyError ? err.code : 'GrantFailed';
      return reply.status(400).send({ error: code, message: (err as Error).message });
    }
  });

  app.post('/economy/deduct', async (req, reply) => {
    const { guildId, userId, amount, reason } = req.body as {
      guildId: string;
      userId: string;
      amount: string;
      reason?: string;
    };

    try {
      const result = await deductCoins(
        guildId,
        userId,
        amount,
        reason ?? '',
        extractRequestContext(req, req.user!.sub)
      );
      return reply.send({ success: true, amount: result.amount.toString(), wallet: result.wallet.toString() });
    } catch (err) {
      const code = err instanceof AdminEconomyError ? err.code : 'DeductFailed';
      return reply.status(400).send({ error: code, message: (err as Error).message });
    }
  });

  app.post('/economy/freeze', async (req, reply) => {
    const { guildId, userId, reason } = req.body as { guildId: string; userId: string; reason: string };

    try {
      await freezeAccount(guildId, userId, reason, extractRequestContext(req, req.user!.sub));
      return reply.send({ success: true });
    } catch (err) {
      const code = err instanceof AdminEconomyError ? err.code : 'FreezeFailed';
      return reply.status(400).send({ error: code, message: (err as Error).message });
    }
  });

  app.get('/economy/settings', async (req) => {
    const { guildId } = req.query as { guildId: string };
    const settings = await prisma.economyAdvancedSettings.findUnique({
      where: { guildId: BigInt(guildId) },
    });
    return { settings };
  });

  app.put('/economy/settings', async (req, reply) => {
    const { guildId, ...data } = req.body as Record<string, unknown> & { guildId: string };

    const settings = await prisma.economyAdvancedSettings.upsert({
      where: { guildId: BigInt(guildId) },
      create: { guildId: BigInt(guildId), ...data } as never,
      update: data as never,
    });

    await logEconomyChange(
      'settings_update',
      { guildId, changes: data },
      extractRequestContext(req, req.user!.sub)
    );

    return reply.send({ settings });
  });
}
