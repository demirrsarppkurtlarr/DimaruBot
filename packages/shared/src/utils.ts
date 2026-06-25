export function snowflakeToDate(id: string | bigint): Date {
  const ms = Number(BigInt(id) >> 22n) + 1420070400000;
  return new Date(ms);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

export function isGodModeUser(userId: string, godModeIds: string[]): boolean {
  return godModeIds.includes(userId);
}

export function formatNumber(value: number | bigint): string {
  return new Intl.NumberFormat('en-US').format(value);
}
