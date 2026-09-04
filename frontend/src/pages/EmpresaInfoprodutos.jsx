import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SK = 'carol_infoprodutos_vendas';

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function monthKey(d) { return format(d, 'yyyy-MM'); }

const today = format(new Date(), 'yyyy-MM-dd');
const EMPTY = { produto: '', valor: '', data: today };

export default function EmpresaInfoprodutos() {
  const [list, setList]         = useState(() => { try { return JSON.parse(localStorage.getItem(SK) || '[]'); } catch { return []; } });
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => { localStorage.setItem(SK, JSON.stringify(list)); }, [list]);

  const mk = monthKey(currentDate);
  const mes = list.filter(i => i.data?.slice(0, 7) === mk);
  const totalMes = mes.reduce((s, i) => s + i.valor, 0);

  function save() {
    if (!form.produto.trim() || !form.valor || !form.data) return;
    const item = { ...form, valor: parseFloat(String(form.valor).replace(',', '.')) || 0 };
    if (editId !== null) {
      setList(l => l.map(i => i.id === editId ? { ...i, ...item } : i));
    } else {
      setList(l => [...l, { ...item, id: Date.now() }]);
    }
    setShowForm(false); setEditId(null); setForm(EMPTY);
  }

  function openEdit(item) {
    setForm({ produto: item.produto, valor: item.valor, data: item.data });
    setEditId(item.id); setShowForm(true);
  }

  function remove(id) {
    if (!confirm('Remover este lançamento?')) return;
    setList(l => l.filter(i => i.id !== id));
  }

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎓 Infoprodutos</h2>
          <p className="text-sm text-gray-500">Lançamentos de vendas de produtos digitais</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true); }}>+ Novo Lançamento</button>
      </div>

      {/* Card resumo */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">💚</div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })} — receita de infoprodutos
          </p>
          <p className="text-2xl font-bold text-green-700">{fmt(totalMes)}</p>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card border-2 border-green-100">
          <h3 className="font-bold text-gray-800 mb-4">{editId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="label">Produto / nome</label>
              <input className="input" placeholder="Ex: E-book, Curso de Instagram, Mentoria..." value={form.produto} onChange={e => set('produto', e.target.value)} />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={e => set('valor', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Data de referência</label>
              <input className="input" type="date" value={form.data} onChange={e => set('data', e.target.value)} />
            </div>
            <div className="sm:col-span-3 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={save} className="btn-primary flex-1">{editId ? 'Salvar' : 'Lançar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista mensal */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-bold text-gray-800">Vendas do mês</h3>
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
            <p className="text-3xl mb-2">🎓</p>
            <p>Nenhum lançamento neste mês</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mes.sort((a, b) => b.data.localeCompare(a.data)).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎓</span>
                  <div>
                    <p className="font-medium text-sm text-gray-800">{item.produto}</p>
                    <p className="text-xs text-gray-400">{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-700">{fmt(item.valor)}</span>
                  <button onClick={() => openEdit(item)} className="btn-ghost text-xs py-1 px-2">✏️</button>
                  <button onClick={() => remove(item.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total do mês:</span>
              <span className="font-bold text-green-700 text-base">{fmt(totalMes)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
