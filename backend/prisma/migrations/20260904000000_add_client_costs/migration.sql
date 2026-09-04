-- CreateTable
CREATE TABLE "ClientCost" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Outros',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientCost_clientId_idx" ON "ClientCost"("clientId");

-- AddForeignKey
ALTER TABLE "ClientCost" ADD CONSTRAINT "ClientCost_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
