'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiRequest, type DecisionResponse } from '../../lib/api';
import { useDemo } from '../demo-context';
import { CacheBadge, DecisionBadge, PageIntro, Pill } from '../ui';

interface TransactionRow { transactionId: string; siteId: string; businessUnit: string; amount: number; transactionAt: string; }

export function TransactionsPage() {
  const { activeUser, token, setLastDecision } = useDemo();
  const [result, setResult] = useState<DecisionResponse | null>(null);
  const [site, setSite] = useState(activeUser?.scope === 'SITE' ? activeUser.siteId ?? 'SITE-A' : 'SITE-NEW');
  const [businessUnit, setBusinessUnit] = useState('');
  useEffect(() => { if (activeUser?.scope === 'SITE' && activeUser.siteId) setSite(activeUser.siteId); }, [activeUser]);
  async function load() {
    const query = new URLSearchParams({ siteId: site }); if (businessUnit) query.set('businessUnit', businessUnit);
    try { const next = await apiRequest<DecisionResponse>(`/api/transactions?${query}`, {}, token); setResult(next); setLastDecision(next); }
    catch (error) { const body = (error as { response?: DecisionResponse }).response; if (body) { setResult(body); setLastDecision(body); } }
  }
  const rows = Array.isArray(result?.data) ? result?.data as TransactionRow[] : [];
  return <><PageIntro eyebrow="FILTERED DATA / 07" title="Transaction Preview" description="Verify that the returned records match the server-generated data filter for the current identity." action={<button className="primary-button" onClick={load}>Load transactions ↻</button>} /><div className="preview-toolbar"><span>Reading as <strong>{activeUser?.username ?? '—'}</strong></span><div className="toolbar-controls"><select value={site} onChange={(event) => setSite(event.target.value)}><option>SITE-A</option><option>SITE-B</option><option>SITE-NEW</option></select><select value={businessUnit} onChange={(event) => setBusinessUnit(event.target.value)}><option value="">All data units</option><option value="RETAIL">RETAIL</option><option value="WHOLESALE">WHOLESALE</option></select><CacheBadge cache={result?.cache} /><DecisionBadge decision={result?.decision} /></div></div>{result?.decision === 'ALLOW' ? <section className="panel transaction-panel"><div className="panel-heading"><div><div className="panel-kicker">VISIBLE RECORDS</div><h2>{result.resultCount ?? rows.length} transactions returned</h2></div><Link className="text-link" href="/trace">View decision trace →</Link></div><div className="table-wrap"><table className="data-table"><thead><tr><th>TRANSACTION</th><th>SITE</th><th>BUSINESS UNIT</th><th>AMOUNT</th><th>TRANSACTION AT</th></tr></thead><tbody>{rows.map((row) => <tr key={row.transactionId}><td><strong>{row.transactionId}</strong></td><td><Pill tone="orange">{row.siteId}</Pill></td><td><span className="data-unit">{row.businessUnit}</span></td><td className="amount">฿{row.amount.toLocaleString()}</td><td>{new Date(row.transactionAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty-state compact">No transactions matched the server-applied filter.</div>}</div></section> : <section className="panel empty-preview"><DecisionBadge decision={result?.decision} /><h2>{result?.reason ?? 'Click load to query transactions'}</h2><p>Switch users or request a different site to see scope enforcement.</p><Link className="secondary-button" href="/simulator">Open simulator</Link></section>}<div className="filter-callout"><span className="filter-icon">⌕</span><div><strong>Data filter is server-generated</strong><span>{result?.dataFilter ? JSON.stringify(result.dataFilter) : 'Run a request to inspect the exact MongoDB filter.'}</span></div></div></>;
}
