import { z } from 'zod';
import { PASSWORD_HINT, PASSWORD_REGEX } from '@/constants';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Must be a valid email address')
  .max(254, 'Email must be at most 254 characters');

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .regex(PASSWORD_REGEX, PASSWORD_HINT);

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^\S+$/, 'Username must not contain whitespace');

export const nameSchema = (field: string) =>
  z
    .string()
    .min(2, `${field} must be at least 2 characters`)
    .max(50, `${field} must be at most 50 characters`);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: nameSchema('First name'),
    lastName: nameSchema('Last name'),
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  firstName: nameSchema('First name').optional(),
  lastName: nameSchema('Last name').optional(),
  username: usernameSchema.optional(),
});

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateRoleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
