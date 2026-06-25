export function isValidSnowflake(value: string): boolean {
  return /^\d{17,20}$/.test(value);
}

export function isValidUsername(username: string): boolean {
  return /^[\w\.]{2,32}$/.test(username);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}
