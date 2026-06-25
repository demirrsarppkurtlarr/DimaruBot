import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { prisma } from '@dmb/prisma';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';

export const balanceCommand: SlashCommand = {
  name: 'balance',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your DimaCoin balance')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to check').setRequired(false)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const target = interaction.options.getUser('user') ?? interaction.user;
    if (!interaction.guildId) {
      await interaction.reply({ content: 'This command only works in a guild.', ephemeral: true });
      return;
    }

    const account = await prisma.dimaCoinAccount.findUnique({
      where: {
        guildId_userId: {
          guildId: BigInt(interaction.guildId),
          userId: BigInt(target.id),
        },
      },
    });

    const wallet = account?.wallet ?? 0n;
    const bank = account?.bank ?? 0n;

    await interaction.reply(
      `💰 ${target.username}'s DimaCoin balance:\nWallet: **${wallet}**\nBank: **${bank}**\nTotal: **${wallet + bank}**`
    );
  },
};
