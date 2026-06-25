import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DISCORD_TOKEN: z.string().min(1).optional(),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().optional(),
  ECONOMY_HMAC_SECRET: z.string().min(1),
  GOD_MODE_USER_IDS: z.string().min(1),
  API_PORT: z.string().default('3001'),
  DASHBOARD_PORT: z.string().default('3000'),
  API_URL: z.string().default('http://localhost:3001'),
  DASHBOARD_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);

export function isProduction() {
  return env.NODE_ENV === 'production';
}

export function isDevelopment() {
  return env.NODE_ENV === 'development';
}

export function getGodModeUserIds(): string[] {
  return env.GOD_MODE_USER_IDS.split(',').map(id => id.trim());
}
