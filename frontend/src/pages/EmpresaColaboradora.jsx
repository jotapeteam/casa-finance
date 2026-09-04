import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createTransaction, deleteTransaction } from '../api.js';

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function monthKey(date) { return format(date, 'yyyy-MM'); }

const SK_COLAB  = 'carol_colaboradora';
const SK_PAGTOS = 'carol_colaboradora_pagtos';
const SK_BONUS  = 'carol_colaboradora_bonus';

const EMPTY_COLAB = { name: '', amount: '', dayOfMonth: 5, pixKey: '', active: true };

export default function EmpresaColaboradora() {
  const [list, setList]     = useState(() => { try { return JSON.parse(localStorage.getItem(SK_COLAB)  || '[]'); } catch { return []; } });
  const [pagtos, setPagtos] = useState(() => { try { return JSON.parse(localStorage.getItem(SK_PAGTOS) || '{}'); } catch { return {}; } });
  const [bonus, setBonus]   = useState(() => { try { return JSON.parse(localStorage.getItem(SK_BONUS)  || '[]'); } catch { return []; } });

  const [form, setForm]           = useState(EMPTY_COLAB);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);

  const [bonusForm, setBonusForm]       = useState({ colaboradoraId: '', amount: '', descricao: '' });
  const [showBonusForm, setShowBonusForm] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const mk    = monthKey(currentDate);
  const hoje  = new Date();
  const isMesAtual = mk === monthKey(hoje);

  useEffect(() => { localStorage.setItem(SK_COLAB,  JSON.stringify(list));   }, [list]);
  useEffect(() => { localStorage.setItem(SK_PAGTOS, JSON.stringify(pagtos)); }, [pagtos]);
  useEffect(() => { localStorage.setItem(SK_BONUS,  JSON.stringify(bonus));  }, [bonus]);

  /* ── COLABORADORA ── */
  function saveColab() {
    if (!form.name.trim() || !form.amount) return;
    const data = { ...form, amount: parseFloat(String(form.amount).replace(',', '.')) || 0, dayOfMonth: Number(form.dayOfMonth) || 5 };
    if (editingId !== null) {
      setList(l => l.map(c => c.id === editingId ? { ...c, ...data } : c));
    } else {
      setList(l => [...l, { ...data, id: Date.now() }]);
    }
    setShowForm(false); setEditingId(null); setForm(EMPTY_COLAB);
  }

  function openEdit(c) {
    setForm({ name: c.name, amount: c.amount, dayOfMonth: c.dayOfMonth, pixKey: c.pixKey, active: c.active });
    setEditingId(c.id); setShowForm(true);
  }

  function removeColab(id) {
    if (!confirm('Remover esta colaboradora?')) return;
    setList(l => l.filter(c => c.id !== id));
  }

  function set(f, v) { setForm(prev => ({ ...prev, [f]: v })); }

  /* ── PAGAMENTOS BASE ── */
  function isPago(colabId) {
    const val = pagtos[mk]?.[colabId];
    return !!(val === true || val?.pago);
  }

  async function togglePagamento(colabId) {
    const c = list.find(x => x.id === colabId);
    const currently = pagtos[mk]?.[colabId];
    const wasPago = !!(currently === true || currently?.pago);

    if (wasPago) {
      const txId = currently?.transactionId;
      if (txId) { try { await deleteTransaction(txId); } catch {} }
      setPagtos(p => {
        const mk_data = { ...(p[mk] || {}) };
        delete mk_data[colabId];
        return { ...p, [mk]: mk_data };
      });
    } else {
      let txId = null;
      try {
        const tx = await createTransaction({
          description: `${c.name} — ${format(currentDate, 'MMMM/yyyy', { locale: ptBR })}`,
          amount: c.amount,
          type: 'gasto',
          category: '👩‍💼 Colaboradora',
          person: 'Carol',
          context: 'empresa',
          source: 'web',
          date: new Date().toISOString(),
        });
        txId = tx.id;
      } catch {}
      setPagtos(p => ({ ...p, [mk]: { ...(p[mk] || {}), [colabId]: { pago: true, transactionId: txId } } }));
    }
  }

  /* ── BÔNUS ── */
  function salvarBonus() {
    if (!bonusForm.colaboradoraId || !bonusForm.amount) return;
    setBonus(b => [...b, {
      id: Date.now(),
      colaboradoraId: Number(bonusForm.colaboradoraId),
      month: mk,
      amount: parseFloat(String(bonusForm.amount).replace(',', '.')) || 0,
      descricao: bonusForm.descricao.trim() || 'Bônus',
      pago: false,
      transactionId: null,
    }]);
    setBonusForm({ colaboradoraId: '', amount: '', descricao: '' });
    setShowBonusForm(false);
  }

  async function toggleBonusPago(id) {
    const bon = bonus.find(b => b.id === id);
    const colab = list.find(c => c.id === bon.colaboradoraId);

    if (bon.pago) {
      if (bon.transactionId) { try { await deleteTransaction(bon.transactionId); } catch {} }
      setBonus(b => b.map(x => x.id === id ? { ...x, pago: false, transactionId: null } : x));
    } else {
      let txId = null;
      try {
        const tx = await createTransaction({
          description: `${colab?.name || 'Colaboradora'} — bônus: ${bon.descricao}`,
          amount: bon.amount,
          type: 'gasto',
          category: '👩‍💼 Colaboradora',
          person: 'Carol',
          context: 'empresa',
          source: 'web',
          date: new Date().toISOString(),
        });
        txId = tx.id;
      } catch {}
      setBonus(b => b.map(x => x.id === id ? { ...x, pago: true, transactionId: txId } : x));
    }
  }

  function removeBonus(id) {
    setBonus(b => b.filter(bon => bon.id !== id));
  }

  /* ── CÁLCULOS ── */
  const ativas     = list.filter(c => c.active);
  const bonusMes   = bonus.filter(b => b.month === mk);
  const totalBase  = ativas.reduce((s, c) => s + c.amount, 0);
  const totalBonus = bonusMes.reduce((s, b) => s + b.amount, 0);
  const totalMes   = totalBase + totalBonus;
  const totalPago  = ativas.filter(c => isPago(c.id)).reduce((s, c) => s + c.amount, 0)
                   + bonusMes.filter(b => b.pago).reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">👩‍💼 Colaboradora</h2>
          <p className="text-sm text-gray-500">Pagamentos mensais, bônus e controle</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost" onClick={() => { setBonusForm({ colaboradoraId: '', amount: '', descricao: '' }); setShowBonusForm(true); }}>
            🎁 Adicionar Bônus
          </button>
          <button className="btn-primary" onClick={() => { setForm(EMPTY_COLAB); setEditingId(null); setShowForm(true); }}>
            + Nova Colaboradora
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-xl">👩‍💼</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Ativas</p>
            <p className="text-xl font-bold text-gray-900">{ativas.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">💰</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Base mensal</p>
            <p className="text-lg font-bold text-gray-900">{fmt(totalBase)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl">🎁</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Bônus {format(currentDate, 'MMM', { locale: ptBR })}</p>
            <p className="text-lg font-bold text-gray-900">{fmt(totalBonus)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">✅</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pago</p>
            <p className="text-lg font-bold text-green-700">{fmt(totalPago)}</p>
          </div>
        </div>
      </div>

      {/* Formulário nova colaboradora */}
      {showForm && (
        <div className="card border-2 border-pink-100">
          <h3 className="font-bold text-gray-800 mb-4">{editingId ? 'Editar Colaboradora' : 'Nova Colaboradora'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome</label>
              <input className="input" placeholder="Nome da colaboradora" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Valor mensal (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Dia de pagamento</label>
              <input className="input" type="number" min="1" max="31" value={form.dayOfMonth} onChange={e => set('dayOfMonth', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Chave PIX</label>
              <input className="input" placeholder="CPF, e-mail, telefone ou chave aleatória" value={form.pixKey} onChange={e => set('pixKey', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <div className="flex gap-2">
                {[['true', 'Ativa'], ['false', 'Inativa']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('active', v === 'true')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${String(form.active) === v ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={saveColab} className="btn-primary flex-1">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário bônus */}
      {showBonusForm && (
        <div className="card border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4">🎁 Adicionar Bônus</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Colaboradora</label>
              <select className="input" value={bonusForm.colaboradoraId} onChange={e => setBonusForm(f => ({ ...f, colaboradoraId: e.target.value }))}>
                <option value="">Selecionar...</option>
                {list.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valor do bônus (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={bonusForm.amount} onChange={e => setBonusForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="label">Descrição</label>
              <input className="input" placeholder="Ex: Meta batida, campanha especial..." value={bonusForm.descricao} onChange={e => setBonusForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="sm:col-span-3 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowBonusForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={salvarBonus} className="btn-primary flex-1">Adicionar Bônus</button>
            </div>
          </div>
        </div>
      )}

      {/* Controle mensal */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-gray-800">📅 Pagamentos — controle mensal</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">← Ant.</button>
            <span className="text-sm font-semibold text-gray-700 capitalize px-2">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">Próx. →</button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">👩‍💼</p>
            <p>Nenhuma colaboradora cadastrada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(c => {
              const pago      = isPago(c.id);
              const atrasado  = isMesAtual && !pago && hoje.getDate() > c.dayOfMonth;
              const bonusColab = bonusMes.filter(b => b.colaboradoraId === c.id);

              return (
                <div key={c.id} className={`rounded-xl border p-3 transition-all ${pago ? 'bg-green-50 border-green-200' : atrasado ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${pago ? 'bg-green-100 text-green-700' : atrasado ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                        {c.dayOfMonth}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        {c.pixKey && <p className="text-xs text-gray-400">PIX: {c.pixKey}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-sm text-gray-800">{fmt(c.amount)}</p>
                        {bonusColab.length > 0 && (
                          <p className="text-xs text-yellow-600">+ {fmt(bonusColab.reduce((s, b) => s + b.amount, 0))} bônus</p>
                        )}
                      </div>
                      <button onClick={() => togglePagamento(c.id)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${pago ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : atrasado ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}>
                        {pago ? '✓ Pago' : atrasado ? '⚠️ Pagar' : 'Confirmar pagamento'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="btn-ghost text-xs py-1 px-2">✏️</button>
                        <button onClick={() => removeColab(c.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                      </div>
                    </div>
                  </div>

                  {bonusColab.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {bonusColab.map(b => (
                        <div key={b.id} className="flex items-center justify-between text-xs px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">🎁</span>
                            <span className="text-gray-600">{b.descricao}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${b.pago ? 'text-gray-400 line-through' : 'text-yellow-700'}`}>{fmt(b.amount)}</span>
                            <button onClick={() => toggleBonusPago(b.id)}
                              className={`px-2 py-0.5 rounded-full font-medium transition-colors ${b.pago ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                              {b.pago ? '✓ Pago' : 'Confirmar'}
                            </button>
                            <button onClick={() => removeBonus(b.id)} className="text-gray-400 hover:text-red-500">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {list.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <div>
              <span className="text-gray-500">Total previsto:</span>
              <span className="font-bold text-gray-900 ml-2">{fmt(totalMes)}</span>
            </div>
            <div>
              <span className="text-gray-500">Pago:</span>
              <span className="font-bold text-green-700 ml-2">{fmt(totalPago)}</span>
            </div>
            <div>
              <span className="text-gray-500">Pendente:</span>
              <span className="font-bold text-red-500 ml-2">{fmt(totalMes - totalPago)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
