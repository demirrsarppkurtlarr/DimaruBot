import { DmbEvent, DmbEventName } from './types';

export class EventRegistry {
  private events: DmbEvent[] = [];

  register<T extends DmbEventName>(event: DmbEvent<T>): void {
    this.events.push(event as DmbEvent);
  }

  getAll(): DmbEvent[] {
    return [...this.events];
  }
}
