const { PrismaClient } = require('@prisma/client');
const { detectCategory } = require('./categoryService');

const prisma = new PrismaClient();

const AUTHORIZED_USERS = (() => {
  const ids = (process.env.TELEGRAM_AUTHORIZED_USER_IDS || '').split(',').filter(Boolean);
  const names = (process.env.TELEGRAM_AUTHORIZED_USER_NAMES || 'JOTAPE,Carol').split(',').filter(Boolean);
  const map = {};
  ids.forEach((id, i) => { map[id.trim()] = names[i]?.trim() || 'JOTAPE'; });
  return map;
})();

function getPersonByTelegramId(telegramId) {
  return AUTHORIZED_USERS[String(telegramId)] || null;
}

function isAuthorized(telegramId) {
  return !!getPersonByTelegramId(telegramId);
}

// Interpreta mensagem informal e extrai valor, descrição, tipo e pessoa
function parseMessage(text, defaultPerson) {
  const lower = text.toLowerCase();

  let type = 'gasto';
  if (/receb[ei]|salário|salario|pagamento recebi|renda|faturei/.test(lower)) {
    type = 'receita';
  }

  let person = defaultPerson;
  if (/carol\s+pag|pag.*carol/.test(lower)) person = 'Carol';
  else if (/jotape\s+pag|pag.*jotape/.test(lower)) person = 'JOTAPE';

  // Extrai valor — suporta "150", "R$ 150", "150,50", "150.50", "150 reais"
  const valueMatch = text.match(/R?\$?\s*([\d]+(?:[.,]\d{1,2})?)/);
  if (!valueMatch) return null;

  const amount = parseFloat(valueMatch[1].replace(',', '.'));
  if (isNaN(amount) || amount <= 0) return null;

  // Remove o valor e palavras de ruído para extrair descrição
  let description = text
    .replace(valueMatch[0], '')
    .replace(/\b(gastei|gasto|paguei|pagou|comprei|recebi|reais|real|r\$|de|no|na|do|da|um|uma|uns|umas|para|pelo|pela|pelos|pelas)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!description) description = 'Sem descrição';

  return { amount, description, type, person };
}

async function createTransaction({ amount, description, type, person, source = 'web', date }) {
  const category = await detectCategory(description, type, person);

  return prisma.transaction.create({
    data: {
      amount,
      description,
      category: category.label,
      person,
      type,
      source,
      date: date ? new Date(date) : new Date(),
    },
  });
}

async function processMessageAndCreate(text, telegramId) {
  const person = getPersonByTelegramId(telegramId);
  const parsed = parseMessage(text, person);
  if (!parsed) return null;

  return createTransaction({ ...parsed, source: 'telegram' });
}

async function getMonthSummary(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const transactions = await prisma.transaction.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: { date: 'desc' },
  });

  const receitas = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const gastos = transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);

  const byCategory = {};
  transactions.filter(t => t.type === 'gasto').forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const byPerson = {};
  transactions.forEach(t => {
    if (!byPerson[t.person]) byPerson[t.person] = { gastos: 0, receitas: 0 };
    if (t.type === 'gasto') byPerson[t.person].gastos += t.amount;
    else byPerson[t.person].receitas += t.amount;
  });

  return { receitas, gastos, saldo: receitas - gastos, byCategory, byPerson, transactions };
}

async function getTodayTransactions() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return prisma.transaction.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: 'desc' },
  });
}

module.exports = {
  createTransaction,
  processMessageAndCreate,
  getMonthSummary,
  getTodayTransactions,
  isAuthorized,
  getPersonByTelegramId,
  prisma,
};
