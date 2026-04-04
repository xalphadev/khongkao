-- CreateTable Customer
CREATE TABLE "Customer" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "name"      TEXT NOT NULL,
    "nickname"  TEXT,
    "phone"     TEXT,
    "address"   TEXT,
    "notes"     TEXT,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Add customerId to Transaction
ALTER TABLE "Transaction" ADD COLUMN "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL;
