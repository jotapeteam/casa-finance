#!/bin/bash
set -e

echo "📦 Instalando dependências do backend..."
cd backend
npm install

echo "⚛️  Instalando e compilando o frontend..."
cd ../frontend
npm install
npm run build

echo "🗄️  Gerando Prisma client e rodando migrations..."
cd ../backend
npx prisma generate

# Retry até 3x por causa do cold start do Neon (free tier)
for i in 1 2 3; do
  npx prisma migrate deploy && break
  echo "⚠️  Migration falhou (tentativa $i/3), aguardando 20s para DB acordar..."
  sleep 20
done

echo "✅ Build concluído!"
