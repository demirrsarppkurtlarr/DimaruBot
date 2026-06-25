import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { placeBet, GameError } from '../../casino/games';

export const slotCommand: SlashCommand = {
  name: 'slot',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('slot')
    .setDescription('Play the slot machine')
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
      const result = await placeBet(interaction.guildId, interaction.user.id, 'slot', amount);
      const reels = (result.metadata.reels as string[]).join(' ');
      await interaction.reply(
        result.won
          ? `🎰 ${reels}\nYou won **${result.payout}** DimaCoin!`
          : `🎰 ${reels}\nYou lost **${amount}** DimaCoin.`
      );
    } catch (err) {
      const message = err instanceof GameError ? err.message : 'Slot game failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
