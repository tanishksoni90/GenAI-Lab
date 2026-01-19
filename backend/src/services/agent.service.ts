import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

interface CreateAgentInput {
  name: string;
  description?: string;
  modelId: string;
  behaviorPrompt?: string;
  strictMode?: boolean;
  knowledgeBase?: string[]; // Array of file paths
  guardrailIds?: string[];
}

interface UpdateAgentInput {
  name?: string;
  description?: string;
  modelId?: string;
  behaviorPrompt?: string;
  strictMode?: boolean;
  knowledgeBase?: string[];
  guardrailIds?: string[];
  status?: 'active' | 'inactive';
}

// Create a new agent
export const createAgent = async (userId: string, input: CreateAgentInput) => {
  const { name, description, modelId, behaviorPrompt, strictMode, knowledgeBase, guardrailIds } = input;

  // Verify model exists
  const model = await prisma.aIModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new NotFoundError('AI Model not found');
  }

  // Use transaction for atomic multi-table creation
  const result = await prisma.$transaction(async (tx) => {
    // Create agent
    const agent = await tx.agent.create({
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
      await tx.agentGuardrail.createMany({
        data: guardrailIds.map(guardrailId => ({
          agentId: agent.id,
          guardrailId,
        })),
      });
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId,
        action: 'agent_create',
        details: JSON.stringify({ agentId: agent.id, name }),
      },
    });

    return agent;
  });

  return {
    ...result,
    knowledgeBase: result.knowledgeBase ? JSON.parse(result.knowledgeBase) : [],
    status: result.isActive ? 'active' : 'inactive',
  };
};

// Get agent by ID
export const getAgent = async (agentId: string, userId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      model: {
        select: { id: true, name: true, provider: true, category: true },
      },
      guardrails: {
        include: {
          guardrail: true,
        },
      },
    },
  });

  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  if (agent.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this agent');
  }

  return {
    ...agent,
    knowledgeBase: agent.knowledgeBase ? JSON.parse(agent.knowledgeBase) : [],
    guardrails: agent.guardrails.map(ag => ag.guardrail),
    status: agent.isActive ? 'active' : 'inactive',
  };
};

// Get user's agents
export const getUserAgents = async (userId: string) => {
  const agents = await prisma.agent.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: 'desc' },
    include: {
      model: {
        select: { id: true, name: true, provider: true, category: true },
      },
      _count: {
        select: { sessions: true },
      },
    },
  });

  return agents.map(agent => ({
    ...agent,
    knowledgeBase: agent.knowledgeBase ? JSON.parse(agent.knowledgeBase) : [],
    sessionsCount: agent._count.sessions,
    status: agent.isActive ? 'active' : 'inactive',
  }));
};

// Update agent
export const updateAgent = async (
  agentId: string,
  userId: string,
  input: UpdateAgentInput
) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { userId: true },
  });

  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  if (agent.userId !== userId) {
    throw new ForbiddenError('Not authorized to modify this agent');
  }

  const { guardrailIds, knowledgeBase, status, ...updateData } = input;

  // Use transaction for atomic multi-table update
  const updatedAgent = await prisma.$transaction(async (tx) => {
    // Update agent
    const result = await tx.agent.update({
      where: { id: agentId },
      data: {
        ...updateData,
        knowledgeBase: knowledgeBase ? JSON.stringify(knowledgeBase) : undefined,
        isActive: status ? status === 'active' : undefined,
      },
      include: {
        model: {
          select: { id: true, name: true, provider: true, category: true },
        },
      },
    });

    // Update guardrails if provided
    if (guardrailIds !== undefined) {
      // Remove existing guardrails
      await tx.agentGuardrail.deleteMany({
        where: { agentId },
      });

      // Add new guardrails
      if (guardrailIds.length > 0) {
        await tx.agentGuardrail.createMany({
          data: guardrailIds.map(guardrailId => ({
            agentId,
            guardrailId,
          })),
        });
      }
    }

    return result;
  });

  return {
    ...updatedAgent,
    knowledgeBase: updatedAgent.knowledgeBase ? JSON.parse(updatedAgent.knowledgeBase) : [],
    status: updatedAgent.isActive ? 'active' : 'inactive',
  };
};

// Delete agent (soft delete)
export const deleteAgent = async (agentId: string, userId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { userId: true },
  });

  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  if (agent.userId !== userId) {
    throw new ForbiddenError('Not authorized to delete this agent');
  }

  await prisma.agent.update({
    where: { id: agentId },
    data: { isActive: false },
  });

  return { message: 'Agent deleted successfully' };
};

// Get agent stats
export const getAgentStats = async (agentId: string, userId: string) => {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
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

  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  if (agent.userId !== userId) {
    throw new ForbiddenError('Not authorized to access this agent');
  }

  // Calculate stats
  const totalSessions = agent._count.sessions;
  const totalMessages = agent.messagesCount;
  const totalTokens = agent.tokensUsed;
  
  // Calculate cost (simplified)
  const avgCostPer1k = (agent.model.inputCost + agent.model.outputCost) / 2;
  const totalCost = (totalTokens / 1000) * avgCostPer1k;

  // Calculate average score across sessions
  const avgScore = agent.sessions.length > 0
    ? agent.sessions.reduce((sum, s) => sum + s.avgScore, 0) / agent.sessions.length
    : 0;

  return {
    sessions: totalSessions,
    messages: totalMessages,
    tokensUsed: totalTokens,
    estimatedCost: Math.round(totalCost * 1000) / 1000, // Round to 3 decimals
    avgScore: Math.round(avgScore * 10) / 10,
  };
};

// Get available guardrails for agents
export const getAvailableGuardrails = async () => {
  return prisma.guardrail.findMany({
    where: { isActive: true },
    orderBy: [{ isSystem: 'desc' }, { priority: 'desc' }],
  });
};

