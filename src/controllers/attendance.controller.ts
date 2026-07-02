import { Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../types';
import { prisma } from '../config/database';
import { employeeRepository } from '../repositories/employee.repository';

async function resolveEmployeeId(userId: string, companyId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new NotFoundError('User not found');
  const employee = await employeeRepository.findByEmail(user.email, companyId);
  if (!employee) throw new NotFoundError('Employee profile not found. Create an employee profile first.');
  return employee.id;
}

export const checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employeeId = req.params.employeeId
    ? (req.params.employeeId as string)
    : await resolveEmployeeId(req.user!.userId, req.user!.companyId);
  const attendance = await attendanceService.checkIn(
    employeeId,
    req.user!.companyId,
    req.body
  );
  sendCreated(res, attendance, 'Check in successful');
});

export const checkOut = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employeeId = req.params.employeeId
    ? (req.params.employeeId as string)
    : await resolveEmployeeId(req.user!.userId, req.user!.companyId);
  const attendance = await attendanceService.checkOut(
    employeeId,
    req.user!.companyId,
    req.body
  );
  sendSuccess(res, attendance, 'Check out successful');
});

export const getTodayAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const records = await attendanceService.getTodayAttendance(req.user!.companyId);
  sendSuccess(res, records);
});

export const getCheckedInEmployees = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employees = await attendanceService.getCheckedInEmployees(req.user!.companyId);
  sendSuccess(res, employees);
});

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.role === 'COMPANY_ADMIN' || req.user!.role === 'MANAGER' || req.user!.role === 'SUPER_ADMIN';
  const query = { ...req.query };

  if (!isAdmin) {
    const empId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
    query.employeeId = empId;
  }

  const result = await attendanceService.getHistory(req.user!.companyId, query);
  sendPaginated(res, result);
});

export const getEmployeeToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  let employeeId = req.params.employeeId as string;
  if (employeeId === 'me') {
    employeeId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
  }
  const attendance = await attendanceService.getEmployeeToday(employeeId, req.user!.companyId);
  sendSuccess(res, attendance);
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await attendanceService.getStats(req.user!.companyId);
  sendSuccess(res, stats);
});
