export type PremiumTier = 'free' | 'premium' | 'premium_plus';

export type ModuleCategory =
  | 'Moderation'
  | 'Protection'
  | 'AI'
  | 'Tickets'
  | 'Economy'
  | 'Levels'
  | 'Music'
  | 'Giveaways'
  | 'Applications'
  | 'Logging'
  | 'Welcome'
  | 'ReactionRoles'
  | 'AutoRoles'
  | 'Statistics'
  | 'Suggestions'
  | 'Verification'
  | 'Premium'
  | 'Backup'
  | 'Automations';

export interface CommandDefinition {
  name: string;
  type: 'slash' | 'context' | 'button' | 'select' | 'modal';
  permissions?: string[];
  cooldown?: number;
  premium?: boolean;
}

export interface EventDefinition {
  name: string;
  once?: boolean;
  handler: string;
}

export interface SettingsSchema {
  [key: string]: unknown;
}

export type DmbClient = any;

export interface TransactionInput {
  guildId: string;
  senderId?: string;
  recipientId?: string;
  amount: number;
  type: string;
  createdAt: string;
}
