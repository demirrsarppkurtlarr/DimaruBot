import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { env } from '@dmb/config';
import { logger } from '@dmb/logger';
import { signTokens } from '../plugins/auth';

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
}

export async function authRoutes(app: FastifyInstance) {
  app.get('/discord', async (req, reply) => {
    const state = generateState();
    const url = new URL('https://discord.com/oauth2/authorize');
    url.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
    url.searchParams.set('redirect_uri', `${env.DASHBOARD_URL}/api/auth/discord/callback`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'identify guilds');
    url.searchParams.set('state', state);

    reply.setCookie('oauth_state', state, { path: '/', httpOnly: true, sameSite: 'lax' });
    return reply.redirect(url.toString());
  });

  app.get('/discord/callback', async (req, reply) => {
    const { code, state } = req.query as { code?: string; state?: string };
    const savedState = req.cookies.oauth_state;

    if (!code || !state || state !== savedState) {
      return reply.status(400).send({ error: 'InvalidOAuthState' });
    }

    try {
      const tokenRes = await axios.post<DiscordTokenResponse>(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${env.DASHBOARD_URL}/api/auth/discord/callback`,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const userRes = await axios.get<DiscordUser>('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      });

      const { access, refresh } = signTokens({
        sub: userRes.data.id,
        username: userRes.data.username,
        avatar: userRes.data.avatar ?? undefined,
      });

      reply.setCookie('access_token', access, { path: '/', httpOnly: true, sameSite: 'lax' });
      reply.setCookie('refresh_token', refresh, { path: '/', httpOnly: true, sameSite: 'lax' });

      return reply.redirect(`${env.DASHBOARD_URL}/dashboard`);
    } catch (err) {
      logger.error({ err }, 'Discord OAuth callback failed');
      return reply.status(500).send({ error: 'OAuthFailed' });
    }
  });

  app.get('/me', async (req, reply) => {
    if (!req.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    return {
      id: req.user.sub,
      username: req.user.username,
      avatar: req.user.avatar,
    };
  });

  app.post('/refresh', async (req, reply) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const payload = await app.jwt.verify(refreshToken);
      const { access, refresh } = signTokens({
        sub: payload.sub,
        username: payload.username,
        avatar: payload.avatar,
      });

      reply.setCookie('access_token', access, { path: '/', httpOnly: true, sameSite: 'lax' });
      reply.setCookie('refresh_token', refresh, { path: '/', httpOnly: true, sameSite: 'lax' });

      return { access };
    } catch (err) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}

function generateState(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}
