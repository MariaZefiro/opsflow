import { useCallback, useEffect, useState } from 'react';
import { Incidents } from './features/incidents/Incidents';
import { Login } from './features/auth/Login';
import { Overview } from './features/dashboard/Overview';
import { Services } from './features/services/Services';
import { Tickets } from './features/tickets/Tickets';
import { api } from './shared/api/client';
import { Tab, User, WorkspaceData } from './shared/types';

const navigation: Array<{ id: Tab; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'services', label: 'Serviços' },
  { id: 'incidents', label: 'Incidentes' },
];

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<WorkspaceData>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summary, ticketPage, services, incidents] = await Promise.all([
        api<NonNullable<WorkspaceData['summary']>>('/dashboard/summary', { headers }),
        api<{ items: NonNullable<WorkspaceData['tickets']> }>('/tickets', { headers }),
        api<NonNullable<WorkspaceData['services']>>('/services', { headers }),
        api<NonNullable<WorkspaceData['incidents']>>('/incidents', { headers }),
      ]);
      setData({ summary, tickets: ticketPage.items, services, incidents });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <Login
        onLogin={(nextUser, nextToken) => {
          setUser(nextUser);
          setToken(nextToken);
        }}
      />
    );
  }

  const currentTitle =
    tab === 'overview' ? 'Bom trabalho, time.' : navigation.find((item) => item.id === tab)?.label;

  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <span className="mark small">O</span>
          <strong>opsflow</strong>
        </div>
        <p className="eyebrow rail-label">WORKSPACE</p>
        {navigation.map((item) => (
          <button
            className={tab === item.id ? 'nav active' : 'nav'}
            key={item.id}
            onClick={() => setTab(item.id)}
          >
            <span className="dot" />
            {item.label}
          </button>
        ))}
        <div className="rail-bottom">
          <div className="avatar">{user.email[0].toUpperCase()}</div>
          <div>
            <strong>{user.email.split('@')[0]}</strong>
            <small>{user.role.replace('_', ' ')}</small>
          </div>
          <button
            className="logout"
            onClick={() => {
              setToken('');
              setUser(null);
              setData({});
            }}
          >
            sair
          </button>
        </div>
      </aside>
      <main className="content">
        <header>
          <div>
            <p className="eyebrow">OPSFLOW CONTROL</p>
            <h1>{currentTitle}</h1>
          </div>
          <button className="refresh" onClick={() => void load()}>
            Atualizar ↻
          </button>
        </header>
        {error && <p className="error banner">{error}</p>}
        {tab === 'overview' && <Overview summary={data.summary} tickets={data.tickets ?? []} />}
        {tab === 'tickets' && (
          <Tickets items={data.tickets ?? []} token={token} onChange={() => void load()} />
        )}
        {tab === 'services' && (
          <Services items={data.services ?? []} token={token} onChange={() => void load()} />
        )}
        {tab === 'incidents' && <Incidents items={data.incidents ?? []} />}
      </main>
    </div>
  );
}
