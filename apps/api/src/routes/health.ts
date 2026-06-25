import { FastifyInstance } from 'fastify';
import { prisma } from '@dmb/prisma';
import { Redis } from 'ioredis';
import { env } from '@dmb/config';

const redisClient = new Redis(env.REDIS_URL);

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { status: 'ok', service: 'dmb-api', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async (_req, reply) => {
    const checks: Record<string, boolean> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      checks.database = false;
    }

    try {
      await redisClient.ping();
      checks.redis = true;
    } catch {
      checks.redis = false;
    }

    const ok = Object.values(checks).every(Boolean);
    reply.status(ok ? 200 : 503);
    return { ready: ok, checks };
  });

  app.get('/metrics', async (_req, reply) => {
    const mem = process.memoryUsage();
    return reply.send({
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: mem.external,
      },
    });
  });
}
