import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const OBRIGACOES = [
  // ── DIA 3 ─────────────────────────────────────────────
  { id: 'nf-colaboradores',   dia: 3,  icone: '📄', titulo: 'Recebimento das NFs dos colaboradores',              categoria: 'Documentos', cor: 'blue',   valorFixo: null,   editavel: false },
  { id: 'envio-nf-creators',  dia: 3,  icone: '📤', titulo: 'Envio das NFs — Creators',                           categoria: 'Documentos', cor: 'blue',   valorFixo: null,   editavel: false },
  { id: 'envio-nf-colab',     dia: 3,  icone: '📤', titulo: 'Envio das NFs — Colaboradoras',                      categoria: 'Documentos', cor: 'blue',   valorFixo: null,   editavel: false },
  { id: 'envio-nf-prest',     dia: 3,  icone: '📤', titulo: 'Envio das NFs — Prestadores',                        categoria: 'Documentos', cor: 'blue',   valorFixo: null,   editavel: false },
  { id: 'extrato-nubank',     dia: 3,  icone: '🟣', titulo: 'Envio do extrato bancário — Nubank',                 categoria: 'Bancário',   cor: 'purple', valorFixo: null,   editavel: false },
  { id: 'extrato-cora',       dia: 3,  icone: '🏦', titulo: 'Envio do extrato bancário — Cora',                   categoria: 'Bancário',   cor: 'purple', valorFixo: null,   editavel: false },
  { id: 'relatorio-vendas',   dia: 3,  icone: '📊', titulo: 'Download do relatório de vendas das plataformas',    categoria: 'Relatórios', cor: 'green',  valorFixo: null,   editavel: false },
  // ── DIA 10 ────────────────────────────────────────────
  { id: 'honorarios-cont',    dia: 10, icone: '📊', titulo: 'Pagamento dos honorários da contabilidade',          categoria: 'Pagamentos', cor: 'orange', valorFixo: 440.00, editavel: false },
  // ── DIA 20 ────────────────────────────────────────────
  { id: 'das',                dia: 20, icone: '🏛️', titulo: 'Pagamento do DAS (Simples Nacional)',                categoria: 'Impostos',   cor: 'red',    valorFixo: null,   editavel: true  },
  { id: 'inss',               dia: 20, icone: '🛡️', titulo: 'Pagamento do INSS',                                  categoria: 'Impostos',   cor: 'red',    valorFixo: 178.31, editavel: false },
];

const COR = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   check: 'bg-blue-600'   },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', check: 'bg-purple-600' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',  check: 'bg-green-600'  },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', check: 'bg-[#c45825]'  },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',      check: 'bg-red-600'    },
};

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

function monthKey(date) { return format(date, 'yyyy-MM'); }

export default function AgenciaObrigacoes() {
  const SK_CHECK  = 'creatorizando_obrigacoes_check';
  const SK_VALORES = 'creatorizando_obrigacoes_valores';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [checked, setChecked] = useState(() => { try { return JSON.parse(localStorage.getItem(SK_CHECK)  || '{}'); } catch { return {}; } });
  const [valores, setValores] = useState(() => { try { return JSON.parse(localStorage.getItem(SK_VALORES) || '{}'); } catch { return {}; } });

  useEffect(() => { localStorage.setItem(SK_CHECK,   JSON.stringify(checked)); },  [checked]);
  useEffect(() => { localStorage.setItem(SK_VALORES, JSON.stringify(valores)); }, [valores]);

  const mk = monthKey(currentDate);
  const hoje = new Date();
  const isMesAtual = mk === monthKey(hoje);

  function isChecked(id) { return !!(checked[mk]?.[id]); }

  function toggle(id) {
    setChecked(c => ({ ...c, [mk]: { ...(c[mk] || {}), [id]: !c[mk]?.[id] } }));
  }

  function getValor(id) {
    const ob = OBRIGACOES.find(o => o.id === id);
    if (ob?.valorFixo) return ob.valorFixo;
    return valores[mk]?.[id] ?? '';
  }

  function setValor(id, v) {
    setValores(prev => ({ ...prev, [mk]: { ...(prev[mk] || {}), [id]: v } }));
  }

  function isAtrasado(ob) {
    return isMesAtual && !isChecked(ob.id) && hoje.getDate() > ob.dia;
  }

  const dias = [...new Set(OBRIGACOES.map(o => o.dia))].sort((a, b) => a - b);
  const total = OBRIGACOES.length;
  const done  = OBRIGACOES.filter(o => isChecked(o.id)).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">✅ Obrigações Mensais</h2>
          <p className="text-sm text-gray-500">Checklist de tarefas recorrentes da agência</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">← Ant.</button>
          <span className="text-sm font-semibold text-gray-700 capitalize px-2">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">Próx. →</button>
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

      {/* Lista por vencimento */}
      {dias.map(dia => {
        const items = OBRIGACOES.filter(o => o.dia === dia);
        const doneDia = items.filter(o => isChecked(o.id)).length;
        const atrasadosDia = isMesAtual && hoje.getDate() > dia && doneDia < items.length;

        return (
          <div key={dia} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${atrasadosDia ? 'bg-red-100 text-red-700' : doneDia === items.length ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {String(dia).padStart(2, '0')}
                </div>
                <div>
                  <p className="font-bold text-gray-800">Vencimento dia {dia}</p>
                  {atrasadosDia && <p className="text-xs text-red-500 font-medium">⚠️ Prazo vencido</p>}
                </div>
              </div>
              <span className="text-xs text-gray-500">{doneDia}/{items.length}</span>
            </div>

            <div className="space-y-2">
              {items.map(o => {
                const done = isChecked(o.id);
                const atrasado = isAtrasado(o);
                const c = COR[o.cor];
                const valorAtual = getValor(o.id);

                return (
                  <div key={o.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${done ? `${c.bg} ${c.border}` : atrasado ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}>

                    {/* Checkbox */}
                    <button onClick={() => toggle(o.id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                        done ? `${c.check} border-transparent` : atrasado ? 'border-red-400 bg-white hover:border-red-600' : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                      {done && <span className="text-white text-xs font-bold">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{o.icone}</span>
                        <p className={`font-medium text-sm ${done ? 'line-through text-gray-400' : atrasado ? 'text-red-700' : 'text-gray-800'}`}>
                          {o.titulo}
                        </p>
                        {atrasado && !done && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Atrasado</span>
                        )}
                      </div>

                      {/* Valor */}
                      {(o.valorFixo || o.editavel) && (
                        <div className="mt-2 flex items-center gap-2">
                          {o.valorFixo ? (
                            <span className={`text-sm font-semibold ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {fmt(o.valorFixo)}
                              <span className="text-xs text-gray-400 font-normal ml-1">(fixo)</span>
                            </span>
                          ) : o.editavel ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Valor do mês:</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={valorAtual}
                                onChange={e => setValor(o.id, e.target.value)}
                                disabled={done}
                                className={`input text-sm py-1 w-28 ${done ? 'opacity-50' : ''}`}
                              />
                              {valorAtual && !isNaN(parseFloat(valorAtual)) && (
                                <span className="text-sm font-semibold text-[#c45825]">{fmt(parseFloat(valorAtual))}</span>
                              )}
                            </div>
                          ) : null}
                        </div>
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
        Marcações salvas localmente por mês. Navegue pelos meses para ver o histórico.
      </p>
    </div>
  );
}
