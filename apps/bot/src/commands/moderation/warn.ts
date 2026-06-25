import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { warnUser, ModerationError } from '../../moderation/actions';

export const warnCommand: SlashCommand = {
  name: 'warn',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason').setRequired(false)),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!interaction.guild) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    try {
      await warnUser(_client, interaction.guild, target, interaction.user, reason);
      await interaction.reply(`⚠️ Warned <@${target.id}>: ${reason}`);
    } catch (err) {
      const message = err instanceof ModerationError ? err.message : 'Warn failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
