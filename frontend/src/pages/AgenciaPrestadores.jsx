import { useState, useEffect } from 'react';

const SERVICOS = [
  'Design / Criação', 'Desenvolvimento', 'Fotografia / Vídeo', 'Edição / Pós-produção',
  'Copywriting / Texto', 'Tráfego Pago', 'Assessoria Jurídica', 'Contabilidade',
  'Marketing', 'Consultoria', 'Outro',
];

const STATUS_LABELS = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-700' },
  concluido: { label: 'Concluído', color: 'bg-gray-100 text-gray-500' },
  suspenso: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-700' },
};

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}

const EMPTY = {
  name: '', service: SERVICOS[0], contact: '', cnpjCpf: '', valueType: 'fixo',
  amount: '', notes: '', status: 'ativo',
};

export default function AgenciaPrestadores() {
  const STORAGE_KEY = 'creatorizando_prestadores';

  const [list, setList] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  function save() {
    if (!form.name.trim()) return;
    if (editingId !== null) {
      setList(l => l.map(p => p.id === editingId ? { ...p, ...form } : p));
    } else {
      setList(l => [...l, { ...form, id: Date.now(), amount: parseFloat(String(form.amount).replace(',', '.')) || 0 }]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
  }

  function openEdit(p) {
    setForm({ name: p.name, service: p.service, contact: p.contact, cnpjCpf: p.cnpjCpf, valueType: p.valueType, amount: p.amount, notes: p.notes, status: p.status });
    setEditingId(p.id);
    setShowForm(true);
  }

  function remove(id) {
    if (!confirm('Remover este prestador?')) return;
    setList(l => l.filter(p => p.id !== id));
  }

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  const ativos = list.filter(p => p.status === 'ativo');
  const totalMensal = ativos.filter(p => p.valueType === 'fixo').reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🤝 Prestadores de Serviço</h2>
          <p className="text-sm text-gray-500">Terceiros e fornecedores contratados pela agência</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }}>
          + Novo Prestador
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">🤝</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prestadores ativos</p>
            <p className="text-2xl font-bold text-gray-900">{ativos.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">📋</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total cadastrados</p>
            <p className="text-2xl font-bold text-gray-900">{list.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">💰</div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Custo fixo mensal</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(totalMensal)}</p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card border-2 border-orange-100">
          <h3 className="font-bold text-gray-800 mb-4">{editingId ? 'Editar Prestador' : 'Novo Prestador'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome / Razão Social</label>
              <input className="input" placeholder="Ex: João Silva, Estúdio XYZ..." value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Tipo de serviço</label>
              <select className="input" value={form.service} onChange={e => set('service', e.target.value)}>
                {SERVICOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contato (WhatsApp / e-mail)</label>
              <input className="input" placeholder="(11) 99999-9999 ou email@..." value={form.contact} onChange={e => set('contact', e.target.value)} />
            </div>
            <div>
              <label className="label">CNPJ / CPF</label>
              <input className="input" placeholder="000.000.000-00" value={form.cnpjCpf} onChange={e => set('cnpjCpf', e.target.value)} />
            </div>
            <div>
              <label className="label">Tipo de valor</label>
              <div className="flex gap-2">
                {[['fixo', '💰 Fixo mensal'], ['variavel', '📊 Por demanda']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('valueType', v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${form.valueType === v ? 'bg-[#c45825] text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">{form.valueType === 'fixo' ? 'Valor mensal (R$)' : 'Valor estimado (R$)'}</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Observações</label>
              <textarea className="input" rows={2} placeholder="Detalhes do contrato, prazo, entregáveis..." value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={save} className="btn-primary flex-1">{editingId ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {list.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">🤝</div>
          <p>Nenhum prestador cadastrado ainda</p>
          <p className="text-sm mt-1">Clique em "Novo Prestador" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(p => {
            const st = STATUS_LABELS[p.status] || STATUS_LABELS.ativo;
            const isOpen = expandedId === p.id;
            return (
              <div key={p.id} className="card">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isOpen ? null : p.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🤝</div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    <span className="font-semibold text-[#c45825]">
                      {p.amount ? `${fmt(p.amount)}${p.valueType === 'fixo' ? '/mês' : ''}` : '—'}
                    </span>
                    <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {p.contact && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Contato</p>
                        <p className="text-gray-700">{p.contact}</p>
                      </div>
                    )}
                    {p.cnpjCpf && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">CNPJ / CPF</p>
                        <p className="text-gray-700">{p.cnpjCpf}</p>
                      </div>
                    )}
                    {p.notes && (
                      <div className="sm:col-span-3">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Observações</p>
                        <p className="text-gray-700">{p.notes}</p>
                      </div>
                    )}
                    <div className="sm:col-span-3 flex gap-2 pt-2">
                      <button onClick={() => openEdit(p)} className="btn-ghost text-xs py-1 px-3">✏️ Editar</button>
                      <button onClick={() => remove(p.id)} className="btn-ghost text-xs py-1 px-3 hover:text-red-500">🗑️ Remover</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
