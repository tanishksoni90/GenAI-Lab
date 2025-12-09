import { prisma } from '../lib/prisma';
import { config } from '../config';
import { NotFoundError, BadRequestError } from '../utils/errors';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients (lazy initialization)
let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;
let googleClient: GoogleGenerativeAI | null = null;

const getOpenAIClient = (): OpenAI | null => {
  if (!config.ai.openai.apiKey) return null;
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.ai.openai.apiKey,
      baseURL: config.ai.openai.baseUrl,
    });
  }
  return openaiClient;
};

const getAnthropicClient = (): Anthropic | null => {
  if (!config.ai.anthropic.apiKey) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: config.ai.anthropic.apiKey,
    });
  }
  return anthropicClient;
};

const getGoogleClient = (): GoogleGenerativeAI | null => {
  if (!config.ai.google.apiKey) return null;
  if (!googleClient) {
    googleClient = new GoogleGenerativeAI(config.ai.google.apiKey);
  }
  return googleClient;
};

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

// ==================== REAL API IMPLEMENTATIONS ====================

// OpenAI API call (GPT models and DALL-E)
const callOpenAI = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  category: string
): Promise<{ content: string; tokensUsed: number }> => {
  const client = getOpenAIClient();
  if (!client) {
    throw new BadRequestError('OpenAI API key not configured');
  }

  // Handle image generation (DALL-E)
  if (category === 'image') {
    const response = await client.images.generate({
      model: modelId,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });
    
    const imageData = response.data?.[0];
    const imageUrl = imageData?.url || imageData?.b64_json || '';
    return {
      content: `![Generated Image](${imageUrl})\n\n*Image generated using ${modelId}*`,
      tokensUsed: 1000, // DALL-E has fixed per-image cost
    };
  }

  // Handle text/chat models
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
    { role: 'user' as const, content: prompt },
  ];

  const response = await client.chat.completions.create({
    model: modelId,
    messages,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || '';
  const tokensUsed = response.usage?.total_tokens || 
    Math.ceil(prompt.length / 4) + Math.ceil(content.length / 4);

  return { content, tokensUsed };
};

// Anthropic API call (Claude models)
const callAnthropic = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ content: string; tokensUsed: number }> => {
  const client = getAnthropicClient();
  if (!client) {
    throw new BadRequestError('Anthropic API key not configured');
  }

  // Convert history to Anthropic format
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: prompt },
  ];

  const response = await client.messages.create({
    model: modelId,
    max_tokens: 2048,
    messages,
  });

  const content = response.content[0]?.type === 'text' 
    ? response.content[0].text 
    : '';
  
  const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { content, tokensUsed };
};

// Google AI API call (Gemini models)
const callGoogle = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ content: string; tokensUsed: number }> => {
  const client = getGoogleClient();
  if (!client) {
    throw new BadRequestError('Google AI API key not configured');
  }

  const model = client.getGenerativeModel({ model: modelId });

  // Build conversation history for Gemini
  const history = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Start chat with history
  const chat = model.startChat({
    history: history as any,
  });

  const result = await chat.sendMessage(prompt);
  const response = await result.response;
  const content = response.text();

  // Estimate tokens (Gemini doesn't always return usage)
  const tokensUsed = Math.ceil(prompt.length / 4) + Math.ceil(content.length / 4);

  return { content, tokensUsed };
};

// ElevenLabs API call (Text-to-Speech)
const callElevenLabs = async (
  modelId: string,
  text: string
): Promise<{ content: string; tokensUsed: number }> => {
  const apiKey = config.ai.elevenlabs.apiKey;
  if (!apiKey) {
    throw new BadRequestError('ElevenLabs API key not configured');
  }

  // Default voice ID (Rachel - a neutral female voice)
  const voiceId = 'EXAVITQu4vr4xnSDxMaL';
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new BadRequestError(`ElevenLabs API error: ${error}`);
  }

  // Convert audio to base64
  const audioBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString('base64');
  
  return {
    content: `🎵 **Audio Generated**\n\n[Audio Player]\ndata:audio/mpeg;base64,${base64Audio}\n\n*Generated using ElevenLabs ${modelId}*`,
    tokensUsed: Math.ceil(text.length * 0.5), // ElevenLabs charges per character
  };
};

// Chat with AI model (mock or real)
export const chatWithModel = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
) => {
  const model = await getModelById(modelId);

  // Check if real API key is available for this provider
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

  // Call real API based on provider
  try {
    let result: { content: string; tokensUsed: number };

    switch (model.provider) {
      case 'openai':
        result = await callOpenAI(model.modelId, prompt, conversationHistory, model.category);
        break;
      
      case 'anthropic':
        result = await callAnthropic(model.modelId, prompt, conversationHistory);
        break;
      
      case 'google':
        result = await callGoogle(model.modelId, prompt, conversationHistory);
        break;
      
      case 'elevenlabs':
        result = await callElevenLabs(model.modelId, prompt);
        break;
      
      default:
        throw new BadRequestError(`Unknown provider: ${model.provider}`);
    }

    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      response: result.content,
      tokensUsed: result.tokensUsed,
      isMock: false,
    };
  } catch (error: any) {
    // Log the error for debugging
    console.error(`[AI Service] Error calling ${model.provider}:`, error.message);
    
    // If API call fails, fall back to mock with error notice
    const mockResult = generateMockResponse(prompt, model.name, model.category);
    
    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      response: `⚠️ **API Error**: ${error.message}\n\n---\n\n**Fallback Mock Response:**\n${mockResult.content}`,
      tokensUsed: mockResult.tokensUsed,
      isMock: true,
      error: error.message,
    };
  }
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

