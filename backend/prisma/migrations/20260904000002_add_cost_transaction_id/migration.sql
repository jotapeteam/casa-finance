-- Add transactionId to ClientCost
ALTER TABLE "ClientCost" ADD COLUMN IF NOT EXISTS "transactionId" INTEGER;

-- Add FK constraint only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClientCost_transactionId_fkey'
  ) THEN
    ALTER TABLE "ClientCost"
      ADD CONSTRAINT "ClientCost_transactionId_fkey"
      FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
