import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { getLeaderboard } from '../../levels/engine';

export const leaderboardCommand: SlashCommand = {
  name: 'leaderboard',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the XP leaderboard')
    .addIntegerOption((option) =>
      option.setName('limit').setDescription('Number of users to show').setRequired(false)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const limit = interaction.options.getInteger('limit') ?? 10;
    const rows = await getLeaderboard(interaction.guildId, Math.min(limit, 25));

    const lines = rows.map(
      (row) => `${row.rank}. <@${row.memberId}> — Level ${row.level} (${row.xp} XP)`
    );

    await interaction.reply(lines.length ? lines.join('\n') : 'No leaderboard data yet.');
  },
};
