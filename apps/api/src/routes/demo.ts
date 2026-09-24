import { Router } from 'express';
import { Role, RoleAssignment, Site, User } from '../models';
import { resetAuthorizationCache } from '../services/cache';
import { authenticateJwt } from '../middleware/auth';
import type { AuthenticatedRequest } from '../types';

export const demoRouter = Router();

demoRouter.get('/catalog', async (_req, res, next) => {
  try {
    const [users, roles, assignments, sites] = await Promise.all([
      User.find().sort({ username: 1 }).lean(),
      Role.find().sort({ name: 1 }).lean(),
      RoleAssignment.find().populate('roleId').lean(),
      Site.find().sort({ code: 1 }).lean(),
    ]);

    const assignmentByUser = new Map(assignments.map((assignment) => [String(assignment.userId), assignment]));
    res.json({
      users: users.map((user) => {
        const assignment = assignmentByUser.get(String(user._id)) as typeof assignments[number] & { roleId: { name: string; permissions: string[] } } | undefined;
        return {
          id: String(user._id),
          username: user.username,
          displayName: user.displayName,
          role: assignment?.roleId?.name ?? 'UNASSIGNED',
          permissions: assignment?.roleId?.permissions ?? [],
          scope: assignment?.scopeType ?? 'NONE',
          siteId: assignment?.siteId ?? null,
          businessUnits: assignment?.businessUnits ?? [],
        };
      }),
      roles: roles.map((role) => ({ id: String(role._id), name: role.name, permissions: role.permissions })),
      sites: sites.map((site) => ({ code: site.code, name: site.name })),
      permissionMap: [
        { page: 'Dashboard', api: 'GET /api/dashboard', permission: 'dashboard.read', scope: 'SITE' },
        { page: 'Transactions', api: 'GET /api/transactions', permission: 'sales.read', scope: 'SITE' },
        { page: 'Finance', api: 'GET /api/finance', permission: 'finance.read', scope: 'SITE' },
        { page: 'Service Status', api: 'GET /api/services/status', permission: 'service.read', scope: 'GLOBAL' },
      ],
    });
  } catch (error) {
    next(error);
  }
});

demoRouter.post('/roles/:roleName/permissions', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const admin = req.authUserId ? await User.findById(req.authUserId) : null;
    const adminAssignment = admin ? await RoleAssignment.findOne({ userId: admin._id, active: true }).populate('roleId') : null;
    const adminRole = adminAssignment?.roleId as unknown as { name?: string } | undefined;
    if (adminRole?.name !== 'ADMIN' || adminAssignment?.scopeType !== 'GLOBAL') {
      res.status(403).json({ error: 'Only a global ADMIN can change demo role permissions' });
      return;
    }

    const permission = typeof req.body?.permission === 'string' ? req.body.permission.trim() : '';
    const action = req.body?.action === 'remove' ? 'remove' : req.body?.action === 'add' ? 'add' : undefined;
    if (!permission || !action) {
      res.status(400).json({ error: 'permission and action (add/remove) are required' });
      return;
    }

    const roleName = Array.isArray(req.params.roleName) ? req.params.roleName[0] : req.params.roleName;
    const role = await Role.findOne({ name: roleName.toUpperCase() });
    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }
    const permissions = new Set(role.permissions);
    if (action === 'add') permissions.add(permission);
    else permissions.delete(permission);
    role.permissions = [...permissions].sort();
    await role.save();
    const invalidated = await resetAuthorizationCache();
    res.json({ role: role.name, permissions: role.permissions, cacheInvalidated: invalidated });
  } catch (error) {
    next(error);
  }
});

demoRouter.post('/cache/reset', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const admin = req.authUserId ? await User.findById(req.authUserId) : null;
    const assignment = admin ? await RoleAssignment.findOne({ userId: admin._id }).populate('roleId') : null;
    const role = assignment?.roleId as unknown as { name?: string } | undefined;
    if (role?.name !== 'ADMIN' || assignment?.scopeType !== 'GLOBAL') {
      res.status(403).json({ error: 'Only a global ADMIN can reset the demo cache' });
      return;
    }
    res.json({ cacheInvalidated: await resetAuthorizationCache() });
  } catch (error) {
    next(error);
  }
});
