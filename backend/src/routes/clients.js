const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { format, addMonths } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/clients
router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { payments: { orderBy: { dueDate: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    res.json(clients);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/clients/forecast
router.get('/forecast', async (req, res) => {
  try {
    const { months = 4 } = req.query;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = addMonths(now, Number(months));

    const payments = await prisma.clientPayment.findMany({
      where: {
        paid: false,
        dueDate: { gte: now, lte: future },
        client: { status: 'active' },
      },
      include: { client: true },
      orderBy: { dueDate: 'asc' },
    });

    const grouped = {};
    payments.forEach(p => {
      const key = format(new Date(p.dueDate), 'yyyy-MM');
      if (!grouped[key]) {
        grouped[key] = {
          key,
          label: format(new Date(p.dueDate), 'MMMM yyyy', { locale: ptBR }),
          total: 0,
          payments: [],
        };
      }
      grouped[key].payments.push(p);
      grouped[key].total += p.amount;
    });

    res.json(Object.values(grouped).sort((a, b) => a.key.localeCompare(b.key)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients
router.post('/', async (req, res) => {
  try {
    const { name, contractType, notes, installments, monthlyAmount, startDate, numberOfMonths } = req.body;

    let paymentsData = [];

    if (contractType === 'monthly') {
      const start = new Date(startDate);
      const total = Number(numberOfMonths) || 12;
      for (let i = 0; i < total; i++) {
        const due = addMonths(start, i);
        paymentsData.push({
          description: format(due, 'MMMM yyyy', { locale: ptBR }),
          amount: Number(monthlyAmount),
          dueDate: due,
        });
      }
    } else {
      paymentsData = installments.map((inst, idx) => ({
        description: inst.description || `Parcela ${idx + 1}/${installments.length}`,
        amount: Number(inst.amount),
        dueDate: new Date(inst.dueDate),
      }));
    }

    const client = await prisma.client.create({
      data: {
        name,
        contractType,
        notes: notes || null,
        payments: { create: paymentsData },
      },
      include: { payments: { orderBy: { dueDate: 'asc' } } },
    });

    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, status, notes } = req.body;
    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { name, status, notes: notes || null },
      include: { payments: { orderBy: { dueDate: 'asc' } } },
    });
    res.json(client);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/clients/:id/payments/:paymentId - editar parcela
router.put('/:id/payments/:paymentId', async (req, res) => {
  try {
    const { amount, dueDate, description } = req.body;
    const payment = await prisma.clientPayment.update({
      where: { id: Number(req.params.paymentId) },
      data: { amount: Number(amount), dueDate: new Date(dueDate), description },
    });
    res.json(payment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients/:id/payments/:paymentId/confirm - confirmar recebimento
router.post('/:id/payments/:paymentId/confirm', async (req, res) => {
  try {
    const { paidAt } = req.body || {};
    const paidDate = paidAt ? new Date(paidAt) : new Date();

    const payment = await prisma.clientPayment.update({
      where: { id: Number(req.params.paymentId) },
      data: { paid: true, paidAt: paidDate },
      include: { client: true },
    });

    await prisma.transaction.create({
      data: {
        description: `${payment.client.name} — ${payment.description}`,
        amount: payment.amount,
        category: '💰 Receita de Clientes',
        person: 'Creatorizando',
        type: 'receita',
        context: 'agencia',
        source: 'web',
        date: paidDate,
      },
    });

    res.json(payment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients/:id/payments/:paymentId/unconfirm - desfazer confirmação
router.post('/:id/payments/:paymentId/unconfirm', async (req, res) => {
  try {
    const payment = await prisma.clientPayment.update({
      where: { id: Number(req.params.paymentId) },
      data: { paid: false, paidAt: null },
    });
    res.json(payment);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/clients/:id/payments - adicionar mais parcelas
router.post('/:id/payments', async (req, res) => {
  try {
    const { installments } = req.body;
    const payments = await Promise.all(
      installments.map(inst =>
        prisma.clientPayment.create({
          data: {
            clientId: Number(req.params.id),
            description: inst.description,
            amount: Number(inst.amount),
            dueDate: new Date(inst.dueDate),
          },
        })
      )
    );
    res.json(payments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
