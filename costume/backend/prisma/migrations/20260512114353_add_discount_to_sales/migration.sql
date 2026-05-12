-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PerfumeSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "perfumeId" INTEGER NOT NULL,
    "quantityMl" REAL NOT NULL,
    "unitPriceMl" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedBy" TEXT NOT NULL,
    CONSTRAINT "PerfumeSale_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PerfumeSale" ("date", "id", "performedBy", "perfumeId", "profit", "quantityMl", "totalAmount", "totalCost", "unitPriceMl") SELECT "date", "id", "performedBy", "perfumeId", "profit", "quantityMl", "totalAmount", "totalCost", "unitPriceMl" FROM "PerfumeSale";
DROP TABLE "PerfumeSale";
ALTER TABLE "new_PerfumeSale" RENAME TO "PerfumeSale";
CREATE INDEX "PerfumeSale_date_idx" ON "PerfumeSale"("date");
CREATE TABLE "new_ProductSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "performedBy" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductSale_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductSale" ("customerName", "customerPhone", "date", "id", "performedBy", "productId", "profit", "quantity", "totalAmount", "totalCost", "unitPrice") SELECT "customerName", "customerPhone", "date", "id", "performedBy", "productId", "profit", "quantity", "totalAmount", "totalCost", "unitPrice" FROM "ProductSale";
DROP TABLE "ProductSale";
ALTER TABLE "new_ProductSale" RENAME TO "ProductSale";
CREATE INDEX "ProductSale_date_idx" ON "ProductSale"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
