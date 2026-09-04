import { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, deleteClient, confirmClientPayment, unconfirmClientPayment, addClientPayments } from '../api.js';
import ClientModal from '../components/ClientModal.jsx';

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const STATUS_LABELS = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-500' },
};

function PaymentRow({ payment, clientId, onRefresh }) {
  const [confirming, setConfirming] = useState(false);
  const isPast = new Date(payment.dueDate) < new Date() && !payment.paid;
  const isToday = new Date(payment.dueDate).toDateString() === new Date().toDateString() && !payment.paid;

  async function toggle() {
    setConfirming(true);
    try {
      if (payment.paid) {
        await unconfirmClientPayment(clientId, payment.id);
      } else {
        await confirmClientPayment(clientId, payment.id);
      }
      onRefresh();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${payment.paid ? 'bg-green-50' : isPast ? 'bg-red-50' : isToday ? 'bg-yellow-50' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${payment.paid ? 'bg-green-100 text-green-700' : isPast ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
          {new Date(payment.dueDate).getDate()}
        </div>
        <div>
          <p className="font-medium text-gray-800">{payment.description}</p>
          <p className="text-xs text-gray-400">{new Date(payment.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-[#c45825]">{fmt(payment.amount)}</span>
        {payment.paid ? (
          <button onClick={toggle} disabled={confirming}
            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
            ✓ Recebido
          </button>
        ) : (
          <button onClick={toggle} disabled={confirming}
            style={!isToday && !isPast ? { background: 'linear-gradient(135deg, #0d1b3e, #1a2d5a)', color: 'white' } : {}}
            className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${isToday ? 'bg-yellow-500 text-white hover:bg-yellow-600' : isPast ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:opacity-90'}`}>
            {confirming ? '...' : isToday ? '⚡ Receber hoje' : isPast ? '⚠️ Receber' : 'Confirmar recebimento'}
          </button>
        )}
      </div>
    </div>
  );
}

function ClientCard({ client, onRefresh, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [addingPayments, setAddingPayments] = useState(false);
  const [newPayments, setNewPayments] = useState([{ amount: '', dueDate: '', description: '' }]);

  const total = client.payments.reduce((s, p) => s + p.amount, 0);
  const received = client.payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
  const pending = client.payments.filter(p => !p.paid).length;
  const pct = total > 0 ? (received / total) * 100 : 0;

  const serviceTypeMatch = client.notes?.match(/^\[(.+?)\]/);
  const serviceType = serviceTypeMatch?.[1] || null;
  const cleanNotes  = serviceType ? client.notes.replace(/^\[.+?\]\n?/, '').trim() : client.notes;

  const statusInfo = STATUS_LABELS[client.status] || STATUS_LABELS.active;

  async function handleStatusChange(status) {
    await updateClient(client.id, { name: client.name, status, notes: client.notes });
    setEditingStatus(false);
    onRefresh();
  }

  async function handleAddPayments(e) {
    e.preventDefault();
    await addClientPayments(client.id, newPayments.map((p, idx) => ({
      amount: parseFloat(String(p.amount).replace(',', '.')),
      dueDate: p.dueDate,
      description: p.description || `Adicional ${idx + 1}`,
    })));
    setAddingPayments(false);
    setNewPayments([{ amount: '', dueDate: '', description: '' }]);
    onRefresh();
  }

  return (
    <div className={`card border-2 transition-colors ${client.status === 'active' ? 'border-orange-200' : 'border-gray-100 opacity-75'}`}>
      {/* Header do cliente */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-lg">{client.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
              {client.contractType === 'monthly' ? '🔄 Mensalidade' : '📅 Parcelas'}
            </span>
            {serviceType && (
              <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                {serviceType === 'Contratação de Creators' ? '🎬 ' : serviceType === 'Permuta / Comissão' ? '🤝 ' : '📋 '}{serviceType}
              </span>
            )}
          </div>
          {cleanNotes && <p className="text-xs text-gray-400 mb-2">{cleanNotes}</p>}

          {/* Barra de progresso */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Recebido: {fmt(received)}</span>
              <span>Total: {fmt(total)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all" style={{ background: 'linear-gradient(90deg, #0d1b3e, #c45825)', width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex gap-3 text-xs text-gray-500">
            <span>{client.payments.length} parcela{client.payments.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="text-orange-600 font-medium">{pending} pendente{pending !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="text-green-600 font-medium">{client.payments.length - pending} recebida{(client.payments.length - pending) !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex gap-1 ml-3">
          <button onClick={() => setExpanded(!expanded)}
            className="btn-ghost text-xs py-1 px-2">
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => setEditingStatus(!editingStatus)}
            className="btn-ghost text-xs py-1 px-2">⚙️</button>
          <button onClick={() => { if (confirm(`Excluir cliente "${client.name}"?`)) onDelete(client.id); }}
            className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
        </div>
      </div>

      {/* Menu de status */}
      {editingStatus && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Alterar status:</p>
          <div className="flex gap-2">
            {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
              <button key={key} onClick={() => handleStatusChange(key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${client.status === key ? color : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de parcelas */}
      {expanded && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Cronograma de pagamentos</p>
            <button onClick={() => setAddingPayments(!addingPayments)}
              className="text-xs text-orange-600 hover:underline">+ Adicionar parcelas</button>
          </div>

          {client.payments.map(p => (
            <PaymentRow key={p.id} payment={p} clientId={client.id} onRefresh={onRefresh} />
          ))}

          {/* Formulário para adicionar parcelas */}
          {addingPayments && (
            <form onSubmit={handleAddPayments} className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-semibold text-gray-600">Novas parcelas:</p>
              {newPayments.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <input className="input text-sm" type="number" step="0.01" placeholder="Valor"
                      value={p.amount} onChange={e => setNewPayments(prev => prev.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} required />
                  </div>
                  <div className="col-span-4">
                    <input className="input text-sm" type="date"
                      value={p.dueDate} onChange={e => setNewPayments(prev => prev.map((x, i) => i === idx ? { ...x, dueDate: e.target.value } : x))} required />
                  </div>
                  <div className="col-span-3">
                    <input className="input text-sm" placeholder="Descrição"
                      value={p.description} onChange={e => setNewPayments(prev => prev.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {newPayments.length > 1 && (
                      <button type="button" onClick={() => setNewPayments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 text-lg">×</button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewPayments(prev => [...prev, { amount: '', dueDate: '', description: '' }])}
                  className="btn-ghost text-xs flex-1">+ Linha</button>
                <button type="button" onClick={() => setAddingPayments(false)} className="btn-ghost text-xs flex-1">Cancelar</button>
                <button type="submit" className="text-white text-xs py-1.5 px-3 rounded-lg hover:opacity-90 flex-1" style={{ background: 'linear-gradient(135deg, #0d1b3e, #c45825)' }}>Salvar</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgenciaClientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('active');

  async function load() {
    setLoading(true);
    try {
      const data = await getClients();
      setClients(data);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(data) {
    await createClient(data);
    setModalOpen(false);
    load();
  }

  async function handleDelete(id) {
    await deleteClient(id);
    load();
  }

  const filtered = filter === 'all' ? clients : clients.filter(c => c.status === filter);

  const totalPendente = clients
    .filter(c => c.status === 'active')
    .flatMap(c => c.payments)
    .filter(p => !p.paid)
    .reduce((s, p) => s + p.amount, 0);

  const totalRecebido = clients
    .flatMap(c => c.payments)
    .filter(p => p.paid)
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 50%, #c45825 100%)' }}>
        <div className="absolute top-2 right-8 text-white/10 text-8xl font-black select-none" style={{ fontFamily: 'serif' }}>✦</div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-white/50 uppercase mb-2">✦ Agência Creatorizando</p>
            <h1 className="text-xl font-bold">Clientes</h1>
            <p className="text-white/60 text-sm mt-0.5">Contratos e recebimentos</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm py-2 px-4 rounded-xl transition-all backdrop-blur-sm">
            + Novo Cliente
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">👥</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Clientes ativos</p>
            <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.status === 'active').length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">✅</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total recebido</p>
            <p className="text-2xl font-bold text-green-700">{fmt(totalRecebido)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">⏳</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">A receber</p>
            <p className="text-2xl font-bold text-orange-600">{fmt(totalPendente)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'active', label: 'Ativos' },
          { key: 'paused', label: 'Pausados' },
          { key: 'completed', label: 'Concluídos' },
          { key: 'all', label: 'Todos' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={filter === f.key ? { background: 'linear-gradient(135deg, #0d1b3e, #c45825)', color: 'white' } : {}}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-all ${filter === f.key ? '' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de clientes */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="card h-28 animate-pulse bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="font-medium">Nenhum cliente cadastrado ainda</p>
          <p className="text-sm mt-1">Clique em "Novo Cliente" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(client => (
            <ClientCard key={client.id} client={client} onRefresh={load} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modalOpen && (
        <ClientModal onClose={() => setModalOpen(false)} onSave={handleCreate} />
      )}
    </div>
  );
}
