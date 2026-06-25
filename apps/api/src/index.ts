import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { env } from '@dmb/config';
import { logger } from '@dmb/logger';
import { prisma } from '@dmb/prisma';
import { registerJwtPlugin } from './plugins/auth';
import { healthRoutes } from './routes/health';
import { economyRoutes } from './routes/economy';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { moderationRoutes } from './routes/moderation';
import { levelsRoutes } from './routes/levels';

const app = Fastify({
  logger: false,
});

async function main() {
  await app.register(cors, { origin: env.DASHBOARD_URL, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(cookie);
  await registerJwtPlugin(app);

  await app.register(healthRoutes, { prefix: '/api/v1/health' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(economyRoutes, { prefix: '/api/v1/economy' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });
  await app.register(moderationRoutes, { prefix: '/api/v1/moderation' });
  await app.register(levelsRoutes, { prefix: '/api/v1/levels' });

  app.setErrorHandler((err, req, reply) => {
    logger.error({ err, reqId: req.id }, 'API error');
    reply.status(err.statusCode ?? 500).send({
      error: err.code ?? 'InternalError',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
  });

  const port = parseInt(env.API_PORT, 10);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`API server listening on port ${port}`);
}

main().catch(async (err) => {
  logger.fatal({ err }, 'Failed to start API');
  await prisma.$disconnect();
  process.exit(1);
});
