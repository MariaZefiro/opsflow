import { FormEvent, useState } from 'react';
import { api } from '../../shared/api/client';
import { Ticket } from '../../shared/types';

type TicketForm = { title: string; description: string; category: string };
const initialForm: TicketForm = { title: '', description: '', category: 'General' };

export function Tickets({
  items,
  token,
  onChange,
}: {
  items: Ticket[];
  token: string;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<TicketForm>(initialForm);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('/tickets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setForm(initialForm);
      setOpen(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o ticket');
    }
  }

  return (
    <>
      <div className="page-actions">
        <p className="muted">Acompanhe, atribua e resolva solicitações.</p>
        <button className="primary compact" onClick={() => setOpen(!open)}>
          {open ? 'Fechar' : '+ Novo ticket'}
        </button>
      </div>
      {open && (
        <form className="panel ticket-form" onSubmit={submit}>
          <input
            required
            placeholder="Título do ticket"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <input
            required
            placeholder="Descrição"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          {error && <p className="error">{error}</p>}
          <button className="primary compact" type="submit">
            Criar
          </button>
        </form>
      )}
      <section className="panel">
        <div className="panel-head">
          <h2>Fila de atendimento</h2>
          <span className="muted">{items.length} registros</span>
        </div>
        {items.length ? (
          items.map((ticket) => (
            <div className="row" key={ticket.id}>
              <span className={`status ${ticket.status.toLowerCase()}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <strong>{ticket.title}</strong>
              <span className="muted">{ticket.category}</span>
            </div>
          ))
        ) : (
          <p className="muted empty">Nenhum ticket na fila.</p>
        )}
      </section>
    </>
  );
}
