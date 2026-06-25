import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { createWarning, createPunishment, getHistory, getGuildCases } from '../services/moderation';

export async function moderationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.post('/warn', async (req, reply) => {
    const { guildId, userId, reason } = req.body as { guildId: string; userId: string; reason: string };
    const moderatorId = req.user!.sub;
    const warning = await createWarning(guildId, userId, moderatorId, reason);
    return reply.send({ success: true, warning });
  });

  app.post('/punish', async (req, reply) => {
    const { guildId, userId, type, reason, duration } = req.body as {
      guildId: string;
      userId: string;
      type: string;
      reason: string;
      duration?: number;
    };
    const moderatorId = req.user!.sub;
    const punishment = await createPunishment(guildId, userId, moderatorId, type, reason, duration);
    return reply.send({ success: true, punishment });
  });

  app.get('/history/:guildId/:userId', async (req) => {
    const { guildId, userId } = req.params as { guildId: string; userId: string };
    return getHistory(guildId, userId);
  });

  app.get('/cases/:guildId', async (req) => {
    const { guildId } = req.params as { guildId: string };
    const { limit = '20', offset = '0' } = req.query as { limit?: string; offset?: string };
    return getGuildCases(guildId, parseInt(limit, 10), parseInt(offset, 10));
  });
}
