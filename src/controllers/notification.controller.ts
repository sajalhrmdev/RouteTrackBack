import { Response } from 'express';
import { notificationService } from '../services/notification.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationService.getAll(req.user!.companyId, req.user!.userId, req.query);
  sendPaginated(res, result as any);
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await notificationService.markAsRead(id, req.user!.userId);
  sendSuccess(res, null, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.userId, req.user!.companyId);
  sendSuccess(res, null, 'All notifications marked as read');
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await notificationService.delete(id, req.user!.userId);
  sendSuccess(res, null, 'Notification deleted');
});
