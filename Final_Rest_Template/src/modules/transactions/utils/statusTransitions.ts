import { TransactionStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  Pending: ['Active'],
  Active: ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

export const isValidStatusTransition = (
  current: TransactionStatus,
  next: TransactionStatus,
): boolean => {
  if (current === next) {
    return false;
  }
  return VALID_TRANSITIONS[current].includes(next);
};
