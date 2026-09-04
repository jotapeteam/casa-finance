import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Obrigações fixas recorrentes mensais
const OBRIGACOES_FIXAS = [
  {
    id: 'nf-colaboradores',
    titulo: 'Recebimento das NFs dos colaboradores',
    descricao: 'Receber e arquivar as notas fiscais emitidas pelos colaboradores referente ao mês.',
    icone: '📄',
    categoria: 'Documentos',
    cor: 'blue',
  },
  {
    id: 'envio-nf-creators',
    titulo: 'Envio das NFs — Creators',
    descricao: 'Enviar as notas fiscais dos creators para as plataformas ou responsáveis.',
    icone: '📤',
    categoria: 'Documentos',
    cor: 'blue',
  },
  {
    id: 'envio-nf-colaboradores',
    titulo: 'Envio das NFs — Colaboradores',
    descricao: 'Enviar as notas fiscais dos colaboradores aos destinatários corretos.',
    icone: '📤',
    categoria: 'Documentos',
    cor: 'blue',
  },
  {
    id: 'envio-nf-prestadores',
    titulo: 'Envio das NFs — Prestadores',
    descricao: 'Enviar as notas fiscais dos prestadores de serviço.',
    icone: '📤',
    categoria: 'Documentos',
    cor: 'blue',
  },
  {
    id: 'extrato-nubank',
    titulo: 'Envio do extrato bancário — Nubank',
    descricao: 'Baixar e enviar o extrato bancário do Nubank para a contadora.',
    icone: '🟣',
    categoria: 'Bancário',
    cor: 'purple',
  },
  {
    id: 'extrato-cora',
    titulo: 'Envio do extrato bancário — Cora',
    descricao: 'Baixar e enviar o extrato bancário do Cora para a contadora.',
    icone: '🏦',
    categoria: 'Bancário',
    cor: 'purple',
  },
  {
    id: 'relatorio-vendas',
    titulo: 'Download do relatório de vendas das plataformas',
    descricao: 'Baixar os relatórios de vendas de todas as plataformas utilizadas.',
    icone: '📊',
    categoria: 'Relatórios',
    cor: 'green',
  },
  {
    id: 'das',
    titulo: 'Pagamento do DAS (Simples Nacional)',
    descricao: 'Gerar e pagar o DAS do mês dentro do prazo.',
    icone: '🏛️',
    categoria: 'Impostos',
    cor: 'red',
  },
  {
    id: 'inss',
    titulo: 'Pagamento do INSS',
    descricao: 'Gerar e pagar a guia de INSS do mês dentro do prazo.',
    icone: '🛡️',
    categoria: 'Impostos',
    cor: 'red',
  },
];

const COR_MAP = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', check: 'bg-blue-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', check: 'bg-purple-600' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-700', check: 'bg-green-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700', check: 'bg-red-600' },
};

function monthKey(date) {
  return format(date, 'yyyy-MM');
}

export default function AgenciaObrigacoes() {
  const STORAGE_KEY = 'creatorizando_obrigacoes';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  });
  const [obs, setObs] = useState({});
  const [showObs, setShowObs] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const mk = monthKey(currentDate);

  function toggle(id) {
    setChecked(c => {
      const month = c[mk] || {};
      const next = { ...month, [id]: !month[id] };
      return { ...c, [mk]: next };
    });
  }

  function isChecked(id) {
    return !!(checked[mk]?.[id]);
  }

  const total = OBRIGACOES_FIXAS.length;
  const done = OBRIGACOES_FIXAS.filter(o => isChecked(o.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const categorias = [...new Set(OBRIGACOES_FIXAS.map(o => o.categoria))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">✅ Obrigações Mensais</h2>
          <p className="text-sm text-gray-500">Checklist de tarefas recorrentes da agência</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))}
            className="btn-ghost py-1 px-3 text-sm">← Ant.</button>
          <span className="text-sm font-semibold text-gray-700 capitalize px-2">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))}
            className="btn-ghost py-1 px-3 text-sm">Próx. →</button>
        </div>
      </div>

      {/* Progresso */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-800">
              {done === total ? '🎉 Todas obrigações cumpridas!' : `${done} de ${total} concluídas`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </div>
          <span className={`text-2xl font-bold ${pct === 100 ? 'text-green-600' : pct >= 50 ? 'text-[#c45825]' : 'text-red-500'}`}>
            {pct}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-[#c45825]' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Lista por categoria */}
      {categorias.map(cat => {
        const items = OBRIGACOES_FIXAS.filter(o => o.categoria === cat);
        const doneCat = items.filter(o => isChecked(o.id)).length;
        return (
          <div key={cat} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">{cat}</h3>
              <span className="text-xs text-gray-500">{doneCat}/{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(o => {
                const done = isChecked(o.id);
                const c = COR_MAP[o.cor];
                return (
                  <div key={o.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${done ? `${c.bg} ${c.border}` : 'bg-gray-50 border-transparent'}`}>
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(o.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                        done ? `${c.check} border-transparent` : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                      {done && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{o.icone}</span>
                        <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {o.titulo}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{o.categoria}</span>
                      </div>
                      {!done && (
                        <p className="text-xs text-gray-500 mt-0.5">{o.descricao}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-gray-400 text-center">
        As marcações são salvas localmente por mês. Navegue pelos meses para ver o histórico.
      </p>
    </div>
  );
}
