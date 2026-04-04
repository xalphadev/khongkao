-- CreateTable PriceGroup
CREATE TABLE "PriceGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable PriceGroupItem
CREATE TABLE "PriceGroupItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "priceGroupId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    CONSTRAINT "PriceGroupItem_priceGroupId_fkey" FOREIGN KEY ("priceGroupId") REFERENCES "PriceGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PriceGroupItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex unique
CREATE UNIQUE INDEX "PriceGroupItem_priceGroupId_productId_key" ON "PriceGroupItem"("priceGroupId", "productId");

-- CreateTable CustomerProductPrice
CREATE TABLE "CustomerProductPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    CONSTRAINT "CustomerProductPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex unique
CREATE UNIQUE INDEX "CustomerProductPrice_customerId_productId_key" ON "CustomerProductPrice"("customerId", "productId");

-- AlterTable Customer: add priceGroupId
ALTER TABLE "Customer" ADD COLUMN "priceGroupId" TEXT REFERENCES "PriceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
