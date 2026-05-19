import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const COLORS = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#06b6d4','#e11d48','#64748b'];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function CategoryPieChart({ byCategory }) {
  const data = Object.entries(byCategory || {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  if (!data.length) {
    return (
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Gastos por Categoria</h2>
        <div className="flex items-center justify-center h-52 text-gray-400 text-sm">Nenhum gasto no período</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Gastos por Categoria</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyBarChart({ evolution }) {
  if (!evolution?.length) return null;

  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Evolução Mensal (6 meses)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={evolution} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
