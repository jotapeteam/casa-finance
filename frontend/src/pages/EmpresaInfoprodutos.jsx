import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SK_PRODUTOS = 'carol_infoprodutos';
const SK_VENDAS   = 'carol_infoprodutos_vendas';

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
}
function monthKey(d) { return format(d, 'yyyy-MM'); }

const EMPTY_PRODUTO = { nome: '', preco: '', descricao: '' };
const EMPTY_VENDA   = { produtoId: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), comprador: '', observacao: '' };

export default function EmpresaInfoprodutos() {
  const [produtos, setProdutos] = useState(() => { try { return JSON.parse(localStorage.getItem(SK_PRODUTOS) || '[]'); } catch { return []; } });
  const [vendas, setVendas]     = useState(() => { try { return JSON.parse(localStorage.getItem(SK_VENDAS)   || '[]'); } catch { return []; } });

  const [formProd, setFormProd]     = useState(EMPTY_PRODUTO);
  const [editProdId, setEditProdId] = useState(null);
  const [showProdForm, setShowProdForm] = useState(false);

  const [formVenda, setFormVenda]   = useState(EMPTY_VENDA);
  const [editVendaId, setEditVendaId] = useState(null);
  const [showVendaForm, setShowVendaForm] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tab, setTab] = useState('vendas');

  useEffect(() => { localStorage.setItem(SK_PRODUTOS, JSON.stringify(produtos)); }, [produtos]);
  useEffect(() => { localStorage.setItem(SK_VENDAS,   JSON.stringify(vendas));   }, [vendas]);

  const mk = monthKey(currentDate);
  const vendasMes = vendas.filter(v => v.data?.slice(0, 7) === mk);

  /* ── produtos ── */
  function saveProduto() {
    if (!formProd.nome.trim()) return;
    const item = { ...formProd, preco: parseFloat(String(formProd.preco).replace(',', '.')) || 0 };
    if (editProdId !== null) {
      setProdutos(l => l.map(p => p.id === editProdId ? { ...p, ...item } : p));
    } else {
      setProdutos(l => [...l, { ...item, id: Date.now() }]);
    }
    setShowProdForm(false); setEditProdId(null); setFormProd(EMPTY_PRODUTO);
  }

  function removeProduto(id) {
    if (!confirm('Remover produto?')) return;
    setProdutos(l => l.filter(p => p.id !== id));
  }

  /* ── vendas ── */
  function saveVenda() {
    if (!formVenda.valor || !formVenda.data) return;
    const item = { ...formVenda, valor: parseFloat(String(formVenda.valor).replace(',', '.')) || 0 };
    if (editVendaId !== null) {
      setVendas(l => l.map(v => v.id === editVendaId ? { ...v, ...item } : v));
    } else {
      setVendas(l => [...l, { ...item, id: Date.now() }]);
    }
    setShowVendaForm(false); setEditVendaId(null); setFormVenda(EMPTY_VENDA);
  }

  function removeVenda(id) {
    if (!confirm('Remover venda?')) return;
    setVendas(l => l.filter(v => v.id !== id));
  }

  function openEditVenda(v) {
    setFormVenda({ produtoId: v.produtoId || '', valor: v.valor, data: v.data, comprador: v.comprador || '', observacao: v.observacao || '' });
    setEditVendaId(v.id); setShowVendaForm(true);
  }

  function setSP(f, v) { setFormProd(p => ({ ...p, [f]: v })); }
  function setSV(f, v) { setFormVenda(p => ({ ...p, [f]: v })); }

  const totalMes   = vendasMes.reduce((s, v) => s + v.valor, 0);
  const totalGeral = vendas.reduce((s, v) => s + v.valor, 0);

  const produtoNome = (id) => produtos.find(p => p.id === Number(id))?.nome || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎓 Infoprodutos</h2>
          <p className="text-sm text-gray-500">Produtos digitais e controle de vendas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => { setFormProd(EMPTY_PRODUTO); setEditProdId(null); setShowProdForm(true); setTab('produtos'); }}>
            📦 Novo Produto
          </button>
          <button className="btn-primary" onClick={() => { setFormVenda(EMPTY_VENDA); setEditVendaId(null); setShowVendaForm(true); setTab('vendas'); }}>
            + Registrar Venda
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">📦</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Produtos</p>
            <p className="text-xl font-bold text-gray-900">{produtos.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">💚</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Vendas no mês</p>
            <p className="text-lg font-bold text-green-700">{fmt(totalMes)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">📈</div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total acumulado</p>
            <p className="text-lg font-bold text-blue-700">{fmt(totalGeral)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[['vendas', '💰 Vendas'], ['produtos', '📦 Produtos']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Formulário produto */}
      {showProdForm && tab === 'produtos' && (
        <div className="card border-2 border-purple-100">
          <h3 className="font-bold text-gray-800 mb-4">{editProdId ? 'Editar Produto' : 'Novo Produto'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome do produto</label>
              <input className="input" placeholder="Ex: Curso de Instagram, E-book..." value={formProd.nome} onChange={e => setSP('nome', e.target.value)} />
            </div>
            <div>
              <label className="label">Preço padrão (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={formProd.preco} onChange={e => setSP('preco', e.target.value)} />
            </div>
            <div>
              <label className="label">Descrição (opcional)</label>
              <input className="input" placeholder="Breve descrição..." value={formProd.descricao} onChange={e => setSP('descricao', e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowProdForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={saveProduto} className="btn-primary flex-1">{editProdId ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulário venda */}
      {showVendaForm && tab === 'vendas' && (
        <div className="card border-2 border-green-100">
          <h3 className="font-bold text-gray-800 mb-4">{editVendaId ? 'Editar Venda' : 'Registrar Venda'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Produto</label>
              <select className="input" value={formVenda.produtoId} onChange={e => {
                const prod = produtos.find(p => p.id === Number(e.target.value));
                setSV('produtoId', e.target.value);
                if (prod && !formVenda.valor) setSV('valor', prod.preco);
              }}>
                <option value="">Selecionar produto...</option>
                {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} ({fmt(p.preco)})</option>)}
                <option value="avulso">Venda avulsa (sem produto)</option>
              </select>
            </div>
            <div>
              <label className="label">Valor cobrado (R$)</label>
              <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={formVenda.valor} onChange={e => setSV('valor', e.target.value)} />
            </div>
            <div>
              <label className="label">Data da venda</label>
              <input className="input" type="date" value={formVenda.data} onChange={e => setSV('data', e.target.value)} />
            </div>
            <div>
              <label className="label">Comprador (opcional)</label>
              <input className="input" placeholder="Nome ou @..." value={formVenda.comprador} onChange={e => setSV('comprador', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Observação (opcional)</label>
              <input className="input" placeholder="Plataforma de venda, cupom aplicado..." value={formVenda.observacao} onChange={e => setSV('observacao', e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="button" onClick={() => setShowVendaForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button type="button" onClick={saveVenda} className="btn-primary flex-1">{editVendaId ? 'Salvar' : 'Registrar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Aba Vendas */}
      {tab === 'vendas' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-gray-800">Vendas</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentDate(d => subMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">← Ant.</button>
              <span className="text-sm font-semibold text-gray-700 capitalize px-2">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => setCurrentDate(d => addMonths(d, 1))} className="btn-ghost py-1 px-3 text-sm">Próx. →</button>
            </div>
          </div>

          {vendasMes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">💰</p>
              <p>Nenhuma venda registrada neste mês</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vendasMes.sort((a, b) => b.data.localeCompare(a.data)).map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{produtoNome(v.produtoId)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {v.comprador && ` · ${v.comprador}`}
                        {v.observacao && ` · ${v.observacao}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-700">{fmt(v.valor)}</span>
                    <button onClick={() => openEditVenda(v)} className="btn-ghost text-xs py-1 px-2">✏️</button>
                    <button onClick={() => removeVenda(v.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100 text-right">
                <span className="text-sm text-gray-500">Total do mês: </span>
                <span className="font-bold text-green-700 text-lg">{fmt(totalMes)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba Produtos */}
      {tab === 'produtos' && (
        <div className="card">
          <h3 className="font-bold text-gray-800 mb-4">Catálogo de Produtos</h3>
          {produtos.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📦</p>
              <p>Nenhum produto cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {produtos.map(p => {
                const vendasProd = vendas.filter(v => v.produtoId === p.id);
                const receitaProd = vendasProd.reduce((s, v) => s + v.valor, 0);
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">{p.nome}</p>
                      {p.descricao && <p className="text-xs text-gray-500">{p.descricao}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{vendasProd.length} venda{vendasProd.length !== 1 ? 's' : ''} · receita total: {fmt(receitaProd)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">{fmt(p.preco)}</span>
                      <button onClick={() => { setFormProd({ nome: p.nome, preco: p.preco, descricao: p.descricao || '' }); setEditProdId(p.id); setShowProdForm(true); }} className="btn-ghost text-xs py-1 px-2">✏️</button>
                      <button onClick={() => removeProduto(p.id)} className="btn-ghost text-xs py-1 px-2 hover:text-red-500">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
