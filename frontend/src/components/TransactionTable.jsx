import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.person.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-gray-800">Transações</h2>
        <input
          className="input max-w-xs"
          placeholder="🔍 Buscar descrição, categoria..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4">Descrição</th>
                  <th className="pb-3 pr-4">Categoria</th>
                  <th className="pb-3 pr-4">Pessoa</th>
                  <th className="pb-3 pr-4 text-right">Valor</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(t.date), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="py-3 pr-4 font-medium max-w-[200px] truncate">{t.description}</td>
                    <td className="py-3 pr-4 text-gray-600">{t.category}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.person === 'JOTAPE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {t.person}
                      </span>
                    </td>
                    <td className={`py-3 pr-4 text-right font-semibold tabular-nums ${t.type === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'receita' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => onEdit(t)} className="btn-ghost text-xs py-1 px-2">✏️</button>
                        <button onClick={() => onDelete(t.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>{filtered.length} transações</span>
              <div className="flex gap-2">
                <button className="btn-ghost py-1 px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Ant.</button>
                <span className="py-1 px-3">{page} / {totalPages}</span>
                <button className="btn-ghost py-1 px-3" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próx. →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
