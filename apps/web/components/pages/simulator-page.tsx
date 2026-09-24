'use client';

import { useMemo, useState } from 'react';
import { apiRequest, type DecisionResponse } from '../../lib/api';
import { useDemo } from '../demo-context';
import { CacheBadge, DecisionBadge, PageIntro, Pill, TraceTimeline } from '../ui';

const scenarios = [
  { label: 'Member A → SITE-A / RETAIL', user: 'member-a', path: '/api/transactions', site: 'SITE-A', businessUnit: 'RETAIL' },
  { label: 'Member A → SITE-B (deny)', user: 'member-a', path: '/api/transactions', site: 'SITE-B', businessUnit: 'RETAIL' },
  { label: 'Admin → SITE-NEW', user: 'admin', path: '/api/transactions', site: 'SITE-NEW', businessUnit: '' },
  { label: 'Admin → Finance (deny)', user: 'admin', path: '/api/finance', site: 'SITE-A', businessUnit: '' },
  { label: 'Member A → WHOLESALE (deny)', user: 'member-a', path: '/api/transactions', site: 'SITE-A', businessUnit: 'WHOLESALE' },
];

export function SimulatorPage() {
  const { catalog, activeUser, token, setActiveUsername, setLastDecision, lastDecision } = useDemo();
  const [path, setPath] = useState('/api/transactions');
  const [site, setSite] = useState('SITE-A');
  const [businessUnit, setBusinessUnit] = useState('RETAIL');
  const [responseData, setResponseData] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedRoute = useMemo(() => catalog?.permissionMap.find((item) => item.api.startsWith(`GET ${path}`)), [catalog, path]);

  async function runRequest() {
    setBusy(true); setError(''); setResponseData(null);
    const query = new URLSearchParams();
    if (site) query.set('siteId', site);
    if (businessUnit) query.set('businessUnit', businessUnit);
    try {
      const result = await apiRequest<DecisionResponse>(`${path}?${query.toString()}`, {}, token);
      setLastDecision(result); setResponseData(result.data ?? result);
    } catch (err) {
      const body = (err as { response?: DecisionResponse }).response;
      if (body) { setLastDecision(body); setResponseData(body.data ?? null); }
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally { setBusy(false); }
  }

  async function applyScenario(scenario: typeof scenarios[number]) {
    if (scenario.user !== activeUser?.username) await setActiveUsername(scenario.user);
    setPath(scenario.path); setSite(scenario.site); setBusinessUnit(scenario.businessUnit);
  }

  return <>
    <PageIntro eyebrow="LIVE REQUEST LAB / 04" title="Request Simulator" description="Compose a request exactly like a frontend client would. Express ignores any role or permission claim from the browser and resolves access server-side." action={<div className="request-lab-badge"><span className="pulse-dot" /> READY TO SEND</div>} />
    <div className="simulator-layout"><section className="panel request-builder"><div className="panel-heading"><div><div className="panel-kicker">REQUEST BUILDER</div><h2>Send an authorization request</h2></div><Pill tone="purple">Bearer JWT</Pill></div><div className="form-grid"><label className="field wide">ACTING USER<select value={activeUser?.username ?? ''} onChange={(event) => setActiveUsername(event.target.value)}>{catalog?.users.map((user) => <option key={user.id} value={user.username}>{user.username} · {user.role}</option>)}</select></label><label className="field wide">PAGE / API<select value={path} onChange={(event) => setPath(event.target.value)}><option value="/api/dashboard">Dashboard · GET /api/dashboard</option><option value="/api/transactions">Transactions · GET /api/transactions</option><option value="/api/finance">Finance · GET /api/finance</option><option value="/api/services/status">Service Status · GET /api/services/status</option></select></label><label className="field">SITE ID<select value={site} onChange={(event) => setSite(event.target.value)}><option value="">— no site —</option>{catalog?.sites.map((item) => <option key={item.code} value={item.code}>{item.code}</option>)}</select></label><label className="field">BUSINESS UNIT<select value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)}><option value="">— no filter —</option><option value="RETAIL">RETAIL</option><option value="WHOLESALE">WHOLESALE</option></select></label></div><div className="request-preview"><div className="request-method">GET</div><code>{path}?siteId={site || '—'}{businessUnit ? `&businessUnit=${businessUnit}` : ''}</code></div><button className="send-button" onClick={runRequest} disabled={busy || !token}>{busy ? 'Checking authorization…' : 'Send request'} <span>↗</span></button>{error && <div className="inline-error">{error}</div>}</section><section className="panel scenario-panel"><div className="panel-kicker">PRESET SCENARIOS</div><h2>Try the required cases</h2><p className="muted">Click a case to populate the request builder, then send it.</p><div className="scenario-list">{scenarios.map((scenario) => <button key={scenario.label} className="scenario-button" onClick={() => applyScenario(scenario)}><span>{scenario.label}</span><span>→</span></button>)}</div></section></div>
    <section className="panel live-result-panel"><div className="panel-heading"><div><div className="panel-kicker">RESPONSE INSPECTOR</div><h2>{selectedRoute?.page ?? 'Request'} result</h2></div><div className="panel-heading-actions"><CacheBadge cache={lastDecision?.cache} /><DecisionBadge decision={lastDecision?.decision} /></div></div>{lastDecision ? <div className="result-grid"><div><div className="subheading">SERVER DECISION TRACE</div><TraceTimeline trace={lastDecision.trace} /></div><div><div className="subheading">DATA RETURNED TO CLIENT</div><pre className="json-block result-json">{JSON.stringify(responseData ?? {}, null, 2)}</pre></div></div> : <div className="empty-state">Your response will appear here with the permission, scope, filter, and returned data.</div>}</section>
  </>;
}
