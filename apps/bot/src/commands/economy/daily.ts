import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { claimDailyReward, RewardError } from '../../economy/rewards';

export const dailyCommand: SlashCommand = {
  name: 'daily',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily DimaCoin reward'),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    try {
      const result = await claimDailyReward(interaction.guildId, interaction.user.id);
      await interaction.reply(
        `🎁 Daily reward claimed! **+${result.total}** DimaCoin (streak: ${result.streak}).`
      );
    } catch (err) {
      const message = err instanceof RewardError ? err.message : 'Daily reward failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
