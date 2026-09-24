export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface TraceStep {
  label: string;
  status: 'pass' | 'fail' | 'info';
  detail?: string;
}

export interface DecisionResponse {
  decision: 'ALLOW' | 'DENY';
  user?: string;
  userId?: string;
  requiredPermission: string;
  role?: string;
  assignmentScope?: string;
  requestedSite?: string;
  requestedBusinessUnit?: string;
  dataFilter?: Record<string, unknown>;
  cache?: 'HIT' | 'MISS' | 'BYPASS';
  reason?: string;
  trace?: TraceStep[];
  data?: unknown;
  resultCount?: number;
  services?: Array<{ name: string; status: string; latencyMs: number }>;
}

export interface DemoUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
  scope: string;
  siteId: string | null;
  businessUnits: string[];
}

export interface DemoRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface DemoSite {
  code: string;
  name: string;
}

export interface PermissionMapEntry {
  page: string;
  api: string;
  permission: string;
  scope: string;
}

export interface Catalog {
  users: DemoUser[];
  roles: DemoRole[];
  sites: DemoSite[];
  permissionMap: PermissionMapEntry[];
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(body.reason ?? body.error ?? `Request failed with ${response.status}`), { response: body, status: response.status });
  }
  return body as T;
}
