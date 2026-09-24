'use client';

import Link from 'next/link';
import { useDemo } from '../demo-context';
import { PageIntro, StatCard, Pill, SectionTitle } from '../ui';

export function OverviewPage() {
  const { catalog, activeUser, lastDecision } = useDemo();
  const allowCount = lastDecision?.decision === 'ALLOW' ? 1 : 0;
  return <>
    <PageIntro eyebrow="CONTROL CENTER / 01" title="Authorization Overview" description="See how a request moves from a signed JWT to a server-side permission, site scope, and filtered data result." action={<Link className="primary-button" href="/simulator">Open request simulator <span>↗</span></Link>} />
    <div className="hero-grid">
      <section className="hero-card">
        <div className="hero-card-top"><div><div className="panel-kicker">LIVE AUTHORIZATION CONTEXT</div><h2>One request. Every decision visible.</h2></div><Pill tone="green">DEMO MODE</Pill></div>
        <p className="hero-copy">Select a demo identity, send a request, and follow the exact checks performed by Express. The browser never supplies the role or permissions.</p>
        <div className="flow-strip"><FlowNode label="JWT" value="Verified" /><div className="flow-arrow">→</div><FlowNode label="RBAC" value="Permission" /><div className="flow-arrow">→</div><FlowNode label="SCOPE" value="Site + data" /><div className="flow-arrow">→</div><FlowNode label="QUERY" value="Filtered" /></div>
      </section>
      <section className="context-card"><div className="panel-kicker">CURRENT IDENTITY</div><div className="identity-avatar">{activeUser?.username.slice(0, 2).toUpperCase() ?? '--'}</div><h3>{activeUser?.displayName ?? 'Loading identity…'}</h3><div className="identity-role">{activeUser?.role ?? '—'} <span>•</span> {activeUser?.scope ?? '—'}</div><div className="identity-chips">{activeUser?.permissions.map((permission) => <Pill key={permission}>{permission}</Pill>)}</div><Link className="text-link" href="/users">Inspect assignment →</Link></section>
    </div>
    <div className="stat-grid"><StatCard label="DEMO USERS" value={catalog?.users.length ?? '—'} note="server-resolved identities" accent="blue" /><StatCard label="ROLE DEFINITIONS" value={catalog?.roles.length ?? '—'} note="permissions from MongoDB" accent="purple" /><StatCard label="SITES IN SCOPE" value={catalog?.sites.length ?? '—'} note="including SITE-NEW" accent="orange" /><StatCard label="LAST REQUEST" value={allowCount ? 'ALLOW' : '—'} note={lastDecision ? `${lastDecision.cache ?? '—'} authorization result` : 'run a scenario'} accent="green" /></div>
    <section className="panel architecture-panel"><SectionTitle kicker="REQUEST PATH" title="Authorization architecture" aside={<Pill>MONOLITHIC DEMO</Pill>} /><div className="architecture-map"><ArchitectureBlock title="NEXT.JS WEB" subtitle="User selector · Request simulator" icon="01" /><div className="map-connector">HTTP + JWT</div><ArchitectureBlock title="EXPRESS API" subtitle="Auth · permission · scope middleware" icon="02" highlighted /><div className="map-connector">query filter</div><ArchitectureBlock title="DATA LAYER" subtitle="MongoDB + Redis decision cache" icon="03" /></div><div className="architecture-note"><span className="note-icon">i</span><span><strong>Source of truth:</strong> role assignments and permissions are read on the server. Redis caches the final decision only; reset it any time from the Permission Map.</span></div></section>
  </>;
}

function FlowNode({ label, value }: { label: string; value: string }) { return <div className="flow-node"><span>{label}</span><strong>{value}</strong></div>; }
function ArchitectureBlock({ title, subtitle, icon, highlighted = false }: { title: string; subtitle: string; icon: string; highlighted?: boolean }) { return <div className={`architecture-block ${highlighted ? 'highlighted' : ''}`}><div className="architecture-icon">{icon}</div><div><strong>{title}</strong><span>{subtitle}</span></div></div>; }
