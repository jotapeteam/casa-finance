require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const transactionsRouter = require('./src/routes/transactions');
const summaryRouter = require('./src/routes/summary');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/summary', summaryRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function main() {
  await prisma.$connect();
  console.log('✅ Banco de dados conectado');

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });

  // Inicia bot do Telegram se o token estiver configurado
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const { startBot } = require('./src/bot/telegramBot');
    startBot();
    console.log('🤖 Bot do Telegram iniciado');
  } else {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN não configurado — bot não iniciado');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
