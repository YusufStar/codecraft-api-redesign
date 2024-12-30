import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../utils/auth';

export const authRequire = async (req: Request, res: Response, next: NextFunction) => {
  await authenticateToken(req, res, next);
};
