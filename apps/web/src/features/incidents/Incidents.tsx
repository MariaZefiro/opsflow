import { Incident } from '../../shared/types';

export function Incidents({ items }: { items: Incident[] }) {
  return (
    <section className="incident-list">
      {items.length ? (
        items.map((incident) => {
          const check = incident.service?.checks?.[0];
          return (
            <article className="panel incident-card" key={incident.id}>
              <div className="incident-head">
                <div>
                  <p className="eyebrow">
                    {incident.createdBy === 'MONITORING'
                      ? 'DETECÇÃO AUTOMÁTICA'
                      : 'ABERTURA MANUAL'}
                  </p>
                  <h2>{incident.title}</h2>
                </div>
                <span className={`status ${incident.status.toLowerCase()}`}>
                  {incident.status.replace('_', ' ')}
                </span>
              </div>
              <p className="incident-description">{incident.description}</p>
              <div className="incident-meta">
                <span>
                  <small>Origem</small>
                  <strong>
                    {incident.service
                      ? `${incident.service.name} · ${incident.service.url}`
                      : 'Operação / sem serviço vinculado'}
                  </strong>
                </span>
                <span>
                  <small>Severidade</small>
                  <strong>{incident.severity}</strong>
                </span>
                <span>
                  <small>Início</small>
                  <strong>{new Date(incident.startedAt).toLocaleString('pt-BR')}</strong>
                </span>
                <span>
                  <small>Duração</small>
                  <strong>{formatDuration(incident.durationSeconds)}</strong>
                </span>
              </div>
              {check && (
                <div className="evidence">
                  <strong>Última evidência do monitoramento</strong>
                  <span>
                    HTTP {check.httpStatus ?? 'N/A'} · {check.responseTimeMs ?? 'N/A'} ms ·{' '}
                    {check.success
                      ? 'respondeu corretamente'
                      : (check.errorMessage ?? 'falha na resposta')}
                  </span>
                </div>
              )}
            </article>
          );
        })
      ) : (
        <section className="panel">
          <p className="muted empty">Nenhum incidente aberto.</p>
        </section>
      )}
    </section>
  );
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return 'Em andamento';
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}
