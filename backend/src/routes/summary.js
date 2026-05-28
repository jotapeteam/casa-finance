const express = require('express');
const router = express.Router();
const { getMonthSummary } = require('../services/transactionService');

const router2 = express.Router();

// GET /api/summary?month=5&year=2025&context=casa
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const context = req.query.context || 'casa';

    const summary = await getMonthSummary(year, month, context);
    res.json(summary);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

// GET /api/summary/monthly-evolution?context=casa
router.get('/monthly-evolution', async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    const context = req.query.context || 'casa';

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const summary = await getMonthSummary(d.getFullYear(), d.getMonth() + 1, context);
      months.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas: summary.receitas,
        gastos: summary.gastos,
        saldo: summary.saldo,
      });
    }

    res.json(months);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar evolução mensal' });
  }
});

module.exports = router;
