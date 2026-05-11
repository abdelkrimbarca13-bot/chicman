-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Perfume" (
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Perfume" ("alertThresholdMl", "brand", "createdAt", "currentQuantityMl", "id", "initialQuantityMl", "name", "salePriceMl", "totalCapacityMl", "totalPurchasePrice", "unitCostMl", "updatedAt") SELECT "alertThresholdMl", "brand", "createdAt", "currentQuantityMl", "id", "initialQuantityMl", "name", "salePriceMl", "totalCapacityMl", "totalPurchasePrice", "unitCostMl", "updatedAt" FROM "Perfume";
DROP TABLE "Perfume";
ALTER TABLE "new_Perfume" RENAME TO "Perfume";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
