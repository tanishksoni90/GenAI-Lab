import { prisma } from '../lib/prisma';
import { config } from '../config';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Check if real API keys are configured
const hasRealApiKey = (provider: string): boolean => {
  switch (provider) {
    case 'openai':
      return !!config.ai.openai.apiKey;
    case 'google':
      return !!config.ai.google.apiKey;
    case 'anthropic':
      return !!config.ai.anthropic.apiKey;
    case 'elevenlabs':
      return !!config.ai.elevenlabs.apiKey;
    default:
      return false;
  }
};

// Get all available AI models
export const getAllModels = async () => {
  return prisma.aIModel.findMany({
    where: { isActive: true },
    orderBy: [{ provider: 'asc' }, { name: 'asc' }],
  });
};

// Get model by ID
export const getModelById = async (modelId: string) => {
  const model = await prisma.aIModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new NotFoundError('Model not found');
  }

  return model;
};

// Get models by category
export const getModelsByCategory = async (category: string) => {
  return prisma.aIModel.findMany({
    where: { category, isActive: true },
    orderBy: { name: 'asc' },
  });
};

// Generate mock AI response
const generateMockResponse = (
  prompt: string,
  modelName: string,
  category: string
): { content: string; tokensUsed: number } => {
  // Simulate different response types based on category
  if (category === 'image') {
    return {
      content: `[Mock Image Generated]\n\nModel: ${modelName}\nPrompt: "${prompt}"\n\nIn production, this would return an actual image URL from DALL-E 3.\n\nExample output: https://example.com/generated-image.png`,
      tokensUsed: 1000, // Image generation has fixed cost
    };
  }

  if (category === 'audio') {
    return {
      content: `[Mock Audio Generated]\n\nModel: ${modelName}\nText: "${prompt}"\n\nIn production, this would return an audio file URL from ElevenLabs.\n\nExample output: https://example.com/generated-audio.mp3`,
      tokensUsed: Math.ceil(prompt.length * 0.5), // Based on character count
    };
  }

  // Text model mock responses
  const mockResponses = [
    `Thank you for your question about "${prompt.slice(0, 50)}...".\n\nThis is a mock response from ${modelName}. In production, this would be a real AI-generated response.\n\nKey points to consider:\n1. Your prompt was well-structured\n2. You provided good context\n3. The question is clear and specific\n\nWould you like me to elaborate on any of these points?`,
    
    `Great question! Let me help you with that.\n\n**Understanding "${prompt.slice(0, 30)}..."**\n\nThis is simulated output from ${modelName}. When connected to real APIs, you'll get actual AI-generated content.\n\n**Tips for better prompts:**\n- Be specific about what you need\n- Provide relevant context\n- Specify the format you want\n\nIs there anything specific you'd like to explore further?`,
    
    `I'd be happy to help with your query.\n\n[Mock Response from ${modelName}]\n\nYour prompt: "${prompt.slice(0, 40)}..."\n\nIn a production environment, I would provide a detailed, contextual response based on your specific question. For now, this demonstrates the API flow.\n\n**Next steps:**\n1. Configure your API keys\n2. Test with real prompts\n3. Evaluate the scoring system`,
  ];

  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
  const inputTokens = Math.ceil(prompt.length / 4);
  const outputTokens = Math.ceil(randomResponse.length / 4);

  return {
    content: randomResponse,
    tokensUsed: inputTokens + outputTokens,
  };
};

// Chat with AI model (mock or real)
export const chatWithModel = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
) => {
  const model = await getModelById(modelId);

  // For now, always use mock responses
  // In production, check hasRealApiKey and call actual APIs
  const useMock = !hasRealApiKey(model.provider);

  if (useMock) {
    const mockResult = generateMockResponse(prompt, model.name, model.category);
    
    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      response: mockResult.content,
      tokensUsed: mockResult.tokensUsed,
      isMock: true,
    };
  }

  // TODO: Implement real API calls when keys are available
  // For now, throw an error to indicate not implemented
  throw new BadRequestError(`Real API integration for ${model.provider} not yet implemented`);
};

// Calculate token cost
export const calculateTokenCost = async (
  modelId: string,
  tokensUsed: number
): Promise<number> => {
  const model = await getModelById(modelId);
  
  // Simplified cost calculation (in production, split input/output)
  const avgCostPer1k = (model.inputCost + model.outputCost) / 2;
  return (tokensUsed / 1000) * avgCostPer1k;
};

// Get model usage stats for a user
export const getModelUsageStats = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      model: {
        select: { id: true, name: true, provider: true, category: true },
      },
    },
  });

  // Aggregate by model
  const modelStats = new Map<string, {
    model: any;
    sessions: number;
    tokensUsed: number;
  }>();

  sessions.forEach((session) => {
    const existing = modelStats.get(session.modelId);
    if (existing) {
      existing.sessions++;
      existing.tokensUsed += session.tokensUsed;
    } else {
      modelStats.set(session.modelId, {
        model: session.model,
        sessions: 1,
        tokensUsed: session.tokensUsed,
      });
    }
  });

  return Array.from(modelStats.values());
};

