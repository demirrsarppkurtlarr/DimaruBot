import { Collection, REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import { DmbCommand } from './types';
import { logger } from '@dmb/logger';
import { botConfig } from '../core/config';

export class CommandRegistry {
  private commands = new Collection<string, DmbCommand>();
  private rest = new REST({ version: '10' }).setToken(botConfig.token);

  register(command: DmbCommand): void {
    this.commands.set(command.name, command);
  }

  get(name: string): DmbCommand | undefined {
    return this.commands.get(name);
  }

  getByCustomId(customId: string): DmbCommand | undefined {
    return this.commands.find((cmd) => {
      if (cmd.type === 'button' || cmd.type === 'select' || cmd.type === 'modal') {
        return cmd.customId === customId;
      }
      return false;
    });
  }

  async deployGlobal(): Promise<void> {
    const slashCommands = this.commands
      .filter((cmd) => cmd.type === 'slash' || cmd.type === 'context')
      .map((cmd) => {
        if (cmd.type === 'slash') return cmd.builder.toJSON();
        return cmd.builder.toJSON();
      }) as RESTPostAPIApplicationCommandsJSONBody[];

    try {
      await this.rest.put(Routes.applicationCommands(botConfig.clientId), { body: slashCommands });
      logger.info(`Deployed ${slashCommands.length} global commands`);
    } catch (err) {
      logger.error({ err }, 'Failed to deploy global commands');
      throw err;
    }
  }
}
