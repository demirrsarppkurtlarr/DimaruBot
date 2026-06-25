import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSigner } from 'fast-jwt';
import { env } from '@dmb/config';
import { logger } from '@dmb/logger';

export interface TokenPayload {
  sub: string;
  username: string;
  avatar?: string;
  iat: number;
  exp: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: TokenPayload;
    user: TokenPayload;
  }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const payload = await req.jwtVerify<TokenPayload>();
    req.user = payload;
  } catch (err) {
    logger.error({ err }, 'JWT verification failed');
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function signTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>) {
  const accessSigner = createSigner({ key: env.JWT_ACCESS_SECRET, expiresIn: '15m' });
  const refreshSigner = createSigner({ key: env.JWT_REFRESH_SECRET, expiresIn: '7d' });
  const access = accessSigner({ ...payload, type: 'access' });
  const refresh = refreshSigner({ ...payload, type: 'refresh' });
  return { access, refresh };
}

export async function registerJwtPlugin(app: FastifyInstance): Promise<void> {
  const jwt = await import('@fastify/jwt');
  await app.register(jwt.default, {
    secret: env.JWT_ACCESS_SECRET,
    cookie: {
      cookieName: 'access_token',
      signed: false,
    },
  });

  app.decorate('authenticate', authenticate);
}
