import { User } from '@prisma/client';

export type UserPublic = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  role?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const toUserPublic = (
  user: User & { role?: { name: string } },
): UserPublic => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  roleId: user.roleId,
  ...(user.role ? { role: user.role.name } : {}),
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
