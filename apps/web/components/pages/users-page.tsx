'use client';

import Link from 'next/link';
import { useDemo } from '../demo-context';
import { PageIntro, Pill, SectionTitle } from '../ui';

export function UsersPage() {
  const { catalog, activeUser, setActiveUsername } = useDemo();
  return <>
    <PageIntro eyebrow="ACCESS MODEL / 02" title="User / Role Assignment" description="Switch the identity used by the simulator. The API receives only a userId inside the JWT and resolves everything else from MongoDB." action={<Link className="secondary-button" href="/simulator">Test this identity ↗</Link>} />
    <section className="panel identity-panel"><SectionTitle kicker="ACTIVE DEMO USER" title="Choose a starting point" /><div className="user-card-grid">{catalog?.users.map((user) => <button key={user.id} className={`user-card ${activeUser?.username === user.username ? 'selected' : ''}`} onClick={() => setActiveUsername(user.username)}><div className="user-card-head"><div className="identity-avatar small">{user.username.slice(0, 2).toUpperCase()}</div><div><strong>{user.username}</strong><span>{user.displayName}</span></div><span className={`selection-mark ${activeUser?.username === user.username ? 'on' : ''}`}>✓</span></div><div className="user-card-tags"><Pill tone={user.role === 'ADMIN' ? 'purple' : 'blue'}>{user.role}</Pill><Pill tone={user.scope === 'GLOBAL' ? 'orange' : 'default'}>{user.scope === 'GLOBAL' ? 'GLOBAL' : user.siteId}</Pill></div><div className="user-card-footer"><span>Business unit</span><strong>{user.businessUnits.length ? user.businessUnits.join(' · ') : 'ALL'}</strong></div></button>)}</div></section>
    <section className="panel assignment-panel"><SectionTitle kicker="SERVER-SIDE ASSIGNMENT" title="What the API will resolve" /><div className="assignment-layout"><div className="assignment-rail"><AssignmentLine label="JWT subject" value={activeUser?.id ?? '—'} mono /><AssignmentLine label="username" value={activeUser?.username ?? '—'} /><AssignmentLine label="role" value={activeUser?.role ?? '—'} /><AssignmentLine label="scope type" value={activeUser?.scope ?? '—'} /></div><div className="assignment-visual"><div className="scope-orbit"><div className="orbit-center">{activeUser?.scope === 'GLOBAL' ? 'ALL SITES' : activeUser?.siteId ?? 'NO SITE'}</div><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-chip chip-top">permission</div><div className="orbit-chip chip-right">data filter</div><div className="orbit-chip chip-bottom">query</div></div></div><div className="assignment-permissions"><div className="subheading">EFFECTIVE PERMISSIONS</div>{activeUser?.permissions.map((permission) => <div className="permission-line" key={permission}><span className="check-circle">✓</span>{permission}</div>)}{activeUser?.permissions.length === 0 && <div className="muted">No permissions assigned.</div>}</div></div></section>
  </>;
}

function AssignmentLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="assignment-line"><span>{label}</span><strong className={mono ? 'mono' : ''}>{value}</strong></div>; }
