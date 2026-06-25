import { z } from 'zod';

export const premiumTierSchema = z.enum(['free', 'premium', 'premium_plus']);

export const transferSchema = z.object({
  recipientId: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().max(200).optional(),
});

export const gameBetSchema = z.object({
  gameType: z.enum(['coinflip', 'blackjack', 'slots', 'roulette', 'crash', 'dice', 'pvp_bet']),
  amount: z.number().int().positive(),
  choice: z.string().optional(),
});

export const moderationSchema = z.object({
  toxicity: z.number().min(0).max(1),
  spam: z.number().min(0).max(1),
  scam: z.number().min(0).max(1),
  reason: z.string(),
});
