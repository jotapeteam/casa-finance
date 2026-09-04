-- Add transactionId to ClientCost for reliable dashboard link
ALTER TABLE "ClientCost" ADD COLUMN IF NOT EXISTS "transactionId" INTEGER;

ALTER TABLE "ClientCost"
  ADD CONSTRAINT "ClientCost_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  NOT VALID;
