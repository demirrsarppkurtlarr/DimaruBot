import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { getMemberLevel } from '../../levels/engine';

export const rankCommand: SlashCommand = {
  name: 'rank',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your level and XP')
    .addUserOption((option) => option.setName('user').setDescription('User to check').setRequired(false)),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user') ?? interaction.user;

    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const data = await getMemberLevel(interaction.guildId, target.id);
    if (!data) {
      await interaction.reply({ content: 'No level data found.', ephemeral: true });
      return;
    }

    await interaction.reply(
      `🏆 ${target.username}: Level **${data.level}**, XP **${data.xp}** / **${data.nextLevelXp}**`
    );
  },
};
