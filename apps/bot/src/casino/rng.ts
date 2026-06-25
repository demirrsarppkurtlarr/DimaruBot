import { createHmac, randomBytes, createHash } from 'crypto';
import { prisma } from '@dmb/prisma';

export interface ProvablyFairResult {
  nonce: bigint;
  serverSeed: string;
  clientSeed?: string;
  hash: string;
  roll: number;
}

const ALGORITHM = 'sha256';
const DEFAULT_CLIENT_SEED = 'dimaru';

export async function getOrCreateSeed(_guildId: string): Promise<string> {
  const active = await prisma.rNGSeed.findFirst({
    where: { isActive: true },
    orderBy: { generatedAt: 'desc' },
  });

  if (active) return active.seed;

  const seed = randomBytes(32).toString('hex');
  const seedHash = createHash(ALGORITHM).update(seed).digest('hex');
  await prisma.rNGSeed.create({
    data: {
      seed,
      seedHash,
      algorithm: 'hmac-sha256',
      isActive: true,
    },
  });
  return seed;
}

export async function rotateSeed(guildId: string): Promise<string> {
  await prisma.rNGSeed.updateMany({
    where: { isActive: true },
    data: { isActive: false, rotatedAt: new Date() },
  });
  return getOrCreateSeed(guildId);
}

export async function generateRoll(
  guildId: string,
  clientSeed?: string,
  max = 100
): Promise<ProvablyFairResult> {
  const serverSeed = await getOrCreateSeed(guildId);
  const active = await prisma.rNGSeed.findFirst({
    where: { isActive: true },
    orderBy: { generatedAt: 'desc' },
  });

  const nonce = (active?.nonce ?? 0n) + 1n;
  await prisma.rNGSeed.updateMany({
    where: { isActive: true },
    data: { nonce: { increment: 1 } },
  });

  const hash = createHmac(ALGORITHM, serverSeed)
    .update(`${clientSeed ?? DEFAULT_CLIENT_SEED}:${nonce}`)
    .digest('hex');

  const roll = parseInt(hash.slice(0, 8), 16) % (max + 1);

  return {
    nonce,
    serverSeed,
    clientSeed: clientSeed ?? DEFAULT_CLIENT_SEED,
    hash,
    roll,
  };
}

export function verifyRoll(
  serverSeed: string,
  clientSeed: string,
  nonce: bigint,
  max = 100
): { hash: string; roll: number } {
  const hash = createHmac(ALGORITHM, serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');
  const roll = parseInt(hash.slice(0, 8), 16) % (max + 1);
  return { hash, roll };
}
