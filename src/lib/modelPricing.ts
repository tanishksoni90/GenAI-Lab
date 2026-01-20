// Model pricing configuration - All prices in USD
// Text models: charged per 1M tokens (USD)
// Image models: charged per image generated (USD)
// Audio models: charged per 1K characters (USD)

// ==================== PRICING CONSTANTS ====================
// These values define the business model

export const PRICING_CONFIG = {
  // Student pricing
  ENROLLMENT_FEE_INR: 2000,      // What student pays (₹2,000)
  BUDGET_LIMIT_USD: 18,          // Actual API budget per student (~$18 USD)
  DISPLAY_TOKENS: 50000,         // Virtual tokens shown to student (50,000)
  USD_TO_INR: 84,                // Exchange rate for display purposes
  
  // Business model: ₹2000 enrollment → $18 API budget (~₹1512 at 84 INR/USD)
  // Profit margin: ~₹488 per student
};

// ==================== CONVERSION UTILITIES ====================

export const pricingUtils = {
  /**
   * Convert actual USD spent to virtual tokens used
   * Formula: Virtual Tokens Used = (USD Spent / BUDGET_LIMIT_USD) × DISPLAY_TOKENS
   */
  usdToVirtualTokens(usdSpent: number): number {
    return Math.round((usdSpent / PRICING_CONFIG.BUDGET_LIMIT_USD) * PRICING_CONFIG.DISPLAY_TOKENS);
  },

  /**
   * Convert virtual tokens to USD equivalent
   * Formula: USD = (Virtual Tokens / DISPLAY_TOKENS) × BUDGET_LIMIT_USD
   */
  virtualTokensToUsd(virtualTokens: number): number {
    return (virtualTokens / PRICING_CONFIG.DISPLAY_TOKENS) * PRICING_CONFIG.BUDGET_LIMIT_USD;
  },

  /**
   * Convert USD to INR for display
   */
  usdToInr(usd: number): number {
    return usd * PRICING_CONFIG.USD_TO_INR;
  },

  /**
   * Calculate remaining virtual tokens from budget used (USD)
   */
  getRemainingVirtualTokens(budgetUsedUSD: number): number {
    const used = pricingUtils.usdToVirtualTokens(budgetUsedUSD);
    return Math.max(0, PRICING_CONFIG.DISPLAY_TOKENS - used);
  },

  /**
   * Calculate remaining budget in USD
   */
  getRemainingBudgetUSD(budgetUsedUSD: number): number {
    return Math.max(0, PRICING_CONFIG.BUDGET_LIMIT_USD - budgetUsedUSD);
  },

  /**
   * Calculate usage percentage
   */
  getUsagePercentage(budgetUsedUSD: number): number {
    return Math.min(100, (budgetUsedUSD / PRICING_CONFIG.BUDGET_LIMIT_USD) * 100);
  },

  /**
   * Check if student has budget remaining
   */
  hasBudget(budgetUsedUSD: number): boolean {
    return budgetUsedUSD < PRICING_CONFIG.BUDGET_LIMIT_USD;
  },
};

// ==================== MODEL PRICING (USD per 1M tokens) ====================

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  category: 'text' | 'image' | 'audio' | 'multimodal' | 'code';
  pricingType: 'token' | 'per_request' | 'per_character';
  // For token-based: USD per 1M tokens
  // For per_request: USD per request
  // For per_character: USD per 1K characters
  inputPer1M: number;     // USD per 1M input tokens
  outputPer1M: number;    // USD per 1M output tokens
  requestCost?: number;   // USD per request (for image/audio)
}

export const modelPricing: Record<string, ModelPricing> = {
  // OpenAI Text Models - USD per 1M tokens
  'gpt-4': {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputPer1M: 30.00,
    outputPer1M: 60.00,
  },
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    category: 'multimodal',
    pricingType: 'token',
    inputPer1M: 2.50,
    outputPer1M: 10.00,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'multimodal',
    pricingType: 'token',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    category: 'text',
    pricingType: 'token',
    inputPer1M: 0.50,
    outputPer1M: 1.50,
  },
  
  // Anthropic Models - USD per 1M tokens
  'claude-opus-4.1': {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputPer1M: 15.00,
    outputPer1M: 75.00,
  },
  'claude-sonnet-4.5': {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputPer1M: 3.00,
    outputPer1M: 15.00,
  },
  'claude-haiku-4.5': {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    category: 'text',
    pricingType: 'token',
    inputPer1M: 0.25,
    outputPer1M: 1.25,
  },
  
  // Google Models - USD per 1M tokens
  // Note: modelId uses 'models/' prefix for Google API
  'models/gemini-2.5-flash': {
    id: 'models/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    category: 'multimodal',
    pricingType: 'token',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
  },
  'models/gemini-2.5-pro': {
    id: 'models/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    category: 'multimodal',
    pricingType: 'token',
    inputPer1M: 1.25,
    outputPer1M: 5.00,
  },
  'models/gemini-2.0-flash': {
    id: 'models/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    category: 'multimodal',
    pricingType: 'token',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
  },
  'models/gemini-2.0-flash-exp-image-generation': {
    id: 'models/gemini-2.0-flash-exp-image-generation',
    name: 'Gemini 2.0 Flash Image',
    provider: 'Google',
    category: 'image',
    pricingType: 'per_request',
    inputPer1M: 0,
    outputPer1M: 0,
    requestCost: 0.04, // Per image cost estimate
  },
  
  // Image Models - USD per request
  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    category: 'image',
    pricingType: 'per_request',
    inputPer1M: 0,
    outputPer1M: 0,
    requestCost: 0.04, // $0.04 per image (1024x1024)
  },
  
  // Audio Models - USD per 1K characters
  'eleven-multilingual-v2': {
    id: 'eleven-multilingual-v2',
    name: 'Eleven Multilingual v2',
    provider: 'ElevenLabs',
    category: 'audio',
    pricingType: 'per_character',
    inputPer1M: 0,
    outputPer1M: 0,
    requestCost: 0.00024, // $0.00024 per character (~$0.24 per 1K chars)
  },
};

// Calculate cost in USD for a request
export function calculateRequestCostUSD(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  characterCount?: number
): number {
  // Normalize modelId: try exact match first, then with/without 'models/' prefix
  let pricing = modelPricing[modelId];
  if (!pricing) {
    // Try adding 'models/' prefix for Google models
    if (!modelId.startsWith('models/')) {
      pricing = modelPricing[`models/${modelId}`];
    } else {
      // Try stripping 'models/' prefix
      pricing = modelPricing[modelId.replace('models/', '')];
    }
  }
  
  if (!pricing) {
    console.warn(`No pricing found for model: ${modelId}`);
    return 0;
  }
  
  switch (pricing.pricingType) {
    case 'token':
      const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
      const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
      return inputCost + outputCost;
    
    case 'per_request':
      return pricing.requestCost || 0;
    
    case 'per_character':
      const chars = characterCount || inputTokens * 4; // Estimate if not provided
      return chars * (pricing.requestCost || 0);
    
    default:
      return 0;
  }
}

// Calculate virtual tokens deducted for display
export function calculateVirtualTokensUsed(costUSD: number): number {
  return pricingUtils.usdToVirtualTokens(costUSD);
}

// Get display text for pricing type (shows USD)
export function getPricingDisplayText(modelId: string): string {
  const pricing = modelPricing[modelId];
  if (!pricing) return 'per request';
  
  switch (pricing.pricingType) {
    case 'token':
      // Show cost per 1K tokens for readability
      const per1K = ((pricing.inputPer1M + pricing.outputPer1M) / 2) / 1000;
      return `$${per1K.toFixed(4)}/1K tokens`;
    case 'per_request':
      return `$${pricing.requestCost?.toFixed(2)}/image`;
    case 'per_character':
      // Show per 1K chars
      const per1KChars = (pricing.requestCost || 0) * 1000;
      return `$${per1KChars.toFixed(2)}/1K chars`;
    default:
      return 'per request';
  }
}

// Backward compatible alias - returns virtual tokens for display
// This converts the USD cost to virtual tokens for the UI
export function calculateRequestCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  characterCount?: number
): number {
  const costUSD = calculateRequestCostUSD(modelId, inputTokens, outputTokens, characterCount);
  return calculateVirtualTokensUsed(costUSD);
}

// Legacy aliases for backward compatibility
export const calculateRequestCostINR = (
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  characterCount?: number
): number => {
  const costUSD = calculateRequestCostUSD(modelId, inputTokens, outputTokens, characterCount);
  return pricingUtils.usdToInr(costUSD);
};
