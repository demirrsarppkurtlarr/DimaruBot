import { ShardingManager } from 'discord.js';
import { env } from '@dmb/config';
import { logger } from '@dmb/logger';
import { join } from 'path';

export function createShardingManager(): ShardingManager {
  const manager = new ShardingManager(join(__dirname, '../../dist/index.js'), {
    token: env.DISCORD_TOKEN,
    totalShards: 'auto',
    respawn: true,
  });

  manager.on('shardCreate', (shard) => {
    logger.info(`Shard ${shard.id} launched`);
    shard.on('error', (err) => logger.error({ shard: shard.id, err }, 'Shard error'));
  });

  return manager;
}
