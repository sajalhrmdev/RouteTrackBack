import { Response } from 'express';
import { gpsService } from '../services/gps.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { resolveEmployeeId } from '../utils/helpers';
import { gpsRepository } from '../repositories/gps.repository';
import { Role } from '@prisma/client';

export const recordLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const empId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
  if (!empId) throw new NotFoundError('Employee profile not found');
  const location = await gpsService.recordLocation(
    empId,
    req.user!.companyId,
    req.body
  );
  sendCreated(res, location, 'Location recorded');
});

export const recordBatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const empId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
  if (!empId) throw new NotFoundError('Employee profile not found');
  await gpsService.recordBatch(
    empId,
    req.user!.companyId,
    req.body.locations,
    req.body.attendanceId
  );
  sendSuccess(res, null, 'Locations recorded');
});

export const getRouteHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.role === 'COMPANY_ADMIN' || req.user!.role === 'MANAGER' || req.user!.role === 'SUPER_ADMIN';
  let employeeId = req.params.employeeId as string;

  if (!isAdmin) {
    const ownEmpId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
    if (!ownEmpId) throw new NotFoundError('Employee profile not found');
    if (employeeId !== 'me' && employeeId !== ownEmpId) {
      throw new ForbiddenError('You can only view your own route history');
    }
    employeeId = ownEmpId;
  }

  const history = await gpsService.getRouteHistory(
    employeeId,
    req.query.date as string,
    req.user!.companyId
  );
  sendSuccess(res, history);
});

export const getLastLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.role === 'COMPANY_ADMIN' || req.user!.role === 'MANAGER' || req.user!.role === 'SUPER_ADMIN';
  let employeeId = req.params.employeeId as string;

  if (!isAdmin) {
    const ownEmpId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
    if (!ownEmpId) throw new NotFoundError('Employee profile not found');
    if (employeeId !== 'me' && employeeId !== ownEmpId) {
      throw new ForbiddenError('You can only view your own location');
    }
    employeeId = ownEmpId;
  }

  const location = await gpsRepository.getLastLocation(employeeId, req.user!.companyId);
  sendSuccess(res, location);
});
