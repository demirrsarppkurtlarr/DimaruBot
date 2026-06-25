import { CommandRegistry } from './registry';
import { CommandHandler } from './handler';
import { pingCommand } from './utility/ping';
import { balanceCommand } from './economy/balance';
import { transferCommand } from './economy/transfer';
import { dailyCommand } from './economy/daily';
import { slotCommand } from './casino/slot';
import { rouletteCommand } from './casino/roulette';
import { blackjackCommand } from './casino/blackjack';

export const commandRegistry = new CommandRegistry();

commandRegistry.register(pingCommand);
commandRegistry.register(balanceCommand);
commandRegistry.register(transferCommand);
commandRegistry.register(dailyCommand);
commandRegistry.register(slotCommand);
commandRegistry.register(rouletteCommand);
commandRegistry.register(blackjackCommand);

export const commandHandler = new CommandHandler(commandRegistry);

export { CommandRegistry } from './registry';
export { CommandHandler } from './handler';
export * from './types';
