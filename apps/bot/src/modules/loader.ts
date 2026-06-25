import { IModule } from '@dmb/shared';
import { DmbClient } from '../core/client';
import { logger } from '@dmb/logger';

export class ModuleLoader {
  private modules = new Map<string, IModule>();

  register(module: IModule): void {
    this.modules.set(module.id, module);
  }

  async loadAll(client: DmbClient): Promise<void> {
    for (const [id, module] of this.modules) {
      try {
        await module.onLoad(client);
        logger.info({ module: id }, 'Module loaded');
      } catch (err) {
        logger.error({ module: id, err }, 'Module load failed');
      }
    }
  }

  async unloadAll(client: DmbClient): Promise<void> {
    for (const [id, module] of this.modules) {
      try {
        await module.onUnload(client);
        logger.info({ module: id }, 'Module unloaded');
      } catch (err) {
        logger.error({ module: id, err }, 'Module unload failed');
      }
    }
  }

  get(id: string): IModule | undefined {
    return this.modules.get(id);
  }

  list(): string[] {
    return [...this.modules.keys()];
  }
}
