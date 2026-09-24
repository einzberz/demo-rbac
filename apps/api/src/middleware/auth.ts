import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthenticatedRequest } from '../types';

interface DemoJwtPayload extends jwt.JwtPayload {
  sub: string;
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ decision: 'DENY', reason: 'JWT_MISSING', trace: [{ label: 'JWT valid', status: 'fail', detail: 'Bearer token is required' }, { label: 'DENY', status: 'fail', detail: 'JWT_MISSING' }] });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as DemoJwtPayload;
    if (!payload.sub) throw new Error('JWT subject is missing');
    req.authUserId = payload.sub;
    next();
  } catch {
    res.status(401).json({ decision: 'DENY', reason: 'JWT_INVALID', trace: [{ label: 'JWT valid', status: 'fail', detail: 'Token signature or expiry is invalid' }, { label: 'DENY', status: 'fail', detail: 'JWT_INVALID' }] });
  }
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    req.requiredPermission = permission;
    next();
  };
}
