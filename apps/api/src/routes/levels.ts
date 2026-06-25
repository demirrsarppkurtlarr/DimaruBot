import { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth';
import { getLeaderboard, getMemberLevel, getLevelRewards } from '../services/levels';

export async function levelsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/leaderboard', async (req) => {
    const { limit = '10' } = req.query as { limit?: string };
    return getLeaderboard(Math.min(parseInt(limit, 10), 100));
  });

  app.get('/guilds/:guildId/users/:userId', async (req) => {
    const { guildId, userId } = req.params as { guildId: string; userId: string };
    return getMemberLevel(guildId, userId);
  });

  app.get('/guilds/:guildId/rewards', async (req) => {
    const { guildId } = req.params as { guildId: string };
    return getLevelRewards(guildId);
  });
}
