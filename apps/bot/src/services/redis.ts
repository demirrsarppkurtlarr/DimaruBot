import { Redis } from 'ioredis';
import { env } from '@dmb/config';
import { logger } from '@dmb/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

export const redisKeys = {
  cooldown: (guildId: string, userId: string, command: string) => `dmb:cd:${guildId}:${userId}:${command}`,
  guildCache: (guildId: string) => `dmb:cache:guild:${guildId}`,
  userCache: (userId: string) => `dmb:cache:user:${userId}`,
  session: (token: string) => `dmb:session:${token}`,
  aiQuota: (guildId: string) => `dmb:ai:rate:${guildId}`,
  xpBucket: (guildId: string, userId: string) => `dmb:xp:${guildId}:${userId}`,
  dailyFlag: (guildId: string, userId: string) => `dmb:economy:daily:${guildId}:${userId}`,
  transferRate: (guildId: string, userId: string) => `dmb:rate:transfer:${guildId}:${userId}`,
  gameRate: (guildId: string, userId: string, game: string) => `dmb:rate:game:${guildId}:${userId}:${game}`,
  shieldRaid: (guildId: string) => `dmb:shield:${guildId}:raid:joins`,
  txId: (txId: string) => `dmb:tx:id:${txId}`,
};
