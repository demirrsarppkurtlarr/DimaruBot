import { EventRegistry } from './registry';
import { EventHandler } from './handler';
import { readyEvent } from './ready';
import { guildCreateEvent } from './guildCreate';
import { messageCreateEvent } from './messageCreate';

export const eventRegistry = new EventRegistry();

export function registerCoreEvents(): void {
  eventRegistry.register(readyEvent);
  eventRegistry.register(guildCreateEvent);
  eventRegistry.register(messageCreateEvent);
}

export { EventRegistry, EventHandler };
export * from './types';
