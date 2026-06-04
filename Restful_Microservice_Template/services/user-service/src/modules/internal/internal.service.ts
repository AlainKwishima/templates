import { prisma } from "@/database/prisma.js";
import {
  ConflictAppError,
  DEFAULT_USER_ROLE_NAME,
  NotFoundAppError,
  type PublicUser,
  type UserAuthContext,
} from "@restful/shared";

function toAuthContext(user: {
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
}): UserAuthContext {
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
    ...toAuthContext(user),
    roles: user.roles.map((assignment) => assignment.role.name),
  };
}

async function loadUser(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { roles: { include: { role: true } } },
  });
}

export class InternalUsersService {
  async createUser(input: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ id: input.id }, { email: input.email.toLowerCase() }], deletedAt: null },
    });
    if (existing) {
      throw new ConflictAppError("User profile already exists");
    }

    const defaultRole = await prisma.role.findFirst({
      where: { name: DEFAULT_USER_ROLE_NAME, deletedAt: null },
    });

    const user = await prisma.user.create({
      data: {
        id: input.id,
        email: input.email.toLowerCase(),
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
        isEmailVerified: false,
        status: "PENDING",
        ...(defaultRole
          ? {
              roles: {
                create: [{ roleId: defaultRole.id }],
              },
            }
          : {}),
      },
      include: { roles: { include: { role: true } } },
    });

    return toPublicUser(user);
  }

  async getAuthContext(userId: string) {
    const user = await loadUser(userId);
    if (!user) {
      throw new NotFoundAppError("User not found");
    }
    return toAuthContext(user);
  }

  async getAuthContextByEmail(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    if (!user) {
      throw new NotFoundAppError("User not found");
    }
    return toAuthContext(user);
  }

  async updateAccountState(
    userId: string,
    input: { isEmailVerified?: boolean; status?: "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED" },
  ) {
    const user = await loadUser(userId);
    if (!user) {
      throw new NotFoundAppError("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.isEmailVerified !== undefined ? { isEmailVerified: input.isEmailVerified } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    const refreshed = await loadUser(userId);
    return toPublicUser(refreshed!);
  }

  async recordLastLogin(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
