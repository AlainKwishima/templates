import prisma from '../../../config/database';
import { User } from '@prisma/client';

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  findUserByVerificationToken(token: string) {
    return prisma.user.findFirst({
      where: { emailVerificationToken: token },
      include: { role: true },
    });
  }

  findUserByResetTokenHash(tokenHash: string) {
    return prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: { gt: new Date() },
      },
      include: { role: true },
    });
  }

  createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    roleId: string;
    emailVerificationToken: string;
  }): Promise<User & { role: { name: string } }> {
    return prisma.user.create({
      data,
      include: { role: true },
    });
  }

  updateUser(id: string, data: Partial<User>) {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  findDefaultRole() {
    return prisma.role.findUnique({ where: { name: 'User' } });
  }

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { include: { role: true } } },
    });
  }

  deleteRefreshToken(token: string) {
    return prisma.refreshToken.delete({ where: { token } });
  }
}

export const authRepository = new AuthRepository();
