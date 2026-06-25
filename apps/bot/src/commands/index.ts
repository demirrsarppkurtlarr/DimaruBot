import { CommandRegistry } from './registry';
import { CommandHandler } from './handler';
import { pingCommand } from './utility/ping';
import { balanceCommand } from './economy/balance';
import { transferCommand } from './economy/transfer';
import { dailyCommand } from './economy/daily';

export const commandRegistry = new CommandRegistry();

commandRegistry.register(pingCommand);
commandRegistry.register(balanceCommand);
commandRegistry.register(transferCommand);
commandRegistry.register(dailyCommand);

export const commandHandler = new CommandHandler(commandRegistry);

export { CommandRegistry } from './registry';
export { CommandHandler } from './handler';
export * from './types';
