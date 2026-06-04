import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';
import { toUserPublic } from '../../../utils/userMapper';
import { addDuration, generateToken, hashToken } from '../../../utils/token';
import { notificationService } from '../../notifications/service/notification.service';
import { authRepository } from '../repository/auth.repository';
import { LoginDto, RegisterDto } from '../validation/auth.schemas';
import { JwtPayload } from '../../../types/express';

const BCRYPT_ROUNDS = 10;

export class AuthService {
  private signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
    });
  }

  async register(dto: RegisterDto) {
    const existing = await authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const defaultRole = await authRepository.findDefaultRole();
    if (!defaultRole) {
      throw new AppError('Default User role is not configured', 500);
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const verificationToken = generateToken();

    const user = await authRepository.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      roleId: defaultRole.id,
      emailVerificationToken: verificationToken,
    });

    const publicUser = toUserPublic(user);
    void notificationService.sendWelcomeEmail(publicUser, verificationToken);

    return publicUser;
  }

  async verifyEmail(token: string) {
    const user = await authRepository.findUserByVerificationToken(token);
    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    if (user.isEmailVerified) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    const updated = await authRepository.updateUser(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });

    const publicUser = toUserPublic(updated);
    void notificationService.sendVerificationSuccessEmail(publicUser);
  }

  async login(dto: LoginDto) {
    const user = await authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = this.signAccessToken(payload);
    const refreshToken = generateToken();
    const expiresAt = addDuration(env.JWT_REFRESH_EXPIRY);

    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    const record = await authRepository.findRefreshToken(refreshToken);
    if (record) {
      await authRepository.deleteRefreshToken(refreshToken);
    }
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return;
    }

    const resetToken = generateToken();
    const tokenHash = hashToken(resetToken);
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await authRepository.updateUser(user.id, {
      passwordResetToken: tokenHash,
      passwordResetExpiry: expiry,
    });

    const publicUser = toUserPublic(user);
    void notificationService.sendPasswordResetEmail(publicUser, resetToken);
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const user = await authRepository.findUserByResetTokenHash(tokenHash);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await authRepository.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    });
  }

  async refreshToken(refreshToken: string) {
    const record = await authRepository.findRefreshToken(refreshToken);
    if (!record || record.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const payload: JwtPayload = {
      userId: record.user.id,
      email: record.user.email,
      role: record.user.role.name,
    };

    return { accessToken: this.signAccessToken(payload) };
  }
}

export const authService = new AuthService();
