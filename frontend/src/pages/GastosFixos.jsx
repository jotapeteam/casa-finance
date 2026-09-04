import { useState, useEffect } from 'react';
import { getRecurring, createRecurring, updateRecurring, deleteRecurring } from '../api.js';

const CATEGORIES_CASA = [
  '🛒 Supermercado', '⛽ Gasolina / Combustível', '💊 Farmácia',
  '🍽️ Restaurante / Delivery', '🏠 Casa', '💡 Contas',
  '👕 Vestuário', '🏥 Saúde', '🎓 Educação',
  '🎬 Lazer / Entretenimento', '🚗 Carro', '💅 Estética Pessoal',
  '🐾 Pets', '📦 Outros',
];

const CATEGORIES_EMPRESA = [
  '💰 Receita JOTAPE', '💰 Receita Carol',
  '🔧 Ferramentas', '🏛️ Imposto', '📊 Contadora',
  '👩‍💼 Colaboradora', '📣 Tráfego', '📈 Investimentos',
];

const CATEGORIES_AGENCIA = [
  '🔧 Ferramentas', '⚖️ Advogados', '📦 Outros',
];

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function GastosFixos({ context = 'casa' }) {
  const CATEGORIES = context === 'agencia' ? CATEGORIES_AGENCIA : context === 'empresa' ? CATEGORIES_EMPRESA : CATEGORIES_CASA;
  const defaultPerson = context === 'agencia' ? 'Creatorizando' : 'JOTAPE';
  const EMPTY = { description: '', amount: '', category: CATEGORIES[0], person: defaultPerson, dayOfMonth: 1, active: true };

  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getRecurring(context);
    setList(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function openNew() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(r) {
    setForm({ description: r.description, amount: r.amount, category: r.category, person: r.person, dayOfMonth: r.dayOfMonth, active: r.active });
    setEditingId(r.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = { ...form, amount: parseFloat(String(form.amount).replace(',', '.')), context };
    if (editingId) {
      await updateRecurring(editingId, data);
    } else {
      await createRecurring(data);
    }
    setShowForm(false);
    setEditingId(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este gasto fixo?')) return;
    await deleteRecurring(id);
    load();
  }

  async function toggleActive(r) {
    await updateRecurring(r.id, { active: !r.active });
    load();
  }

  const total = list.filter(r => r.active).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {context === 'agencia' ? '🎨 Gastos Fixos Agência' : context === 'empresa' ? '💼 Gastos Fixos Empresa' : '🏠 Gastos Fixos Casa'}
          </h2>
          <p className="text-sm text-gray-500">
            {context === 'agencia' ? 'Despesas fixas da Creatorizando' : context === 'empresa' ? 'Assinaturas e mensalidades da empresa' : 'Despesas recorrentes mensais'}
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo Gasto Fixo</button>
      </div>

      {/* Card total */}
      <div className="card flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">📅</div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total mensal comprometido</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card border-2 border-blue-100">
          <h3 className="font-bold text-gray-800 mb-4">{editingId ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Descrição</label>
              <input className="input" placeholder="Ex: Aluguel, Luz, Internet..." value={form.description} onChange={e => set('description', e.target.value)} required />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
            <div>
              <label className="label">Dia do vencimento</label>
              <input className="input" type="number" min="1" max="31" value={form.dayOfMonth} onChange={e => set('dayOfMonth', e.target.value)} required />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {context !== 'agencia' && (
              <div>
                <label className="label">Responsável</label>
                <div className="flex gap-2">
                  {['JOTAPE', 'Carol'].map(p => (
                    <button key={p} type="button" onClick={() => set('person', p)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${form.person === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" className="btn-primary flex-1">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="card animate-pulse h-32" />
      ) : list.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p>Nenhum gasto fixo cadastrado ainda</p>
          <p className="text-sm mt-1">Clique em "Novo Gasto Fixo" para começar</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-3 pr-4">Descrição</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Responsável</th>
                  <th className="pb-3 pr-4">Vencimento</th>
                  <th className="pb-3 pr-4 text-right">Valor</th>
                  <th className="pb-3 pr-4 text-center">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className={`border-b border-gray-50 transition-colors ${r.active ? 'hover:bg-gray-50' : 'opacity-40'}`}>
                    <td className="py-3 pr-4 font-medium">{r.description}</td>
                    <td className="py-3 pr-4 text-gray-600 text-xs">{r.category}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.person === 'JOTAPE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {r.person}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">Dia {r.dayOfMonth}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-orange-600">{formatCurrency(r.amount)}</td>
                    <td className="py-3 pr-4 text-center">
                      <button onClick={() => toggleActive(r)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(r)} className="btn-ghost text-xs py-1 px-2">✏️</button>
                        <button onClick={() => handleDelete(r.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
