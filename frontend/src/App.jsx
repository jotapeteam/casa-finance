import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import GastosFixos from './pages/GastosFixos.jsx';
import Login from './pages/Login.jsx';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'fixos', label: '📅 Gastos Fixos' },
];

export default function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem('cf_token'));
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!logged) return <Login onLogin={() => setLogged(true)} />;

  function handleLogout() {
    localStorage.removeItem('cf_token');
    setLogged(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Casa Finance</h1>
            <p className="text-xs text-gray-500">Gestão financeira familiar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
            JOTAPE &amp; Carol
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Sair
          </button>
        </div>
      </header>

      {/* Abas */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'fixos' && <GastosFixos />}
      </main>
    </div>
  );
}
