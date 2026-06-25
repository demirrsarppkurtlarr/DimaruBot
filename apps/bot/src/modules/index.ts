import { ModuleLoader } from './loader';
import { moderationModule } from './moderation';

export const moduleLoader = new ModuleLoader();
moduleLoader.register(moderationModule);

export { ModuleLoader } from './loader';
