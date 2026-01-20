/*
  Warnings:

  - You are about to drop the column `agentId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `Agent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AgentGuardrail` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_modelId_fkey";

-- DropForeignKey
ALTER TABLE "Agent" DROP CONSTRAINT "Agent_userId_fkey";

-- DropForeignKey
ALTER TABLE "AgentGuardrail" DROP CONSTRAINT "AgentGuardrail_agentId_fkey";

-- DropForeignKey
ALTER TABLE "AgentGuardrail" DROP CONSTRAINT "AgentGuardrail_guardrailId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_agentId_fkey";

-- DropIndex
DROP INDEX "Session_agentId_idx";

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "agentId",
ADD COLUMN     "chatbotId" TEXT;

-- DropTable
DROP TABLE "Agent";

-- DropTable
DROP TABLE "AgentGuardrail";

-- CreateTable
CREATE TABLE "Chatbot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "behaviorPrompt" TEXT,
    "strictMode" BOOLEAN NOT NULL DEFAULT false,
    "knowledgeBase" TEXT,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chatbot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotGuardrail" (
    "id" TEXT NOT NULL,
    "chatbotId" TEXT NOT NULL,
    "guardrailId" TEXT NOT NULL,

    CONSTRAINT "ChatbotGuardrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Chatbot_userId_idx" ON "Chatbot"("userId");

-- CreateIndex
CREATE INDEX "Chatbot_modelId_idx" ON "Chatbot"("modelId");

-- CreateIndex
CREATE INDEX "Chatbot_createdAt_idx" ON "Chatbot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatbotGuardrail_chatbotId_guardrailId_key" ON "ChatbotGuardrail"("chatbotId", "guardrailId");

-- CreateIndex
CREATE INDEX "Session_chatbotId_idx" ON "Session"("chatbotId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chatbot" ADD CONSTRAINT "Chatbot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chatbot" ADD CONSTRAINT "Chatbot_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "AIModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotGuardrail" ADD CONSTRAINT "ChatbotGuardrail_chatbotId_fkey" FOREIGN KEY ("chatbotId") REFERENCES "Chatbot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatbotGuardrail" ADD CONSTRAINT "ChatbotGuardrail_guardrailId_fkey" FOREIGN KEY ("guardrailId") REFERENCES "Guardrail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
