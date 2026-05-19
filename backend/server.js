require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const transactionsRouter = require('./src/routes/transactions');
const summaryRouter = require('./src/routes/summary');
const authRouter = require('./src/routes/auth');
const authMiddleware = require('./src/middleware/auth');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/transactions', authMiddleware, transactionsRouter);
app.use('/api/summary', authMiddleware, summaryRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve o frontend compilado
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
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
