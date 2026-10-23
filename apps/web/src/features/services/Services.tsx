import { FormEvent, useState } from 'react';
import { api } from '../../shared/api/client';
import { MonitoredService } from '../../shared/types';

type ServiceForm = {
  name: string;
  url: string;
  type: string;
  checkInterval: number;
  timeout: number;
  expectedStatus: number;
};
const initialForm: ServiceForm = {
  name: '',
  url: '',
  type: 'HTTPS',
  checkInterval: 60,
  timeout: 10,
  expectedStatus: 200,
};

export function Services({
  items,
  token,
  onChange,
}: {
  items: MonitoredService[];
  token: string;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ServiceForm>(initialForm);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('/services', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setForm(initialForm);
      setOpen(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o serviço');
    }
  }

  return (
    <>
      <div className="page-actions">
        <p className="muted">Monitore disponibilidade, latência e incidentes automaticamente.</p>
        <button className="primary compact" onClick={() => setOpen(!open)}>
          {open ? 'Fechar' : '+ Novo serviço'}
        </button>
      </div>
      {open && (
        <form className="panel service-form" onSubmit={submit}>
          <div className="form-grid">
            <label>
              Nome
              <input
                required
                placeholder="API de pagamentos"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label>
              URL
              <input
                required
                type="url"
                placeholder="https://exemplo.com/health"
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
              />
            </label>
            <label>
              Tipo
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                <option>HTTPS</option>
                <option>HTTP</option>
                <option>TCP</option>
                <option>ICMP</option>
              </select>
            </label>
            <label>
              Intervalo (segundos)
              <input
                required
                type="number"
                min="5"
                value={form.checkInterval}
                onChange={(event) =>
                  setForm({ ...form, checkInterval: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Timeout (segundos)
              <input
                required
                type="number"
                min="1"
                max="120"
                value={form.timeout}
                onChange={(event) => setForm({ ...form, timeout: Number(event.target.value) })}
              />
            </label>
            <label>
              Status esperado
              <input
                required
                type="number"
                min="100"
                max="599"
                value={form.expectedStatus}
                onChange={(event) =>
                  setForm({ ...form, expectedStatus: Number(event.target.value) })
                }
              />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="primary compact" type="submit">
            Cadastrar e monitorar
          </button>
        </form>
      )}
      <section className="panel">
        <div className="panel-head">
          <h2>Serviços monitorados</h2>
          <span className="muted">{items.length} registros</span>
        </div>
        {items.length ? (
          items.map((service) => <ServiceCard service={service} key={service.id} />)
        ) : (
          <p className="muted empty">Nenhum serviço cadastrado.</p>
        )}
      </section>
    </>
  );
}

function ServiceCard({ service }: { service: MonitoredService }) {
  const check = service.checks?.[0];
  const state = !check
    ? { label: 'Aguardando primeiro check', className: 'waiting' }
    : check.success
      ? { label: 'Respondendo', className: 'healthy' }
      : { label: 'Indisponível', className: 'down' };

  return (
    <article className="service-card">
      <div className="service-main">
        <span className={`health-dot ${state.className}`} />
        <div>
          <h3>{service.name}</h3>
          <p className="muted service-url">
            {service.type} · {service.url}
          </p>
        </div>
        <span className={`status ${state.className}`}>{state.label}</span>
      </div>
      <div className="service-details">
        <span>
          HTTP <strong>{check?.httpStatus ?? service.expectedStatus}</strong>
        </span>
        <span>
          Resposta{' '}
          <strong>
            {check?.responseTimeMs != null ? `${check.responseTimeMs} ms` : 'Sem dados'}
          </strong>
        </span>
        <span>
          Checks <strong>{service._count?.checks ?? 0}</strong>
        </span>
        <span>
          Último check{' '}
          <strong>
            {check ? new Date(check.checkedAt).toLocaleString('pt-BR') : 'Aguardando'}
          </strong>
        </span>
      </div>
      {check?.errorMessage && <p className="service-error">{check.errorMessage}</p>}
    </article>
  );
}
