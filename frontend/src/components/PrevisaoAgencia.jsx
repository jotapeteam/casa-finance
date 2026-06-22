import { useState, useEffect } from 'react';
import { getClientsForecast, confirmClientPayment, getRecurringPreview, confirmRecurring } from '../api.js';

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function PrevisaoAgencia({ month, year, onRefresh }) {
  const [revForecast, setRevForecast] = useState([]);
  const [expPreview, setExpPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [rev, exp] = await Promise.all([
        getClientsForecast(4),
        getRecurringPreview({ month, year, context: 'agencia' }),
      ]);
      setRevForecast(rev);
      setExpPreview(exp);
    } catch {
      setRevForecast([]);
      setExpPreview(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [month, year]);

  async function handleConfirmPayment(clientId, paymentId) {
    await confirmClientPayment(clientId, paymentId);
    load();
    onRefresh?.();
  }

  async function handleConfirmExpense(id) {
    await confirmRecurring(id, { month, year });
    load();
    onRefresh?.();
  }

  if (loading) return <div className="card animate-pulse h-40" />;
  if (revForecast.length === 0 && (!expPreview || expPreview.preview.length === 0)) return null;

  const today = new Date().getDate();
  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  return (
    <div className="space-y-4">
      {/* Previsão de receita de clientes */}
      {revForecast.length > 0 && (
        <div className="card border-l-4 border-purple-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">💜 Previsão de Receitas — Clientes</h2>
              <p className="text-xs text-gray-500 mt-0.5">Pagamentos pendentes dos próximos 4 meses</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-500">Total previsto</p>
              <p className="font-bold text-purple-600 text-lg">
                {fmt(revForecast.reduce((s, m) => s + m.total, 0))}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {revForecast.map(monthGroup => (
              <div key={monthGroup.key}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 capitalize">{monthGroup.label}</p>
                  <span className="text-sm font-bold text-purple-600">{fmt(monthGroup.total)}</span>
                </div>
                <div className="space-y-1.5 pl-2">
                  {monthGroup.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{p.client.name}</p>
                        <p className="text-xs text-gray-500">{p.description} · vence {new Date(p.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-purple-700">{fmt(p.amount)}</span>
                        <button
                          onClick={() => handleConfirmPayment(p.clientId, p.id)}
                          className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
                          Recebido
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previsão de gastos fixos da agência */}
      {expPreview && expPreview.preview.length > 0 && (
        <div className="card border-l-4 border-orange-400">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">📅 Gastos Fixos Agência</h2>
              <p className="text-xs text-gray-500 mt-0.5">Despesas recorrentes do mês</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-500">Pendente</p>
              <p className="font-bold text-orange-600 text-lg">{fmt(expPreview.totalPendente)}</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>✅ Confirmado: {fmt(expPreview.totalConfirmado)}</span>
              <span>⏳ Previsto: {fmt(expPreview.totalPrevisto)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${expPreview.totalPrevisto > 0 ? (expPreview.totalConfirmado / expPreview.totalPrevisto) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {expPreview.preview.map(r => {
              const isOverdue = isCurrentMonth && !r.confirmed && r.dayOfMonth < today;
              const isDueToday = isCurrentMonth && !r.confirmed && r.dayOfMonth === today;
              return (
                <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl ${r.confirmed ? 'bg-green-50' : isOverdue ? 'bg-red-50' : isDueToday ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${r.confirmed ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                      {r.dayOfMonth}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{r.description}</p>
                      <p className="text-xs text-gray-500">{r.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{fmt(r.amount)}</span>
                    {r.confirmed ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Pago</span>
                    ) : (
                      <button onClick={() => handleConfirmExpense(r.id)}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${isDueToday ? 'bg-yellow-500 text-white' : isOverdue ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                        {isDueToday ? '⚡ Hoje' : isOverdue ? '⚠️ Vencido' : 'Confirmar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
