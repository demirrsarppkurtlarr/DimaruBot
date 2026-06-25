import { DmbClient } from '../core/client';
import { DmbEvent } from './types';
import { logger } from '@dmb/logger';

export class EventHandler {
  constructor(private client: DmbClient) {}

  attach(events: DmbEvent[]): void {
    for (const event of events) {
      const wrapped = async (...args: unknown[]) => {
        try {
          await event.execute(this.client, ...(args as never[]));
        } catch (err) {
          logger.error({ event: event.name, err }, 'Event handler error');
        }
      };

      if (event.once) {
        this.client.once(event.name, wrapped as never);
      } else {
        this.client.on(event.name, wrapped as never);
      }
    }
  }
}
