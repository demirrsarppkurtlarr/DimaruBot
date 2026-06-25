import { FastifyRequest, FastifyReply } from 'fastify';
import { getGodModeUserIds } from '@dmb/config';

export async function requireGodMode(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = req.user?.sub;
  if (!userId || !getGodModeUserIds().includes(userId)) {
    return reply.status(403).send({ error: 'GodModeRequired' });
  }
}
