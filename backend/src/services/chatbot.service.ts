import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

interface CreateChatbotInput {
  name: string;
  description?: string;
  modelId: string;
  behaviorPrompt?: string;
  strictMode?: boolean;
  knowledgeBase?: string[]; // Array of file paths
  guardrailIds?: string[];
}

interface UpdateChatbotInput {
  name?: string;
  description?: string;
  modelId?: string;
  behaviorPrompt?: string;
  strictMode?: boolean;
  knowledgeBase?: string[];
  guardrailIds?: string[];
  status?: 'active' | 'inactive';
}

// Create a new chatbot
export const createChatbot = async (userId: string, input: CreateChatbotInput) => {
  const { name, description, modelId, behaviorPrompt, strictMode, knowledgeBase, guardrailIds } = input;

  // Verify model exists
  const model = await prisma.aIModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new NotFoundError('AI Model not found');
  }

  // Verify guardrails exist if provided
  if (guardrailIds && guardrailIds.length > 0) {
    // Deduplicate to prevent false validation failures
    const uniqueGuardrailIds = [...new Set(guardrailIds)];
    const existingGuardrails = await prisma.guardrail.findMany({
      where: { id: { in: uniqueGuardrailIds }, isActive: true },
      select: { id: true },
    });
    if (existingGuardrails.length !== uniqueGuardrailIds.length) {
      throw new NotFoundError('One or more guardrails not found');
    }
  }

  // Use transaction for atomic multi-table creation
  const result = await prisma.$transaction(async (tx) => {
    // Create chatbot
    const chatbot = await tx.chatbot.create({
      data: {
        userId,
        name,
        description,
        modelId,
        behaviorPrompt,
        strictMode: strictMode || false,
        knowledgeBase: knowledgeBase ? JSON.stringify(knowledgeBase) : null,
      },
      include: {
        model: {
          select: { id: true, name: true, provider: true, category: true },
        },
      },
    });

    // Add guardrails if provided
    if (guardrailIds && guardrailIds.length > 0) {
      await tx.chatbotGuardrail.createMany({
        data: guardrailIds.map(guardrailId => ({
          chatbotId: chatbot.id,
          guardrailId,
        })),
      });
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: 'chatbot_create',
        details: JSON.stringify({ chatbotId: chatbot.id, name }),
      },
    });

    return chatbot;
  });

  return {
    ...result,
    knowledgeBase: result.knowledgeBase ? JSON.parse(result.knowledgeBase) : [],
    status: result.isActive ? 'active' : 'inactive',
  };
};

// Get chatbot by ID
export const getChatbot = async (chatbotId: string, userId: string) => {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      model: {
        select: { id: true, modelId: true, name: true, provider: true, category: true },
      },
      guardrails: {
        include: {
          guardrail: true,
        },
      },
    },
  });

  if (!chatbot) {
    throw new NotFoundError('Chatbot not found');
  }

  if (chatbot.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this chatbot');
  }

  return {
    ...chatbot,
    knowledgeBase: chatbot.knowledgeBase ? JSON.parse(chatbot.knowledgeBase) : [],
    guardrails: chatbot.guardrails.map(cg => cg.guardrail),
    status: chatbot.isActive ? 'active' : 'inactive',
  };
};

// Get user's chatbots
export const getUserChatbots = async (userId: string) => {
  const chatbots = await prisma.chatbot.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      model: {
        select: { id: true, modelId: true, name: true, provider: true, category: true },
      },
      _count: {
        select: { sessions: true },
      },
    },
  });

  return chatbots.map(chatbot => ({
    ...chatbot,
    knowledgeBase: chatbot.knowledgeBase ? JSON.parse(chatbot.knowledgeBase) : [],
    sessionsCount: chatbot._count.sessions,
    status: chatbot.isActive ? 'active' : 'inactive',
  }));
};

// Update chatbot
export const updateChatbot = async (
  chatbotId: string,
  userId: string,
  input: UpdateChatbotInput
) => {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });

  if (!chatbot) {
    throw new NotFoundError('Chatbot not found');
  }

  if (chatbot.userId !== userId) {
    throw new ForbiddenError('Not authorized to modify this chatbot');
  }

  const { guardrailIds, knowledgeBase, status, ...updateData } = input;

  // Verify model exists if being updated
  if (updateData.modelId) {
    const model = await prisma.aIModel.findUnique({
      where: { id: updateData.modelId },
    });
    if (!model) {
      throw new NotFoundError('AI Model not found');
    }
  }

  // Verify guardrails exist if provided
  if (guardrailIds && guardrailIds.length > 0) {
    // Deduplicate to prevent false validation failures
    const uniqueGuardrailIds = [...new Set(guardrailIds)];
    const existingGuardrails = await prisma.guardrail.findMany({
      where: { id: { in: uniqueGuardrailIds }, isActive: true },
      select: { id: true },
    });
    if (existingGuardrails.length !== uniqueGuardrailIds.length) {
      throw new NotFoundError('One or more guardrails not found');
    }
  }

  // Use transaction for atomic multi-table update
  const updatedChatbot = await prisma.$transaction(async (tx) => {
    // Update chatbot
    const result = await tx.chatbot.update({
      where: { id: chatbotId },
      data: {
        ...updateData,
        knowledgeBase: knowledgeBase ? JSON.stringify(knowledgeBase) : undefined,
        isActive: status ? status === 'active' : undefined,
      },
      include: {
        model: {
          select: { id: true, modelId: true, name: true, provider: true, category: true },
        },
      },
    });

    // Update guardrails if provided
    if (guardrailIds !== undefined) {
      // Remove existing guardrails
      await tx.chatbotGuardrail.deleteMany({
        where: { chatbotId },
      });

      // Add new guardrails
      if (guardrailIds.length > 0) {
        await tx.chatbotGuardrail.createMany({
          data: guardrailIds.map(guardrailId => ({
            chatbotId,
            guardrailId,
          })),
        });
      }
    }

    return result;
  });

  return {
    ...updatedChatbot,
    knowledgeBase: updatedChatbot.knowledgeBase ? JSON.parse(updatedChatbot.knowledgeBase) : [],
    status: updatedChatbot.isActive ? 'active' : 'inactive',
  };
};

// Delete chatbot (soft delete)
export const deleteChatbot = async (chatbotId: string, userId: string) => {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: { userId: true },
  });

  if (!chatbot) {
    throw new NotFoundError('Chatbot not found');
  }

  if (chatbot.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this chatbot');
  }

  await prisma.chatbot.update({
    where: { id: chatbotId },
    data: { isActive: false },
  });

  return { message: 'Chatbot deleted successfully' };
};

// Get chatbot stats
export const getChatbotStats = async (chatbotId: string, userId: string) => {
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      model: {
        select: { inputCost: true, outputCost: true },
      },
      sessions: {
        select: {
          id: true,
          avgScore: true,
          tokensUsed: true,
          promptCount: true,
        },
      },
      _count: {
        select: { sessions: true },
      },
    },
  });

  if (!chatbot) {
    throw new NotFoundError('Chatbot not found');
  }

  if (chatbot.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this chatbot');
  }

  // Calculate stats
  const totalSessions = chatbot._count.sessions;
  const totalMessages = chatbot.messagesCount;
  const totalTokens = chatbot.tokensUsed;
  
  // Calculate cost (simplified)
  const avgCostPer1k = (chatbot.model.inputCost + chatbot.model.outputCost) / 2;
  const totalCost = (totalTokens / 1000) * avgCostPer1k;

  // Calculate average score across sessions (filter out null values to avoid NaN)
  const sessionsWithScore = chatbot.sessions.filter(s => s.avgScore != null);
  const avgScore = sessionsWithScore.length > 0
    ? sessionsWithScore.reduce((sum, s) => sum + (s.avgScore ?? 0), 0) / sessionsWithScore.length
    : 0;

  return {
    sessions: totalSessions,
    messages: totalMessages,
    tokensUsed: totalTokens,
    estimatedCost: Math.round(totalCost * 1000) / 1000, // Round to 3 decimals
    avgScore: Math.round(avgScore * 10) / 10,
  };
};

// Get available guardrails for chatbots
export const getAvailableGuardrails = async () => {
  return prisma.guardrail.findMany({
    where: { isActive: true },
    orderBy: [{ isSystem: 'desc' }, { priority: 'desc' }],
  });
};
