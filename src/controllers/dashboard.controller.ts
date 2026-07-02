import { Response } from 'express';
import { companyRepository } from '../repositories/company.repository';
import { attendanceRepository } from '../repositories/attendance.repository';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await companyRepository.getDashboardStats(req.user!.companyId);
  sendSuccess(res, stats);
});

export const getAttendanceTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const trend = await attendanceRepository.getAttendanceTrend(req.user!.companyId, days);
  sendSuccess(res, trend);
});

export const getDistanceTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 7;
  const trend: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const distance = await attendanceRepository.getTotalDistance(
      req.user!.companyId,
      startOfDay,
      endOfDay
    );
    trend[date.toISOString().split('T')[0]] = Math.round(distance);
  }

  sendSuccess(res, trend);
});
