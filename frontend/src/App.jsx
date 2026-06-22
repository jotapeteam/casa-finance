import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import GastosFixos from './pages/GastosFixos.jsx';
import AgenciaDashboard from './pages/AgenciaDashboard.jsx';
import AgenciaClientes from './pages/AgenciaClientes.jsx';
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
    label: '💼 Empresa',
    color: 'blue',
    tabs: [
      { id: 'empresa', label: 'Dashboard' },
      { id: 'fixos-empresa', label: 'Gastos Fixos' },
    ],
  },
  {
    id: 'agencia',
    label: '🎨 Criativamente',
    color: 'purple',
    tabs: [
      { id: 'agencia', label: 'Dashboard' },
      { id: 'agencia-clientes', label: 'Clientes' },
      { id: 'agencia-fixos', label: 'Gastos Fixos' },
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
      <header className={`border-b border-gray-200 px-6 py-4 flex items-center justify-between transition-colors ${isAgencia ? 'bg-purple-700' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isAgencia ? '🎨' : '🏠'}</span>
          <div>
            <h1 className={`text-xl font-bold ${isAgencia ? 'text-white' : 'text-gray-900'}`}>
              {isAgencia ? 'Criativamente' : 'Casa Finance'}
            </h1>
            <p className={`text-xs ${isAgencia ? 'text-purple-200' : 'text-gray-500'}`}>
              {isAgencia ? 'Agência de criadores de conteúdo' : 'Gestão financeira familiar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm ${isAgencia ? 'text-purple-200' : 'text-gray-500'}`}>
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            {isAgencia ? 'Criativamente' : 'JOTAPE & Carol'}
          </div>
          <button onClick={handleLogout} className={`text-xs transition-colors ${isAgencia ? 'text-purple-300 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
            Sair
          </button>
        </div>
      </header>

      {/* Grupos de abas */}
      <div className={`border-b border-gray-200 px-6 ${isAgencia ? 'bg-purple-600' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Seletor de grupo */}
          <div className={`flex gap-1 pt-2 ${isAgencia ? 'border-b border-purple-500' : 'border-b border-gray-100'}`}>
            {TAB_GROUPS.map(group => {
              const isActiveGroup = activeGroup?.id === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.tabs[0].id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                    isActiveGroup
                      ? group.id === 'agencia'
                        ? 'bg-white text-purple-700'
                        : 'bg-blue-600 text-white'
                      : isAgencia
                        ? 'text-purple-200 hover:text-white'
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
                      ? 'border-white text-white'
                      : 'border-blue-600 text-blue-600'
                    : isAgencia
                      ? 'border-transparent text-purple-200 hover:text-white'
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
        {activeTab === 'agencia' && <AgenciaDashboard />}
        {activeTab === 'agencia-clientes' && <AgenciaClientes />}
        {activeTab === 'agencia-fixos' && <GastosFixos context="agencia" />}
      </main>
    </div>
  );
}
