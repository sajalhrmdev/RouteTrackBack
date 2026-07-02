import { Response } from 'express';
import { departmentService } from '../services/department.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const departments = await departmentService.getAll(req.user!.companyId);
  sendSuccess(res, departments);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const department = await departmentService.getById(id, req.user!.companyId);
  sendSuccess(res, department);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const department = await departmentService.create(req.user!.companyId, req.body);
  sendCreated(res, department, 'Department created successfully');
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const department = await departmentService.update(id, req.user!.companyId, req.body);
  sendSuccess(res, department, 'Department updated successfully');
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await departmentService.delete(id, req.user!.companyId);
  sendSuccess(res, null, 'Department deleted successfully');
});
