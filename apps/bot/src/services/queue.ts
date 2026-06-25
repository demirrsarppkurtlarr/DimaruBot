import { Queue } from 'bullmq';
import { env } from '@dmb/config';
import { logger } from '@dmb/logger';

const connection = {
  url: env.REDIS_URL,
};

export const queues = {
  ai: new Queue('ai', { connection }),
  logs: new Queue('logs', { connection }),
  analytics: new Queue('analytics', { connection }),
  tickets: new Queue('tickets', { connection }),
  giveaways: new Queue('giveaways', { connection }),
  notifications: new Queue('notifications', { connection }),
  backups: new Queue('backups', { connection }),
};

export async function closeQueues(): Promise<void> {
  await Promise.all(Object.values(queues).map((q) => q.close()));
  logger.info('BullMQ queues closed');
}
