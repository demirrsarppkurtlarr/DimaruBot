import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  ContextMenuCommandBuilder,
} from 'discord.js';
import { DmbClient } from '../core/client';

export type CommandType = 'slash' | 'context' | 'button' | 'select' | 'modal';

export interface BaseCommand {
  name: string;
  type: CommandType;
  permissions?: string[];
  cooldown?: number;
  premium?: boolean;
  guildOnly?: boolean;
  defer?: boolean;
  deferEphemeral?: boolean;
}

export interface SlashCommand extends BaseCommand {
  type: 'slash';
  builder: SlashCommandBuilder;
  execute: (client: DmbClient, interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface ContextCommand extends BaseCommand {
  type: 'context';
  builder: ContextMenuCommandBuilder;
  execute: (client: DmbClient, interaction: ContextMenuCommandInteraction) => Promise<void>;
}

export interface ButtonCommand extends BaseCommand {
  type: 'button';
  customId: string;
  execute: (client: DmbClient, interaction: ButtonInteraction) => Promise<void>;
}

export interface SelectCommand extends BaseCommand {
  type: 'select';
  customId: string;
  execute: (client: DmbClient, interaction: StringSelectMenuInteraction) => Promise<void>;
}

export interface ModalCommand extends BaseCommand {
  type: 'modal';
  customId: string;
  execute: (client: DmbClient, interaction: ModalSubmitInteraction) => Promise<void>;
}

export type DmbCommand = SlashCommand | ContextCommand | ButtonCommand | SelectCommand | ModalCommand;
