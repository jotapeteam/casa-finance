import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTransactions, getSummary, getMonthlyEvolution, createTransaction, updateTransaction, deleteTransaction } from '../api.js';
import TransactionModal from '../components/TransactionModal.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { CategoryPieChart, MonthlyBarChart } from '../components/Charts.jsx';
import PrevisaoAgencia from '../components/PrevisaoAgencia.jsx';

function fmt(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{fmt(value)}</p>
      </div>
    </div>
  );
}

export default function AgenciaDashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
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
        getSummary({ month, year, context: 'agencia' }),
        getTransactions({ month, year, type: filterType || undefined, context: 'agencia', limit: 500 }),
        getMonthlyEvolution('agencia'),
      ]);
      setSummary(sum);
      setTransactions(txData.transactions);
      setEvolution(evo);
    } catch (e) {
      console.error('Erro ao carregar agência:', e);
    } finally {
      setLoading(false);
    }
  }, [month, year, filterType]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data) {
    try {
      if (editingTx?.id) {
        await updateTransaction(editingTx.id, data);
      } else {
        await createTransaction({ ...data, context: 'agencia' });
      }
      setModalOpen(false);
      setEditingTx(null);
      load();
    } catch {
      alert('Erro ao salvar transação.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    await deleteTransaction(id);
    load();
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2000, i, 1), 'MMMM', { locale: ptBR }),
  }));
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Header da agência */}
      <div className="rounded-2xl p-6 text-white overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 50%, #c45825 100%)' }}>
        <div className="absolute top-2 right-8 text-white/10 text-8xl font-black select-none" style={{ fontFamily: 'serif' }}>✦</div>
        <p className="text-xs tracking-[0.2em] text-white/50 uppercase mb-3">✦ Criativamente</p>
        <h1 className="text-2xl font-bold mb-1">Dashboard Financeiro</h1>
        <p className="text-white/60 text-sm">Controle de receitas, gastos e clientes da agência</p>
      </div>

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
        <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="gasto">🔴 Gastos</option>
          <option value="receita">💚 Receitas</option>
        </select>
        <button style={{ background: 'linear-gradient(135deg, #0d1b3e, #c45825)' }} className="text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity ml-auto" onClick={() => { setEditingTx(null); setModalOpen(true); }}>
          + Novo Lançamento
        </button>
      </div>

      {/* Cards resumo */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Receitas" value={summary.receitas} color="bg-green-50" icon="💚" />
          <SummaryCard label="Gastos" value={summary.gastos} color="bg-red-50" icon="🔴" />
          <SummaryCard label={`Saldo — ${monthLabel}`} value={summary.saldo}
            color={summary.saldo >= 0 ? 'bg-orange-50' : 'bg-red-50'} icon="✦" />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart byCategory={summary?.byCategory} />
        <MonthlyBarChart evolution={evolution} />
      </div>

      {/* Previsão (receita de clientes + gastos fixos) */}
      <PrevisaoAgencia month={month} year={year} onRefresh={load} />

      {/* Tabela de transações */}
      <TransactionTable transactions={transactions} onEdit={tx => { setEditingTx(tx); setModalOpen(true); }} onDelete={handleDelete} />

      {modalOpen && (
        <TransactionModal
          transaction={editingTx}
          onClose={() => { setModalOpen(false); setEditingTx(null); }}
          onSave={handleSave}
          context="agencia"
        />
      )}
    </div>
  );
}
