import { env } from '@dmb/config';

export const botConfig = {
  token: env.DISCORD_TOKEN,
  clientId: env.DISCORD_CLIENT_ID,
  defaultPrefix: '/',
  defaultLocale: 'en',
  ownerIds: env.GOD_MODE_USER_IDS.split(','),
  commandCooldown: 5,
} as const;
