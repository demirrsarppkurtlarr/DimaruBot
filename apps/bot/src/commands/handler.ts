import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  Interaction,
} from 'discord.js';
import { DmbClient } from '../core/client';
import { CommandRegistry } from './registry';
import { logger } from '@dmb/logger';
import { redis, redisKeys } from '../services/redis';

export class CommandHandler {
  constructor(private registry: CommandRegistry) {}

  async handleSlash(client: DmbClient, interaction: ChatInputCommandInteraction): Promise<void> {
    const command = this.registry.get(interaction.commandName);
    if (!command || command.type !== 'slash') {
      await interaction.reply({ content: 'Unknown command.', ephemeral: true });
      return;
    }

    await this.runWithCooldown(command, interaction, () => command.execute(client, interaction));
  }

  async handleContext(client: DmbClient, interaction: ContextMenuCommandInteraction): Promise<void> {
    const command = this.registry.get(interaction.commandName);
    if (!command || command.type !== 'context') {
      await interaction.reply({ content: 'Unknown context command.', ephemeral: true });
      return;
    }

    await this.runWithCooldown(command, interaction, () => command.execute(client, interaction));
  }

  async handleButton(client: DmbClient, interaction: ButtonInteraction): Promise<void> {
    const command = this.registry.getByCustomId(interaction.customId);
    if (!command || command.type !== 'button') return;

    await this.runWithCooldown(command, interaction, () => command.execute(client, interaction));
  }

  async handleSelect(client: DmbClient, interaction: StringSelectMenuInteraction): Promise<void> {
    const command = this.registry.getByCustomId(interaction.customId);
    if (!command || command.type !== 'select') return;

    await this.runWithCooldown(command, interaction, () => command.execute(client, interaction));
  }

  async handleModal(client: DmbClient, interaction: ModalSubmitInteraction): Promise<void> {
    const command = this.registry.getByCustomId(interaction.customId);
    if (!command || command.type !== 'modal') return;

    await this.runWithCooldown(command, interaction, () => command.execute(client, interaction));
  }

  async onInteraction(client: DmbClient, interaction: Interaction): Promise<void> {
    try {
      if (interaction.isChatInputCommand()) {
        await this.handleSlash(client, interaction);
      } else if (interaction.isContextMenuCommand()) {
        await this.handleContext(client, interaction);
      } else if (interaction.isButton()) {
        await this.handleButton(client, interaction);
      } else if (interaction.isStringSelectMenu()) {
        await this.handleSelect(client, interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModal(client, interaction);
      }
    } catch (err) {
      logger.error({ err, interactionId: interaction.id }, 'Interaction handler error');
    }
  }

  private async runWithCooldown(
    command: { name: string; cooldown?: number; defer?: boolean; deferEphemeral?: boolean },
    interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction | ContextMenuCommandInteraction,
    fn: () => Promise<void>
  ): Promise<void> {
    const guildId = interaction.guildId ?? 'dm';
    const userId = interaction.user.id;

    if (command.cooldown) {
      const key = redisKeys.cooldown(guildId, userId, command.name);
      const exists = await redis.exists(key);
      if (exists) {
        await interaction.reply({ content: 'This command is on cooldown.', ephemeral: true });
        return;
      }
      await redis.setex(key, command.cooldown, '1');
    }

    if (command.defer) {
      await interaction.deferReply({ ephemeral: command.deferEphemeral ?? false });
    }

    await fn();
  }
}
