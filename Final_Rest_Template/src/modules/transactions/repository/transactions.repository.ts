import prisma from '../../../config/database';
import { Prisma, TransactionStatus } from '@prisma/client';

export class TransactionsRepository {
  async findAll(params: {
    skip: number;
    take: number;
    userId?: string;
    resourceId?: string;
    status?: TransactionStatus;
  }) {
    const where: Prisma.TransactionWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.resourceId) where.resourceId = params.resourceId;
    if (params.status) where.status = params.status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true } },
          resource: { select: { name: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return [transactions, total] as const;
  }

  findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        resource: { select: { name: true } },
      },
    });
  }

  create(data: Prisma.TransactionCreateInput) {
    return prisma.transaction.create({
      data,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        resource: { select: { name: true } },
      },
    });
  }

  update(id: string, data: Prisma.TransactionUpdateInput) {
    return prisma.transaction.update({
      where: { id },
      data,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        resource: { select: { name: true } },
      },
    });
  }

  remove(id: string) {
    return prisma.transaction.delete({ where: { id } });
  }
}

export const transactionsRepository = new TransactionsRepository();
