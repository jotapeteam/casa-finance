import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getClients, createClient, updateClient, deleteClient, confirmClientPayment, unconfirmClientPayment, addClientPayments, addClientCost, updateClientCost, deleteClientCost } from '../api.js';
import ClientModal from '../components/ClientModal.jsx';

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

const STATUS_LABELS = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-500' },
};

function PaymentRow({ payment, onConfirm, onUnconfirm }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [processing, setProcessing] = useState(false);

  const isPast  = new Date(payment.dueDate) < new Date() && !payment.paid;
  const isToday = new Date(payment.dueDate).toDateString() === new Date().toDateString() && !payment.paid;

  async function handleConfirm() {
    setProcessing(true);
    try { await onConfirm(payment.id, paidDate); } finally { setProcessing(false); setShowDatePicker(false); }
  }

  async function handleUnconfirm() {
    setProcessing(true);
    try { await onUnconfirm(payment.id); } finally { setProcessing(false); }
  }

  const paidAtDate = payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('pt-BR') : null;
  const dueLabel   = new Date(payment.dueDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className={`rounded-xl text-sm transition-colors ${payment.paid ? 'bg-green-50' : isPast ? 'bg-red-50' : isToday ? 'bg-yellow-50' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${payment.paid ? 'bg-green-100 text-green-700' : isPast ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
            {new Date(payment.dueDate).getDate()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{payment.description}</p>
            <p className="text-xs text-gray-400">
              Venc.: {dueLabel}
              {paidAtDate && <span className="text-green-600 ml-2">· Recebido em {paidAtDate}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#c45825]">{fmt(payment.amount)}</span>
          {payment.paid ? (
            <button onClick={handleUnconfirm} disabled={processing}
              className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
              ✓ Recebido
            </button>
          ) : showDatePicker ? null : (
            <button onClick={() => setShowDatePicker(true)}
              style={!isToday && !isPast ? { background: 'linear-gradient(135deg, #0d1b3e, #1a2d5a)', color: 'white' } : {}}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${isToday ? 'bg-yellow-500 text-white hover:bg-yellow-600' : isPast ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:opacity-90'}`}>
              {isToday ? '⚡ Receber hoje' : isPast ? '⚠️ Receber' : 'Confirmar recebimento'}
            </button>
          )}
        </div>
      </div>

      {/* Mini-formulário de data de recebimento */}
      {showDatePicker && !payment.paid && (
        <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Data do recebimento:</span>
          <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)}
            className="input text-xs py-1 w-36" />
          <button onClick={handleConfirm} disabled={processing}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-medium hover:bg-green-700 transition-colors">
            {processing ? '...' : 'Confirmar'}
          </button>
          <button onClick={() => setShowDatePicker(false)}
            className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
        </div>
      )}
    </div>
  );
}

const COST_CATEGORIES = ['👤 Creators', '🎬 Produção', '🔧 Ferramentas', '📦 Outros'];

function ClientCard({ client, onRefresh, onDelete, month, year }) {
  const [expanded, setExpanded] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [addingPayments, setAddingPayments] = useState(false);
  const [newPayments, setNewPayments] = useState([{ amount: '', dueDate: '', description: '' }]);

  // Custos
  const [showCosts, setShowCosts] = useState(false);
  const [addingCost, setAddingCost] = useState(false);
  const [editingCostId, setEditingCostId] = useState(null);
  const refMonthDefault = `${year}-${String(month).padStart(2, '0')}`;
  const EMPTY_COST = { description: '', amount: '', category: COST_CATEGORIES[0], date: new Date().toISOString().slice(0, 10), referenceMonth: refMonthDefault };
  const [costForm, setCostForm] = useState(EMPTY_COST);

  const costs = client.costs || [];
  const mk = `${year}-${String(month).padStart(2, '0')}`;
  // Custos do mês de referência selecionado
  const costsThisMonth = costs.filter(c => c.referenceMonth === mk);
  const totalCosts = costsThisMonth.reduce((s, c) => s + c.amount, 0);
  const allCosts = costs; // todos, para exibição

  const total = client.payments.reduce((s, p) => s + p.amount, 0);
  const receivedTotal = client.payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0); // para barra de progresso
  const pct = total > 0 ? (receivedTotal / total) * 100 : 0;
  // Recebido no mês selecionado (para líquido)
  const received = client.payments.filter(p => {
    if (!p.paid || !p.paidAt) return false;
    const d = new Date(p.paidAt);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }).reduce((s, p) => s + p.amount, 0);
  const liquido = received - totalCosts;
  const pending = client.payments.filter(p => !p.paid).length;

  async function handleSaveCost(e) {
    e.preventDefault();
    const data = { ...costForm, amount: parseFloat(String(costForm.amount).replace(',', '.')) };
    if (editingCostId) {
      await updateClientCost(client.id, editingCostId, data);
    } else {
      await addClientCost(client.id, data);
    }
    setCostForm(EMPTY_COST);
    setAddingCost(false);
    setEditingCostId(null);
    onRefresh();
  }

  function openEditCost(cost) {
    setCostForm({
      description: cost.description,
      amount: cost.amount,
      category: cost.category,
      date: new Date(cost.date).toISOString().slice(0, 10),
      referenceMonth: cost.referenceMonth || refMonthDefault,
    });
    setEditingCostId(cost.id);
    setAddingCost(true);
    setShowCosts(true);
  }

  async function handleDeleteCost(costId) {
    if (!confirm('Remover este custo?')) return;
    await deleteClientCost(client.id, costId);
    onRefresh();
  }

  const serviceTypeMatch = client.notes?.match(/^\[(.+?)\]/);
  const serviceType = serviceTypeMatch?.[1] || null;
  const cleanNotes  = serviceType ? client.notes.replace(/^\[.+?\]\n?/, '').trim() : client.notes;

  const statusInfo = STATUS_LABELS[client.status] || STATUS_LABELS.active;

  async function handleStatusChange(status) {
    await updateClient(client.id, { name: client.name, status, notes: client.notes });
    setEditingStatus(false);
    onRefresh();
  }

  async function handleConfirmPayment(paymentId, paidAt) {
    await confirmClientPayment(client.id, paymentId, paidAt);
    // Se todos os pagamentos ficaram pagos, auto-concluir
    const remainingUnpaid = client.payments.filter(p => p.id !== paymentId && !p.paid);
    if (remainingUnpaid.length === 0 && client.status === 'active') {
      await updateClient(client.id, { name: client.name, status: 'completed', notes: client.notes });
    }
    onRefresh();
  }

  async function handleUnconfirmPayment(paymentId) {
    await unconfirmClientPayment(client.id, paymentId);
    // Se voltou a ter pagamento pendente, reativar
    if (client.status === 'completed') {
      await updateClient(client.id, { name: client.name, status: 'active', notes: client.notes });
    }
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
              <span>Recebido: {fmt(receivedTotal)}</span>
              <span>Total: {fmt(total)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="h-1.5 rounded-full transition-all" style={{ background: 'linear-gradient(90deg, #0d1b3e, #c45825)', width: `${pct}%` }} />
            </div>
          </div>

          <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
            <span>{client.payments.length} parcela{client.payments.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="text-orange-600 font-medium">{pending} pendente{pending !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="text-green-600 font-medium">{client.payments.length - pending} recebida{(client.payments.length - pending) !== 1 ? 's' : ''}</span>
            {totalCosts > 0 && (
              <>
                <span>·</span>
                <span className={`font-medium ${liquido >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  Líquido: {fmt(liquido)}
                </span>
              </>
            )}
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
            <PaymentRow key={p.id} payment={p} onConfirm={handleConfirmPayment} onUnconfirm={handleUnconfirmPayment} />
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

          {/* ── Seção de Custos ── */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setShowCosts(!showCosts)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
                <span>💸 Custos da campanha</span>
                <span className="text-xs text-gray-400">({allCosts.length})</span>
                <span className="text-xs">{showCosts ? '▲' : '▼'}</span>
              </button>
              <button onClick={() => { setCostForm({ ...EMPTY_COST, referenceMonth: refMonthDefault }); setEditingCostId(null); setAddingCost(true); setShowCosts(true); }}
                className="text-xs text-orange-600 hover:underline font-medium">+ Lançar custo</button>
            </div>

            {showCosts && (
              <div className="space-y-2">
                {/* Formulário de custo */}
                {addingCost && (
                  <form onSubmit={handleSaveCost} className="bg-orange-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-600">{editingCostId ? 'Editar custo' : 'Novo custo'}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm col-span-2" placeholder="Descrição (ex: Creator @fulano)"
                        value={costForm.description} onChange={e => setCostForm(f => ({ ...f, description: e.target.value }))} required />
                      <input className="input text-sm" type="number" step="0.01" min="0.01" placeholder="Valor (R$)"
                        value={costForm.amount} onChange={e => setCostForm(f => ({ ...f, amount: e.target.value }))} required />
                      <input className="input text-sm" type="date" title="Data do pagamento"
                        value={costForm.date} onChange={e => setCostForm(f => ({ ...f, date: e.target.value }))} required />
                      <select className="input text-sm col-span-2" value={costForm.category} onChange={e => setCostForm(f => ({ ...f, category: e.target.value }))}>
                        {COST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 block mb-1">Mês de referência (competência)</label>
                        <input className="input text-sm" type="month"
                          value={costForm.referenceMonth}
                          onChange={e => setCostForm(f => ({ ...f, referenceMonth: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setAddingCost(false); setEditingCostId(null); }} className="btn-ghost text-xs flex-1">Cancelar</button>
                      <button type="submit" className="text-white text-xs py-1.5 px-3 rounded-lg hover:opacity-90 flex-1" style={{ background: 'linear-gradient(135deg, #0d1b3e, #c45825)' }}>
                        {editingCostId ? 'Salvar' : 'Lançar'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de todos os custos */}
                {allCosts.length === 0 && !addingCost ? (
                  <p className="text-xs text-gray-400 text-center py-2">Nenhum custo lançado ainda</p>
                ) : (
                  allCosts.map(cost => {
                    const isRefMonth = cost.referenceMonth === mk;
                    return (
                      <div key={cost.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${isRefMonth ? 'bg-red-50' : 'bg-gray-50 opacity-60'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cost.category.split(' ')[0]}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{cost.description}</p>
                            <p className="text-xs text-gray-400">
                              {cost.category.replace(/^\S+\s/, '')} · pago em {new Date(cost.date).toLocaleDateString('pt-BR')}
                              {cost.referenceMonth && (
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${isRefMonth ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-500'}`}>
                                  ref. {cost.referenceMonth.slice(5, 7)}/{cost.referenceMonth.slice(0, 4)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600 text-sm">{fmt(cost.amount)}</span>
                          <button onClick={() => openEditCost(cost)} className="btn-ghost text-xs py-1 px-1.5">✏️</button>
                          <button onClick={() => handleDeleteCost(cost.id)} className="btn-ghost text-xs py-1 px-1.5 hover:text-red-500">🗑️</button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Resumo financeiro do mês selecionado */}
                {(received > 0 || totalCosts > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-400 mb-2 text-center capitalize">
                      Resultado de {format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR })}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 rounded-xl p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Recebido</p>
                        <p className="font-bold text-green-700 text-sm">{fmt(received)}</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-2">
                        <p className="text-xs text-gray-500 mb-0.5">Custos</p>
                        <p className="font-bold text-red-600 text-sm">{fmt(totalCosts)}</p>
                      </div>
                      <div className={`rounded-xl p-2 ${liquido >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
                        <p className="text-xs text-gray-500 mb-0.5">Líquido</p>
                        <p className={`font-bold text-sm ${liquido >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{fmt(liquido)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgenciaClientes() {
  const now = new Date();
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter]     = useState('active');
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [year, setYear]         = useState(now.getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR }),
  }));
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

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
    .filter(p => {
      if (p.paid) return false;
      const d = new Date(p.dueDate);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((s, p) => s + p.amount, 0);

  // Recebido filtrado pelo mês/ano selecionado (usa paidAt)
  const totalRecebido = clients
    .flatMap(c => c.payments)
    .filter(p => {
      if (!p.paid || !p.paidAt) return false;
      const d = new Date(p.paidAt);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((s, p) => s + p.amount, 0);

  const mk = `${year}-${String(month).padStart(2, '0')}`;
  const totalGastos = clients
    .flatMap(c => c.costs || [])
    .filter(c => c.referenceMonth === mk)
    .reduce((s, c) => s + c.amount, 0);

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });

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

      {/* Seletor de mês */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Recebimentos de:</span>
        <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">👥</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{clients.filter(c => c.status === 'active').length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl flex-shrink-0">✅</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide capitalize">Recebido</p>
            <p className="text-xl font-bold text-green-700">{fmt(totalRecebido)}</p>
            <p className="text-xs text-gray-400 capitalize">{monthLabel}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl flex-shrink-0">💸</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Gastos</p>
            <p className="text-xl font-bold text-red-600">{fmt(totalGastos)}</p>
            <p className="text-xs text-gray-400 capitalize">{monthLabel}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">⏳</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">A receber</p>
            <p className="text-xl font-bold text-orange-600">{fmt(totalPendente)}</p>
            <p className="text-xs text-gray-400 capitalize">{monthLabel}</p>
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
            <ClientCard key={client.id} client={client} onRefresh={load} onDelete={handleDelete} month={month} year={year} />
          ))}
        </div>
      )}

      {modalOpen && (
        <ClientModal onClose={() => setModalOpen(false)} onSave={handleCreate} />
      )}
    </div>
  );
}
