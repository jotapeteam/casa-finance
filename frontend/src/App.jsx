import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import GastosFixos from './pages/GastosFixos.jsx';
import AgenciaDashboard from './pages/AgenciaDashboard.jsx';
import AgenciaClientes from './pages/AgenciaClientes.jsx';
import AgenciaPrestadores from './pages/AgenciaPrestadores.jsx';
import AgenciaObrigacoes from './pages/AgenciaObrigacoes.jsx';
import AgenciaColaboradoras from './pages/AgenciaColaboradoras.jsx';
import EmpresaTrafego from './pages/EmpresaTrafego.jsx';
import EmpresaInfoprodutos from './pages/EmpresaInfoprodutos.jsx';
import EmpresaColaboradora from './pages/EmpresaColaboradora.jsx';
import Login from './pages/Login.jsx';

const TAB_GROUPS = [
  {
    id: 'casa',
    label: '🏠 Casa',
    color: 'blue',
    tabs: [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'fixos', label: 'Gastos Fixos' },
    ],
  },
  {
    id: 'empresa',
    label: '📸 Instagram Carol',
    color: 'blue',
    tabs: [
      { id: 'empresa', label: 'Dashboard' },
      { id: 'fixos-empresa', label: 'Gastos Fixos' },
      { id: 'empresa-trafego', label: 'Tráfego' },
      { id: 'empresa-infoprodutos', label: 'Infoprodutos' },
      { id: 'empresa-colaboradora', label: 'Colaboradora' },
    ],
  },
  {
    id: 'agencia',
    label: '🎨 Agência Creatorizando',
    color: 'purple',
    tabs: [
      { id: 'agencia', label: 'Dashboard' },
      { id: 'agencia-clientes', label: 'Clientes' },
      { id: 'agencia-fixos', label: 'Gastos Fixos' },
      { id: 'agencia-prestadores', label: 'Prestadores' },
      { id: 'agencia-colaboradoras', label: 'Colaboradoras' },
      { id: 'agencia-obrigacoes', label: 'Obrigações' },
    ],
  },
];

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem('cf_token'));
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!logged) return <Login onLogin={() => setLogged(true)} />;

  function handleLogout() {
    localStorage.removeItem('cf_token');
    setLogged(false);
  }

  const activeGroup = TAB_GROUPS.find(g => g.tabs.some(t => t.id === activeTab));
  const isAgencia = activeGroup?.id === 'agencia';

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        style={isAgencia ? { background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 60%, #c45825 100%)' } : {}}
        className={`border-b px-6 py-4 flex items-center justify-between transition-all ${isAgencia ? 'border-[#c45825]/30' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          {isAgencia ? (
            <span className="text-2xl font-bold tracking-widest text-white/90 uppercase" style={{ letterSpacing: '0.15em', fontSize: '11px' }}>
              ✦ AGÊNCIA CREATORIZANDO
            </span>
          ) : (
            <>
              <span className="text-2xl">💼</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestão financeira empresarial e familiar</h1>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm ${isAgencia ? 'text-white/60' : 'text-gray-500'}`}>
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            {isAgencia ? 'Creatorizando' : 'JOTAPE & Carol'}
          </div>
          <button onClick={handleLogout} className={`text-xs transition-colors ${isAgencia ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            Sair
          </button>
        </div>
      </header>

      {/* Grupos de abas */}
      <div
        style={isAgencia ? { background: 'linear-gradient(135deg, #0a1628 0%, #152244 100%)' } : {}}
        className={`border-b px-6 ${isAgencia ? 'border-[#c45825]/20' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Seletor de grupo */}
          <div className={`flex gap-1 pt-2 ${isAgencia ? 'border-b border-white/10' : 'border-b border-gray-100'}`}>
            {TAB_GROUPS.map(group => {
              const isActiveGroup = activeGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.tabs[0].id)}
                  style={isActiveGroup && group.id === 'agencia' ? { background: 'linear-gradient(135deg, #c45825, #e07a40)', color: 'white' } : {}}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                    isActiveGroup
                      ? group.id === 'agencia'
                        ? ''
                        : 'bg-blue-600 text-white'
                      : isAgencia
                        ? 'text-white/40 hover:text-white/80'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}>
                  {group.label}
                </button>
              );
            })}
          </div>

          {/* Sub-abas do grupo ativo */}
          <div className="flex gap-1">
            {activeGroup?.tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? isAgencia
                      ? 'border-[#c45825] text-[#e07a40]'
                      : 'border-blue-600 text-blue-600'
                    : isAgencia
                      ? 'border-transparent text-white/50 hover:text-white/80'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard context="casa" />}
        {activeTab === 'fixos' && <GastosFixos context="casa" />}
        {activeTab === 'empresa' && <Dashboard context="empresa" />}
        {activeTab === 'fixos-empresa' && <GastosFixos context="empresa" />}
        {activeTab === 'empresa-trafego' && <EmpresaTrafego />}
        {activeTab === 'empresa-infoprodutos' && <EmpresaInfoprodutos />}
        {activeTab === 'empresa-colaboradora' && <EmpresaColaboradora />}
        {activeTab === 'agencia' && <AgenciaDashboard />}
        {activeTab === 'agencia-clientes' && <AgenciaClientes />}
        {activeTab === 'agencia-fixos' && <GastosFixos context="agencia" />}
        {activeTab === 'agencia-prestadores' && <AgenciaPrestadores />}
        {activeTab === 'agencia-colaboradoras' && <AgenciaColaboradoras />}
        {activeTab === 'agencia-obrigacoes' && <AgenciaObrigacoes />}
      </main>
    </div>
  );
}
