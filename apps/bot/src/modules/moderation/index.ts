import { IModule, ModuleCategory } from '@dmb/shared';
import { DmbClient } from '../../core/client';
import { GuildMember } from 'discord.js';

export const moderationModule: IModule = {
  id: 'moderation',
  name: 'Moderation',
  description: 'Ban, kick, mute, warn, timeout and punishment management',
  category: 'Moderation' as ModuleCategory,
  defaultEnabled: true,
  premium: false,
  commands: [
    {
      name: 'ban',
      type: 'slash',
      permissions: ['BanMembers'],
      cooldown: 3,
    },
    {
      name: 'kick',
      type: 'slash',
      permissions: ['KickMembers'],
      cooldown: 3,
    },
    {
      name: 'warn',
      type: 'slash',
      permissions: ['ModerateMembers'],
      cooldown: 3,
    },
    {
      name: 'mute',
      type: 'slash',
      permissions: ['ModerateMembers'],
      cooldown: 3,
    },
    {
      name: 'history',
      type: 'slash',
      permissions: ['ModerateMembers'],
      cooldown: 5,
    },
  ],
  async onLoad(client: DmbClient) {
    client.on('guildMemberAdd', async (_member: GuildMember) => {
      // TODO: re-apply active punishments for returning members
    });
  },
  async onUnload() {
    // Cleanup if needed
  },
};
