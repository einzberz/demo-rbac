import { Router } from 'express';
import { authenticateJwt, requirePermission } from '../middleware/auth';
import { resolveDataAccessScope } from '../middleware/scope';
import { Transaction } from '../models';
import type { AuthenticatedRequest } from '../types';

export const protectedRouter = Router();

protectedRouter.get('/dashboard', authenticateJwt, requirePermission('dashboard.read'), resolveDataAccessScope('SITE'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const decision = req.authorizationDecision!;
    const rows = await Transaction.find(decision.dataFilter ?? {}).lean();
    res.json({ ...decision, data: { totalTransactions: rows.length, totalAmount: rows.reduce((sum, row) => sum + row.amount, 0), sites: [...new Set(rows.map((row) => row.siteId))], businessUnits: [...new Set(rows.map((row) => row.businessUnit))] } });
  } catch (error) {
    next(error);
  }
});

protectedRouter.get('/transactions', authenticateJwt, requirePermission('sales.read'), resolveDataAccessScope('SITE'), async (req: AuthenticatedRequest, res, next) => {
  try {
    const decision = req.authorizationDecision!;
    const rows = await Transaction.find(decision.dataFilter ?? {}).sort({ transactionAt: -1 }).limit(50).lean();
    res.json({ ...decision, data: rows, resultCount: rows.length });
  } catch (error) {
    next(error);
  }
});

protectedRouter.get('/finance', authenticateJwt, requirePermission('finance.read'), resolveDataAccessScope('SITE'), async (req: AuthenticatedRequest, res) => {
  res.json({ ...req.authorizationDecision!, data: { budget: 2500000, currency: 'THB', status: 'demo-only' } });
});

protectedRouter.get('/services/status', authenticateJwt, requirePermission('service.read'), resolveDataAccessScope('GLOBAL'), (req: AuthenticatedRequest, res) => {
  res.json({
    ...req.authorizationDecision!,
    decision: 'ALLOW',
    services: [
      { name: 'Transaction API', status: 'healthy', latencyMs: 42 },
      { name: 'MongoDB', status: 'healthy', latencyMs: 9 },
      { name: 'Redis', status: 'healthy', latencyMs: 3 },
    ],
  });
});
