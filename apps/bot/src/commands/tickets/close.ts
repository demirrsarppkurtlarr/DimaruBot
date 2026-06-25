import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { closeTicket, TicketError } from '../../tickets/engine';

export const ticketCloseCommand: SlashCommand = {
  name: 'ticketclose',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('ticketclose')
    .setDescription('Close a support ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption((option) =>
      option.setName('ticket').setDescription('Ticket ID').setRequired(true)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const ticketId = interaction.options.getString('ticket', true);

    try {
      await closeTicket(interaction.guild, ticketId, interaction.user);
      await interaction.reply('🔒 Ticket closed.');
    } catch (err) {
      const message = err instanceof TicketError ? err.message : 'Ticket close failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
