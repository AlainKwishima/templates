export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'JavaT';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  RESEND_VERIFICATION: '/resend-verification',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  USERS: '/users',
  USER_DETAIL: '/users/:id',
  ROLES: '/roles',
  SETTINGS: '/settings',
  AUDIT_LOGS: '/audit-logs',
  API_DOCS: '/api-docs',
  NOT_FOUND: '*',
} as const;

export const ROLES = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;

export const ENTITY_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  PENDING: 'PENDING',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'javat_access_token',
  REFRESH_TOKEN: 'javat_refresh_token',
  TOKEN_EXPIRY: 'javat_token_expiry',
  USER_EMAIL: 'javat_user_email',
  USER_ROLE: 'javat_user_role',
  THEME: 'javat_theme',
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
export const PASSWORD_HINT =
  '8–72 characters with uppercase, lowercase, digit, and special character';
