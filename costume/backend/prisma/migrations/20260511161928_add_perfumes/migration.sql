-- CreateTable
CREATE TABLE "Perfume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "brand" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalCapacityMl" REAL NOT NULL,
    "initialQuantityMl" REAL NOT NULL,
    "currentQuantityMl" REAL NOT NULL,
    "totalPurchasePrice" REAL NOT NULL,
    "unitCostMl" REAL NOT NULL,
    "salePriceMl" REAL NOT NULL,
    "alertThresholdMl" REAL NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PerfumeSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "perfumeId" INTEGER NOT NULL,
    "quantityMl" REAL NOT NULL,
    "unitPriceMl" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT NOT NULL,
    CONSTRAINT "PerfumeSale_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DailyCash" ("createdAt", "date", "finalBalance", "id", "initialCash", "status", "totalExpenses", "totalRentals", "totalWithdrawals", "updatedAt") SELECT "createdAt", "date", "finalBalance", "id", "initialCash", "status", "totalExpenses", "totalRentals", "totalWithdrawals", "updatedAt" FROM "DailyCash";
DROP TABLE "DailyCash";
ALTER TABLE "new_DailyCash" RENAME TO "DailyCash";
CREATE UNIQUE INDEX "DailyCash_date_key" ON "DailyCash"("date");
CREATE INDEX "DailyCash_date_idx" ON "DailyCash"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PerfumeSale_date_idx" ON "PerfumeSale"("date");
