-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SaleItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "itemRef" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemSize" TEXT NOT NULL,
    "itemColor" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "rentalPrice" REAL NOT NULL DEFAULT 0,
    "ensembleId" INTEGER,
    CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SaleItem" ("id", "itemColor", "itemName", "itemRef", "itemSize", "itemType", "price", "saleId") SELECT "id", "itemColor", "itemName", "itemRef", "itemSize", "itemType", "price", "saleId" FROM "SaleItem";
DROP TABLE "SaleItem";
ALTER TABLE "new_SaleItem" RENAME TO "SaleItem";
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
