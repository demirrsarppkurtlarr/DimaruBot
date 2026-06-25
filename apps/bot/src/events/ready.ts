import { Events } from 'discord.js';
import { DmbEvent } from './types';
import { logger } from '@dmb/logger';

export const readyEvent: DmbEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client) => {
    logger.info(`Bot ready as ${client.user.tag}`);
  },
};
