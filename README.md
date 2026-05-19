# 🏠 Casa Finance

Plataforma de gestão financeira familiar para JOTAPE e Carol, com dashboard web e bot do Telegram para lançamentos em tempo real via texto ou áudio.

---

## 🚀 Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- npm

### 2. Clone e instale dependências
```bash
cd casa-finance
npm run install:all
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example backend/.env
# Edite backend/.env com suas chaves
```

### 4. Configure o banco de dados
```bash
npm run db:setup
```

### 5. Rode o projeto
```bash
# Terminal 1 — Backend + Bot
npm run dev:backend

# Terminal 2 — Frontend
npm run dev:frontend
```

Acesse: http://localhost:5173

---

## 🤖 Configurando o Bot do Telegram

### Passo 1 — Crie o bot no BotFather
1. Abra o Telegram e pesquise por **@BotFather**
2. Envie `/newbot`
3. Escolha um nome (ex: `Casa Finance Bot`)
4. Escolha um username (ex: `casafinance_bot`)
5. Copie o **token** gerado e cole em `TELEGRAM_BOT_TOKEN` no `.env`

### Passo 2 — Descubra seus IDs do Telegram
1. Pesquise no Telegram por **@userinfobot**
2. Envie qualquer mensagem
3. Ele responde com seu **ID numérico**
4. Faça isso com JOTAPE e Carol, e adicione os IDs em `TELEGRAM_AUTHORIZED_USER_IDS`

### Passo 3 — Configure o `.env`
```env
TELEGRAM_BOT_TOKEN=1234567890:AAFxxx...
TELEGRAM_AUTHORIZED_USER_IDS=111111111,222222222
TELEGRAM_AUTHORIZED_USER_NAMES=JOTAPE,Carol
```

---

## 📱 Como usar o Bot

### Lançar gastos (texto)
Envie mensagens informais — o bot entende linguagem natural:
```
200 supermercado
gastei 80 reais de gasolina
carol pagou 350 no mercado
recebi 5000
pizza 45
```

### Lançar gastos (áudio)
Grave um áudio no Telegram descrevendo o gasto. O bot transcreve com Whisper (OpenAI) e processa automaticamente.

### Comandos disponíveis
| Comando | Descrição |
|---------|-----------|
| `/start` | Boas-vindas e ajuda |
| `/resumo` | Resumo do mês atual |
| `/hoje` | Gastos do dia |
| `/saldo` | Receitas − gastos do mês |
| `/categorias` | Breakdown por categoria |
| `/relatorio` | Relatório completo com comparativo |

---

## 🔑 Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `TELEGRAM_BOT_TOKEN` | Sim (bot) | Token do @BotFather |
| `TELEGRAM_AUTHORIZED_USER_IDS` | Sim (bot) | IDs numéricos separados por vírgula |
| `TELEGRAM_AUTHORIZED_USER_NAMES` | Não | Nomes correspondentes aos IDs |
| `OPENAI_API_KEY` | Para áudio | Transcrição com Whisper |
| `ANTHROPIC_API_KEY` | Recomendado | Classificação automática de categorias |
| `DATABASE_URL` | Sim | `file:./dev.db` para SQLite local |
| `PORT` | Não | Padrão: 3001 |

---

## 📁 Estrutura do Projeto

```
casa-finance/
├── backend/
│   ├── src/
│   │   ├── bot/          # Bot do Telegram
│   │   ├── routes/       # API REST (transactions, summary)
│   │   └── services/     # Regras de negócio e categorização
│   ├── prisma/
│   │   └── schema.prisma # Schema do banco SQLite
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/   # Modal, Tabela, Gráficos
│       ├── pages/        # Dashboard
│       └── App.jsx
├── .env.example
└── README.md
```

---

## ☁️ Deploy

### Backend (Railway)
1. Crie uma conta em [railway.app](https://railway.app)
2. Conecte o repositório GitHub
3. Configure as variáveis de ambiente no painel
4. O Railway detecta Node.js automaticamente — use `npm run start` como comando de start
5. Mude `DATABASE_URL` para um volume persistente ou PostgreSQL Railway

### Frontend (Vercel)
1. Crie conta em [vercel.com](https://vercel.com)
2. Importe o repositório e selecione a pasta `frontend` como root
3. Configure a variável `VITE_API_URL` com a URL do backend no Railway
4. Deploy automático a cada push

### Backend (Render — alternativa gratuita)
1. Crie conta em [render.com](https://render.com)
2. New Web Service → conecte o GitHub
3. Root Directory: `backend`
4. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
5. Start Command: `node server.js`

---

## 🏷️ Categorias

| Emoji | Categoria |
|-------|-----------|
| 🛒 | Supermercado |
| ⛽ | Gasolina / Combustível |
| 💊 | Farmácia |
| 🍽️ | Restaurante / Delivery |
| 🏠 | Casa |
| 💡 | Contas |
| 👕 | Vestuário |
| 🏥 | Saúde |
| 🎓 | Educação |
| 🎬 | Lazer / Entretenimento |
| 💰 | Receita JOTAPE / Carol |
| 📦 | Outros |

---

## 🛡️ Segurança

- O bot só responde a usuários autorizados via `TELEGRAM_AUTHORIZED_USER_IDS`
- O `.env` nunca deve ser commitado (está no `.gitignore`)
- O banco SQLite fica local — faça backup do arquivo `.db` regularmente
