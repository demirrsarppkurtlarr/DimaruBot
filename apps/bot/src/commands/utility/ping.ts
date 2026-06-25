import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { DmbClient } from '../../core/client';
import { SlashCommand } from '../types';

export const pingCommand: SlashCommand = {
  name: 'ping',
  type: 'slash',
  builder: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  execute: async (client: DmbClient, interaction: ChatInputCommandInteraction) => {
    await interaction.reply(`Pong! ${client.ws.ping}ms`);
  },
};
