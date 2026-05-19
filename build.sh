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
npx prisma migrate deploy

echo "✅ Build concluído!"
