import { useState } from 'react';

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export default function ClientModal({ onClose, onSave }) {
  const [step, setStep] = useState(1); // 1 = info, 2 = parcelas
  const [contractType, setContractType] = useState('monthly');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  // Monthly
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [numberOfMonths, setNumberOfMonths] = useState(12);

  // Installments
  const [installments, setInstallments] = useState([
    { amount: '', dueDate: '', description: '' },
  ]);

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
    setInstallments(prev => prev.map((inst, i) => ({
      ...inst,
      description: inst.description || `Parcela ${i + 1}/${total}`,
    })));
  }

  function handleNext(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (contractType === 'monthly') {
      if (!monthlyAmount || !startDate) return;
    }
    setStep(2);
  }

  async function handleSave(e) {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      contractType,
      notes: notes.trim() || undefined,
    };

    if (contractType === 'monthly') {
      payload.monthlyAmount = parseFloat(String(monthlyAmount).replace(',', '.'));
      payload.startDate = startDate;
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
            <div>
              <label className="label">Nome do cliente / marca</label>
              <input className="input" placeholder="Ex: Marca X, Empresa Y..." value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div>
              <label className="label">Tipo de contrato</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setContractType('monthly')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border-2 ${contractType === 'monthly' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                  🔄 Mensalidade fixa
                </button>
                <button type="button" onClick={() => setContractType('installments')}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border-2 ${contractType === 'installments' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600'}`}>
                  📅 Parcelas
                </button>
              </div>
            </div>

            {contractType === 'monthly' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Valor mensal (R$)</label>
                    <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Meses a gerar</label>
                    <input className="input" type="number" min="1" max="60" value={numberOfMonths} onChange={e => setNumberOfMonths(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Data do 1º vencimento</label>
                  <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                </div>
                {monthlyAmount && startDate && (
                  <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
                    <p>Total previsto: <strong>R$ {(parseFloat(monthlyAmount) * numberOfMonths).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                    <p className="text-xs mt-0.5 text-purple-500">Geração de {numberOfMonths} parcelas mensais a partir de {startDate ? new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="label mb-0">Parcelas do contrato</label>
                    <button type="button" onClick={autoFillDescriptions} className="text-xs text-purple-600 hover:underline">Auto-preencher descrições</button>
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
                    <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
                      Total do contrato: <strong>R$ {totalInstallments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> em {installments.length} parcela{installments.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="label">Observações (opcional)</label>
              <input className="input" placeholder="Tipo de serviço, detalhes do contrato..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" className="btn-primary flex-1">Confirmar →</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-bold text-gray-800">{name}</p>
              <p className="text-sm text-gray-500">{contractType === 'monthly' ? 'Mensalidade fixa' : 'Parcelas personalizadas'}</p>
              {notes && <p className="text-xs text-gray-400 mt-1">{notes}</p>}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Parcelas que serão geradas:</p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {contractType === 'monthly' ? (
                  Array.from({ length: numberOfMonths }, (_, i) => {
                    const date = new Date(startDate + 'T12:00:00');
                    date.setMonth(date.getMonth() + i);
                    return (
                      <div key={i} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-700">{date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                        <span className="font-semibold text-purple-700">R$ {parseFloat(monthlyAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })
                ) : (
                  installments.map((inst, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700">{inst.description || `Parcela ${idx + 1}`} · {inst.dueDate ? new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                      <span className="font-semibold text-purple-700">R$ {parseFloat(inst.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1">← Voltar</button>
              <button type="submit" className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-purple-700 transition-colors flex-1">
                Salvar cliente
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
