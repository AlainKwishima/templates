import { Request, Response } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler';
import { sendSuccess } from '../../../utils/response';
import { authService } from '../service/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  sendSuccess(res, user, 'User registered successfully', 201);
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  sendSuccess(res, null, 'Email verified successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.login(req.body);
  sendSuccess(res, tokens, 'Login successful');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);
  sendSuccess(res, null, 'Logged out successfully');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, null, 'If the email exists, a reset link has been sent');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, null, 'Password reset successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  sendSuccess(res, result, 'Token refreshed successfully');
});
