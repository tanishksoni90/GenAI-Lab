import { prisma } from '../lib/prisma';
import { config } from '../config';
import { NotFoundError, BadRequestError } from '../utils/errors';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Cache for API keys from database (with TTL)
interface CachedApiKey {
  apiKey: string;
  baseUrl?: string | null;
  cachedAt: number;
}

const apiKeyCache: Map<string, CachedApiKey> = new Map();
const CACHE_TTL = 60000; // 1 minute cache

// Cache for AI clients (recreated when API keys change)
const clientCache: Map<string, { client: any; apiKey: string }> = new Map();

// Get API key from database with caching
const getApiKeyFromDB = async (provider: string): Promise<{ apiKey: string; baseUrl?: string | null } | null> => {
  const cacheKey = provider.toLowerCase();
  const cached = apiKeyCache.get(cacheKey);
  
  // Return cached value if still valid
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return { apiKey: cached.apiKey, baseUrl: cached.baseUrl };
  }
  
  // Fetch from database
  const key = await prisma.aPIKey.findUnique({
    where: { provider: cacheKey },
  });
  
  if (key && key.apiKey && key.isActive) {
    apiKeyCache.set(cacheKey, {
      apiKey: key.apiKey,
      baseUrl: key.baseUrl,
      cachedAt: Date.now(),
    });
    return { apiKey: key.apiKey, baseUrl: key.baseUrl };
  }
  
  // Clear cache if key not found or inactive
  apiKeyCache.delete(cacheKey);
  return null;
};

// Get OpenAI client (creates new client if API key changed)
const getOpenAIClient = async (): Promise<OpenAI | null> => {
  const keyData = await getApiKeyFromDB('openai');
  if (!keyData) return null;
  
  const cached = clientCache.get('openai');
  if (cached && cached.apiKey === keyData.apiKey) {
    return cached.client as OpenAI;
  }
  
  // Create new client
  const client = new OpenAI({
    apiKey: keyData.apiKey,
    baseURL: keyData.baseUrl || 'https://api.openai.com/v1',
  });
  
  clientCache.set('openai', { client, apiKey: keyData.apiKey });
  return client;
};

// Get Anthropic client
const getAnthropicClient = async (): Promise<Anthropic | null> => {
  const keyData = await getApiKeyFromDB('anthropic');
  if (!keyData) return null;
  
  const cached = clientCache.get('anthropic');
  if (cached && cached.apiKey === keyData.apiKey) {
    return cached.client as Anthropic;
  }
  
  const client = new Anthropic({
    apiKey: keyData.apiKey,
  });
  
  clientCache.set('anthropic', { client, apiKey: keyData.apiKey });
  return client;
};

// Get Google client
const getGoogleClient = async (): Promise<GoogleGenerativeAI | null> => {
  const keyData = await getApiKeyFromDB('google');
  if (!keyData) return null;
  
  const cached = clientCache.get('google');
  if (cached && cached.apiKey === keyData.apiKey) {
    return cached.client as GoogleGenerativeAI;
  }
  
  const client = new GoogleGenerativeAI(keyData.apiKey);
  
  clientCache.set('google', { client, apiKey: keyData.apiKey });
  return client;
};

// Check if real API keys are configured (from database)
const hasRealApiKey = async (provider: string): Promise<boolean> => {
  const keyData = await getApiKeyFromDB(provider.toLowerCase());
  return !!keyData;
};

// Clear API key cache (call when keys are updated via admin dashboard)
export const clearApiKeyCache = (provider?: string) => {
  if (provider) {
    apiKeyCache.delete(provider.toLowerCase());
    clientCache.delete(provider.toLowerCase());
  } else {
    apiKeyCache.clear();
    clientCache.clear();
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
): Promise<{ content: string; tokensUsed: number; inputTokens: number; outputTokens: number }> => {
  const client = await getOpenAIClient();
  if (!client) {
    throw new BadRequestError('OpenAI API key not configured. Please add it in Admin Dashboard → API Keys.');
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
      inputTokens: 0,
      outputTokens: 1000,
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
    max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
  });

  const content = response.choices[0]?.message?.content || '';
  
  // Get actual token counts from API response
  const inputTokens = response.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
  const outputTokens = response.usage?.completion_tokens || Math.ceil(content.length / 4);
  const tokensUsed = response.usage?.total_tokens || (inputTokens + outputTokens);

  return { content, tokensUsed, inputTokens, outputTokens };
};

// Anthropic API call (Claude models)
const callAnthropic = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ content: string; tokensUsed: number; inputTokens: number; outputTokens: number }> => {
  const client = await getAnthropicClient();
  if (!client) {
    throw new BadRequestError('Anthropic API key not configured. Please add it in Admin Dashboard → API Keys.');
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
    max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
    messages,
  });

  const content = response.content[0]?.type === 'text' 
    ? response.content[0].text 
    : '';
  
  // Get actual token counts from API response
  const inputTokens = response.usage?.input_tokens || Math.ceil(prompt.length / 4);
  const outputTokens = response.usage?.output_tokens || Math.ceil(content.length / 4);
  const tokensUsed = inputTokens + outputTokens;

  return { content, tokensUsed, inputTokens, outputTokens };
};

// Default max output tokens for responses (can be made configurable later)
const DEFAULT_MAX_OUTPUT_TOKENS = 1024;

// Google AI API call (Gemini models)
const callGoogle = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ content: string; tokensUsed: number; inputTokens: number; outputTokens: number }> => {
  const client = await getGoogleClient();
  if (!client) {
    throw new BadRequestError('Google AI API key not configured. Please add it in Admin Dashboard → API Keys.');
  }

  // Configure model with generation settings including max output tokens
  const model = client.getGenerativeModel({ 
    model: modelId,
    generationConfig: {
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
  });

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

  // Get actual token counts from API response (usageMetadata)
  // IMPORTANT: Gemini's promptTokenCount is CUMULATIVE (includes all history)
  // We need to calculate the INCREMENTAL tokens for just this exchange
  const usageMetadata = response.usageMetadata;
  
  // Calculate history tokens to subtract from cumulative promptTokenCount
  // Each message in history contributes to the prompt token count
  const historyText = conversationHistory.map(m => m.content).join('');
  const estimatedHistoryTokens = Math.ceil(historyText.length / 4);
  
  // The cumulative prompt token count from Gemini
  const cumulativePromptTokens = usageMetadata?.promptTokenCount || 0;
  
  // Calculate incremental input tokens (just for this prompt, not including history)
  // If we have history, subtract estimated history tokens; otherwise use the prompt tokens directly
  let inputTokens: number;
  if (conversationHistory.length > 0 && cumulativePromptTokens > 0) {
    // Subtract history tokens to get just the new prompt's tokens
    inputTokens = Math.max(Math.ceil(prompt.length / 4), cumulativePromptTokens - estimatedHistoryTokens);
    // Sanity check: input tokens should be roughly proportional to prompt length
    const promptEstimate = Math.ceil(prompt.length / 4);
    if (inputTokens > promptEstimate * 3) {
      // If calculated value seems too high, use estimate
      inputTokens = promptEstimate;
    }
  } else {
    inputTokens = cumulativePromptTokens || Math.ceil(prompt.length / 4);
  }
  
  // Output tokens are NOT cumulative, they're just for this response
  const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(content.length / 4);
  
  // Total tokens used for THIS exchange only (not cumulative)
  const tokensUsed = inputTokens + outputTokens;

  return { content, tokensUsed, inputTokens, outputTokens };
};

// ElevenLabs API call (Text-to-Speech)
const callElevenLabs = async (
  modelId: string,
  text: string
): Promise<{ content: string; tokensUsed: number }> => {
  const keyData = await getApiKeyFromDB('elevenlabs');
  if (!keyData) {
    throw new BadRequestError('ElevenLabs API key not configured. Please add it in Admin Dashboard → API Keys.');
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
        'xi-api-key': keyData.apiKey,
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

// ==================== STREAMING API IMPLEMENTATIONS ====================

// Streaming callback type
export type StreamCallback = (chunk: string, done: boolean) => void;

// OpenAI Streaming
const streamOpenAI = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onChunk: StreamCallback
): Promise<{ tokensUsed: number; inputTokens: number; outputTokens: number }> => {
  const client = await getOpenAIClient();
  if (!client) {
    throw new BadRequestError('OpenAI API key not configured. Please add it in Admin Dashboard → API Keys.');
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
    { role: 'user' as const, content: prompt },
  ];

  const stream = await client.chat.completions.create({
    model: modelId,
    messages,
    max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
    stream: true,
    stream_options: { include_usage: true }, // Request usage in final chunk
  });

  let fullContent = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let tokensUsed = 0;

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullContent += content;
      onChunk(content, false);
    }
    
    // Get usage from final chunk (with stream_options: { include_usage: true })
    if (chunk.usage) {
      inputTokens = chunk.usage.prompt_tokens || 0;
      outputTokens = chunk.usage.completion_tokens || 0;
      tokensUsed = chunk.usage.total_tokens || 0;
    }
  }

  onChunk('', true); // Signal completion

  // Fallback to estimation if not provided
  if (tokensUsed === 0) {
    inputTokens = Math.ceil(prompt.length / 4);
    outputTokens = Math.ceil(fullContent.length / 4);
    tokensUsed = inputTokens + outputTokens;
  }

  return { tokensUsed, inputTokens, outputTokens };
};

// Anthropic Streaming
const streamAnthropic = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onChunk: StreamCallback
): Promise<{ tokensUsed: number; inputTokens: number; outputTokens: number }> => {
  const client = await getAnthropicClient();
  if (!client) {
    throw new BadRequestError('Anthropic API key not configured. Please add it in Admin Dashboard → API Keys.');
  }

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: prompt },
  ];

  const stream = await client.messages.stream({
    model: modelId,
    max_tokens: DEFAULT_MAX_OUTPUT_TOKENS,
    messages,
  });

  let inputTokens = 0;
  let outputTokens = 0;

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text, false);
    }
    // Capture input tokens from message_start event
    if (event.type === 'message_start' && event.message?.usage) {
      inputTokens = event.message.usage.input_tokens || 0;
    }
    // Capture output tokens from message_delta event
    if (event.type === 'message_delta' && event.usage) {
      outputTokens = event.usage.output_tokens || 0;
    }
  }

  // Get final message for complete token counts
  const finalMessage = await stream.finalMessage();
  inputTokens = finalMessage.usage?.input_tokens || inputTokens;
  outputTokens = finalMessage.usage?.output_tokens || outputTokens;
  const tokensUsed = inputTokens + outputTokens;

  onChunk('', true); // Signal completion

  return { tokensUsed, inputTokens, outputTokens };
};

// Google Streaming
const streamGoogle = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onChunk: StreamCallback
): Promise<{ tokensUsed: number; inputTokens: number; outputTokens: number }> => {
  const client = await getGoogleClient();
  if (!client) {
    throw new BadRequestError('Google AI API key not configured. Please add it in Admin Dashboard → API Keys.');
  }

  // Configure model with generation settings including max output tokens
  const model = client.getGenerativeModel({ 
    model: modelId,
    generationConfig: {
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    },
  });

  const history = conversationHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: history as any,
  });

  const result = await chat.sendMessageStream(prompt);
  
  let fullContent = '';

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullContent += text;
      onChunk(text, false);
    }
  }

  onChunk('', true); // Signal completion

  // Get actual token counts from final response
  // IMPORTANT: Gemini's promptTokenCount is CUMULATIVE (includes all history)
  // We need to calculate the INCREMENTAL tokens for just this exchange
  const response = await result.response;
  const usageMetadata = response.usageMetadata;
  
  // Calculate history tokens to subtract from cumulative promptTokenCount
  const historyText = conversationHistory.map(m => m.content).join('');
  const estimatedHistoryTokens = Math.ceil(historyText.length / 4);
  
  // The cumulative prompt token count from Gemini
  const cumulativePromptTokens = usageMetadata?.promptTokenCount || 0;
  
  // Calculate incremental input tokens (just for this prompt, not including history)
  let inputTokens: number;
  if (conversationHistory.length > 0 && cumulativePromptTokens > 0) {
    inputTokens = Math.max(Math.ceil(prompt.length / 4), cumulativePromptTokens - estimatedHistoryTokens);
    const promptEstimate = Math.ceil(prompt.length / 4);
    if (inputTokens > promptEstimate * 3) {
      inputTokens = promptEstimate;
    }
  } else {
    inputTokens = cumulativePromptTokens || Math.ceil(prompt.length / 4);
  }
  
  // Output tokens are NOT cumulative, they're just for this response
  const outputTokens = usageMetadata?.candidatesTokenCount || Math.ceil(fullContent.length / 4);
  
  // Total tokens used for THIS exchange only (not cumulative)
  const tokensUsed = inputTokens + outputTokens;

  return { tokensUsed, inputTokens, outputTokens };
};

// Stream with AI model
export const streamWithModel = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onChunk: StreamCallback
): Promise<{
  model: { id: string; name: string; provider: string; category: string };
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  isMock: boolean;
}> => {
  const model = await getModelById(modelId);

  // Check if real API key is available
  const useMock = !(await hasRealApiKey(model.provider));

  if (useMock) {
    // Simulate streaming for mock responses
    const mockResult = generateMockResponse(prompt, model.name, model.category);
    const words = mockResult.content.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      onChunk(word, false);
      // Small delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    onChunk('', true);

    // Estimate tokens for mock (no real API to get actual counts)
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(mockResult.content.length / 4);

    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      tokensUsed: mockResult.tokensUsed,
      inputTokens,
      outputTokens,
      isMock: true,
    };
  }

  // Stream from real API
  try {
    let result: { tokensUsed: number; inputTokens: number; outputTokens: number };

    switch (model.provider) {
      case 'openai':
        result = await streamOpenAI(model.modelId, prompt, conversationHistory, onChunk);
        break;
      
      case 'anthropic':
        result = await streamAnthropic(model.modelId, prompt, conversationHistory, onChunk);
        break;
      
      case 'google':
        result = await streamGoogle(model.modelId, prompt, conversationHistory, onChunk);
        break;
      
      default:
        // Fallback to non-streaming for unsupported providers
        const nonStreamResult = await chatWithModel(modelId, prompt, conversationHistory);
        onChunk(nonStreamResult.response, true);
        return {
          model: {
            id: model.id,
            name: model.name,
            provider: model.provider,
            category: model.category,
          },
          tokensUsed: nonStreamResult.tokensUsed,
          inputTokens: nonStreamResult.inputTokens,
          outputTokens: nonStreamResult.outputTokens,
          isMock: nonStreamResult.isMock,
        };
    }

    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      tokensUsed: result.tokensUsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      isMock: false,
    };
  } catch (error: any) {
    console.error(`[AI Service] Streaming error for ${model.provider}:`, error.message);
    
    // Send error message as stream
    onChunk(`⚠️ **API Error**: ${error.message}`, true);

    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      tokensUsed: 0,
      inputTokens: 0,
      outputTokens: 0,
      isMock: true,
    };
  }
};

// Chat with AI model (mock or real)
export const chatWithModel = async (
  modelId: string,
  prompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
) => {
  const model = await getModelById(modelId);

  // Check if real API key is available for this provider (from database)
  const useMock = !(await hasRealApiKey(model.provider));

  if (useMock) {
    const mockResult = generateMockResponse(prompt, model.name, model.category);
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(mockResult.content.length / 4);
    
    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      response: mockResult.content,
      tokensUsed: mockResult.tokensUsed,
      inputTokens,
      outputTokens,
      isMock: true,
    };
  }

  // Call real API based on provider
  try {
    let result: { content: string; tokensUsed: number; inputTokens: number; outputTokens: number };

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
        const elevenResult = await callElevenLabs(model.modelId, prompt);
        result = { ...elevenResult, inputTokens: 0, outputTokens: elevenResult.tokensUsed };
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
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      isMock: false,
    };
  } catch (error: any) {
    // Log the error for debugging
    console.error(`[AI Service] Error calling ${model.provider}:`, error.message);
    
    // If API call fails, fall back to mock with error notice
    const mockResult = generateMockResponse(prompt, model.name, model.category);
    const inputTokens = Math.ceil(prompt.length / 4);
    const outputTokens = Math.ceil(mockResult.content.length / 4);
    
    return {
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider,
        category: model.category,
      },
      response: `⚠️ **API Error**: ${error.message}\n\n---\n\n**Fallback Mock Response:**\n${mockResult.content}`,
      tokensUsed: mockResult.tokensUsed,
      inputTokens,
      outputTokens,
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

