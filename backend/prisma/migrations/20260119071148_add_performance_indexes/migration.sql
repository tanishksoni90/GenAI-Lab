-- CreateTable
CREATE TABLE "ComparisonSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT,
    "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ComparisonSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComparisonExchange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comparisonSessionId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComparisonExchange_comparisonSessionId_fkey" FOREIGN KEY ("comparisonSessionId") REFERENCES "ComparisonSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComparisonResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comparisonExchangeId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "responseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComparisonResponse_comparisonExchangeId_fkey" FOREIGN KEY ("comparisonExchangeId") REFERENCES "ComparisonExchange" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "score" REAL,
    "feedback" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "createdAt", "feedback", "id", "role", "score", "sessionId", "tokens") SELECT "content", "createdAt", "feedback", "id", "role", "score", "sessionId", "tokens" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_sessionId_idx" ON "Message"("sessionId");
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "agentId" TEXT,
    "title" TEXT,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "avgScore" REAL NOT NULL DEFAULT 0,
    "promptCount" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalCost" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("agentId", "avgScore", "createdAt", "id", "isActive", "modelId", "promptCount", "title", "tokensUsed", "totalScore", "updatedAt", "userId") SELECT "agentId", "avgScore", "createdAt", "id", "isActive", "modelId", "promptCount", "title", "tokensUsed", "totalScore", "updatedAt", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_modelId_idx" ON "Session"("modelId");
CREATE INDEX "Session_agentId_idx" ON "Session"("agentId");
CREATE INDEX "Session_createdAt_idx" ON "Session"("createdAt");
CREATE INDEX "Session_updatedAt_idx" ON "Session"("updatedAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "registrationId" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_User" ("batchId", "budgetLimit", "budgetUsed", "courseId", "createdAt", "email", "id", "isActive", "isVerified", "lastLoginAt", "name", "password", "registrationId", "role", "tokenQuota", "tokenUsed", "updatedAt") SELECT "batchId", "budgetLimit", "budgetUsed", "courseId", "createdAt", "email", "id", "isActive", "isVerified", "lastLoginAt", "name", "password", "registrationId", "role", "tokenQuota", "tokenUsed", "updatedAt" FROM "User";
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

-- CreateIndex
CREATE INDEX "ComparisonSession_userId_idx" ON "ComparisonSession"("userId");

-- CreateIndex
CREATE INDEX "ComparisonSession_category_idx" ON "ComparisonSession"("category");

-- CreateIndex
CREATE INDEX "ComparisonExchange_comparisonSessionId_idx" ON "ComparisonExchange"("comparisonSessionId");

-- CreateIndex
CREATE INDEX "ComparisonResponse_comparisonExchangeId_idx" ON "ComparisonResponse"("comparisonExchangeId");

-- CreateIndex
CREATE INDEX "ComparisonResponse_modelId_idx" ON "ComparisonResponse"("modelId");

-- CreateIndex
CREATE INDEX "Agent_createdAt_idx" ON "Agent"("createdAt");

-- CreateIndex
CREATE INDEX "Artifact_createdAt_idx" ON "Artifact"("createdAt");
