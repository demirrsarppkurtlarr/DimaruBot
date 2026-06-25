import { CommandRegistry } from './registry';
import { CommandHandler } from './handler';
import { pingCommand } from './utility/ping';
import { balanceCommand } from './economy/balance';
import { transferCommand } from './economy/transfer';
import { dailyCommand } from './economy/daily';
import { slotCommand } from './casino/slot';
import { rouletteCommand } from './casino/roulette';
import { blackjackCommand } from './casino/blackjack';
import { warnCommand } from './moderation/warn';
import { kickCommand } from './moderation/kick';
import { banCommand } from './moderation/ban';
import { timeoutCommand } from './moderation/timeout';
import { historyCommand } from './moderation/history';
import { ticketCreateCommand } from './tickets/create';
import { ticketCloseCommand } from './tickets/close';

export const commandRegistry = new CommandRegistry();

commandRegistry.register(pingCommand);
commandRegistry.register(balanceCommand);
commandRegistry.register(transferCommand);
commandRegistry.register(dailyCommand);
commandRegistry.register(slotCommand);
commandRegistry.register(rouletteCommand);
commandRegistry.register(blackjackCommand);
commandRegistry.register(warnCommand);
commandRegistry.register(kickCommand);
commandRegistry.register(banCommand);
commandRegistry.register(timeoutCommand);
commandRegistry.register(historyCommand);
commandRegistry.register(ticketCreateCommand);
commandRegistry.register(ticketCloseCommand);

export const commandHandler = new CommandHandler(commandRegistry);

export { CommandRegistry } from './registry';
export { CommandHandler } from './handler';
export * from './types';
