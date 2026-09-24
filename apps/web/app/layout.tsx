import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DemoProvider } from '../components/demo-context';
import { AppShell } from '../components/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'AuthScope Visualizer',
  description: 'A visual demo of RBAC and site-level data authorization',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>
          <AppShell>{children}</AppShell>
        </DemoProvider>
      </body>
    </html>
  );
}
