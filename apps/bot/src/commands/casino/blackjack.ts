import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { placeBet, GameError } from '../../casino/games';

export const blackjackCommand: SlashCommand = {
  name: 'blackjack',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Play blackjack')
    .addStringOption((option) =>
      option.setName('amount').setDescription('Amount to bet').setRequired(true)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const amount = interaction.options.getString('amount', true);

    try {
      const result = await placeBet(interaction.guildId, interaction.user.id, 'blackjack', amount);
      const player = result.metadata.player as number;
      const dealer = result.metadata.dealer as number;
      await interaction.reply(
        result.won
          ? `🃏 You: **${player}**, Dealer: **${dealer}**. You won **${result.payout}** DimaCoin!`
          : `🃏 You: **${player}**, Dealer: **${dealer}**. You lost **${amount}** DimaCoin.`
      );
    } catch (err) {
      const message = err instanceof GameError ? err.message : 'Blackjack game failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
