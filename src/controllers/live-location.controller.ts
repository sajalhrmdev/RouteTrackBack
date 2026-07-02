import { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../types';
import { liveLocationRepository } from '../repositories/live-location.repository';

export const getActiveLocations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const locations = await liveLocationRepository.findByCompany(req.user!.companyId);
  sendSuccess(res, locations);
});
