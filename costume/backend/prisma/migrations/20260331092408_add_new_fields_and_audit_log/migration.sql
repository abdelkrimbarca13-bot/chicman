-- AlterTable
ALTER TABLE "Item" ADD COLUMN "ensembleId" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "idNumber" TEXT NOT NULL,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Customer" ("address", "createdAt", "email", "firstName", "id", "idNumber", "lastName", "phone") SELECT "address", "createdAt", "email", "firstName", "id", "idNumber", "lastName", "phone" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_idNumber_key" ON "Customer"("idNumber");
CREATE TABLE "new_Rental" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturn" DATETIME NOT NULL,
    "actualReturn" DATETIME,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "depositAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "addedAmount" REAL NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "guaranteeDocument" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rental_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Rental" ("actualReturn", "createdAt", "customerId", "depositAmount", "discount", "expectedReturn", "guaranteeDocument", "id", "isActivated", "paidAmount", "remarks", "startDate", "status", "totalAmount", "updatedAt") SELECT "actualReturn", "createdAt", "customerId", "depositAmount", "discount", "expectedReturn", "guaranteeDocument", "id", "isActivated", "paidAmount", "remarks", "startDate", "status", "totalAmount", "updatedAt" FROM "Rental";
DROP TABLE "Rental";
ALTER TABLE "new_Rental" RENAME TO "Rental";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
