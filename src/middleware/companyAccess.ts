import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ForbiddenError } from '../utils/errors';

export function requireCompanyAccess(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new ForbiddenError('Not authenticated');
  }

  const requestedCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (requestedCompanyId && req.user.role !== 'SUPER_ADMIN') {
    if (requestedCompanyId !== req.user.companyId) {
      throw new ForbiddenError('Access denied to this company data');
    }
  }

  next();
}

export function injectCompanyId(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.user && req.user.role !== 'SUPER_ADMIN') {
    req.body.companyId = req.user.companyId;
  }
  next();
}
