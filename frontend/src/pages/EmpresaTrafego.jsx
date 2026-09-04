import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SK = 'carol_trafego';
const TIPOS = ['Gerenciador de Anúncios', 'Posts Turbinados'];
const PLATAFORMAS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Outro'];

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function monthKey(d) { return format(d, 'yyyy-MM'); }

const EMPTY = { tipo: TIPOS[0], plataforma: PLATAFORMAS[0], valor: '', data: format(new Date(), 'yyyy-MM-dd'), descricao: '' };

export default function EmpresaTrafego() {
  const [list, setList]       = useState(() => { try { return JSON.parse(localStorage.getItem(SK) || '[]'); } catch { return []; } });
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { localStorage.setItem(SK, JSON.stringify(list)); }, [list]);

  const mk = monthKey(currentDate);
  const mes = list.filter(i => i.data?.slice(0, 7) === mk);

  function save() {
    if (!form.valor || !form.data) return;
    const item = { ...form, valor: parseFloat(String(form.valor).replace(',', '.')) || 0 };
    if (editId !== null) {
      setList(l => l.map(i => i.id === editId ? { ...i, ...item } : i));
    } else {
      setList(l => [...l, { ...item, id: Date.now() }]);
    }
    setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  function openEdit(item) {
    setForm({ tipo: item.tipo, plataforma: item.plataforma, valor: item.valor, data: item.data, descricao: item.descricao });
    setEditId(item.id); setShowForm(true);
  }

  function remove(id) {
    if (!confirm('Remover este gasto?')) return;
    setList(l => l.filter(i => i.id !== id));
  }

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  const totalGeral = mes.reduce((s, i) => s + i.valor, 0);
  const totalAnuncios = mes.filter(i => i.tipo === TIPOS[0]).reduce((s, i) => s + i.valor, 0);
  const totalPosts = mes.filter(i => i.tipo === TIPOS[1]).reduce((s, i) => s + i.valor, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📣 Gastos com Tráfego</h2>
          <p className="text-sm text-gray-500">Gerenciador de anúncios e posts turbinados</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}>+ Novo Gasto</button>
      </div>

      {/* Resumo cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">📊</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Gerenciador</p>
            <p className="text-lg font-bold text-gray-900">{fmt(totalAnuncios)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">⚡</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Posts Turbinados</p>
            <p className="text-lg font-bold text-gray-900">{fmt(totalPosts)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-xl">💸</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total do mês</p>
            <p className="text-lg font-bold text-red-600">{fmt(totalGeral)}</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card border-2 border-blue-100">
          <h3 className="font-bold text-gray-800 mb-4">{editId ? 'Editar Gasto' : 'Novo Gasto de Tráfego'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Tipo</label>
              <div className="flex gap-2">
                {TIPOS.map(t => (
                  <button key={t} type="button" onClick={() => set('tipo', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${form.tipo === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {t === TIPOS[0] ? '📊 ' : '⚡ '}{t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={e => set('valor', e.target.value)} />
            </div>
            <div>
              <label className="label">Data</label>
              <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} />
            </div>
            <div>
              <label className="label">Plataforma</label>
              <select className="input" value={form.plataforma} onChange={e => set('plataforma', e.target.value)}>
                {PLATAFORMAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Descrição (opcional)</label>
              <input className="input" placeholder="Ex: Campanha de verão, post do dia 10..." value={form.descricao} onChange={e => set('descricao', e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={save} className="btn-primary flex-1">{editId ? 'Salvar' : 'Adicionar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista mensal */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-gray-800">Histórico</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">← Ant.</button>
            <span className="text-sm font-semibold text-gray-700 capitalize px-2">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">Próx. →</button>
          </div>
        </div>

        {mes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📣</p>
            <p>Nenhum gasto de tráfego neste mês</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mes.sort((a, b) => b.data.localeCompare(a.data)).map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl ${item.tipo === TIPOS[0] ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.tipo === TIPOS[0] ? '📊' : '⚡'}</span>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{item.tipo}</p>
                    <p className="text-xs text-gray-400">
                      {item.plataforma} · {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {item.descricao && ` · ${item.descricao}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-600">{fmt(item.valor)}</span>
                  <button onClick={() => openEdit(item)} className="btn-ghost text-xs py-1 px-2">✏️</button>
                  <button onClick={() => remove(item.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
