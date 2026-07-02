import { Response } from 'express';
import { designationService } from '../services/designation.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { AuthRequest } from '../types';

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const designations = await designationService.getAll(req.user!.companyId);
  sendSuccess(res, designations);
});

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const designation = await designationService.getById(id, req.user!.companyId);
  sendSuccess(res, designation);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const designation = await designationService.create(req.user!.companyId, req.body);
  sendCreated(res, designation, 'Designation created successfully');
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const designation = await designationService.update(id, req.user!.companyId, req.body);
  sendSuccess(res, designation, 'Designation updated successfully');
});

export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await designationService.delete(id, req.user!.companyId);
  sendSuccess(res, null, 'Designation deleted successfully');
});
