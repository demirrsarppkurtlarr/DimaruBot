import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { timeoutUser, ModerationError } from '../../moderation/actions';

export const timeoutCommand: SlashCommand = {
  name: 'timeout',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('user').setDescription('User to timeout').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('minutes').setDescription('Timeout duration in minutes').setRequired(true)
    )
    .addStringOption((option) => option.setName('reason').setDescription('Reason').setRequired(false)),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes', true);
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
      await timeoutUser(_client, interaction.guild, member, interaction.user, reason, minutes);
      await interaction.reply(`⏳ Timed out <@${target.id}> for ${minutes} minutes: ${reason}`);
    } catch (err) {
      const message = err instanceof ModerationError ? err.message : 'Timeout failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
