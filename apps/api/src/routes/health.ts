import { FastifyInstance } from 'fastify';
import { prisma } from '@dmb/prisma';
import { redis } from 'ioredis';
import { env } from '@dmb/config';

const redisClient = new redis(env.REDIS_URL);

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { status: 'ok', service: 'dmb-api', timestamp: new Date().toISOString() };
  });

  app.get('/ready', async (req, reply) => {
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

  app.get('/metrics', async (req, reply) => {
    // TODO: expose Prometheus metrics
    return reply.status(501).send({ error: 'NotImplemented', message: 'Metrics endpoint coming soon.' });
  });
}
