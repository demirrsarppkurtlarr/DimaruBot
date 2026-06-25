import { Client, GatewayIntentBits } from 'discord.js';
import { env } from '@dmb/config';

export function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildInvites,
    ],
  });
}

export type DmbClient = ReturnType<typeof createClient>;

export async function loginClient(client: DmbClient): Promise<void> {
  await client.login(env.DISCORD_TOKEN);
}
