// Model pricing configuration
// Text models: charged per token
// Image models: charged per image generated
// Audio models: charged per character/request

// ==================== PRICING CONSTANTS ====================
// These values define the business model

export const PRICING_CONFIG = {
  // Student pricing
  ENROLLMENT_FEE: 2000,        // What student pays (₹2,000)
  BUDGET_LIMIT: 1500,          // Actual API budget per student (₹1,500)
  DISPLAY_TOKENS: 50000,       // Virtual tokens shown to student (50,000)
  
  // Profit margin: ₹500 per student (ENROLLMENT_FEE - BUDGET_LIMIT)
};

// ==================== CONVERSION UTILITIES ====================

export const pricingUtils = {
  /**
   * Convert actual INR spent to virtual tokens used
   * Formula: Virtual Tokens Used = (Actual ₹ Spent / BUDGET_LIMIT) × DISPLAY_TOKENS
   */
  inrToVirtualTokens(inrSpent: number): number {
    return Math.round((inrSpent / PRICING_CONFIG.BUDGET_LIMIT) * PRICING_CONFIG.DISPLAY_TOKENS);
  },

  /**
   * Convert virtual tokens to INR equivalent
   * Formula: INR = (Virtual Tokens / DISPLAY_TOKENS) × BUDGET_LIMIT
   */
  virtualTokensToInr(virtualTokens: number): number {
    return (virtualTokens / PRICING_CONFIG.DISPLAY_TOKENS) * PRICING_CONFIG.BUDGET_LIMIT;
  },

  /**
   * Calculate remaining virtual tokens from budget used
   */
  getRemainingVirtualTokens(budgetUsed: number): number {
    const used = pricingUtils.inrToVirtualTokens(budgetUsed);
    return Math.max(0, PRICING_CONFIG.DISPLAY_TOKENS - used);
  },

  /**
   * Calculate remaining budget in INR
   */
  getRemainingBudget(budgetUsed: number): number {
    return Math.max(0, PRICING_CONFIG.BUDGET_LIMIT - budgetUsed);
  },

  /**
   * Calculate usage percentage
   */
  getUsagePercentage(budgetUsed: number): number {
    return Math.min(100, (budgetUsed / PRICING_CONFIG.BUDGET_LIMIT) * 100);
  },

  /**
   * Check if student has budget remaining
   */
  hasBudget(budgetUsed: number): boolean {
    return budgetUsed < PRICING_CONFIG.BUDGET_LIMIT;
  },
};

// ==================== MODEL PRICING ====================

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  category: 'text' | 'image' | 'audio' | 'multimodal' | 'code';
  pricingType: 'token' | 'per_request' | 'per_character';
  // For token-based: cost per 1000 tokens in INR
  // For per_request: cost per request in INR
  // For per_character: cost per 1000 characters in INR
  inputCostINR: number;   // INR per 1K input tokens
  outputCostINR: number;  // INR per 1K output tokens
  requestCostINR?: number; // INR per request (for image/audio)
}

export const modelPricing: Record<string, ModelPricing> = {
  // OpenAI Text Models - Token based (INR per 1K tokens)
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCostINR: 2.50,
    outputCostINR: 7.50,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'multimodal',
    pricingType: 'token',
    inputCostINR: 0.42,
    outputCostINR: 1.25,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'multimodal',
    pricingType: 'token',
    inputCostINR: 0.013,
    outputCostINR: 0.05,
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCostINR: 0.013,
    outputCostINR: 0.05,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputCostINR: 0.042,
    outputCostINR: 0.125,
  },
  
  // Anthropic Models
  'claude-opus-4.1': {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputCostINR: 1.25,
    outputCostINR: 6.25,
  },
  'claude-sonnet-4.5': {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputCostINR: 0.25,
    outputCostINR: 1.25,
  },
  'claude-haiku-4.5': {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputCostINR: 0.067,
    outputCostINR: 0.33,
  },
  
  // Google Models
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    category: 'multimodal',
    pricingType: 'token',
    inputCostINR: 0.006,
    outputCostINR: 0.025,
  },
  'gemini-2.0-flash-lite': {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    provider: 'Google',
    category: 'multimodal',
    pricingType: 'token',
    inputCostINR: 0.004,
    outputCostINR: 0.017,
  },
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    category: 'multimodal',
    pricingType: 'token',
    inputCostINR: 0.004,
    outputCostINR: 0.017,
  },
  
  // Image Models - Per request based (INR per image)
  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    category: 'image',
    pricingType: 'per_request',
    inputCostINR: 0,
    outputCostINR: 0,
    requestCostINR: 3.35, // ~$0.04 per image
  },
  
  // Audio Models - Per character based (INR per request/1K chars)
  'eleven-multilingual-v2': {
    id: 'eleven-multilingual-v2',
    name: 'Eleven Multilingual v2',
    provider: 'ElevenLabs',
    category: 'audio',
    pricingType: 'per_character',
    inputCostINR: 0,
    outputCostINR: 0,
    requestCostINR: 0.25, // per 1K characters
  },
};

// Calculate cost in INR for a request
export function calculateRequestCostINR(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  characterCount?: number
): number {
  const pricing = modelPricing[modelId];
  if (!pricing) {
    console.warn(`No pricing found for model: ${modelId}`);
    return 0;
  }
  
  switch (pricing.pricingType) {
    case 'token':
      const inputCost = (inputTokens / 1000) * pricing.inputCostINR;
      const outputCost = (outputTokens / 1000) * pricing.outputCostINR;
      return inputCost + outputCost;
    
    case 'per_request':
      return pricing.requestCostINR || 0;
    
    case 'per_character':
      const chars = characterCount || inputTokens * 4; // Estimate if not provided
      return (chars / 1000) * (pricing.requestCostINR || 0);
    
    default:
      return 0;
  }
}

// Calculate virtual tokens deducted for display
export function calculateVirtualTokensUsed(costINR: number): number {
  return pricingUtils.inrToVirtualTokens(costINR);
}

// Get display text for pricing type
export function getPricingDisplayText(modelId: string): string {
  const pricing = modelPricing[modelId];
  if (!pricing) return 'per request';
  
  switch (pricing.pricingType) {
    case 'token':
      return `₹${(pricing.inputCostINR + pricing.outputCostINR).toFixed(2)}/1K tokens`;
    case 'per_request':
      return `₹${pricing.requestCostINR?.toFixed(2)}/image`;
    case 'per_character':
      return `₹${pricing.requestCostINR?.toFixed(2)}/1K chars`;
    default:
      return 'per request';
  }
}

// Backward compatible alias - returns virtual tokens for display
// This converts the INR cost to virtual tokens for the UI
export function calculateRequestCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  characterCount?: number
): number {
  const costINR = calculateRequestCostINR(modelId, inputTokens, outputTokens, characterCount);
  return calculateVirtualTokensUsed(costINR);
}

