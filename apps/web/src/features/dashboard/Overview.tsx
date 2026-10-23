import { DashboardSummary, Ticket } from '../../shared/types';

export function Overview({ summary, tickets }: { summary?: DashboardSummary; tickets: Ticket[] }) {
  const uptime = summary?.uptime24h ?? 1;
  const openTickets = (summary?.tickets ?? [])
    .filter((item) => item.status !== 'CLOSED')
    .reduce((total, item) => total + item._count, 0);

  return (
    <>
      <section className="metric-grid">
        <Metric label="Tickets abertos" value={openTickets} note="na fila de atendimento" />
        <Metric
          label="Incidentes ativos"
          value={summary?.openIncidents ?? 0}
          note="exigem atenção"
          accent
        />
        <Metric
          label="Uptime · 24h"
          value={`${(uptime * 100).toFixed(2)}%`}
          note={`${summary?.activeServices ?? 0} serviços ativos`}
        />
      </section>
      <section className="panel split">
        <div>
          <p className="eyebrow">SINAL OPERACIONAL</p>
          <h2>Seu ambiente está sob controle.</h2>
          <p className="muted">
            O monitoramento consolida disponibilidade e resposta em tempo real.
          </p>
        </div>
        <div className="signal">
          <span className="signal-ring" />
          <strong>{(uptime * 100).toFixed(1)}%</strong>
          <small>disponibilidade</small>
        </div>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Atividade recente</h2>
          <span className="muted">últimos tickets</span>
        </div>
        {tickets.slice(0, 4).map((ticket) => (
          <div className="row" key={ticket.id}>
            <span className={`status ${ticket.status.toLowerCase()}`}>
              {ticket.status.replace('_', ' ')}
            </span>
            <strong>{ticket.title}</strong>
            <span className="muted">{ticket.category}</span>
          </div>
        ))}
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string | number;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={`metric ${accent ? 'accent' : ''}`}>
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
