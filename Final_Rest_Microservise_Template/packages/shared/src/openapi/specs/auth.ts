import { createServiceSpec } from '../common';

const authBody = (required: string[]) => ({
  required: true,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required,
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          token: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
    },
  },
});

export const authOpenApi = createServiceSpec({
  title: 'Auth Service API',
  description: 'Registration, login, tokens, and password flows',
  tag: 'Auth',
  port: 3001,
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: authBody(['firstName', 'lastName', 'email', 'password']),
        responses: { '201': { description: 'User registered' }, '409': { description: 'Email already registered' } },
      },
    },
    '/api/v1/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email address',
        requestBody: authBody(['token']),
        responses: { '200': { description: 'Email verified' }, '400': { description: 'Invalid token' } },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive tokens',
        security: [],
        requestBody: authBody(['email', 'password']),
        responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout and invalidate refresh token',
        requestBody: authBody(['refreshToken']),
        responses: { '200': { description: 'Logged out' } },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset',
        requestBody: authBody(['email']),
        responses: { '200': { description: 'Reset email sent if account exists' } },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: authBody(['token', 'password']),
        responses: { '200': { description: 'Password reset' }, '400': { description: 'Invalid token' } },
      },
    },
    '/api/v1/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: authBody(['refreshToken']),
        responses: { '200': { description: 'Token refreshed' }, '401': { description: 'Invalid refresh token' } },
      },
    },
  },
});
