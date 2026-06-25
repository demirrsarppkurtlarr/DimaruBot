import { Message } from 'discord.js';
import { DmbEvent } from './types';
import { addMessageXp, applyLevelRewards } from '../levels/engine';

export const messageCreateEvent: DmbEvent<'messageCreate'> = {
  name: 'messageCreate',
  once: false,
  execute: async (_client, message: Message) => {
    if (message.author.bot || !message.guild) return;

    const result = await addMessageXp(message.guild.id, message.author.id);
    if (result.leveledUp) {
      const member = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (member) {
        await applyLevelRewards(member, result.level);
      }
      await message.react('🎉').catch(() => null);
    }
  },
};
