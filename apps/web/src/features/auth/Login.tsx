import { FormEvent, useState } from 'react';
import { api } from '../../shared/api/client';
import { User } from '../../shared/types';

type LoginResult = { user: User; accessToken: string };

export function Login({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [form, setForm] = useState({
    companySlug: localStorage.getItem('opsflow-company-slug') ?? 'opsflow-demo',
    email: 'demo@opsflow.local',
    password: 'OpsFlowDemo2026!',
  });
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      const payload = register
        ? {
            companyName: form.companySlug.trim(),
            name: form.email.trim().split('@')[0],
            email: form.email.trim(),
            password: form.password,
          }
        : { ...form, companySlug: form.companySlug.trim(), email: form.email.trim() };
      const result = await api<LoginResult>(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      localStorage.setItem('opsflow-company-slug', result.user.companySlug);
      onLogin(result.user, result.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no acesso');
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-copy">
        <span className="mark">O</span>
        <p className="eyebrow">OPERATIONS CONTROL</p>
        <h1>Clareza para cada incidente.</h1>
        <p>Suporte, uptime e resposta em um único lugar.</p>
      </section>
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">{register ? 'CRIAR ESPAÇO' : 'BEM-VINDO DE VOLTA'}</p>
        <h2>{register ? 'Comece pelo seu time.' : 'Acesse o OpsFlow.'}</h2>
        <label>
          {register ? 'Nome da empresa' : 'Slug da empresa'}
          <input
            required
            value={form.companySlug}
            onChange={(event) => setForm({ ...form, companySlug: event.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            minLength={12}
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {!register && <p className="muted">Demo local: demo@opsflow.local / OpsFlowDemo2026!</p>}
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit">
          {register ? 'Criar conta' : 'Entrar'} <span>↗</span>
        </button>
        <button className="link" type="button" onClick={() => setRegister(!register)}>
          {register ? 'Já tenho uma conta' : 'Criar uma conta'}
        </button>
      </form>
    </main>
  );
}
