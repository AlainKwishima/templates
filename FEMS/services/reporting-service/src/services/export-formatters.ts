/** Human-readable labels and value formatters for report exports. */

export const BRAND = {
  name: process.env.BREVO_SENDER_NAME?.trim() || 'TWZ LTD',
  tagline: 'Fire Extinguisher Management System',
  primary: '#B91C1C',
  primaryDark: '#991B1B',
  slate: '#1E293B',
  slateMuted: '#64748B',
  border: '#E2E8F0',
  headerBg: '#1E293B',
  zebra: '#F8FAFC',
  white: '#FFFFFF',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
} as const;

const COLUMN_LABELS: Record<string, string> = {
  id: 'Reference',
  serialNumber: 'Serial no.',
  assetCode: 'Asset code',
  customerId: 'Owner ID',
  type: 'Type',
  size: 'Size',
  status: 'Status',
  channel: 'Channel',
  subject: 'Subject',
  body: 'Message',
  expirationDate: 'Expiry date',
  installationDate: 'Installed',
  nextServiceDate: 'Next service',
  location: 'Location',
  createdAt: 'Date / time',
  requestNumber: 'Request no.',
  priority: 'Priority',
  description: 'Description',
  scheduledDate: 'Scheduled',
  inspectorName: 'Inspector',
  inspectorId: 'Inspector ID',
  assignedAt: 'Assigned',
  completedAt: 'Completed',
  completionSummary: 'Completion notes',
};

/** Columns omitted from PDF (still included in CSV/Excel). */
export const PDF_OMIT_COLUMNS = new Set(['id', 'customerId', 'assetId', 'inspectorId']);

export function columnLabel(key: string): string {
  return COLUMN_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export function formatReportValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  const str = String(value);

  if (
    key.endsWith('At') ||
    key.endsWith('Date') ||
    key === 'date' ||
    key.includes('Date')
  ) {
    const d = new Date(str);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  }

  if (key === 'id' && str.length > 12) {
    return str.slice(0, 8).toUpperCase();
  }

  if (key === 'status' || key === 'channel') {
    return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return str;
}

export function formatGeneratedAt(date = new Date()): string {
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
}

export function summaryEntries(summary: Record<string, unknown> | undefined): Array<{ label: string; value: string }> {
  if (!summary) return [];
  const entries: Array<{ label: string; value: string }> = [];
  const labels: Record<string, string> = {
    totalFireExtinguishers: 'Total extinguishers',
    assetCount: 'Total assets',
    requestCount: 'Total requests',
    notificationCount: 'Total notifications',
  };
  for (const [key, val] of Object.entries(summary)) {
    if (val === null || val === undefined) continue;
    entries.push({
      label: labels[key] ?? columnLabel(key),
      value: String(val),
    });
  }
  return entries;
}

/** Relative column weights for PDF layout (higher = wider). */
export function columnWeight(key: string): number {
  const weights: Record<string, number> = {
    subject: 4,
    description: 4,
    completionSummary: 3,
    location: 2.5,
    serialNumber: 2,
    requestNumber: 2,
    inspectorName: 2,
    createdAt: 2,
    completedAt: 2,
    scheduledAt: 2,
    expirationDate: 1.5,
    installationDate: 1.5,
    type: 1.2,
    size: 1,
    status: 1,
    channel: 1,
    priority: 1,
  };
  return weights[key] ?? 1;
}
