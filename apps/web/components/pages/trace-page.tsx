'use client';

import Link from 'next/link';
import { useDemo } from '../demo-context';
import { DecisionPanel, PageIntro } from '../ui';

export function TracePage() {
  const { lastDecision } = useDemo();
  return <><PageIntro eyebrow="OBSERVABILITY / 05" title="Decision Trace" description="A readable audit-style view of the last demo request. Every step is produced by the API response, not reconstructed in the browser." action={<Link className="secondary-button" href="/simulator">Run another request ↗</Link>} /><DecisionPanel decision={lastDecision} title="Last authorization decision" /></>;
}
