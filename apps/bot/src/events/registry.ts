import { DmbEvent } from './types';

export class EventRegistry {
  private events: DmbEvent[] = [];

  register(event: DmbEvent): void {
    this.events.push(event);
  }

  getAll(): DmbEvent[] {
    return [...this.events];
  }
}
