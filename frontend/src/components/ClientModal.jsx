import { useState } from 'react';

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + Number(days));
  return d;
}

function addMonthsToDate(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

export default function ClientModal({ onClose, onSave }) {
  const [step, setStep]           = useState(1);
  const [contractType, setContractType] = useState('monthly');
  const [serviceType, setServiceType]   = useState('');
  const [name, setName]           = useState('');
  const [notes, setNotes]         = useState('');

  // Monthly
  const [monthlyAmount, setMonthlyAmount]   = useState('');
  const [contractDate, setContractDate]     = useState('');
  const [paymentDays, setPaymentDays]       = useState(30);
  const [numberOfMonths, setNumberOfMonths] = useState(12);

  // Installments
  const [installments, setInstallments] = useState([{ amount: '', dueDate: '', description: '' }]);

  // Avulso
  const [avulsoAmount, setAvulsoAmount] = useState('');
  const [avulsoContractDate, setAvulsoContractDate] = useState('');
  const [avulsoPaymentDays, setAvulsoPaymentDays]   = useState(30);
  const [avulsoDesc, setAvulsoDesc]     = useState('');

  /* ── helpers ── */
  function addInstallment() {
    setInstallments(prev => [...prev, { amount: '', dueDate: '', description: '' }]);
  }
  function removeInstallment(idx) {
    setInstallments(prev => prev.filter((_, i) => i !== idx));
  }
  function setInstallmentField(idx, field, value) {
    setInstallments(prev => prev.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst));
  }
  function autoFillDescriptions() {
    const total = installments.length;
    setInstallments(prev => prev.map((inst, i) => ({ ...inst, description: inst.description || `Parcela ${i + 1}/${total}` })));
  }

  // First due date for monthly
  const firstDueDate = contractDate && paymentDays ? addDays(contractDate, paymentDays) : null;
  const firstDueDateStr = firstDueDate ? toDateStr(firstDueDate) : null;

  // First due date for avulso
  const avulsoDueDate = avulsoContractDate && avulsoPaymentDays ? addDays(avulsoContractDate, avulsoPaymentDays) : null;

  /* ── step 1 ── */
  function handleNext(e) {
    e.preventDefault();
    if (!name.trim()) return;

    if (contractType === 'avulso') {
      if (!avulsoAmount || !avulsoContractDate) return;
      const notesWithType = [serviceType ? `[${serviceType}]` : '', notes.trim()].filter(Boolean).join('\n') || undefined;
      onSave({
        name: name.trim(),
        contractType: 'installments',
        notes: notesWithType,
        installments: [{
          amount: parseFloat(String(avulsoAmount).replace(',', '.')),
          dueDate: avulsoDueDate ? toDateStr(avulsoDueDate) : avulsoContractDate,
          description: avulsoDesc.trim() || 'Pagamento avulso',
        }],
      });
      return;
    }

    if (contractType === 'monthly') {
      if (!monthlyAmount || !contractDate) return;
    }

    setStep(2);
  }

  /* ── step 2 ── */
  async function handleSave(e) {
    e.preventDefault();
    const notesWithType = [serviceType ? `[${serviceType}]` : '', notes.trim()].filter(Boolean).join('\n') || undefined;
    const payload = { name: name.trim(), contractType, notes: notesWithType };

    if (contractType === 'monthly') {
      payload.monthlyAmount  = parseFloat(String(monthlyAmount).replace(',', '.'));
      payload.startDate      = firstDueDateStr;
      payload.numberOfMonths = Number(numberOfMonths);
    } else {
      payload.installments = installments.map((inst, idx) => ({
        amount: parseFloat(String(inst.amount).replace(',', '.')),
        dueDate: inst.dueDate,
        description: inst.description || `Parcela ${idx + 1}/${installments.length}`,
      }));
    }

    await onSave(payload);
  }

  const totalInstallments = installments.reduce((s, i) => s + (parseFloat(String(i.amount).replace(',', '.')) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold">Novo Cliente</h2>
            <p className="text-xs text-gray-500">{step === 1 ? 'Informações do contrato' : 'Confirmar parcelas'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} className="p-5 space-y-4">
            {/* Nome */}
            <div>
              <label className="label">Nome do cliente / marca</label>
              <input className="input" placeholder="Ex: Marca X, Empresa Y..." value={name} onChange={e => setName(e.target.value)} required />
            </div>

            {/* Categoria de serviço */}
            <div>
              <label className="label">Categoria de serviço</label>
              <div className="flex gap-2 flex-wrap">
                {['Contratação de Creators', 'Permuta / Comissão', 'Outro'].map(opt => (
                  <button key={opt} type="button" onClick={() => setServiceType(serviceType === opt ? '' : opt)}
                    className={`py-2 px-3 rounded-xl font-medium text-sm transition-colors border-2 ${serviceType === opt ? 'border-[#c45825] bg-orange-50 text-[#c45825]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {opt === 'Contratação de Creators' ? '🎬 ' : opt === 'Permuta / Comissão' ? '🤝 ' : '📋 '}{opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de contrato */}
            <div>
              <label className="label">Tipo de contrato</label>
              <div className="flex gap-3">
                {[['monthly', '🔄 Mensalidade fixa'], ['installments', '📅 Parcelas'], ['avulso', '💸 Avulso']].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setContractType(id)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border-2 ${contractType === id ? 'border-[#c45825] bg-orange-50 text-[#c45825]' : 'border-gray-200 text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── AVULSO ── */}
            {contractType === 'avulso' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Valor (R$)</label>
                    <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={avulsoAmount} onChange={e => setAvulsoAmount(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Data de contratação</label>
                    <input className="input" type="date" value={avulsoContractDate} onChange={e => setAvulsoContractDate(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Prazo para pagamento (dias)</label>
                  <input className="input" type="number" min="0" max="365" value={avulsoPaymentDays} onChange={e => setAvulsoPaymentDays(e.target.value)} />
                </div>
                <div>
                  <label className="label">Descrição (opcional)</label>
                  <input className="input" placeholder="Ex: Criação de identidade visual..." value={avulsoDesc} onChange={e => setAvulsoDesc(e.target.value)} />
                </div>
                {avulsoDueDate && (
                  <div className="bg-orange-50 rounded-xl p-3 text-sm text-[#c45825]">
                    Vencimento: <strong>{avulsoDueDate.toLocaleDateString('pt-BR')}</strong>
                    <span className="text-xs text-orange-400 ml-2">({avulsoPaymentDays} dias após {new Date(avulsoContractDate + 'T12:00:00').toLocaleDateString('pt-BR')})</span>
                  </div>
                )}
              </>
            )}

            {/* ── MENSALIDADE ── */}
            {contractType === 'monthly' && (
              <>
                <div>
                  <label className="label">Valor mensal (R$)</label>
                  <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Data de contratação</label>
                    <input className="input" type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Prazo para 1º pagamento (dias)</label>
                    <input className="input" type="number" min="0" max="365" value={paymentDays} onChange={e => setPaymentDays(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Meses a gerar</label>
                  <input className="input" type="number" min="1" max="60" value={numberOfMonths} onChange={e => setNumberOfMonths(e.target.value)} required />
                </div>
                {firstDueDate && (
                  <div className="bg-orange-50 rounded-xl p-3 text-sm text-[#c45825]">
                    <p>1º vencimento: <strong>{firstDueDate.toLocaleDateString('pt-BR')}</strong>
                      <span className="text-xs text-orange-400 ml-2">({paymentDays} dias após {new Date(contractDate + 'T12:00:00').toLocaleDateString('pt-BR')})</span>
                    </p>
                    {monthlyAmount && (
                      <p className="text-xs mt-1 text-orange-500">
                        {numberOfMonths} parcelas · total: R$ {(parseFloat(monthlyAmount) * numberOfMonths).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── PARCELAS ── */}
            {contractType === 'installments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Parcelas do contrato</label>
                  <button type="button" onClick={autoFillDescriptions} className="text-xs text-[#c45825] hover:underline">Auto-preencher descrições</button>
                </div>
                {installments.map((inst, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <input className="input text-sm" type="number" step="0.01" placeholder="Valor" value={inst.amount}
                        onChange={e => setInstallmentField(idx, 'amount', e.target.value)} required />
                    </div>
                    <div className="col-span-4">
                      <input className="input text-sm" type="date" value={inst.dueDate}
                        onChange={e => setInstallmentField(idx, 'dueDate', e.target.value)} required />
                    </div>
                    <div className="col-span-2">
                      <input className="input text-sm" placeholder="Label" value={inst.description}
                        onChange={e => setInstallmentField(idx, 'description', e.target.value)} />
                    </div>
                    <div className="col-span-1 flex items-center justify-center pt-2">
                      {installments.length > 1 && (
                        <button type="button" onClick={() => removeInstallment(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addInstallment} className="btn-ghost w-full text-sm">+ Adicionar parcela</button>
                {totalInstallments > 0 && (
                  <div className="bg-orange-50 rounded-xl p-3 text-sm text-[#c45825]">
                    Total: <strong>R$ {totalInstallments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> em {installments.length} parcela{installments.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div>
              <label className="label">Observações (opcional)</label>
              <input className="input" placeholder="Detalhes do contrato..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" className="btn-primary flex-1">Confirmar →</button>
            </div>
          </form>
        ) : (
          /* ── STEP 2: preview ── */
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-bold text-gray-800">{name}</p>
              <p className="text-sm text-gray-500">{contractType === 'monthly' ? 'Mensalidade fixa' : 'Parcelas personalizadas'}</p>
              {firstDueDate && contractType === 'monthly' && (
                <p className="text-xs text-orange-500 mt-1">
                  Contratação: {new Date(contractDate + 'T12:00:00').toLocaleDateString('pt-BR')} · 1º vencimento: {firstDueDate.toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Parcelas que serão geradas:</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {contractType === 'monthly' ? (
                  Array.from({ length: numberOfMonths }, (_, i) => {
                    const due = i === 0 ? firstDueDate : addMonthsToDate(firstDueDate, i);
                    return (
                      <div key={i} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-700">{due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        <span className="font-semibold text-[#c45825]">R$ {parseFloat(monthlyAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })
                ) : (
                  installments.map((inst, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700">{inst.description || `Parcela ${idx + 1}`} · {inst.dueDate ? new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                      <span className="font-semibold text-[#c45825]">R$ {parseFloat(inst.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">← Voltar</button>
              <button type="submit" className="text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity flex-1" style={{ background: 'linear-gradient(135deg, #0d1b3e, #c45825)' }}>
                Salvar cliente
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
