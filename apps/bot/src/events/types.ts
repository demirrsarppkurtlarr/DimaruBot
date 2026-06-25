import { ClientEvents } from 'discord.js';
import { DmbClient } from '../core/client';

export type DmbEventName = keyof ClientEvents;

export interface DmbEvent<T extends DmbEventName = DmbEventName> {
  name: T;
  once?: boolean;
  execute: (client: DmbClient, ...args: ClientEvents[T]) => Promise<void>;
}
