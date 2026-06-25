import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { createTicket, TicketError } from '../../tickets/engine';

export const ticketCreateCommand: SlashCommand = {
  name: 'ticket',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a support ticket')
    .addStringOption((option) =>
      option.setName('category').setDescription('Ticket category ID').setRequired(true)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const categoryId = interaction.options.getString('category', true);

    try {
      const result = await createTicket(interaction.guild, interaction.user, categoryId);
      await interaction.reply(`🎫 Ticket created: <#${result.channel.id}>`);
    } catch (err) {
      const message = err instanceof TicketError ? err.message : 'Ticket creation failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
