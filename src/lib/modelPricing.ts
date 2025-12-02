// Model pricing configuration
// Text models: charged per token
// Image models: charged per image generated
// Audio models: charged per character/request

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  category: 'text' | 'image' | 'audio';
  pricingType: 'token' | 'per_request' | 'per_character';
  // For token-based: cost per 1000 tokens
  // For per_request: cost per request
  // For per_character: cost per 1000 characters
  inputCost: number;
  outputCost: number;
  // Flat cost per request (for image/audio)
  requestCost?: number;
}

export const modelPricing: Record<string, ModelPricing> = {
  // Text Models - Token based
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCost: 30, // tokens per 1000
    outputCost: 60,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCost: 5,
    outputCost: 15,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCost: 0.15,
    outputCost: 0.6,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCost: 0.5,
    outputCost: 1.5,
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputCost: 3,
    outputCost: 15,
  },
  'claude-haiku': {
    id: 'claude-haiku',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputCost: 0.8,
    outputCost: 4,
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    category: 'text',
    pricingType: 'token',
    inputCost: 0.075,
    outputCost: 0.3,
  },
  
  // Image Models - Per request based
  'dalle-3': {
    id: 'dalle-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    category: 'image',
    pricingType: 'per_request',
    inputCost: 0,
    outputCost: 0,
    requestCost: 500, // 500 tokens equivalent per image
  },
  
  // Audio Models - Per character based
  'elevenlabs': {
    id: 'elevenlabs',
    name: 'Eleven Multilingual v2',
    provider: 'ElevenLabs',
    category: 'audio',
    pricingType: 'per_character',
    inputCost: 0,
    outputCost: 0,
    requestCost: 200, // 200 tokens equivalent per 1000 characters
  },
};

// Calculate cost for a request
export function calculateRequestCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  characterCount?: number
): number {
  const pricing = modelPricing[modelId];
  if (!pricing) {
    // Default token-based pricing
    return inputTokens + outputTokens;
  }
  
  switch (pricing.pricingType) {
    case 'token':
      return Math.ceil((inputTokens * pricing.inputCost + outputTokens * pricing.outputCost) / 1000);
    
    case 'per_request':
      return pricing.requestCost || 500;
    
    case 'per_character':
      const chars = characterCount || inputTokens * 4; // Estimate if not provided
      return Math.ceil((chars / 1000) * (pricing.requestCost || 200));
    
    default:
      return inputTokens + outputTokens;
  }
}

// Get display text for pricing type
export function getPricingDisplayText(modelId: string): string {
  const pricing = modelPricing[modelId];
  if (!pricing) return 'tokens/request';
  
  switch (pricing.pricingType) {
    case 'token':
      return 'tokens/request';
    case 'per_request':
      return `${pricing.requestCost} tokens/image`;
    case 'per_character':
      return `${pricing.requestCost} tokens/1K chars`;
    default:
      return 'tokens/request';
  }
}

