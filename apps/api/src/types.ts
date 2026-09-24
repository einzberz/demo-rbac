import type { Request } from 'express';

export type Decision = 'ALLOW' | 'DENY';
export type CacheStatus = 'HIT' | 'MISS' | 'BYPASS';
export type TraceStatus = 'pass' | 'fail' | 'info';

export interface TraceStep {
  label: string;
  status: TraceStatus;
  detail?: string;
}

export interface AuthorizationDecision {
  decision: Decision;
  user?: string;
  userId?: string;
  requiredPermission: string;
  role?: string;
  assignmentScope?: string;
  requestedSite?: string;
  requestedBusinessUnit?: string;
  dataFilter?: Record<string, unknown>;
  cache: CacheStatus;
  reason?: string;
  trace: TraceStep[];
}

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
  requiredPermission?: string;
  authorizationDecision?: AuthorizationDecision;
}

export type AccessScope = 'SITE' | 'GLOBAL';
