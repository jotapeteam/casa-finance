const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Lista todos os gastos fixos
router.get('/', async (req, res) => {
  try {
    const context = req.query.context || 'casa';
    const recurring = await prisma.recurringExpense.findMany({
      where: { context },
      orderBy: { dayOfMonth: 'asc' },
    });
    res.json(recurring);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar gastos fixos' });
  }
});

// Previsão do mês — retorna cada gasto fixo com status: confirmado ou pendente
router.get('/preview', async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const context = req.query.context || 'casa';

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const recurring = await prisma.recurringExpense.findMany({
      where: { active: true, context },
      orderBy: { dayOfMonth: 'asc' },
    });

    // Busca transações do mês que vieram de gastos fixos
    const confirmedTxs = await prisma.transaction.findMany({
      where: {
        date: { gte: start, lt: end },
        recurringExpenseId: { not: null },
      },
    });

    const confirmedIds = new Set(confirmedTxs.map(t => t.recurringExpenseId));

    const preview = recurring.map(r => ({
      ...r,
      confirmed: confirmedIds.has(r.id),
      dueDate: new Date(year, month - 1, Math.min(r.dayOfMonth, new Date(year, month, 0).getDate())),
    }));

    const totalPrevisto = preview.reduce((s, r) => s + r.amount, 0);
    const totalConfirmado = preview.filter(r => r.confirmed).reduce((s, r) => s + r.amount, 0);
    const totalPendente = preview.filter(r => !r.confirmed).reduce((s, r) => s + r.amount, 0);

    res.json({ preview, totalPrevisto, totalConfirmado, totalPendente });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao gerar previsão' });
  }
});

// Cria novo gasto fixo
router.post('/', async (req, res) => {
  try {
    const { description, amount, category, person, dayOfMonth, context } = req.body;
    if (!description || !amount || !category || !person || !dayOfMonth) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const r = await prisma.recurringExpense.create({
      data: { description, amount: Number(amount), category, person, dayOfMonth: Number(dayOfMonth), context: context || 'casa' },
    });
    res.status(201).json(r);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar gasto fixo' });
  }
});

// Atualiza gasto fixo
router.put('/:id', async (req, res) => {
  try {
    const { description, amount, category, person, dayOfMonth, active } = req.body;
    const r = await prisma.recurringExpense.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(description && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(category && { category }),
        ...(person && { person }),
        ...(dayOfMonth !== undefined && { dayOfMonth: Number(dayOfMonth) }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao atualizar gasto fixo' });
  }
});

// Deleta gasto fixo
router.delete('/:id', async (req, res) => {
  try {
    await prisma.recurringExpense.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao deletar gasto fixo' });
  }
});

// Confirma gasto fixo — lança como transação real
router.post('/:id/confirm', async (req, res) => {
  try {
    const recurring = await prisma.recurringExpense.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!recurring) return res.status(404).json({ error: 'Gasto fixo não encontrado' });

    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const day = Math.min(recurring.dayOfMonth, new Date(year, month, 0).getDate());

    const tx = await prisma.transaction.create({
      data: {
        amount: recurring.amount,
        description: recurring.description,
        category: recurring.category,
        person: recurring.person,
        type: 'gasto',
        source: 'web',
        context: recurring.context || 'casa',
        date: new Date(year, month - 1, day),
        recurringExpenseId: recurring.id,
      },
    });

    res.status(201).json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao confirmar gasto fixo' });
  }
});

module.exports = router;
