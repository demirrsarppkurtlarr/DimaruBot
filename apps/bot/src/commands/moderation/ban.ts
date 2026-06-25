import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { banUser, ModerationError } from '../../moderation/actions';

export const banCommand: SlashCommand = {
  name: 'ban',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) => option.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption((option) =>
      option.setName('delete_messages').setDescription('Delete messages from last N days').setRequired(false)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_messages') ?? 0;

    if (!interaction.guild) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    try {
      await banUser(_client, interaction.guild, target, interaction.user, reason, deleteDays);
      await interaction.reply(`🔨 Banned <@${target.id}>: ${reason}`);
    } catch (err) {
      const message = err instanceof ModerationError ? err.message : 'Ban failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
