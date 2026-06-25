import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';
import { executeTransfer, TransferError } from '../../economy/transfer';

export const transferCommand: SlashCommand = {
  name: 'transfer',
  type: 'slash',
  builder: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer DimaCoin to another user')
    .addUserOption((option) =>
      option.setName('user').setDescription('Recipient').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('amount').setDescription('Amount to transfer').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('note').setDescription('Optional note').setRequired(false)
    ),
  execute: async (_client: DmbClient, interaction: ChatInputCommandInteraction) => {
    const recipient = interaction.options.getUser('user', true);
    const amount = interaction.options.getString('amount', true);
    const note = interaction.options.getString('note') ?? undefined;

    try {
      const result = await executeTransfer({
        guildId: interaction.guildId!,
        senderId: interaction.user.id,
        recipientId: recipient.id,
        amount,
        note,
      });

      await interaction.reply(
        `✅ Transfer complete! Sent **${result.amount}** DimaCoin to <@${recipient.id}> (fee: ${result.fee}).`
      );
    } catch (err) {
      const message = err instanceof TransferError ? err.message : 'Transfer failed.';
      await interaction.reply({ content: `❌ ${message}`, ephemeral: true });
    }
  },
};
