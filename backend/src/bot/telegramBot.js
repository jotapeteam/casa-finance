const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const https = require('https');
const OpenAI = require('openai');
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

const {
  processMessageAndCreate,
  getMonthSummary,
  getTodayTransactions,
  isAuthorized,
  getPersonByTelegramId,
  createTransaction,
  prisma,
} = require('../services/transactionService');

const { detectCategory } = require('../services/categoryService');

let bot;

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

async function transcribeAudio(fileBuffer, filename) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { toFile } = require('openai');

  const file = await toFile(fileBuffer, filename, { type: 'audio/ogg' });
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pt',
  });
  return transcription.text;
}

async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(url, (res) => {
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function buildSummaryMessage(summary, label) {
  const cats = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `  ${cat}: ${formatCurrency(val)}`)
    .join('\n');

  return `📊 *${label}*\n\n` +
    `💚 Receitas: ${formatCurrency(summary.receitas)}\n` +
    `🔴 Gastos: ${formatCurrency(summary.gastos)}\n` +
    `💰 Saldo: ${formatCurrency(summary.saldo)}\n\n` +
    `*Por categoria:*\n${cats || '  Nenhum gasto registrado'}`;
}

function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    if (!isAuthorized(msg.from.id)) return;
    const name = getPersonByTelegramId(msg.from.id);
    bot.sendMessage(msg.chat.id,
      `👋 Olá, *${name}*! Bem-vindo ao Casa Finance!\n\n` +
      `📝 *Como lançar gastos:*\n` +
      `• "200 supermercado"\n` +
      `• "gastei 80 de gasolina"\n` +
      `• "carol pagou 350 no mercado"\n` +
      `• "recebi 5000" (lança como receita)\n` +
      `• Envie um 🎤 áudio descrevendo o gasto\n\n` +
      `📋 *Comandos:*\n` +
      `/resumo — resumo do mês atual\n` +
      `/hoje — gastos de hoje\n` +
      `/saldo — receitas - gastos do mês\n` +
      `/categorias — breakdown por categoria\n` +
      `/relatorio — relatório completo do mês`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/resumo/, async (msg) => {
    if (!isAuthorized(msg.from.id)) return;
    const now = new Date();
    const summary = await getMonthSummary(now.getFullYear(), now.getMonth() + 1);
    const label = format(now, 'MMMM yyyy', { locale: ptBR });
    bot.sendMessage(msg.chat.id, buildSummaryMessage(summary, `Resumo de ${label}`), { parse_mode: 'Markdown' });
  });

  bot.onText(/\/saldo/, async (msg) => {
    if (!isAuthorized(msg.from.id)) return;
    const now = new Date();
    const summary = await getMonthSummary(now.getFullYear(), now.getMonth() + 1);
    bot.sendMessage(msg.chat.id,
      `💰 *Saldo do mês:* ${formatCurrency(summary.saldo)}\n` +
      `💚 Receitas: ${formatCurrency(summary.receitas)}\n` +
      `🔴 Gastos: ${formatCurrency(summary.gastos)}`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.onText(/\/hoje/, async (msg) => {
    if (!isAuthorized(msg.from.id)) return;
    const txs = await getTodayTransactions();
    if (!txs.length) {
      bot.sendMessage(msg.chat.id, '📭 Nenhuma transação registrada hoje.');
      return;
    }
    const lines = txs.map(t =>
      `${t.type === 'gasto' ? '🔴' : '💚'} ${formatCurrency(t.amount)} — ${t.description} (${t.person})`
    ).join('\n');
    const total = txs.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
    bot.sendMessage(msg.chat.id, `📅 *Hoje*\n\n${lines}\n\n💸 Total gasto: ${formatCurrency(total)}`, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/categorias/, async (msg) => {
    if (!isAuthorized(msg.from.id)) return;
    const now = new Date();
    const summary = await getMonthSummary(now.getFullYear(), now.getMonth() + 1);
    const label = format(now, 'MMMM yyyy', { locale: ptBR });
    const cats = Object.entries(summary.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => `${cat}: *${formatCurrency(val)}*`)
      .join('\n');
    bot.sendMessage(msg.chat.id, `📊 *Categorias — ${label}*\n\n${cats || 'Nenhum gasto registrado'}`, { parse_mode: 'Markdown' });
  });

  bot.onText(/\/relatorio/, async (msg) => {
    if (!isAuthorized(msg.from.id)) return;
    const now = new Date();
    const cur = await getMonthSummary(now.getFullYear(), now.getMonth() + 1);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prev = await getMonthSummary(prevDate.getFullYear(), prevDate.getMonth() + 1);

    const label = format(now, 'MMMM yyyy', { locale: ptBR });
    const prevLabel = format(prevDate, 'MMMM yyyy', { locale: ptBR });
    const diff = cur.gastos - prev.gastos;
    const diffStr = diff >= 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff);
    const diffEmoji = diff >= 0 ? '📈' : '📉';

    const cats = Object.entries(cur.byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => `  ${cat}: ${formatCurrency(val)}`)
      .join('\n');

    const persons = Object.entries(cur.byPerson)
      .map(([p, v]) => `  ${p}: gastos ${formatCurrency(v.gastos)}, receitas ${formatCurrency(v.receitas)}`)
      .join('\n');

    const report =
      `📋 *Relatório — ${label}*\n\n` +
      `💚 Receitas: ${formatCurrency(cur.receitas)}\n` +
      `🔴 Gastos: ${formatCurrency(cur.gastos)}\n` +
      `💰 Saldo: ${formatCurrency(cur.saldo)}\n\n` +
      `${diffEmoji} *Comparativo com ${prevLabel}:* ${diffStr}\n\n` +
      `*Por categoria:*\n${cats || '  Nenhum gasto'}\n\n` +
      `*Por pessoa:*\n${persons || '  Nenhum registro'}`;

    bot.sendMessage(msg.chat.id, report, { parse_mode: 'Markdown' });
  });

  // Mensagens de texto normais (lançamento de gasto)
  bot.on('message', async (msg) => {
    if (!isAuthorized(msg.from.id)) {
      bot.sendMessage(msg.chat.id, '❌ Acesso não autorizado.');
      return;
    }

    // Ignora comandos e áudios (tratados separadamente)
    if (msg.text && msg.text.startsWith('/')) return;
    if (msg.voice || msg.audio) return;

    if (msg.text) {
      try {
        const tx = await processMessageAndCreate(msg.text, msg.from.id);
        if (!tx) {
          bot.sendMessage(msg.chat.id,
            '🤔 Não consegui entender o valor. Tente:\n"200 supermercado" ou "gastei 80 de gasolina"'
          );
          return;
        }
        bot.sendMessage(msg.chat.id,
          `✅ *Lançamento registrado!*\n\n` +
          `${tx.type === 'gasto' ? '🔴' : '💚'} ${tx.type === 'gasto' ? 'Gasto' : 'Receita'}: *${formatCurrency(tx.amount)}*\n` +
          `📝 ${tx.description}\n` +
          `🏷️ ${tx.category}\n` +
          `👤 ${tx.person}\n` +
          `📅 ${formatDate(tx.date)}`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        console.error('Erro ao processar mensagem:', e);
        bot.sendMessage(msg.chat.id, '❌ Erro ao registrar. Tente novamente.');
      }
    }
  });

  // Mensagens de áudio (transcrição com Whisper)
  bot.on('voice', async (msg) => {
    if (!isAuthorized(msg.from.id)) return;

    const waitMsg = await bot.sendMessage(msg.chat.id, '🎤 Transcrevendo áudio...');

    try {
      const fileLink = await bot.getFileLink(msg.voice.file_id);
      const audioBuffer = await downloadFile(fileLink);
      const text = await transcribeAudio(audioBuffer, 'audio.ogg');

      await bot.editMessageText(`🎤 Transcrição: _"${text}"_\n\n⏳ Processando...`, {
        chat_id: msg.chat.id,
        message_id: waitMsg.message_id,
        parse_mode: 'Markdown',
      });

      const tx = await processMessageAndCreate(text, msg.from.id);
      if (!tx) {
        bot.editMessageText(
          `🎤 Transcrição: _"${text}"_\n\n🤔 Não encontrei um valor válido no áudio.`,
          { chat_id: msg.chat.id, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
        );
        return;
      }

      bot.editMessageText(
        `🎤 _"${text}"_\n\n` +
        `✅ *Lançamento registrado!*\n\n` +
        `${tx.type === 'gasto' ? '🔴' : '💚'} ${tx.type === 'gasto' ? 'Gasto' : 'Receita'}: *${formatCurrency(tx.amount)}*\n` +
        `📝 ${tx.description}\n` +
        `🏷️ ${tx.category}\n` +
        `👤 ${tx.person}\n` +
        `📅 ${formatDate(tx.date)}`,
        { chat_id: msg.chat.id, message_id: waitMsg.message_id, parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.error('Erro ao processar áudio:', e);
      bot.editMessageText('❌ Erro ao transcrever o áudio. Verifique se a OPENAI_API_KEY está configurada.', {
        chat_id: msg.chat.id,
        message_id: waitMsg.message_id,
      });
    }
  });

  bot.on('polling_error', (err) => {
    console.error('Erro no polling do bot:', err.message);
  });

  return bot;
}

module.exports = { startBot };
