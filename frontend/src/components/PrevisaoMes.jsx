import { useState, useEffect } from 'react';
import { getRecurringPreview, confirmRecurring } from '../api.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function PrevisaoMes({ month, year, onConfirmed }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getRecurringPreview({ month, year });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [month, year]);

  async function handleConfirm(id) {
    await confirmRecurring(id, { month, year });
    load();
    onConfirmed?.();
  }

  if (loading) return <div className="card animate-pulse h-32" />;
  if (!data || data.preview.length === 0) return null;

  const today = new Date().getDate();
  const isCurrentMonth = month === new Date().getMonth() + 1 && year === new Date().getFullYear();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">📅 Previsão de Gastos Fixos</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR })}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-500">Total previsto</p>
          <p className="font-bold text-orange-600 text-lg">{formatCurrency(data.totalPrevisto)}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>✅ Confirmado: {formatCurrency(data.totalConfirmado)}</span>
          <span>⏳ Pendente: {formatCurrency(data.totalPendente)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${data.totalPrevisto > 0 ? (data.totalConfirmado / data.totalPrevisto) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {data.preview.map(r => {
          const isOverdue = isCurrentMonth && !r.confirmed && r.dayOfMonth < today;
          const isDueToday = isCurrentMonth && !r.confirmed && r.dayOfMonth === today;

          return (
            <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
              r.confirmed ? 'bg-green-50' : isOverdue ? 'bg-red-50' : isDueToday ? 'bg-yellow-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  r.confirmed ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {r.dayOfMonth}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">{r.description}</p>
                  <p className="text-xs text-gray-500">{r.category} · {r.person}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-gray-800">{formatCurrency(r.amount)}</span>
                {r.confirmed ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Pago</span>
                ) : (
                  <button
                    onClick={() => handleConfirm(r.id)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      isDueToday ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                      isOverdue ? 'bg-red-500 text-white hover:bg-red-600' :
                      'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}>
                    {isDueToday ? '⚡ Confirmar hoje' : isOverdue ? '⚠️ Confirmar' : 'Confirmar'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
