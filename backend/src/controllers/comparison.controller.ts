import { Request, Response, NextFunction } from 'express';
import * as comparisonService from '../services/comparison.service';
import { sendSuccess } from '../utils/response';
import { streamWithModel } from '../services/ai.service';
import { prisma } from '../lib/prisma';
import { calculateModelCostUSD, pricingUtils } from '../config/pricing';

// Get available categories for comparison
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await comparisonService.getAvailableCategories();
    return sendSuccess(res, categories, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get models for a specific category
export const getModelsByCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.params;
    const models = await comparisonService.getModelsForComparison(category);
    return sendSuccess(res, models, 'Models retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Start a comparison exchange - returns session ID, exchange ID, and model info
export const startExchange = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { category, modelIds, prompt, comparisonSessionId } = req.body;

    const result = await comparisonService.startComparisonExchange({
      userId,
      category,
      modelIds,
      prompt,
      comparisonSessionId,
    });

    return sendSuccess(res, result, 'Exchange started successfully');
  } catch (error) {
    next(error);
  }
};

// Run a single model comparison - called independently for each model
export const runSingleModel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { modelId, prompt, exchangeId } = req.body;

    const result = await comparisonService.runSingleModelComparison({
      userId,
      modelId,
      prompt,
      exchangeId,
    });

    return sendSuccess(res, result, 'Model comparison completed');
  } catch (error) {
    next(error);
  }
};

// Compare multiple models (legacy - waits for all)
export const compareModels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { category, modelIds, prompt, comparisonSessionId } = req.body;

    const result = await comparisonService.compareModels({
      userId,
      category,
      modelIds,
      prompt,
      comparisonSessionId,
    });

    return sendSuccess(res, result, 'Comparison completed successfully');
  } catch (error) {
    next(error);
  }
};

// Get user's comparison sessions
export const getUserSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const sessions = await comparisonService.getUserComparisonSessions(userId);
    return sendSuccess(res, sessions, 'Sessions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Get comparison session details
export const getSessionDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const session = await comparisonService.getComparisonSessionDetails(sessionId, userId);
    return sendSuccess(res, session, 'Session details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Delete comparison session
export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    await comparisonService.deleteComparisonSession(sessionId, userId);
    return sendSuccess(res, null, 'Session deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Stream a single model's response using Server-Sent Events
export const streamSingleModel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user!.id;
  const { modelId, prompt, exchangeId } = req.body;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  const startTime = Date.now();
  let fullResponse = '';
  let tokensUsed = 0;
  let isMock = false;

  try {
    // Get model info
    const model = await prisma.aIModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Model not found' })}\n\n`);
      res.end();
      return;
    }

    // Get conversation history for context
    const exchange = await prisma.comparisonExchange.findUnique({
      where: { id: exchangeId },
      include: {
        comparisonSession: {
          include: {
            exchanges: {
              where: {
                createdAt: { lt: new Date() }
              },
              orderBy: { createdAt: 'asc' },
              include: {
                responses: {
                  where: { modelId },
                },
              },
            },
          },
        },
      },
    });

    // Build conversation history for this model
    const conversationHistory: Array<{ role: string; content: string }> = [];
    if (exchange?.comparisonSession?.exchanges) {
      for (const prevExchange of exchange.comparisonSession.exchanges) {
        if (prevExchange.id === exchangeId) break;
        
        conversationHistory.push({
          role: 'user',
          content: prevExchange.prompt,
        });
        
        const modelResponse = prevExchange.responses.find(r => r.modelId === modelId);
        if (modelResponse?.response) {
          conversationHistory.push({
            role: 'assistant',
            content: modelResponse.response,
          });
        }
      }
    }

    // Send initial metadata
    res.write(`data: ${JSON.stringify({ 
      type: 'start', 
      modelId, 
      modelName: model.name,
      provider: model.provider 
    })}\n\n`);

    // Stream the response
    const result = await streamWithModel(
      modelId,
      prompt,
      conversationHistory,
      (chunk: string, done: boolean) => {
        if (done) {
          return;
        }
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      }
    );

    tokensUsed = result.tokensUsed;
    isMock = result.isMock;

    const responseTime = Date.now() - startTime;

    // Calculate cost in USD using actual token counts from API
    const inputTokens = result.inputTokens || 0;
    const outputTokens = result.outputTokens || 0;
    const totalTokens = inputTokens + outputTokens;
    
    // Calculate cost using USD pricing
    const cost = calculateModelCostUSD(model.modelId, inputTokens, outputTokens);

    // Save to database with all required fields including cost
    await prisma.comparisonResponse.create({
      data: {
        comparisonExchangeId: exchangeId,
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        response: fullResponse,
        inputTokens,
        outputTokens,
        tokensUsed: totalTokens,
        cost,
        responseTimeMs: responseTime,
        score: null,
        isMock,
        error: null,
      },
    });

    // Update user's virtual token usage and budget
    if (cost > 0) {
      // Convert USD cost to virtual tokens for consistent quota tracking
      const virtualTokensToAdd = pricingUtils.usdToVirtualTokens(cost);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          tokenUsed: { increment: virtualTokensToAdd },
          budgetUsed: { increment: cost },
        },
      });

      // Update session totals with real token counts (for analytics)
      if (exchange) {
        await prisma.comparisonSession.update({
          where: { id: exchange.comparisonSessionId },
          data: {
            totalInputTokens: { increment: inputTokens },
            totalOutputTokens: { increment: outputTokens },
            totalTokensUsed: { increment: totalTokens },
            totalCost: { increment: cost },
          },
        });
      }
    }

    // Send completion event
    res.write(`data: ${JSON.stringify({ 
      type: 'done', 
      inputTokens,
      outputTokens,
      tokensUsed: totalTokens,
      responseTimeMs: responseTime,
      cost,
      isMock
    })}\n\n`);

    res.end();
  } catch (error: any) {
    console.error('[Stream] Error:', error.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
};
