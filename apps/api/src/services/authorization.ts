import { RoleAssignment, User, type RoleAssignmentWithRole } from '../models';
import type { AccessScope, AuthorizationDecision, CacheStatus, TraceStep } from '../types';
import { authorizationCacheKey, redis } from './cache';

interface AuthorizationInput {
  userId: string;
  requiredPermission: string;
  requestedSite?: string;
  requestedBusinessUnit?: string;
  accessScope: AccessScope;
}

function trace(label: string, status: TraceStep['status'], detail?: string): TraceStep {
  return { label, status, ...(detail ? { detail } : {}) };
}

function cacheTrace(decision: AuthorizationDecision, cache: CacheStatus): AuthorizationDecision {
  const nextTrace = decision.trace.map((step) => step.label === 'MongoDB CHECK'
    ? trace(cache === 'HIT' ? 'Redis cache HIT' : 'MongoDB CHECK', 'info', cache === 'HIT' ? 'Authorization decision served from Redis' : 'No cached decision; checked assignment and role in MongoDB')
    : step);
  return { ...decision, cache, trace: nextTrace };
}

function serializeForCache(decision: AuthorizationDecision): string {
  return JSON.stringify({ ...decision, cache: 'MISS' });
}

function parseCached(value: string): AuthorizationDecision {
  return JSON.parse(value) as AuthorizationDecision;
}

function deny(input: AuthorizationInput, fields: Partial<AuthorizationDecision>, steps: TraceStep[]): AuthorizationDecision {
  return {
    decision: 'DENY',
    requiredPermission: input.requiredPermission,
    requestedSite: input.requestedSite,
    requestedBusinessUnit: input.requestedBusinessUnit,
    cache: 'MISS',
    ...fields,
    trace: [...steps, trace('DENY', 'fail', fields.reason)],
  };
}

export async function authorize(input: AuthorizationInput): Promise<AuthorizationDecision> {
  const key = authorizationCacheKey(input.userId, input.requiredPermission, input.requestedSite, input.requestedBusinessUnit);
  const cached = await redis.get(key);
  if (cached) return cacheTrace(parseCached(cached), 'HIT');

  const steps: TraceStep[] = [trace('JWT valid', 'pass', 'Token verified and userId was extracted')];
  const user = await User.findById(input.userId);
  if (!user) {
    const decision = deny(input, { reason: 'USER_NOT_FOUND' }, [...steps, trace('User found', 'fail', 'The JWT subject does not map to a demo user')]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }
  steps.push(trace('User found', 'pass', user.username));

  const assignment = await RoleAssignment.findOne({ userId: user._id, active: true }).populate('roleId') as RoleAssignmentWithRole | null;
  if (!assignment) {
    const decision = deny(input, { user: user.username, userId: user.id, reason: 'ASSIGNMENT_NOT_FOUND' }, [...steps, trace('Role Assignment found', 'fail', 'No active role assignment exists')]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }

  const role = assignment.roleId;
  steps.push(trace('Role Assignment found', 'pass', `${role.name} / ${assignment.scopeType}`));
  const commonFields = {
    user: user.username,
    userId: user.id,
    role: role.name,
    assignmentScope: assignment.scopeType === 'GLOBAL' ? 'GLOBAL' : assignment.siteId,
    requestedSite: input.requestedSite,
    requestedBusinessUnit: input.requestedBusinessUnit,
  };

  if (assignment.expiresAt && assignment.expiresAt.getTime() <= Date.now()) {
    const decision = deny(input, { ...commonFields, reason: 'ASSIGNMENT_EXPIRED' }, [...steps, trace('Assignment active', 'fail', 'The role assignment has expired')]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }

  if (!role.permissions.includes(input.requiredPermission)) {
    const decision = deny(input, { ...commonFields, reason: 'PERMISSION_NOT_GRANTED' }, [...steps, trace('Permission matched', 'fail', `${role.name} does not include ${input.requiredPermission}`)]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }
  steps.push(trace('Permission matched', 'pass', input.requiredPermission));

  if (input.accessScope === 'GLOBAL' && assignment.scopeType !== 'GLOBAL') {
    const decision = deny(input, { ...commonFields, reason: 'GLOBAL_SCOPE_REQUIRED' }, [...steps, trace('Global scope matched', 'fail', 'This API requires a GLOBAL assignment')]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }

  if (input.accessScope === 'SITE' && !input.requestedSite) {
    const decision = deny(input, { ...commonFields, reason: 'SITE_REQUIRED' }, [...steps, trace('Site scope matched', 'fail', 'A siteId is required for this API')]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }

  if (assignment.scopeType === 'SITE' && input.requestedSite !== assignment.siteId) {
    const decision = deny(input, { ...commonFields, reason: 'SITE_SCOPE_MISMATCH' }, [...steps, trace('Site scope matched', 'fail', `Assignment is limited to ${assignment.siteId}`)]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }
  steps.push(trace('Site scope matched', 'pass', assignment.scopeType === 'GLOBAL' ? 'GLOBAL assignment can read every site' : assignment.siteId));

  if (assignment.scopeType === 'SITE' && input.requestedBusinessUnit && !assignment.businessUnits.includes(input.requestedBusinessUnit)) {
    const decision = deny(input, { ...commonFields, reason: 'DATA_SCOPE_MISMATCH' }, [...steps, trace('Data scope matched', 'fail', `Allowed business units: ${assignment.businessUnits.join(', ')}`)]);
    await redis.set(key, serializeForCache(decision), 'EX', 300);
    return decision;
  }

  const dataFilter: Record<string, unknown> = {};
  if (input.requestedSite) dataFilter.siteId = input.requestedSite;
  if (assignment.scopeType === 'SITE') {
    dataFilter.businessUnit = input.requestedBusinessUnit ?? { $in: assignment.businessUnits };
  } else if (input.requestedBusinessUnit) {
    dataFilter.businessUnit = input.requestedBusinessUnit;
  }

  steps.push(trace('Data scope matched', 'pass', 'MongoDB query filter prepared from the server-side assignment'));
  const decision: AuthorizationDecision = {
    ...commonFields,
    decision: 'ALLOW',
    requiredPermission: input.requiredPermission,
    dataFilter,
    cache: 'MISS',
    trace: [...steps, trace('ALLOW', 'pass', 'Request may continue to the controller')],
  };
  await redis.set(key, serializeForCache(decision), 'EX', 300);
  return decision;
}
