import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTransactions, getSummary, getMonthlyEvolution, createTransaction, updateTransaction, deleteTransaction } from '../api.js';
import TransactionModal from '../components/TransactionModal.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { CategoryPieChart, MonthlyBarChart } from '../components/Charts.jsx';
import PrevisaoMes from '../components/PrevisaoMes.jsx';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
      </div>
    </div>
  );
}

export default function Dashboard({ context = 'casa' }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filterPerson, setFilterPerson] = useState('');
  const [filterType, setFilterType] = useState('');

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, txData, evo] = await Promise.all([
        getSummary({ month, year, context }),
        getTransactions({ month, year, person: filterPerson || undefined, type: filterType || undefined, context, limit: 500 }),
        getMonthlyEvolution(context),
      ]);
      setSummary(sum);
      setTransactions(txData.transactions);
      setEvolution(evo);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  }, [month, year, filterPerson, filterType]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    try {
      if (editingTx?.id) {
        await updateTransaction(editingTx.id, data);
      } else {
        await createTransaction({ ...data, context });
      }
      setModalOpen(false);
      setEditingTx(null);
      load();
    } catch (e) {
      alert('Erro ao salvar transação.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    await deleteTransaction(id);
    load();
  }

  function openNew() { setEditingTx(null); setModalOpen(true); }
  function openEdit(tx) { setEditingTx(tx); setModalOpen(true); }

  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR }),
  }));

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <select className="input w-auto" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="input w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <select className="input w-auto" value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
          <option value="">👥 Todos</option>
          <option value="JOTAPE">JOTAPE</option>
          <option value="Carol">Carol</option>
        </select>
        <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="gasto">🔴 Gastos</option>
          <option value="receita">💚 Receitas</option>
        </select>
        <button className="btn-primary ml-auto" onClick={openNew}>+ Novo Lançamento</button>
      </div>

      {/* Cards de resumo */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Receitas" value={summary.receitas} color="bg-green-50" icon="💚" />
          <SummaryCard label="Total Gastos" value={summary.gastos} color="bg-red-50" icon="🔴" />
          <SummaryCard label={`Saldo — ${monthLabel}`} value={summary.saldo}
            color={summary.saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'} icon="💰" />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart byCategory={summary?.byCategory} />
        <MonthlyBarChart evolution={evolution} />
      </div>

      {/* Por pessoa */}
      {summary?.byPerson && Object.keys(summary.byPerson).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Por Pessoa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(summary.byPerson).map(([person, data]) => (
              <div key={person} className={`rounded-xl p-4 ${person === 'JOTAPE' ? 'bg-blue-50' : 'bg-pink-50'}`}>
                <p className="font-bold text-gray-800 mb-2">{person}</p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-600">Gastos</span><span className="font-semibold text-red-600">{formatCurrency(data.gastos)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Receitas</span><span className="font-semibold text-green-600">{formatCurrency(data.receitas)}</span></div>
                  <div className="flex justify-between border-t border-white/60 pt-1 mt-1"><span className="text-gray-700 font-medium">Saldo</span><span className={`font-bold ${(data.receitas - data.gastos) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(data.receitas - data.gastos)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previsão de gastos fixos — só no contexto casa */}
      {context === 'casa' && <PrevisaoMes month={month} year={year} onConfirmed={load} />}

      {/* Tabela */}
      <TransactionTable transactions={transactions} onEdit={openEdit} onDelete={handleDelete} />

      {/* Modal */}
      {modalOpen && (
        <TransactionModal
          transaction={editingTx}
          onClose={() => { setModalOpen(false); setEditingTx(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
