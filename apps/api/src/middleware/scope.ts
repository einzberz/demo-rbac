import type { NextFunction, Response } from 'express';
import { authorize } from '../services/authorization';
import type { AccessScope, AuthenticatedRequest } from '../types';

export function resolveDataAccessScope(accessScope: AccessScope = 'SITE') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.authUserId || !req.requiredPermission) {
      res.status(500).json({ error: 'Authorization middleware is incomplete' });
      return;
    }

    const requestedSite = typeof req.query.siteId === 'string' ? req.query.siteId : undefined;
    const requestedBusinessUnit = typeof req.query.businessUnit === 'string' ? req.query.businessUnit : undefined;
    try {
      const decision = await authorize({
        userId: req.authUserId,
        requiredPermission: req.requiredPermission,
        requestedSite,
        requestedBusinessUnit,
        accessScope,
      });
      req.authorizationDecision = decision;
      if (decision.decision === 'DENY') {
        res.status(403).json(decision);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
