import { ClientEvents } from 'discord.js';
import { DmbClient } from '../core/client';

export type DmbEventName = keyof ClientEvents;

export interface DmbEvent {
  name: DmbEventName;
  once?: boolean;
  execute: (client: DmbClient, ...args: unknown[]) => Promise<void>;
}
