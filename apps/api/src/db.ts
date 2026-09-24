import mongoose from 'mongoose';
import { config } from './config';
import { Role, RoleAssignment, Site, Transaction, User } from './models';

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  await seedDemoData();
  console.log('MongoDB connected and demo data ready');
}

async function seedDemoData(): Promise<void> {
  const adminRole = await Role.findOneAndUpdate(
    { name: 'ADMIN' },
    { name: 'ADMIN', permissions: ['dashboard.read', 'sales.read', 'service.read'] },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const memberRole = await Role.findOneAndUpdate(
    { name: 'MEMBER' },
    { name: 'MEMBER', permissions: ['dashboard.read', 'sales.read'] },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const users = await Promise.all([
    User.findOneAndUpdate({ username: 'admin' }, { username: 'admin', displayName: 'Admin (Global)' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
    User.findOneAndUpdate({ username: 'member-a' }, { username: 'member-a', displayName: 'Member A (Retail)' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
    User.findOneAndUpdate({ username: 'member-b' }, { username: 'member-b', displayName: 'Member B (Wholesale)' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
  ]);

  const [admin, memberA, memberB] = users;
  if (!admin || !memberA || !memberB || !adminRole || !memberRole) throw new Error('Unable to seed users and roles');

  await Promise.all([
    RoleAssignment.findOneAndUpdate(
      { userId: admin._id },
      { userId: admin._id, roleId: adminRole._id, scopeType: 'GLOBAL', siteId: undefined, businessUnits: [], active: true, expiresAt: undefined },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    RoleAssignment.findOneAndUpdate(
      { userId: memberA._id },
      { userId: memberA._id, roleId: memberRole._id, scopeType: 'SITE', siteId: 'SITE-A', businessUnits: ['RETAIL'], active: true, expiresAt: undefined },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
    RoleAssignment.findOneAndUpdate(
      { userId: memberB._id },
      { userId: memberB._id, roleId: memberRole._id, scopeType: 'SITE', siteId: 'SITE-B', businessUnits: ['WHOLESALE'], active: true, expiresAt: undefined },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ),
  ]);

  await Promise.all([
    Site.findOneAndUpdate({ code: 'SITE-A' }, { code: 'SITE-A', name: 'North Branch' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
    Site.findOneAndUpdate({ code: 'SITE-B' }, { code: 'SITE-B', name: 'South Branch' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
    Site.findOneAndUpdate({ code: 'SITE-NEW' }, { code: 'SITE-NEW', name: 'New Branch' }, { upsert: true, new: true, setDefaultsOnInsert: true }),
  ]);

  // The database is intentionally refreshed with generic demo records on startup.
  await Transaction.deleteMany({});
  await Transaction.insertMany([
    { transactionId: 'ORD-A-1001', siteId: 'SITE-A', businessUnit: 'RETAIL', amount: 12500, transactionAt: new Date('2026-09-20T08:30:00Z') },
    { transactionId: 'ORD-A-1002', siteId: 'SITE-A', businessUnit: 'RETAIL', amount: 8450, transactionAt: new Date('2026-09-21T10:10:00Z') },
    { transactionId: 'ORD-A-1003', siteId: 'SITE-A', businessUnit: 'WHOLESALE', amount: 4700, transactionAt: new Date('2026-09-22T13:45:00Z') },
    { transactionId: 'ORD-B-2001', siteId: 'SITE-B', businessUnit: 'WHOLESALE', amount: 22100, transactionAt: new Date('2026-09-20T09:00:00Z') },
    { transactionId: 'ORD-B-2002', siteId: 'SITE-B', businessUnit: 'WHOLESALE', amount: 9950, transactionAt: new Date('2026-09-21T14:20:00Z') },
    { transactionId: 'ORD-B-2003', siteId: 'SITE-B', businessUnit: 'RETAIL', amount: 3800, transactionAt: new Date('2026-09-23T11:00:00Z') },
    { transactionId: 'ORD-N-3001', siteId: 'SITE-NEW', businessUnit: 'RETAIL', amount: 15200, transactionAt: new Date('2026-09-22T16:30:00Z') },
    { transactionId: 'ORD-N-3002', siteId: 'SITE-NEW', businessUnit: 'WHOLESALE', amount: 7300, transactionAt: new Date('2026-09-23T12:15:00Z') },
  ]);
}
