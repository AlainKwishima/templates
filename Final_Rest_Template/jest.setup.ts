process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/institution_test?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.BREVO_API_KEY = 'test-brevo-key';
process.env.BREVO_SENDER_EMAIL = 'test@example.com';
process.env.BREVO_SENDER_NAME = 'Test';
