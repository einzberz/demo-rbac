'use client';

import { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useDemo } from '../demo-context';
import { CacheBadge, PageIntro, Pill, SectionTitle } from '../ui';

export function PermissionsPage() {
  const { catalog, token, refreshCatalog } = useDemo();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  async function mutate(role: string, permission: string, action: 'add' | 'remove') {
    setBusy(`${role}:${permission}`);
    try {
      const result = await apiRequest<{ cacheInvalidated: number }>(`/api/demo/roles/${role}/permissions`, { method: 'POST', body: JSON.stringify({ permission, action }) }, token);
      setMessage(`${action === 'remove' ? 'Removed' : 'Added'} ${permission} on ${role}. Invalidated ${result.cacheInvalidated} cached decision(s).`);
      await refreshCatalog();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Permission update failed'); }
    finally { setBusy(''); }
  }
  async function resetCache() {
    setBusy('cache');
    try { const result = await apiRequest<{ cacheInvalidated: number }>('/api/demo/cache/reset', { method: 'POST' }, token); setMessage(`Reset complete. Invalidated ${result.cacheInvalidated} authorization decision(s).`); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Cache reset failed'); }
    finally { setBusy(''); }
  }
  return <>
    <PageIntro eyebrow="POLICY SURFACE / 03" title="Page Permission Map" description="See the permission required by each page and safely change demo role permissions to watch Redis invalidation happen." action={<button className="secondary-button" onClick={resetCache} disabled={busy === 'cache'}>{busy === 'cache' ? 'Resetting…' : '↻ Reset authorization cache'}</button>} />
    {message && <div className="toast-message"><span>✓</span>{message}</div>}
    <section className="panel"><SectionTitle kicker="API ROUTE MAP" title="Page → API → permission → scope" /><div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>PAGE</th><th>API ROUTE</th><th>REQUIRED PERMISSION</th><th>SCOPE CHECK</th></tr></thead><tbody>{catalog?.permissionMap.map((item) => <tr key={item.page}><td><strong>{item.page}</strong></td><td><code>{item.api}</code></td><td><span className="permission-token">{item.permission}</span></td><td><Pill tone={item.scope === 'GLOBAL' ? 'orange' : 'blue'}>{item.scope}</Pill></td></tr>)}</tbody></table></div></section>
    <section className="panel role-panel"><SectionTitle kicker="LIVE ROLE DEFINITIONS" title="Role permissions from MongoDB" aside={<CacheBadge cache="MISS" />} /><div className="role-grid">{catalog?.roles.map((role) => <RoleCard key={role.id} role={role} busy={busy} onMutate={mutate} />)}</div></section>
  </>;
}

function RoleCard({ role, busy, onMutate }: { role: { name: string; permissions: string[] }; busy: string; onMutate: (role: string, permission: string, action: 'add' | 'remove') => void }) {
  const permissionOptions = ['dashboard.read', 'sales.read', 'finance.read', 'service.read'];
  return <div className="role-card"><div className="role-card-head"><div className={`role-emblem ${role.name === 'ADMIN' ? 'admin' : 'member'}`}>{role.name === 'ADMIN' ? 'A' : 'M'}</div><div><h3>{role.name}</h3><span>{role.name === 'ADMIN' ? 'Global demo administrator' : 'Site-scoped demo member'}</span></div></div><div className="role-permission-list">{permissionOptions.map((permission) => { const enabled = role.permissions.includes(permission); return <div className={`role-permission ${enabled ? 'enabled' : ''}`} key={permission}><span className="permission-status">{enabled ? '✓' : '—'}</span><span>{permission}</span><button className="permission-toggle" onClick={() => onMutate(role.name, permission, enabled ? 'remove' : 'add')} disabled={Boolean(busy)}>{busy === `${role.name}:${permission}` ? '…' : enabled ? 'Remove' : 'Add'}</button></div>; })}</div></div>;
}
