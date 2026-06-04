import bcrypt from 'bcrypt';
import { AppError } from '../../../utils/AppError';

jest.mock('../repository/auth.repository', () => ({
  authRepository: {
    findUserByEmail: jest.fn(),
    findDefaultRole: jest.fn(),
    createUser: jest.fn(),
    findUserByVerificationToken: jest.fn(),
    updateUser: jest.fn(),
    findUserByResetTokenHash: jest.fn(),
    createRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
  },
}));

jest.mock('../../notifications/service/notification.service', () => ({
  notificationService: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendVerificationSuccessEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

import { authRepository } from '../repository/auth.repository';
import { AuthService } from '../service/auth.service';

const mockRepo = authRepository as jest.Mocked<typeof authRepository>;

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates user on valid payload', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.findDefaultRole.mockResolvedValue({ id: 'role-1', name: 'User' } as never);
      mockRepo.createUser.mockResolvedValue({
        id: 'u1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        roleId: 'role-1',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { name: 'User' },
      } as never);

      const result = await service.register({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(result.email).toBe('jane@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('rejects duplicate email with 409', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({ id: 'existing' } as never);

      await expect(
        service.register({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'password123',
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('returns tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);
      mockRepo.findUserByEmail.mockResolvedValue({
        id: 'u1',
        email: 'jane@example.com',
        password: hash,
        role: { name: 'User' },
      } as never);
      mockRepo.createRefreshToken.mockResolvedValue({} as never);

      const result = await service.login({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('rejects invalid credentials with 401', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('verifyEmail', () => {
    it('verifies email with valid token', async () => {
      mockRepo.findUserByVerificationToken.mockResolvedValue({
        id: 'u1',
        isEmailVerified: false,
        role: { name: 'User' },
      } as never);
      mockRepo.updateUser.mockResolvedValue({
        id: 'u1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        roleId: 'r1',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { name: 'User' },
      } as never);

      await expect(service.verifyEmail('valid-token')).resolves.toBeUndefined();
      expect(mockRepo.updateUser).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('rejects invalid token', async () => {
      mockRepo.findUserByResetTokenHash.mockResolvedValue(null);

      await expect(service.resetPassword('bad-token', 'newpass123')).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });
});
