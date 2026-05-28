const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { createTransaction } = require('../services/transactionService');

const prisma = new PrismaClient();

// GET /api/transactions — lista com filtros
router.get('/', async (req, res) => {
  try {
    const { month, year, category, person, type, context, page = 1, limit = 50 } = req.query;

    const where = {};

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      where.date = { gte: start, lt: end };
    }

    if (category) where.category = { contains: category };
    if (person) where.person = person;
    if (type) where.type = type;
    if (context) where.context = context;

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ transactions, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST /api/transactions — cria nova transação
router.post('/', async (req, res) => {
  try {
    const { amount, description, type, person, date, context } = req.body;

    if (!amount || !description || !type || !person) {
      return res.status(400).json({ error: 'Campos obrigatórios: amount, description, type, person' });
    }

    const tx = await createTransaction({ amount: Number(amount), description, type, person, date, context: context || 'casa', source: 'web' });
    res.status(201).json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// PUT /api/transactions/:id — edita transação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category, type, person, date } = req.body;

    const tx = await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(description && { description }),
        ...(category && { category }),
        ...(type && { type }),
        ...(person && { person }),
        ...(date && { date: new Date(date) }),
      },
    });

    res.json(tx);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao editar transação' });
  }
});

// DELETE /api/transactions/:id — remove transação
router.delete('/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

module.exports = router;
