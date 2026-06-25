import { CommandDefinition, EventDefinition, SettingsSchema, DmbClient, ModuleCategory } from './types';

export interface IModule {
  id: string;
  name: string;
  description: string;
  category: ModuleCategory;
  defaultEnabled: boolean;
  premium: boolean;
  commands?: CommandDefinition[];
  events?: EventDefinition[];
  settings?: SettingsSchema;
  onLoad(client: DmbClient): Promise<void>;
  onUnload(client: DmbClient): Promise<void>;
}
