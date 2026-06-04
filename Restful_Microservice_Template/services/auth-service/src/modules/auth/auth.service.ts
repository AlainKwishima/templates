import { nanoid } from "nanoid";
import { prisma } from "@/database/prisma.js";
import { userServiceClient } from "@/clients/user-service.client.js";
import type { LoginContext } from "@/modules/auth/auth.types.js";
import { emailService } from "@/shared/email/email.service.js";
import {
  AuthenticationAppError,
  AuthorizationAppError,
  ConflictAppError,
  addDuration,
  generateSecureToken,
  hashPassword,
  hashToken,
  parseDurationToMs,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
  type PublicUser,
} from "@restful/shared";
import { env } from "@/config/env.js";

function toPublicUser(context: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  isEmailVerified: boolean;
  status: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: context.id,
    email: context.email,
    firstName: context.firstName,
    lastName: context.lastName,
    avatarUrl: context.avatarUrl,
    phoneNumber: context.phoneNumber,
    isEmailVerified: context.isEmailVerified,
    status: context.status,
    roles: context.roles,
    createdAt: context.createdAt,
    updatedAt: context.updatedAt,
  };
}

async function loadCredential(emailOrId: { email?: string; id?: string }) {
  return prisma.credential.findFirst({
    where: {
      ...(emailOrId.email ? { email: emailOrId.email.toLowerCase() } : {}),
      ...(emailOrId.id ? { id: emailOrId.id } : {}),
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
    const email = input.email.toLowerCase();
    const existingCredential = await loadCredential({ email });
    if (existingCredential) {
      throw new ConflictAppError("Email is already registered");
    }

    const userId = nanoid();
    const passwordHash = await hashPassword(input.password);

    await prisma.credential.create({
      data: {
        id: userId,
        email,
        passwordHash,
      },
    });

    try {
      await userServiceClient.createUser({
        id: userId,
        email,
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
      });
    } catch (error) {
      await prisma.credential.delete({ where: { id: userId } }).catch(() => undefined);
      throw error;
    }

    const verificationToken = generateSecureToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(verificationToken),
        expiresAt: addDuration(new Date(), "1d"),
      },
    });

    await emailService.sendVerificationEmail(email, verificationToken, input.firstName);

    const profile = await userServiceClient.getAuthContext(userId);
    const publicUser = toPublicUser(profile);
    const tokens = await this.issueTokenPair(publicUser, context);

    return { user: publicUser, tokens };
  }

  async login(input: { email: string; password: string }, context?: LoginContext) {
    const email = input.email.toLowerCase();
    const credential = await loadCredential({ email });
    if (!credential) {
      throw new AuthenticationAppError("Invalid credentials");
    }

    const profile = await userServiceClient.getAuthContext(credential.id);

    if (profile.status !== "ACTIVE") {
      throw new AuthorizationAppError("Account is not active");
    }

    if (!profile.isEmailVerified) {
      throw new AuthorizationAppError("Please verify your email before logging in");
    }

    const isPasswordValid = await verifyPassword(credential.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new AuthenticationAppError("Invalid credentials");
    }

    const publicUser = toPublicUser(profile);
    const tokens = await this.issueTokenPair(publicUser, context);

    await prisma.credential.update({
      where: { id: credential.id },
      data: { lastLoginAt: new Date() },
    });
    await userServiceClient.recordLastLogin(credential.id);

    return { user: publicUser, tokens };
  }

  async refresh(refreshToken: string, context?: LoginContext) {
    const payload = verifyRefreshToken(refreshToken);
    const session = await prisma.refreshTokenSession.findFirst({
      where: { jti: payload.jti, deletedAt: null },
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

    const profile = await userServiceClient.getAuthContext(payload.sub);
    if (profile.status !== "ACTIVE") {
      throw new AuthorizationAppError("User is not active");
    }

    const publicUser = toPublicUser(profile);
    const tokens = await this.issueTokenPair(publicUser, context, session.tokenFamilyId);

    await prisma.refreshTokenSession.update({
      where: { jti: session.jti },
      data: { revokedAt: new Date(), replacedByJti: tokens.jti },
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
    if (!refreshToken) return;

    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshTokenSession.updateMany({
        where: { jti: payload.jti, deletedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore invalid tokens on logout.
    }
  }

  async requestPasswordReset(email: string) {
    const credential = await loadCredential({ email: email.toLowerCase() });
    if (!credential) return;

    const profile = await userServiceClient.getAuthContext(credential.id);
    const token = generateSecureToken();

    await prisma.passwordResetToken.deleteMany({ where: { userId: credential.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: credential.id,
        tokenHash: hashToken(token),
        expiresAt: addDuration(new Date(), "1h"),
      },
    });

    await emailService.sendPasswordResetEmail(profile.email, token, profile.firstName ?? undefined);
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
    await prisma.credential.update({
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

    const { user } = await userServiceClient.updateAccountState(verificationToken.userId, {
      isEmailVerified: true,
      status: "ACTIVE",
    });

    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    return user;
  }

  private async issueTokenPair(user: PublicUser, context?: LoginContext, tokenFamilyId?: string) {
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
