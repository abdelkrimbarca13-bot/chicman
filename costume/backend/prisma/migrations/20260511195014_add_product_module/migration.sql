-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "salePrice" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "performedBy" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyCash" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialCash" REAL NOT NULL DEFAULT 0,
    "totalRentals" REAL NOT NULL DEFAULT 0,
    "totalExpenses" REAL NOT NULL DEFAULT 0,
    "totalWithdrawals" REAL NOT NULL DEFAULT 0,
    "finalBalance" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "totalPerfumeSales" REAL NOT NULL DEFAULT 0,
    "totalPerfumeProfit" REAL NOT NULL DEFAULT 0,
    "totalProductSales" REAL NOT NULL DEFAULT 0,
    "totalProductProfit" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DailyCash" ("createdAt", "date", "finalBalance", "id", "initialCash", "status", "totalExpenses", "totalPerfumeProfit", "totalPerfumeSales", "totalRentals", "totalWithdrawals", "updatedAt") SELECT "createdAt", "date", "finalBalance", "id", "initialCash", "status", "totalExpenses", "totalPerfumeProfit", "totalPerfumeSales", "totalRentals", "totalWithdrawals", "updatedAt" FROM "DailyCash";
DROP TABLE "DailyCash";
ALTER TABLE "new_DailyCash" RENAME TO "DailyCash";
CREATE UNIQUE INDEX "DailyCash_date_key" ON "DailyCash"("date");
CREATE INDEX "DailyCash_date_idx" ON "DailyCash"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Product_reference_key" ON "Product"("reference");

-- CreateIndex
CREATE INDEX "Product_reference_idx" ON "Product"("reference");

-- CreateIndex
CREATE INDEX "ProductSale_date_idx" ON "ProductSale"("date");
