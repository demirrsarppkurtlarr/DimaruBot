import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { kickUser, ModerationError } from '../../moderation/actions';

export const kickCommand: SlashCommand = {
  name: 'kick',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) => option.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason').setRequired(false)),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!interaction.guild) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
      return;
    }

    try {
      await kickUser(_client, interaction.guild, member, interaction.user, reason);
      await interaction.reply(`👢 Kicked <@${target.id}>: ${reason}`);
    } catch (err) {
      const message = err instanceof ModerationError ? err.message : 'Kick failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
