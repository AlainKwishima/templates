import { format, formatDistanceToNow, parseISO } from './date';

export { format, formatDistanceToNow, parseISO };

export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function formatInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatRole(role: string): string {
  return capitalize(role);
}

export function formatStatus(status: string): string {
  return capitalize(status);
}
