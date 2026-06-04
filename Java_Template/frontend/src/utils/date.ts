export function parseISO(value: string): Date {
  return new Date(value);
}

export function format(value: string | Date, pattern: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const options: Intl.DateTimeFormatOptions =
    pattern === 'date'
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : pattern === 'time'
        ? { hour: '2-digit', minute: '2-digit' }
        : {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          };

  return new Intl.DateTimeFormat(undefined, options).format(date);
}

export function formatDistanceToNow(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ];

  for (const [unit, ms] of units) {
    if (absMs >= ms || unit === 'second') {
      const value = Math.round(diffMs / ms);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}
