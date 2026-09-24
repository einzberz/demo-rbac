import type { ReactNode } from 'react';
import type { DecisionResponse, TraceStep } from '../lib/api';

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-intro"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div>{action}</div>}</div>;
}

export function DecisionBadge({ decision }: { decision?: 'ALLOW' | 'DENY' }) {
  if (!decision) return <span className="decision-badge neutral">NO DECISION</span>;
  return <span className={`decision-badge ${decision === 'ALLOW' ? 'allow' : 'deny'}`}><span className="badge-dot" />{decision}</span>;
}

export function CacheBadge({ cache }: { cache?: string }) {
  if (!cache) return null;
  return <span className={`cache-badge ${cache === 'HIT' ? 'hit' : 'miss'}`}>{cache === 'HIT' ? '⚡ REDIS HIT' : '◌ MONGODB CHECK'}</span>;
}

export function StatCard({ label, value, note, accent = 'blue' }: { label: string; value: string | number; note: string; accent?: 'blue' | 'orange' | 'green' | 'purple' }) {
  return <div className={`stat-card accent-${accent}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}

export function TraceTimeline({ trace }: { trace?: TraceStep[] }) {
  if (!trace?.length) return <div className="empty-state compact">Run a request to see the authorization sequence.</div>;
  return <div className="trace-timeline">{trace.map((step, index) => <div className="trace-row" key={`${step.label}-${index}`}><div className={`trace-marker ${step.status}`}>{step.status === 'pass' ? '✓' : step.status === 'fail' ? '×' : '·'}</div><div className="trace-content"><div className="trace-label">{step.label}</div>{step.detail && <div className="trace-detail">{step.detail}</div>}</div>{index < trace.length - 1 && <div className="trace-line" />}</div>)}</div>;
}

export function DecisionPanel({ decision, title = 'Latest decision' }: { decision: DecisionResponse | null; title?: string }) {
  return <section className="panel decision-panel"><div className="panel-heading"><div><div className="panel-kicker">DECISION OUTPUT</div><h2>{title}</h2></div><div className="panel-heading-actions"><CacheBadge cache={decision?.cache} /><DecisionBadge decision={decision?.decision} /></div></div>{decision ? <><div className="decision-meta-grid"><div><span>User</span><strong>{decision.user ?? '—'}</strong></div><div><span>Permission</span><strong>{decision.requiredPermission}</strong></div><div><span>Role</span><strong>{decision.role ?? '—'}</strong></div><div><span>Assignment scope</span><strong>{decision.assignmentScope ?? '—'}</strong></div><div><span>Requested site</span><strong>{decision.requestedSite ?? '—'}</strong></div><div><span>Business unit</span><strong>{decision.requestedBusinessUnit ?? '—'}</strong></div></div>{decision.reason && <div className="reason-box"><span>DENY REASON</span><strong>{decision.reason}</strong></div>}<div className="decision-columns"><div><div className="subheading">DECISION TRACE</div><TraceTimeline trace={decision.trace} /></div><div><div className="subheading">APPLIED DATA FILTER</div><pre className="json-block">{JSON.stringify(decision.dataFilter ?? {}, null, 2)}</pre></div></div></> : <div className="empty-state">No request has been simulated yet. Open Request Simulator to send one.</div>}</section>;
}

export function SectionTitle({ kicker, title, aside }: { kicker: string; title: string; aside?: ReactNode }) {
  return <div className="section-title"><div><div className="panel-kicker">{kicker}</div><h2>{title}</h2></div>{aside}</div>;
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'blue' | 'purple' | 'orange' | 'green' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
