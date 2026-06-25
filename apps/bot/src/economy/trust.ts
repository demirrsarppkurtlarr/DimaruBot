export type TrustTier = 'new' | 'standard' | 'trusted' | 'premium';

export function getTierByTrust(score: number): TrustTier {
  if (score >= 80) return 'premium';
  if (score >= 50) return 'trusted';
  if (score >= 20) return 'standard';
  return 'new';
}

export function getTransferFeeRate(
  trustScore: number,
  settings: {
    transferFeeMin: number | bigint | DecimalLike;
    transferFeeMax: number | bigint | DecimalLike;
    transferFeeTrusted: number | bigint | DecimalLike;
  }
): number {
  if (trustScore >= 80) return toNumber(settings.transferFeeTrusted);
  if (trustScore >= 50) return toNumber(settings.transferFeeMin);
  return toNumber(settings.transferFeeMax);
}

export function calculateFraudScore(
  account: {
    wallet: bigint;
    bank: bigint;
    totalEarned: bigint;
    totalSpent: bigint;
    trustScore: number;
  },
  recentTransfers: number,
  maxDailyTransfers = 10
): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  if (account.wallet < 0 || account.bank < 0) {
    score += 50;
    flags.push('negative_balance');
  }

  if (account.totalSpent > account.totalEarned * 5n) {
    score += 30;
    flags.push('overspending');
  }

  if (recentTransfers > maxDailyTransfers) {
    score += 20;
    flags.push('transfer_spam');
  }

  if (account.trustScore < 10) {
    score += 15;
    flags.push('low_trust');
  }

  return { score: Math.min(100, score), flags };
}

export function updateTrustScore(current: number, delta: number): number {
  return Math.max(0, Math.min(100, current + delta));
}

export function tierLabel(tier: TrustTier): string {
  switch (tier) {
    case 'new':
      return 'New';
    case 'standard':
      return 'Standard';
    case 'trusted':
      return 'Trusted';
    case 'premium':
      return 'Premium';
  }
}

type DecimalLike = { toNumber(): number } | number | bigint;

function toNumber(value: DecimalLike): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return value.toNumber();
}
