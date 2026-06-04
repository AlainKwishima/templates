import { prisma } from "@/database/prisma.js";
import { DEFAULT_USER_ROLE_NAME } from "@/shared/constants/roles.js";
import type { LoginContext } from "@/modules/auth/auth.types.js";
import { emailService } from "@/shared/email/email.service.js";
import type { PublicUser } from "@/shared/types/auth.js";
import { AuthenticationAppError, AuthorizationAppError, ConflictAppError } from "@/shared/errors/app-error.js";
import { addDuration, parseDurationToMs } from "@/utils/duration.js";
import { hashPassword, verifyPassword } from "@/utils/password.js";
import {
  generateSecureToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/utils/token.js";
import { env } from "@/config/env.js";

function toPublicUser(user: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  isEmailVerified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{ role: { name: string } }>;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    phoneNumber: user.phoneNumber,
    isEmailVerified: user.isEmailVerified,
    status: user.status,
    roles: user.roles.map((assignment) => assignment.role.name),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function loadUserForAuth(emailOrId: { email?: string; id?: string }) {
  return prisma.user.findFirst({
    where: {
      deletedAt: null,
      ...(emailOrId.email ? { email: emailOrId.email } : {}),
      ...(emailOrId.id ? { id: emailOrId.id } : {}),
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
}

export class AuthService {
  async register(
    input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
    },
    context?: LoginContext,
  ) {
    const existingUser = await loadUserForAuth({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictAppError("Email is already registered");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
        isEmailVerified: false,
        status: "PENDING",
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const defaultRole = await prisma.role.findFirst({
      where: { name: DEFAULT_USER_ROLE_NAME, deletedAt: null },
    });
    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: defaultRole.id,
        },
      });
    }

    const verificationToken = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(verificationToken),
        expiresAt: addDuration(new Date(), "1d"),
      },
    });

    await emailService.sendVerificationEmail(user.email, verificationToken, user.firstName ?? undefined);

    const refreshedUser = await loadUserForAuth({ id: user.id });
    if (!refreshedUser) {
      throw new AuthenticationAppError("Unable to load created user");
    }

    const publicUser = toPublicUser(refreshedUser);
    const tokens = await this.issueTokenPair(publicUser, context);

    return { user: publicUser, tokens };
  }

  async login(input: { email: string; password: string }, context?: LoginContext) {
    const user = await loadUserForAuth({ email: input.email.toLowerCase() });
    if (!user) {
      throw new AuthenticationAppError("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new AuthorizationAppError("Account is not active");
    }

    if (!user.isEmailVerified) {
      throw new AuthorizationAppError("Please verify your email before logging in");
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new AuthenticationAppError("Invalid credentials");
    }

    const publicUser = toPublicUser(user);
    const tokens = await this.issueTokenPair(publicUser, context);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user: publicUser, tokens };
  }

  async refresh(refreshToken: string, context?: LoginContext) {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.refreshTokenSession.findFirst({
      where: {
        jti: payload.jti,
        deletedAt: null,
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AuthenticationAppError("Refresh token is invalid or expired");
    }

    if (session.tokenHash !== hashToken(refreshToken)) {
      await prisma.refreshTokenSession.updateMany({
        where: { tokenFamilyId: session.tokenFamilyId, deletedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AuthenticationAppError("Refresh token reuse detected");
    }

    const user = await loadUserForAuth({ id: payload.sub });
    if (!user || user.status !== "ACTIVE") {
      throw new AuthorizationAppError("User is not active");
    }

    const publicUser = toPublicUser(user);
    const tokens = await this.issueTokenPair(publicUser, context, session.tokenFamilyId);

    await prisma.refreshTokenSession.update({
      where: { jti: session.jti },
      data: {
        revokedAt: new Date(),
        replacedByJti: tokens.jti,
      },
    });

    return {
      user: publicUser,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshTokenSession.updateMany({
        where: { jti: payload.jti, deletedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore invalid tokens on logout for a smooth UX.
    }
  }

  async requestPasswordReset(email: string) {
    const user = await loadUserForAuth({ email: email.toLowerCase() });
    if (!user) {
      return;
    }

    const token = generateSecureToken();
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: addDuration(new Date(), "1h"),
      },
    });
    await emailService.sendPasswordResetEmail(user.email, token, user.firstName ?? undefined);
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!resetToken) {
      throw new AuthenticationAppError("Password reset token is invalid or expired");
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await prisma.refreshTokenSession.updateMany({
      where: { userId: resetToken.userId, deletedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async verifyEmail(token: string) {
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!verificationToken) {
      throw new AuthenticationAppError("Verification token is invalid or expired");
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        isEmailVerified: true,
        status: "ACTIVE",
      },
    });

    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    const user = await loadUserForAuth({ id: verificationToken.userId });
    if (!user) {
      throw new AuthenticationAppError("Unable to load verified user");
    }

    return toPublicUser(user);
  }

  private async issueTokenPair(
    user: PublicUser,
    context?: LoginContext,
    tokenFamilyId?: string,
  ) {
    const familyId = tokenFamilyId ?? generateSecureToken(16);
    const jti = generateSecureToken(16);
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sessionId: jti,
    });
    const refreshToken = signRefreshToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      tokenFamilyId: familyId,
      jti,
      sessionId: jti,
    });

    await prisma.refreshTokenSession.create({
      data: {
        userId: user.id,
        tokenFamilyId: familyId,
        jti,
        tokenHash: hashToken(refreshToken),
        expiresAt: addDuration(new Date(), env.JWT_REFRESH_TTL),
        ...(context?.userAgent ? { userAgent: context.userAgent } : {}),
        ...(context?.ipAddress ? { ipAddress: context.ipAddress } : {}),
      },
    });

    return {
      accessToken,
      refreshToken,
      jti,
      expiresIn: Math.floor(parseDurationToMs(env.JWT_ACCESS_TTL) / 1000),
    };
  }
}
