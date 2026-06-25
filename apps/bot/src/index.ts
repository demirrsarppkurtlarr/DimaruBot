import { Events } from 'discord.js';
import { createServer } from 'http';
import { logger } from '@dmb/logger';
import { prisma } from '@dmb/prisma';
import { createClient, loginClient } from './core/client';
import { setContainer } from './core/container';
import { redis } from './services/redis';
import { queues } from './services/queue';
import { commandHandler, commandRegistry } from './commands';
import { registerCoreEvents, eventRegistry, EventHandler } from './events';
import { moduleLoader } from './modules';

async function main() {
  logger.info('Starting DimaruBot...');

  const client = createClient();

  const port = Number(process.env.PORT) || 3000;
  const healthServer = createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          ready: client.isReady(),
          user: client.user?.tag ?? null,
        })
      );
      return;
    }
    res.writeHead(404);
    res.end('Not found');
  });
  healthServer.listen(port, () => {
    logger.info(`Health server listening on port ${port}`);
  });

  registerCoreEvents();
  const eventHandler = new EventHandler(client);
  eventHandler.attach(eventRegistry.getAll());

  client.on(Events.InteractionCreate, (interaction) => commandHandler.onInteraction(client, interaction));

  setContainer({ client, redis, queues });

  await moduleLoader.loadAll(client);
  await commandRegistry.deployGlobal();
  await loginClient(client);

  logger.info('DimaruBot startup complete');
}

main().catch(async (err) => {
  logger.fatal({ err }, 'Failed to start bot');
  await prisma.$disconnect();
  process.exit(1);
});
