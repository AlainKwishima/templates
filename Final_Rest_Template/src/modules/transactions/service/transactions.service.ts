import { TransactionStatus } from '@prisma/client';
import prisma from '../../../config/database';
import { AppError } from '../../../utils/AppError';
import { buildPaginatedResult, paginate, PaginatedResult } from '../../../utils/pagination';
import { toUserPublic } from '../../../utils/userMapper';
import { notificationService } from '../../notifications/service/notification.service';
import { transactionsRepository } from '../repository/transactions.repository';
import { isValidStatusTransition } from '../utils/statusTransitions';
import { z } from 'zod';
import { transactionQuerySchema } from '../validation/transactions.schemas';

type TransactionQuery = z.infer<typeof transactionQuerySchema>;

const mapTransaction = (t: {
  id: string;
  userId: string;
  resourceId: string;
  transactionDate: Date;
  returnDate: Date | null;
  status: TransactionStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { firstName: string; lastName: string };
  resource: { name: string };
}) => ({
  id: t.id,
  userId: t.userId,
  resourceId: t.resourceId,
  userName: `${t.user.firstName} ${t.user.lastName}`,
  resourceName: t.resource.name,
  transactionDate: t.transactionDate,
  returnDate: t.returnDate,
  status: t.status,
  notes: t.notes,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

export class TransactionsService {
  async getAll(query: TransactionQuery): Promise<PaginatedResult<ReturnType<typeof mapTransaction>>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { skip, take } = paginate({ page, limit });

    const [transactions, total] = await transactionsRepository.findAll({
      skip,
      take,
      userId: query.userId,
      resourceId: query.resourceId,
      status: query.status,
    });

    return buildPaginatedResult(transactions.map(mapTransaction), total, { page, limit });
  }

  async getById(id: string) {
    const tx = await transactionsRepository.findById(id);
    if (!tx) {
      throw new AppError('Transaction not found', 404);
    }
    return mapTransaction(tx);
  }

  async create(data: {
    userId: string;
    resourceId: string;
    transactionDate: Date;
    returnDate?: Date | null;
    notes?: string | null;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { role: true },
    });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const resource = await prisma.resource.findUnique({ where: { id: data.resourceId } });
    if (!resource) {
      throw new AppError('Resource not found', 404);
    }

    const transaction = await transactionsRepository.create({
      user: { connect: { id: data.userId } },
      resource: { connect: { id: data.resourceId } },
      transactionDate: data.transactionDate,
      returnDate: data.returnDate ?? null,
      notes: data.notes ?? null,
      status: 'Pending',
    });

    const mapped = mapTransaction(transaction);
    const publicUser = toUserPublic(user);
    void notificationService.sendTransactionCreatedEmail(publicUser, {
      id: transaction.id,
      status: transaction.status,
      resource: { name: transaction.resource.name },
    });

    return mapped;
  }

  async update(
    id: string,
    data: Partial<{
      transactionDate: Date;
      returnDate: Date | null;
      status: TransactionStatus;
      notes: string | null;
    }>,
  ) {
    const existing = await transactionsRepository.findById(id);
    if (!existing) {
      throw new AppError('Transaction not found', 404);
    }

    if (data.status && data.status !== existing.status) {
      if (!isValidStatusTransition(existing.status, data.status)) {
        throw new AppError(
          `Invalid status transition from ${existing.status} to ${data.status}`,
          400,
        );
      }
    }

    const updated = await transactionsRepository.update(id, data);

    if (data.status && data.status !== existing.status) {
      const user = await prisma.user.findUnique({
        where: { id: updated.userId },
        include: { role: true },
      });
      if (user) {
        void notificationService.sendTransactionStatusUpdateEmail(toUserPublic(user), {
          id: updated.id,
          status: updated.status,
          resource: { name: updated.resource.name },
        });
      }
    }

    return mapTransaction(updated);
  }

  async delete(id: string) {
    const tx = await transactionsRepository.findById(id);
    if (!tx) {
      throw new AppError('Transaction not found', 404);
    }
    await transactionsRepository.remove(id);
  }
}

export const transactionsService = new TransactionsService();
