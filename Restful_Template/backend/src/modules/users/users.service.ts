import { prisma } from "@/database/prisma.js";
import type { Prisma } from "@prisma/client";
import { ADMIN_ROLE_NAME } from "@/shared/constants/roles.js";
import { NotFoundAppError, ValidationAppError } from "@/shared/errors/app-error.js";
import type { PublicUser } from "@/shared/types/auth.js";
import { normalizePagination } from "@/utils/pagination.js";

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

async function loadUser(id: string) {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
}

async function countOtherActiveAdmins(userId: string) {
  return prisma.user.count({
    where: {
      deletedAt: null,
      id: { not: userId },
      status: "ACTIVE",
      roles: {
        some: {
          role: {
            name: ADMIN_ROLE_NAME,
            deletedAt: null,
          },
        },
      },
    },
  });
}

export class UsersService {
  async getMe(userId: string) {
    const user = await loadUser(userId);
    if (!user) {
      throw new NotFoundAppError("User not found");
    }
    return toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    input: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      avatarUrl?: string;
    },
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
        ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
      },
    });

    const user = await loadUser(userId);
    if (!user) {
      throw new NotFoundAppError("User not found");
    }
    return toPublicUser(user);
  }

  async listUsers(input: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const pagination = normalizePagination({
      page: input.page,
      limit: input.limit,
      search: input.search,
    });

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.search
        ? {
            OR: [
              { email: { contains: input.search, mode: "insensitive" as const } },
              { firstName: { contains: input.search, mode: "insensitive" as const } },
              { lastName: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(input.role
        ? {
            roles: {
              some: {
                role: {
                  name: input.role,
                },
              },
            },
          }
        : {}),
    };

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
    ]);

    const publicUsers = users.map((user) => toPublicUser(user as any));
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

    return {
      users: publicUsers,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    };
  }

  async setStatus(id: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED") {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundAppError("User not found");
    }

    const isAdmin = user.roles.some((assignment) => assignment.role.name === ADMIN_ROLE_NAME);
    if (isAdmin && status !== "ACTIVE") {
      const remainingAdmins = await countOtherActiveAdmins(id);
      if (remainingAdmins === 0) {
        throw new ValidationAppError("At least one active admin account must remain");
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        status,
        ...(status === "DELETED" ? { deletedAt: new Date() } : { deletedAt: null }),
      },
    });

    if (status === "DELETED") {
      const deletedUser = await prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!deletedUser) {
        throw new NotFoundAppError("User not found");
      }

      return toPublicUser(deletedUser);
    }

    return this.getMe(id);
  }

  async replaceRoles(id: string, roles: string[]) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundAppError("User not found");
    }

    const matchedRoles = await prisma.role.findMany({
      where: { name: { in: roles }, deletedAt: null },
    });

    if (matchedRoles.length !== roles.length) {
      const matchedNames = new Set(matchedRoles.map((role) => role.name));
      const missingRoles = roles.filter((role) => !matchedNames.has(role));
      throw new ValidationAppError("One or more roles are invalid", { missingRoles });
    }

    const isRemovingAdmin = user.roles.some((assignment) => assignment.role.name === ADMIN_ROLE_NAME)
      && !roles.includes(ADMIN_ROLE_NAME);

    if (isRemovingAdmin) {
      const remainingAdmins = await countOtherActiveAdmins(id);
      if (remainingAdmins === 0) {
        throw new ValidationAppError("At least one active admin account must remain");
      }
    }

    await prisma.userRole.deleteMany({ where: { userId: id } });

    if (matchedRoles.length) {
      await prisma.userRole.createMany({
        data: matchedRoles.map((role) => ({
          userId: id,
          roleId: role.id,
        })),
      });
    }

    return this.getMe(id);
  }

  async getRoles() {
    return prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }
}
