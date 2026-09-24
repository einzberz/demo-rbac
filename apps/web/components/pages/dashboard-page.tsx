'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, type DecisionResponse } from '../../lib/api';
import { useDemo } from '../demo-context';
import { CacheBadge, DecisionBadge, PageIntro, StatCard } from '../ui';

export function DashboardPage() {
  const { activeUser, token, setLastDecision } = useDemo();
  const [result, setResult] = useState<DecisionResponse | null>(null);
  const [site, setSite] = useState(activeUser?.scope === 'SITE' ? activeUser.siteId ?? 'SITE-A' : 'SITE-NEW');
  useEffect(() => { if (activeUser?.scope === 'SITE' && activeUser.siteId) setSite(activeUser.siteId); }, [activeUser]);
  async function load() {
    try { const next = await apiRequest<DecisionResponse>(`/api/dashboard?siteId=${site}`, {}, token); setResult(next); setLastDecision(next); }
    catch (error) { const body = (error as { response?: DecisionResponse }).response; if (body) { setResult(body); setLastDecision(body); } }
  }
  const data = result?.data as { totalTransactions?: number; totalAmount?: number; sites?: string[]; businessUnits?: string[] } | undefined;
  return <><PageIntro eyebrow="READ MODEL / 06" title="Dashboard Preview" description="A small dashboard backed by the same filtered transaction query. Change the acting user to compare global and site-scoped access." action={<button className="primary-button" onClick={load}>Refresh dashboard ↻</button>} /><div className="preview-toolbar"><span>Reading as <strong>{activeUser?.username ?? '—'}</strong></span><span className="toolbar-route"><code>GET /api/dashboard</code><CacheBadge cache={result?.cache} /><DecisionBadge decision={result?.decision} /></span></div>{result?.decision === 'ALLOW' ? <div className="stat-grid dashboard-stats"><StatCard label="FILTERED TRANSACTIONS" value={data?.totalTransactions ?? 0} note="rows visible to this identity" accent="blue" /><StatCard label="TOTAL AMOUNT" value={`฿${(data?.totalAmount ?? 0).toLocaleString()}`} note="from the filtered result" accent="green" /><StatCard label="SITE RESULT" value={data?.sites?.join(', ') ?? '—'} note="query site scope" accent="orange" /><StatCard label="DATA UNIT" value={data?.businessUnits?.join(', ') ?? '—'} note="server-applied filter" accent="purple" /></div> : <section className="panel empty-preview"><DecisionBadge decision={result?.decision} /><h2>{result?.reason ?? 'Click refresh to load the preview'}</h2><p>Try changing the acting user or use the Request Simulator for a detailed trace.</p><Link className="secondary-button" href="/simulator">Open simulator</Link></section>}<section className="panel preview-explain"><div className="panel-kicker">WHAT THIS PROVES</div><h2>The data query follows the authorization result</h2><p>For a site-scoped member, the server builds a MongoDB filter from the assignment. The UI never sends a role or permission to override it.</p><div className="proof-flow"><span>Role assignment</span><b>→</b><span>Data filter</span><b>→</b><span>Visible totals</span></div></section></>;
}
