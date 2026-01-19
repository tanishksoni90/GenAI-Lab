-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "registrationId" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "courseId" TEXT,
    "batchId" TEXT,
    "budgetLimit" REAL NOT NULL DEFAULT 18,
    "budgetUsed" REAL NOT NULL DEFAULT 0,
    "tokenQuota" INTEGER NOT NULL DEFAULT 50000,
    "tokenUsed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    CONSTRAINT "User_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("batchId", "budgetLimit", "budgetUsed", "courseId", "createdAt", "email", "id", "isActive", "isVerified", "lastLoginAt", "mustChangePassword", "name", "password", "registrationId", "role", "tokenQuota", "tokenUsed", "updatedAt") SELECT "batchId", "budgetLimit", "budgetUsed", "courseId", "createdAt", "email", "id", "isActive", "isVerified", "lastLoginAt", "mustChangePassword", "name", "password", "registrationId", "role", "tokenQuota", "tokenUsed", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_registrationId_key" ON "User"("registrationId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_registrationId_idx" ON "User"("registrationId");
CREATE INDEX "User_courseId_idx" ON "User"("courseId");
CREATE INDEX "User_batchId_idx" ON "User"("batchId");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
