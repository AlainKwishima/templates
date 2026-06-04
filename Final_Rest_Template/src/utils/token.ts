import crypto from 'crypto';

export const generateToken = (): string => crypto.randomUUID();

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const parseDurationToMs = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
};

export const addDuration = (duration: string, from = new Date()): Date =>
  new Date(from.getTime() + parseDurationToMs(duration));
