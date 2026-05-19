import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
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
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          JOTAPE &amp; Carol
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Dashboard />
      </main>
    </div>
  );
}
