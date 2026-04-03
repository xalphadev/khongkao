-- AlterTable: add customerName to Transaction
ALTER TABLE "Transaction" ADD COLUMN "customerName" TEXT;

-- CreateTable: HeldBill
CREATE TABLE IF NOT EXISTS "HeldBill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT,
    "items" TEXT NOT NULL,
    "heldBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
