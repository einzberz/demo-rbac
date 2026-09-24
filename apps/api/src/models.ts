import { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';

export type RoleName = 'ADMIN' | 'MEMBER';
export type ScopeType = 'GLOBAL' | 'SITE';

export interface UserDocument {
  username: string;
  displayName: string;
}

export interface RoleDocument {
  name: RoleName;
  permissions: string[];
}

export interface SiteDocument {
  code: string;
  name: string;
}

export interface RoleAssignmentDocument {
  userId: Types.ObjectId;
  roleId: Types.ObjectId;
  scopeType: ScopeType;
  siteId?: string;
  businessUnits: string[];
  active: boolean;
  expiresAt?: Date;
}

export interface TransactionDocument {
  transactionId: string;
  siteId: string;
  businessUnit: string;
  amount: number;
  transactionAt: Date;
}

const userSchema = new Schema<UserDocument>({
  username: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
});

const roleSchema = new Schema<RoleDocument>({
  name: { type: String, required: true, unique: true },
  permissions: { type: [String], required: true, default: [] },
});

const siteSchema = new Schema<SiteDocument>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
});

const roleAssignmentSchema = new Schema<RoleAssignmentDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  scopeType: { type: String, enum: ['GLOBAL', 'SITE'], required: true },
  siteId: { type: String },
  businessUnits: { type: [String], default: [] },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date },
});

const transactionSchema = new Schema<TransactionDocument>({
  transactionId: { type: String, required: true, unique: true },
  siteId: { type: String, required: true, index: true },
  businessUnit: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  transactionAt: { type: Date, required: true },
});

export const User: Model<UserDocument> = model<UserDocument>('User', userSchema);
export const Role: Model<RoleDocument> = model<RoleDocument>('Role', roleSchema);
export const Site: Model<SiteDocument> = model<SiteDocument>('Site', siteSchema);
export const RoleAssignment: Model<RoleAssignmentDocument> = model<RoleAssignmentDocument>('RoleAssignment', roleAssignmentSchema);
export const Transaction: Model<TransactionDocument> = model<TransactionDocument>('Transaction', transactionSchema);

export type RoleAssignmentWithRole = HydratedDocument<RoleAssignmentDocument> & {
  roleId: HydratedDocument<RoleDocument>;
};
