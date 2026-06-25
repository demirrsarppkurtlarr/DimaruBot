import { EventRegistry } from './registry';
import { EventHandler } from './handler';
import { readyEvent } from './ready';
import { guildCreateEvent } from './guildCreate';

export const eventRegistry = new EventRegistry();

export function registerCoreEvents(): void {
  eventRegistry.register(readyEvent);
  eventRegistry.register(guildCreateEvent);
}

export { EventRegistry, EventHandler };
export * from './types';
