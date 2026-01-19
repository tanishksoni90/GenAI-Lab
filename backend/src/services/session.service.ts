import { prisma } from '../lib/prisma';
import { NotFoundError, InsufficientTokensError, ForbiddenError } from '../utils/errors';
import * as aiService from './ai.service';
import * as scoringService from './scoring.service';
import { StreamCallback } from './ai.service';
import { calculateModelCostUSD, getModelPricing, pricingUtils } from '../config/pricing';

// Helper to check if hard limit enforcement is enabled
async function isHardLimitEnforced(): Promise<boolean> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
    select: { hardLimitEnforcement: true },
  });
  return settings?.hardLimitEnforcement ?? true; // Default to true if not set
}

// Helper to check token availability
async function checkTokenAvailability(userId: string): Promise<{ available: boolean; tokenQuota: number; tokenUsed: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenQuota: true, tokenUsed: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const hardLimitEnabled = await isHardLimitEnforced();
  const available = !hardLimitEnabled || user.tokenUsed < user.tokenQuota;
  
  return {
    available,
    tokenQuota: user.tokenQuota,
    tokenUsed: user.tokenUsed,
  };
}

// Create a new session
export const createSession = async (
  userId: string,
  modelId: string,
  agentId?: string
) => {
  // Verify model exists
  const model = await aiService.getModelById(modelId);

  // Check user has tokens (with hard limit enforcement)
  const tokenCheck = await checkTokenAvailability(userId);
  if (!tokenCheck.available) {
    throw new InsufficientTokensError();
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      userId,
      modelId,
      agentId,
      title: `${model.name} Session`,
    },
    include: {
      model: {
        select: { id: true, name: true, provider: true, category: true },
      },
      agent: {
        select: { id: true, name: true, behaviorPrompt: true },
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'session_start',
      details: JSON.stringify({ sessionId: session.id, modelId, agentId }),
    },
  });

  return session;
};

// Get session by ID
export const getSession = async (sessionId: string, userId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      model: {
        select: { id: true, name: true, provider: true, category: true },
      },
      agent: {
        select: { id: true, name: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this session');
  }

  return session;
};

// Get user's sessions
export const getUserSessions = async (
  userId: string,
  options: {
    page?: number;
    limit?: number;
    modelId?: string;
    agentId?: string;
  } = {}
) => {
  const { page = 1, limit = 20, modelId, agentId } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (modelId) where.modelId = modelId;
  if (agentId) where.agentId = agentId;

  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: {
        model: {
          select: { id: true, name: true, provider: true, category: true },
        },
        agent: {
          select: { id: true, name: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
    prisma.session.count({ where }),
  ]);

  return { sessions, total, page, limit };
};

// Send a message in a session
export const sendMessage = async (
  sessionId: string,
  userId: string,
  content: string
) => {
  // Get session with messages
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      model: true,
      agent: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this session');
  }

  // Check user has tokens (with hard limit enforcement)
  const tokenCheck = await checkTokenAvailability(userId);
  if (!tokenCheck.available) {
    throw new InsufficientTokensError();
  }

  // Prepare conversation history
  const conversationHistory = session.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Score the user's prompt using Gemini AI (cost deducted from budget, not shown in session)
  const scoreResult = await scoringService.scorePrompt(content, conversationHistory, userId);

  // Get AI response
  const aiResponse = await aiService.chatWithModel(
    session.modelId,
    content,
    conversationHistory
  );

  // Calculate cost in USD using actual token counts from API
  // Uses pricing config with per 1M token rates (industry standard)
  const inputTokens = aiResponse.inputTokens;
  const outputTokens = aiResponse.outputTokens;
  const totalTokens = inputTokens + outputTokens;
  const costUSD = calculateModelCostUSD(session.model.modelId, inputTokens, outputTokens);

  // Calculate message costs
  const userInputCost = calculateModelCostUSD(session.model.modelId, inputTokens, 0);
  const assistantOutputCost = calculateModelCostUSD(session.model.modelId, 0, outputTokens);

  // Calculate average score for session update
  const allScores = [...session.messages.filter(m => m.score).map(m => m.score!), scoreResult.totalScore];
  const avgScore = scoringService.calculateSessionScore(allScores);

  // Get hard limit setting once (outside transaction for read)
  const hardLimitEnabled = await isHardLimitEnforced();

  // Convert USD cost to virtual tokens for consistent quota tracking
  // Formula: Virtual Tokens = (USD Spent / Budget Limit USD) × Display Tokens
  const virtualTokensToAdd = pricingUtils.usdToVirtualTokens(costUSD);

  // ============================================================
  // ATOMIC TRANSACTION: All database writes in a single transaction
  // This prevents race conditions where concurrent requests could
  // both pass budget checks and cause overspending
  // ============================================================
  const result = await prisma.$transaction(async (tx) => {
    // Re-fetch user within transaction to ensure we have latest data
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { tokenQuota: true, tokenUsed: true, budgetLimit: true, budgetUsed: true },
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Double-check budget availability within transaction (prevents race condition)
    if (hardLimitEnabled && currentUser.tokenUsed >= currentUser.tokenQuota) {
      throw new InsufficientTokensError();
    }

    // Cap virtual tokens at remaining quota if hard limit enabled
    let cappedVirtualTokens = virtualTokensToAdd;
    if (hardLimitEnabled) {
      const remainingQuota = Math.max(0, currentUser.tokenQuota - currentUser.tokenUsed);
      cappedVirtualTokens = Math.min(virtualTokensToAdd, remainingQuota);
    }

    // Create user message
    const userMessage = await tx.message.create({
      data: {
        sessionId,
        role: 'user',
        content,
        score: scoreResult.totalScore,
        feedback: JSON.stringify(scoreResult),
        inputTokens: inputTokens,
        outputTokens: 0,
        tokens: inputTokens, // Legacy field
        cost: userInputCost,
      },
    });

    // Create assistant message
    const assistantMessage = await tx.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse.response,
        inputTokens: 0,
        outputTokens: outputTokens,
        tokens: outputTokens, // Legacy field
        cost: assistantOutputCost,
      },
    });

    // Update session stats
    await tx.session.update({
      where: { id: sessionId },
      data: {
        promptCount: { increment: 1 },
        totalScore: { increment: scoreResult.totalScore },
        avgScore,
        inputTokens: { increment: inputTokens },
        outputTokens: { increment: outputTokens },
        tokensUsed: { increment: totalTokens }, // Legacy field
        totalCost: { increment: costUSD },
        updatedAt: new Date(),
      },
    });

    // Update user's budget (cost in USD) and virtual tokens - ATOMIC
    await tx.user.update({
      where: { id: userId },
      data: {
        tokenUsed: { increment: cappedVirtualTokens },
        budgetUsed: { increment: costUSD },
      },
    });

    // Update agent stats if applicable
    if (session.agentId) {
      await tx.agent.update({
        where: { id: session.agentId },
        data: {
          messagesCount: { increment: 2 }, // user + assistant
          tokensUsed: { increment: aiResponse.tokensUsed },
        },
      });
    }

    return { userMessage, assistantMessage, cappedVirtualTokens };
  });

  const { userMessage, assistantMessage } = result;

  return {
    userMessage: {
      ...userMessage,
      scoreResult,
    },
    assistantMessage,
    tokensUsed: aiResponse.tokensUsed,
    isMock: aiResponse.isMock,
    sessionStats: {
      avgScore,
      promptCount: session.promptCount + 1,
      tokensUsed: session.tokensUsed + aiResponse.tokensUsed,
    },
  };
};

// Get session messages
export const getSessionMessages = async (sessionId: string, userId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this session');
  }

  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
};

// Update session title
export const updateSessionTitle = async (
  sessionId: string,
  userId: string,
  title: string
) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this session');
  }

  return prisma.session.update({
    where: { id: sessionId },
    data: { title },
  });
};

// End/deactivate session
export const endSession = async (sessionId: string, userId: string) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this session');
  }

  return prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
};

// Send a message with streaming response
export const sendMessageStreaming = async (
  sessionId: string,
  userId: string,
  content: string,
  onChunk: StreamCallback
): Promise<{
  userMessage: any;
  assistantMessage: any;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  isMock: boolean;
}> => {
  // Get session with messages
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      model: true,
      agent: true,
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  if (session.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this session');
  }

  // Check user has tokens (with hard limit enforcement)
  const tokenCheck = await checkTokenAvailability(userId);
  if (!tokenCheck.available) {
    throw new InsufficientTokensError();
  }

  // Prepare conversation history
  const conversationHistory = session.messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Score the user's prompt using Gemini AI
  const scoreResult = await scoringService.scorePrompt(content, conversationHistory, userId);

  // Stream AI response first to get actual token counts
  let fullResponse = '';
  const streamResult = await aiService.streamWithModel(
    session.modelId,
    content,
    conversationHistory,
    (chunk: string, done: boolean) => {
      if (!done) {
        fullResponse += chunk;
      }
      onChunk(chunk, done);
    }
  );

  // Calculate cost in USD using actual token counts from API
  const inputTokens = streamResult.inputTokens;
  const outputTokens = streamResult.outputTokens;
  const totalTokens = inputTokens + outputTokens;
  const costUSD = calculateModelCostUSD(session.model.modelId, inputTokens, outputTokens);

  // Calculate message costs
  const userInputCost = calculateModelCostUSD(session.model.modelId, inputTokens, 0);
  const assistantOutputCost = calculateModelCostUSD(session.model.modelId, 0, outputTokens);

  // Calculate average score for session update
  const allScores = [...session.messages.filter(m => m.score).map(m => m.score!), scoreResult.totalScore];
  const avgScore = scoringService.calculateSessionScore(allScores);

  // Get hard limit setting once (outside transaction for read)
  const hardLimitEnabled = await isHardLimitEnforced();

  // Convert USD cost to virtual tokens for consistent quota tracking
  const virtualTokensToAdd = pricingUtils.usdToVirtualTokens(costUSD);

  // ============================================================
  // ATOMIC TRANSACTION: All database writes in a single transaction
  // This prevents race conditions where concurrent requests could
  // both pass budget checks and cause overspending
  // ============================================================
  const result = await prisma.$transaction(async (tx) => {
    // Re-fetch user within transaction to ensure we have latest data
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { tokenQuota: true, tokenUsed: true, budgetLimit: true, budgetUsed: true },
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Double-check budget availability within transaction (prevents race condition)
    if (hardLimitEnabled && currentUser.tokenUsed >= currentUser.tokenQuota) {
      throw new InsufficientTokensError();
    }

    // Cap virtual tokens at remaining quota if hard limit enabled
    let cappedVirtualTokens = virtualTokensToAdd;
    if (hardLimitEnabled) {
      const remainingQuota = Math.max(0, currentUser.tokenQuota - currentUser.tokenUsed);
      cappedVirtualTokens = Math.min(virtualTokensToAdd, remainingQuota);
    }

    // Create user message
    const userMessage = await tx.message.create({
      data: {
        sessionId,
        role: 'user',
        content,
        score: scoreResult.totalScore,
        feedback: JSON.stringify(scoreResult),
        inputTokens: inputTokens,
        outputTokens: 0,
        tokens: inputTokens, // Legacy
        cost: userInputCost,
      },
    });

    // Create assistant message
    const assistantMessage = await tx.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: fullResponse,
        inputTokens: 0,
        outputTokens: outputTokens,
        tokens: outputTokens, // Legacy
        cost: assistantOutputCost,
      },
    });

    // Update session stats
    await tx.session.update({
      where: { id: sessionId },
      data: {
        promptCount: { increment: 1 },
        totalScore: { increment: scoreResult.totalScore },
        avgScore,
        inputTokens: { increment: inputTokens },
        outputTokens: { increment: outputTokens },
        tokensUsed: { increment: totalTokens }, // Legacy
        totalCost: { increment: costUSD },
        updatedAt: new Date(),
      },
    });

    // Update user's budget (cost in USD) and virtual tokens - ATOMIC
    await tx.user.update({
      where: { id: userId },
      data: {
        tokenUsed: { increment: cappedVirtualTokens },
        budgetUsed: { increment: costUSD },
      },
    });

    return { userMessage, assistantMessage };
  });

  const { userMessage, assistantMessage } = result;

  return {
    userMessage: {
      ...userMessage,
      scoreResult,
    },
    assistantMessage,
    tokensUsed: totalTokens,
    inputTokens,
    outputTokens,
    cost: costUSD,
    isMock: streamResult.isMock,
  };
};

