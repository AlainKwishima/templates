import { Router } from 'express';
import { validate } from '../../../middleware/validate';
import * as authController from '../controller/auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validation/auth.schemas';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 */
router.post('/login', validate(loginSchema), authController.login);

router.post('/logout', validate(logoutSchema), authController.logout);

router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

export default router;
