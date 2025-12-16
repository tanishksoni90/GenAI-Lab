import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { chatWithModel, getModelsByCategory } from './ai.service';
import { scorePrompt } from './scoring.service';
import { calculateModelCostUSD, pricingUtils } from '../config/pricing';

// Types
interface CompareInput {
  userId: string;
  category: string;
  modelIds: string[];
  prompt: string;
  comparisonSessionId?: string; // Optional - for continuing an existing session
}

interface SingleModelInput {
  userId: string;
  modelId: string;
  prompt: string;
  exchangeId: string;
}

interface CompareResult {
  comparisonSessionId: string;
  exchangeId: string;
  prompt: string;
  responses: Array<{
    modelId: string;
    modelName: string;
    provider: string;
    response: string;
    inputTokens: number;
    outputTokens: number;
    tokensUsed: number;
    cost: number;
    responseTimeMs: number;
    score: number | null;
    isMock: boolean;
    error: string | null;
  }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokensUsed: number;
  totalCost: number;
}

interface SingleModelResult {
  modelId: string;
  modelName: string;
  provider: string;
  modelApiId: string;  // The actual API model ID for pricing lookup
  response: string;
  inputTokens: number;
  outputTokens: number;
  tokensUsed: number;
  cost: number;
  responseTimeMs: number;
  score: number | null;
  isMock: boolean;
  error: string | null;
}

// Get available models for comparison by category
export const getModelsForComparison = async (category: string) => {
  const models = await prisma.aIModel.findMany({
    where: {
      category,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      provider: true,
      modelId: true,
      category: true,
      description: true,
      maxTokens: true,
    },
    orderBy: [{ provider: 'asc' }, { name: 'asc' }],
  });

  return models;
};

// Get available categories
export const getAvailableCategories = async () => {
  const categories = await prisma.aIModel.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
  });

  return categories.map(c => c.category);
};

// Create or get comparison session
const getOrCreateComparisonSession = async (
  userId: string,
  category: string,
  sessionId?: string
) => {
  if (sessionId) {
    const session = await prisma.comparisonSession.findUnique({
      where: { id: sessionId, userId },
    });
    if (session) return session;
  }

  // Create new session
  return prisma.comparisonSession.create({
    data: {
      userId,
      category,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Comparison`,
    },
  });
};

// Start a comparison exchange - creates session and exchange, returns IDs
export const startComparisonExchange = async (input: {
  userId: string;
  category: string;
  modelIds: string[];
  prompt: string;
  comparisonSessionId?: string;
}) => {
  const { userId, category, modelIds, prompt, comparisonSessionId } = input;

  if (modelIds.length < 2) {
    throw new BadRequestError('Please select at least 2 models to compare');
  }

  if (modelIds.length > 6) {
    throw new BadRequestError('Maximum 6 models can be compared at once');
  }

  // Verify all models exist and belong to the category
  const models = await prisma.aIModel.findMany({
    where: {
      id: { in: modelIds },
      category,
      isActive: true,
    },
  });

  if (models.length !== modelIds.length) {
    throw new BadRequestError('One or more selected models are invalid or not available');
  }

  // Check user's token quota
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenQuota: true, tokenUsed: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const remainingTokens = user.tokenQuota - user.tokenUsed;
  if (remainingTokens <= 0) {
    throw new BadRequestError('Token quota exceeded. Please contact admin for more tokens.');
  }

  // Get or create comparison session
  const session = await getOrCreateComparisonSession(userId, category, comparisonSessionId);

  // Create the exchange record
  const exchange = await prisma.comparisonExchange.create({
    data: {
      comparisonSessionId: session.id,
      prompt,
    },
  });

  // Score the prompt
  let promptScore: number | null = null;
  try {
    const scoreResult = await scorePrompt(prompt, [], userId);
    promptScore = scoreResult.totalScore;
  } catch (error) {
    console.error('Error scoring prompt:', error);
  }

  return {
    comparisonSessionId: session.id,
    exchangeId: exchange.id,
    prompt,
    promptScore,
    models: models.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
    })),
  };
};

// Run a single model comparison - called independently for each model
// Now supports conversation history for multi-turn conversations
export const runSingleModelComparison = async (input: SingleModelInput): Promise<SingleModelResult> => {
  const { userId, modelId, prompt, exchangeId } = input;

  // Get the model
  const model = await prisma.aIModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new NotFoundError('Model not found');
  }

  // Get the exchange and session to build conversation history
  const exchangeData = await prisma.comparisonExchange.findUnique({
    where: { id: exchangeId },
    include: {
      comparisonSession: {
        include: {
          exchanges: {
            orderBy: { createdAt: 'asc' },
            include: {
              responses: {
                where: { modelId }, // Only get responses for this specific model
              },
            },
          },
        },
      },
    },
  });

  if (!exchangeData) {
    throw new NotFoundError('Exchange not found');
  }

  // Build conversation history from previous exchanges for this specific model
  const conversationHistory: Array<{ role: string; content: string }> = [];
  
  for (const prevExchange of exchangeData.comparisonSession.exchanges) {
    // Skip the current exchange (we're about to answer it)
    if (prevExchange.id === exchangeId) break;
    
    // Add the user's prompt
    conversationHistory.push({
      role: 'user',
      content: prevExchange.prompt,
    });
    
    // Add this model's response (if it exists)
    const modelResponse = prevExchange.responses.find((r: { modelId: string }) => r.modelId === modelId);
    if (modelResponse && modelResponse.response) {
      conversationHistory.push({
        role: 'assistant',
        content: modelResponse.response,
      });
    }
  }

  const startTime = Date.now();
  let result: SingleModelResult;

  try {
    // Pass conversation history to maintain context
    const aiResult = await chatWithModel(model.id, prompt, conversationHistory);
    const responseTime = Date.now() - startTime;

    // Calculate cost using actual input/output tokens
    const inputTokens = aiResult.inputTokens || 0;
    const outputTokens = aiResult.outputTokens || 0;
    const totalTokens = inputTokens + outputTokens;
    const cost = calculateModelCostUSD(model.modelId, inputTokens, outputTokens);

    result = {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      modelApiId: model.modelId,
      response: aiResult.response,
      inputTokens,
      outputTokens,
      tokensUsed: totalTokens,
      cost,
      responseTimeMs: responseTime,
      score: null,
      isMock: aiResult.isMock,
      error: null,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    result = {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      modelApiId: model.modelId,
      response: '',
      inputTokens: 0,
      outputTokens: 0,
      tokensUsed: 0,
      cost: 0,
      responseTimeMs: responseTime,
      score: null,
      isMock: false,
      error: error.message || 'Unknown error occurred',
    };
  }

  // Save response to database with separate input/output tracking
  await prisma.comparisonResponse.create({
    data: {
      comparisonExchangeId: exchangeId,
      modelId: result.modelId,
      modelName: result.modelName,
      provider: result.provider,
      response: result.response,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      tokensUsed: result.tokensUsed,
      cost: result.cost,
      responseTimeMs: result.responseTimeMs,
      score: result.score,
      isMock: result.isMock,
      error: result.error,
    },
  });

  // Update user's virtual token usage and budget
  if (result.cost > 0) {
    // Convert USD cost to virtual tokens for consistent quota tracking
    const virtualTokensToAdd = pricingUtils.usdToVirtualTokens(result.cost);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokenUsed: { increment: virtualTokensToAdd },
        budgetUsed: { increment: result.cost },
      },
    });

    // Update session totals with real token counts (for analytics)
    await prisma.comparisonSession.update({
      where: { id: exchangeData.comparisonSessionId },
      data: {
        totalInputTokens: { increment: result.inputTokens },
        totalOutputTokens: { increment: result.outputTokens },
        totalTokensUsed: { increment: result.tokensUsed },
        totalCost: { increment: result.cost },
      },
    });
  }

  return result;
};

// Run comparison across multiple models (legacy - waits for all)
export const compareModels = async (input: CompareInput): Promise<CompareResult> => {
  const { userId, category, modelIds, prompt, comparisonSessionId } = input;

  if (modelIds.length < 2) {
    throw new BadRequestError('Please select at least 2 models to compare');
  }

  if (modelIds.length > 6) {
    throw new BadRequestError('Maximum 6 models can be compared at once');
  }

  // Verify all models exist and belong to the category
  const models = await prisma.aIModel.findMany({
    where: {
      id: { in: modelIds },
      category,
      isActive: true,
    },
  });

  if (models.length !== modelIds.length) {
    throw new BadRequestError('One or more selected models are invalid or not available');
  }

  // Check user's token quota
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenQuota: true, tokenUsed: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const remainingTokens = user.tokenQuota - user.tokenUsed;
  if (remainingTokens <= 0) {
    throw new BadRequestError('Token quota exceeded. Please contact admin for more tokens.');
  }

  // Get or create comparison session
  const session = await getOrCreateComparisonSession(userId, category, comparisonSessionId);

  // Create the exchange record
  const exchange = await prisma.comparisonExchange.create({
    data: {
      comparisonSessionId: session.id,
      prompt,
    },
  });

  // Score the prompt once (same for all models)
  let promptScore: number | null = null;
  try {
    const scoreResult = await scorePrompt(prompt, [], userId);
    promptScore = scoreResult.totalScore;
  } catch (error) {
    console.error('Error scoring prompt:', error);
  }

  // Run all models in parallel
  const startTimes = new Map<string, number>();
  const modelPromises = models.map(async (model) => {
    startTimes.set(model.id, Date.now());
    
    try {
      const result = await chatWithModel(model.id, prompt, []);
      const responseTime = Date.now() - (startTimes.get(model.id) || Date.now());
      
      // Calculate cost using actual input/output tokens
      const inputTokens = result.inputTokens || 0;
      const outputTokens = result.outputTokens || 0;
      const totalTokens = inputTokens + outputTokens;
      const cost = calculateModelCostUSD(model.modelId, inputTokens, outputTokens);
      
      return {
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        response: result.response,
        inputTokens,
        outputTokens,
        tokensUsed: totalTokens,
        cost,
        responseTimeMs: responseTime,
        score: promptScore,
        isMock: result.isMock,
        error: null,
      };
    } catch (error: any) {
      const responseTime = Date.now() - (startTimes.get(model.id) || Date.now());
      
      return {
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        response: '',
        inputTokens: 0,
        outputTokens: 0,
        tokensUsed: 0,
        cost: 0,
        responseTimeMs: responseTime,
        score: promptScore,
        isMock: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  });

  const responses = await Promise.all(modelPromises);

  // Save all responses to database with separate input/output tracking
  await prisma.comparisonResponse.createMany({
    data: responses.map((r) => ({
      comparisonExchangeId: exchange.id,
      modelId: r.modelId,
      modelName: r.modelName,
      provider: r.provider,
      response: r.response,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      tokensUsed: r.tokensUsed,
      cost: r.cost,
      responseTimeMs: r.responseTimeMs,
      score: r.score,
      isMock: r.isMock,
      error: r.error,
    })),
  });

  // Calculate totals
  const totalInputTokens = responses.reduce((sum, r) => sum + r.inputTokens, 0);
  const totalOutputTokens = responses.reduce((sum, r) => sum + r.outputTokens, 0);
  const totalTokensUsed = totalInputTokens + totalOutputTokens;
  const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);

  // Update session with separate input/output tracking
  await prisma.comparisonSession.update({
    where: { id: session.id },
    data: {
      totalInputTokens: { increment: totalInputTokens },
      totalOutputTokens: { increment: totalOutputTokens },
      totalTokensUsed: { increment: totalTokensUsed },
      totalCost: { increment: totalCost },
    },
  });

  // Update user's virtual token usage and budget
  // Convert USD cost to virtual tokens for consistent quota tracking
  const virtualTokensToAdd = pricingUtils.usdToVirtualTokens(totalCost);
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      tokenUsed: { increment: virtualTokensToAdd },
      budgetUsed: { increment: totalCost },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'model_comparison',
      details: JSON.stringify({
        category,
        modelCount: modelIds.length,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        tokensUsed: totalTokensUsed,
        cost: totalCost,
      }),
    },
  });

  return {
    comparisonSessionId: session.id,
    exchangeId: exchange.id,
    prompt,
    responses,
    totalInputTokens,
    totalOutputTokens,
    totalTokensUsed,
    totalCost,
  };
};

// Get user's comparison sessions
export const getUserComparisonSessions = async (userId: string) => {
  const sessions = await prisma.comparisonSession.findMany({
    where: { userId },
    include: {
      exchanges: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          prompt: true,
          responses: {
            select: {
              modelName: true,
            },
          },
        },
      },
      _count: {
        select: { exchanges: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return sessions.map((session: any) => ({
    id: session.id,
    category: session.category,
    title: session.title,
    totalTokensUsed: session.totalTokensUsed,
    exchangeCount: session._count.exchanges,
    lastPrompt: session.exchanges[0]?.prompt || null,
    modelsUsed: session.exchanges[0]?.responses.map((r: { modelName: string }) => r.modelName) || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }));
};

// Get comparison session details
export const getComparisonSessionDetails = async (sessionId: string, userId: string) => {
  const session = await prisma.comparisonSession.findUnique({
    where: { id: sessionId, userId },
    include: {
      exchanges: {
        include: {
          responses: {
            orderBy: { modelName: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    throw new NotFoundError('Comparison session not found');
  }

  return session;
};

// Delete comparison session
export const deleteComparisonSession = async (sessionId: string, userId: string) => {
  const session = await prisma.comparisonSession.findUnique({
    where: { id: sessionId, userId },
  });

  if (!session) {
    throw new NotFoundError('Comparison session not found');
  }

  await prisma.comparisonSession.delete({
    where: { id: sessionId },
  });

  return { success: true };
};
