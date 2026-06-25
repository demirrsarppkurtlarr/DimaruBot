import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { placeBet, GameError } from '../../casino/games';

export const rouletteCommand: SlashCommand = {
  name: 'roulette',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Play roulette')
    .addStringOption((option) =>
      option.setName('amount').setDescription('Amount to bet').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('choice').setDescription('red, black, or a number 0-36').setRequired(true)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const amount = interaction.options.getString('amount', true);
    const choice = interaction.options.getString('choice', true);

    try {
      const result = await placeBet(interaction.guildId, interaction.user.id, 'roulette', amount, choice);
      const number = result.metadata.number as number;
      const color = result.metadata.color as string;
      await interaction.reply(
        result.won
          ? `🎡 Ball landed on **${number} ${color}**! You won **${result.payout}** DimaCoin.`
          : `🎡 Ball landed on **${number} ${color}**. You lost **${amount}** DimaCoin.`
      );
    } catch (err) {
      const message = err instanceof GameError ? err.message : 'Roulette game failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
