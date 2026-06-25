import { Events, Guild } from 'discord.js';
import { DmbEvent } from './types';
import { prisma } from '@dmb/prisma';
import { logger } from '@dmb/logger';

export const guildCreateEvent: DmbEvent = {
  name: Events.GuildCreate,
  execute: async (_client, ...args: unknown[]) => {
    const guild = args[0] as Guild;
    logger.info({ guildId: guild.id, name: guild.name }, 'Joined guild');

    await prisma.guild.upsert({
      where: { id: BigInt(guild.id) },
      create: {
        id: BigInt(guild.id),
        name: guild.name,
        ownerId: BigInt(guild.ownerId),
        locale: 'en',
      },
      update: {
        name: guild.name,
        ownerId: BigInt(guild.ownerId),
        leftAt: null,
      },
    });
  },
};
