import prisma from '../../../config/database';
import { Prisma } from '@prisma/client';

export class UsersRepository {
  async findAll(params: { skip: number; take: number; search?: string }) {
    const where: Prisma.UserWhereInput = params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: params.skip,
        take: params.take,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return [users, total] as const;
  }

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, include: { role: true } });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: { role: true } });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data, include: { role: true } });
  }

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}

export const usersRepository = new UsersRepository();
