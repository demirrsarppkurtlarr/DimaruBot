export const COLORS = {
  neonBlue: '#00F0FF',
  neonPurple: '#B829DD',
  dark: '#0B0C15',
  panel: '#12131D',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const DEFAULT_LOCALE = 'en';

export const DEFAULT_PREFIX = '/';

export const DEFAULT_DAILY_AMOUNT = 100;

export const DEFAULT_CURRENCY = {
  name: 'DimaCoin',
  symbol: '🪙',
} as const;

export const TRUST_TIERS = {
  new: { fee: 0.05, limit: 1000 },
  standard: { fee: 0.02, limit: 10000 },
  trusted: { fee: 0, limit: 100000 },
  premium: { fee: 0, limit: 1000000 },
} as const;

export const GAME_TYPES = [
  'coinflip',
  'blackjack',
  'slots',
  'roulette',
  'crash',
  'dice',
  'pvp_bet',
] as const;

export const MODULES = [
  'moderation',
  'protection',
  'ai',
  'tickets',
  'economy',
  'levels',
  'music',
  'giveaways',
  'applications',
  'logging',
  'welcome',
  'reaction_roles',
  'auto_roles',
  'statistics',
  'suggestions',
  'verification',
  'premium',
  'backup',
  'automations',
] as const;
