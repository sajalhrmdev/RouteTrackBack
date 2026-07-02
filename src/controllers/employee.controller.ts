import { Response } from 'express';
import { employeeService } from '../services/employee.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../types';
import { resolveEmployeeId } from '../utils/helpers';

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await employeeService.getAll(req.user!.companyId, req.query);
  sendPaginated(res, result);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  let id = req.params.id as string;
  if (id === 'me') {
    const empId = await resolveEmployeeId(req.user!.userId, req.user!.companyId);
    if (!empId) throw new NotFoundError('Employee profile not found');
    id = empId;
  }
  const employee = await employeeService.getById(id, req.user!.companyId);
  sendSuccess(res, employee);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const employee = await employeeService.create(req.user!.companyId, req.body);
  sendCreated(res, employee, 'Employee created successfully');
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const employee = await employeeService.update(id, req.user!.companyId, req.body);
  sendSuccess(res, employee, 'Employee updated successfully');
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await employeeService.delete(id, req.user!.companyId);
  sendSuccess(res, null, 'Employee deleted successfully');
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await employeeService.getStats(req.user!.companyId);
  sendSuccess(res, stats);
});
