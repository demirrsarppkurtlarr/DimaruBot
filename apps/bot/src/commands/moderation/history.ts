import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { getUserHistory } from '../../moderation/actions';

export const historyCommand: SlashCommand = {
  name: 'history',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View moderation history of a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((option) => option.setName('user').setDescription('User').setRequired(true)),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user', true);

    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const { warnings, punishments } = await getUserHistory(interaction.guildId, target.id);
    const total = warnings.length + punishments.length;

    await interaction.reply(
      `📋 History for <@${target.id}>: **${total}** entries (${warnings.length} warnings, ${punishments.length} punishments).`
    );
  },
};
