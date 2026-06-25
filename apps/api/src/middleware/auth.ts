import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '@dmb/logger';
import { TokenPayload } from '../plugins/auth';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') ?? req.cookies.access_token;
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const payload = await req.server.jwt.verify<TokenPayload>(token);
    req.user = payload;
  } catch (err) {
    logger.error({ err }, 'Auth middleware failed');
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}
