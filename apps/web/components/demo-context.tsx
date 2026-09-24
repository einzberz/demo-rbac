'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, type Catalog, type DecisionResponse, type DemoUser } from '../lib/api';

interface DemoContextValue {
  catalog: Catalog | null;
  activeUser: DemoUser | null;
  token: string;
  loading: boolean;
  error: string;
  lastDecision: DecisionResponse | null;
  setActiveUsername: (username: string) => Promise<void>;
  setLastDecision: (decision: DecisionResponse | null) => void;
  refreshCatalog: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [activeUsername, setActiveUsernameState] = useState('admin');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastDecision, setLastDecision] = useState<DecisionResponse | null>(null);

  const refreshCatalog = useCallback(async () => {
    const nextCatalog = await apiRequest<Catalog>('/api/demo/catalog');
    setCatalog(nextCatalog);
    const storedUsername = typeof window !== 'undefined' ? window.localStorage.getItem('demo-auth-user') : null;
    const nextUsername = storedUsername && nextCatalog.users.some((user) => user.username === storedUsername) ? storedUsername : activeUsername;
    setActiveUsernameState(nextUsername);
  }, [activeUsername]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshCatalog();
        if (!cancelled) setError('');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'API is unavailable. Start Docker Compose first.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshCatalog]);

  const setActiveUsername = useCallback(async (username: string) => {
    setActiveUsernameState(username);
    if (typeof window !== 'undefined') window.localStorage.setItem('demo-auth-user', username);
    const response = await apiRequest<{ accessToken: string }>('/api/auth/demo-token', { method: 'POST', body: JSON.stringify({ username }) });
    setToken(response.accessToken);
    setLastDecision(null);
  }, []);

  useEffect(() => {
    if (!catalog || !activeUsername) return;
    setActiveUsername(activeUsername).catch((err) => setError(err instanceof Error ? err.message : 'Unable to create demo token'));
  }, [catalog, activeUsername, setActiveUsername]);

  const activeUser = useMemo(() => catalog?.users.find((user) => user.username === activeUsername) ?? null, [catalog, activeUsername]);
  return (
    <DemoContext.Provider value={{ catalog, activeUser, token, loading, error, lastDecision, setActiveUsername, setLastDecision, refreshCatalog }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo must be used inside DemoProvider');
  return value;
}
