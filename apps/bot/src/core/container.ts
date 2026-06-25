import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { DmbClient } from './client';

export interface ServiceContainer {
  client: DmbClient;
  redis: Redis;
  queues: {
    ai: Queue;
    logs: Queue;
    analytics: Queue;
    tickets: Queue;
    giveaways: Queue;
    notifications: Queue;
    backups: Queue;
  };
}

let container: ServiceContainer | null = null;

export function setContainer(c: ServiceContainer): void {
  container = c;
}

export function getContainer(): ServiceContainer {
  if (!container) {
    throw new Error('Service container not initialized');
  }
  return container;
}
