-- Add referenceMonth to ClientCost (IF NOT EXISTS for safety if table was just created)
ALTER TABLE "ClientCost" ADD COLUMN IF NOT EXISTS "referenceMonth" TEXT NOT NULL DEFAULT '';
