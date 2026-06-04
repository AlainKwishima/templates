export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration value: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const multiplier = multipliers[unit as keyof typeof multipliers];
  if (!multiplier) {
    throw new Error(`Invalid duration unit: ${unit}`);
  }

  return value * multiplier;
}

export function addDuration(date: Date, duration: string): Date {
  return new Date(date.getTime() + parseDurationToMs(duration));
}
