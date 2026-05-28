import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const CATEGORIES_CASA = [
  '🛒 Supermercado', '⛽ Gasolina / Combustível', '💊 Farmácia',
  '🍽️ Restaurante / Delivery', '🏠 Casa', '💡 Contas',
  '👕 Vestuário', '🏥 Saúde', '🎓 Educação',
  '🎬 Lazer / Entretenimento', '💰 Receita JOTAPE', '💰 Receita Carol', '📦 Outros',
];

const CATEGORIES_EMPRESA = [
  '💰 Receita JOTAPE', '💰 Receita Carol',
  '🔧 Ferramentas', '🏛️ Imposto', '📊 Contadora',
  '👩‍💼 Colaboradora', '📣 Tráfego', '📈 Investimentos',
];

export default function TransactionModal({ transaction, onClose, onSave, context = 'casa' }) {
  const isEdit = !!transaction?.id;
  const CATEGORIES = context === 'empresa' ? CATEGORIES_EMPRESA : CATEGORIES_CASA;

  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: CATEGORIES[0],
    type: context === 'empresa' ? 'receita' : 'gasto',
    person: 'JOTAPE',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  useEffect(() => {
    if (transaction) {
      setForm({
        amount: transaction.amount || '',
        description: transaction.description || '',
        category: transaction.category || CATEGORIES[0],
        type: transaction.type || 'gasto',
        person: transaction.person || 'JOTAPE',
        date: transaction.date
          ? format(new Date(transaction.date), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      });
    }
  }, [transaction]);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    onSave({ ...form, amount: parseFloat(String(form.amount).replace(',', '.')) });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">{isEdit ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-3">
            <button type="button"
              onClick={() => set('type', 'gasto')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${form.type === 'gasto' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              🔴 Gasto
            </button>
            <button type="button"
              onClick={() => set('type', 'receita')}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${form.type === 'receita' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              💚 Receita
            </button>
          </div>

          <div>
            <label className="label">Valor (R$)</label>
            <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00"
              value={form.amount} onChange={e => set('amount', e.target.value)} required />
          </div>

          <div>
            <label className="label">Descrição</label>
            <input className="input" type="text" placeholder="Ex: Compras no mercado"
              value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>

          <div>
            <label className="label">Categoria</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Quem pagou</label>
            <div className="flex gap-3">
              {['JOTAPE', 'Carol'].map(p => (
                <button key={p} type="button"
                  onClick={() => set('person', p)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${form.person === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Data e hora</label>
            <input className="input" type="datetime-local"
              value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1">
              {isEdit ? 'Salvar alterações' : 'Lançar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
