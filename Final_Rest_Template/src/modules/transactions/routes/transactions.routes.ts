import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { authorise } from '../../../middleware/authorise';
import { validate } from '../../../middleware/validate';
import { uuidParamSchema } from '../../../shared/zod/common.schemas';
import * as transactionsController from '../controller/transactions.controller';
import {
  createTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from '../validation/transactions.schemas';

const router = Router();

router.get(
  '/',
  authenticate,
  validate({ query: transactionQuerySchema }),
  transactionsController.listTransactions,
);
router.get(
  '/:id',
  authenticate,
  validate({ params: uuidParamSchema }),
  transactionsController.getTransaction,
);

router.post(
  '/',
  authenticate,
  authorise('Admin', 'Staff'),
  validate(createTransactionSchema),
  transactionsController.createTransaction,
);
router.put(
  '/:id',
  authenticate,
  authorise('Admin', 'Staff'),
  validate({ params: uuidParamSchema, body: updateTransactionSchema }),
  transactionsController.updateTransaction,
);
router.delete(
  '/:id',
  authenticate,
  authorise('Admin'),
  validate({ params: uuidParamSchema }),
  transactionsController.deleteTransaction,
);

export default router;
