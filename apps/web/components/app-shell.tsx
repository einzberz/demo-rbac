'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useDemo } from './demo-context';

const navItems = [
  { href: '/', label: 'Authorization Overview', icon: '◈' },
  { href: '/users', label: 'User / Role Assignment', icon: '◎' },
  { href: '/permissions', label: 'Page Permission Map', icon: '⌘' },
  { href: '/simulator', label: 'Request Simulator', icon: '↗' },
  { href: '/trace', label: 'Decision Trace', icon: '≋' },
  { href: '/dashboard', label: 'Dashboard Preview', icon: '▦' },
  { href: '/transactions', label: 'Transaction Preview', icon: '₿' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { catalog, activeUser, loading, error, setActiveUsername } = useDemo();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span>AS</span></div>
          <div><div className="brand-name">AuthScope</div><div className="brand-subtitle">VISUALIZER / DEMO</div></div>
        </div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="main-nav">
          {navItems.map((item) => <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}><span className="nav-icon">{item.icon}</span>{item.label}</Link>)}
        </nav>
        <div className="sidebar-footer">
          <div className="environment-pill"><span className="pulse-dot" /> LOCAL DEMO ENVIRONMENT</div>
          <div className="stack-list"><span>Next.js</span><span>Express</span><span>MongoDB</span><span>Redis</span></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>AUTHORIZATION</span><span className="breadcrumb-slash">/</span><strong>{navItems.find((item) => item.href === pathname)?.label ?? 'Overview'}</strong></div>
          <div className="topbar-actions">
            <div className="api-state"><span className={`state-dot ${error ? 'offline' : ''}`} />{loading ? 'CONNECTING' : error ? 'API OFFLINE' : 'API CONNECTED'}</div>
            <label className="user-select-label">ACTING AS
              <select value={activeUser?.username ?? 'admin'} onChange={(event) => setActiveUsername(event.target.value)} disabled={!catalog}>
                {catalog?.users.map((user) => <option key={user.id} value={user.username}>{user.username}</option>)}
              </select>
            </label>
          </div>
        </header>
        {error && <div className="connection-banner"><strong>API connection needed.</strong> {error} <span>Run <code>docker compose up --build</code> from the project folder.</span></div>}
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
