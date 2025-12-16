// Pricing Configuration for GenAI Lab
// All costs are stored and calculated in USD (Universal Standard)
// AI providers quote prices in USD per 1M tokens

export const PRICING_CONFIG = {
  // Currency settings
  USD_TO_INR: 84,  // Exchange rate for display purposes only (update as needed)
  
  // Student budget (in USD)
  ENROLLMENT_FEE_INR: 2000,      // What student pays (₹2,000)
  BUDGET_LIMIT_USD: 18,          // Actual API budget per student (~$18 = ₹1,500 @ 84)
  DISPLAY_TOKENS: 50000,         // Virtual tokens shown to student (50,000)
  
  // Calculated values
  get BUDGET_LIMIT_INR() {
    return this.BUDGET_LIMIT_USD * this.USD_TO_INR;
  },
  get PROFIT_MARGIN_INR() {
    return this.ENROLLMENT_FEE_INR - this.BUDGET_LIMIT_INR;
  },
};

// Conversion functions
export const pricingUtils = {
  /**
   * Convert USD to INR for display
   */
  usdToInr(usd: number): number {
    return usd * PRICING_CONFIG.USD_TO_INR;
  },

  /**
   * Convert INR to USD
   */
  inrToUsd(inr: number): number {
    return inr / PRICING_CONFIG.USD_TO_INR;
  },

  /**
   * Convert actual USD spent to virtual tokens used
   * Formula: Virtual Tokens Used = (USD Spent / BUDGET_LIMIT_USD) × DISPLAY_TOKENS
   */
  usdToVirtualTokens(usdSpent: number): number {
    return Math.round((usdSpent / PRICING_CONFIG.BUDGET_LIMIT_USD) * PRICING_CONFIG.DISPLAY_TOKENS);
  },

  /**
   * Convert virtual tokens to USD equivalent
   */
  virtualTokensToUsd(virtualTokens: number): number {
    return (virtualTokens / PRICING_CONFIG.DISPLAY_TOKENS) * PRICING_CONFIG.BUDGET_LIMIT_USD;
  },

  /**
   * Calculate remaining virtual tokens from budget used (in USD)
   */
  getRemainingVirtualTokens(budgetUsedUsd: number): number {
    const used = pricingUtils.usdToVirtualTokens(budgetUsedUsd);
    return Math.max(0, PRICING_CONFIG.DISPLAY_TOKENS - used);
  },

  /**
   * Calculate remaining budget in USD
   */
  getRemainingBudgetUsd(budgetUsedUsd: number): number {
    return Math.max(0, PRICING_CONFIG.BUDGET_LIMIT_USD - budgetUsedUsd);
  },

  /**
   * Calculate usage percentage
   */
  getUsagePercentage(budgetUsedUsd: number): number {
    return Math.min(100, (budgetUsedUsd / PRICING_CONFIG.BUDGET_LIMIT_USD) * 100);
  },

  /**
   * Check if student has budget remaining
   */
  hasBudget(budgetUsedUsd: number): boolean {
    return budgetUsedUsd < PRICING_CONFIG.BUDGET_LIMIT_USD;
  },

  /**
   * Format USD amount for display
   */
  formatUsd(amount: number): string {
    return `$${amount.toFixed(4)}`;
  },

  /**
   * Format INR amount for display
   */
  formatInr(amount: number): string {
    return `₹${amount.toFixed(2)}`;
  },
};

// ==================== AI MODEL PRICING ====================
// All prices in USD per 1M tokens (as quoted by providers)
// Source: Official pricing pages of each provider

export interface ModelPricing {
  inputPer1M: number;     // USD per 1M input tokens
  outputPer1M: number;    // USD per 1M output tokens
  requestCost?: number;   // USD per request (for image/audio models)
}

export const MODEL_PRICING_USD: Record<string, ModelPricing> = {
  // ==================== OpenAI Models ====================
  // Source: https://openai.com/pricing
  'gpt-4o': { 
    inputPer1M: 2.50, 
    outputPer1M: 10.00 
  },
  'gpt-4o-mini': { 
    inputPer1M: 0.15, 
    outputPer1M: 0.60 
  },
  'gpt-4-turbo': { 
    inputPer1M: 10.00, 
    outputPer1M: 30.00 
  },
  'gpt-4': { 
    inputPer1M: 30.00, 
    outputPer1M: 60.00 
  },
  'gpt-3.5-turbo': { 
    inputPer1M: 0.50, 
    outputPer1M: 1.50 
  },
  'dall-e-3': { 
    inputPer1M: 0, 
    outputPer1M: 0, 
    requestCost: 0.04  // $0.04 per image (1024x1024)
  },
  
  // ==================== Google Models ====================
  // Source: https://ai.google.dev/pricing
  'gemini-2.0-flash': { 
    inputPer1M: 0.10, 
    outputPer1M: 0.40 
  },
  'gemini-2.0-flash-lite': { 
    inputPer1M: 0.075, 
    outputPer1M: 0.30 
  },
  'gemini-2.5-flash-preview-05-20': { 
    inputPer1M: 0.15, 
    outputPer1M: 0.60 
  },
  'gemini-1.5-flash': { 
    inputPer1M: 0.075, 
    outputPer1M: 0.30 
  },
  'gemini-1.5-pro': { 
    inputPer1M: 1.25, 
    outputPer1M: 5.00 
  },
  
  // ==================== Anthropic Models ====================
  // Source: https://www.anthropic.com/pricing
  'claude-sonnet-4-20250514': { 
    inputPer1M: 3.00, 
    outputPer1M: 15.00 
  },
  'claude-3-5-sonnet-20241022': { 
    inputPer1M: 3.00, 
    outputPer1M: 15.00 
  },
  'claude-3-5-haiku-20241022': { 
    inputPer1M: 0.80, 
    outputPer1M: 4.00 
  },
  'claude-3-opus-20240229': { 
    inputPer1M: 15.00, 
    outputPer1M: 75.00 
  },
  'claude-3-haiku-20240307': { 
    inputPer1M: 0.25, 
    outputPer1M: 1.25 
  },
  
  // ==================== ElevenLabs ====================
  // Source: https://elevenlabs.io/pricing
  'eleven_multilingual_v2': { 
    inputPer1M: 0, 
    outputPer1M: 0, 
    requestCost: 0.30  // ~$0.30 per 1K characters
  },
};

/**
 * Calculate cost in USD for a model usage
 * @param modelId - The model identifier (e.g., 'gpt-4o', 'gemini-2.0-flash')
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in USD
 */
export function calculateModelCostUSD(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING_USD[modelId];
  if (!pricing) {
    console.warn(`[Pricing] No pricing found for model: ${modelId}`);
    return 0;
  }

  // For request-based models (image/audio)
  if (pricing.requestCost && pricing.requestCost > 0) {
    return pricing.requestCost;
  }

  // For token-based models: (tokens / 1,000,000) × price_per_1M
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;
  
  return inputCost + outputCost;
}

/**
 * Get model pricing, with fallback to database values
 * @param modelId - The model identifier
 * @param dbInputCost - Fallback input cost from database (per 1K tokens)
 * @param dbOutputCost - Fallback output cost from database (per 1K tokens)
 */
export function getModelPricing(
  modelId: string,
  dbInputCost?: number,
  dbOutputCost?: number
): ModelPricing {
  // First check if we have pricing in our config
  if (MODEL_PRICING_USD[modelId]) {
    return MODEL_PRICING_USD[modelId];
  }
  
  // Fallback to database values (convert from per 1K to per 1M)
  if (dbInputCost !== undefined && dbOutputCost !== undefined) {
    return {
      inputPer1M: dbInputCost * 1000,  // Convert per 1K to per 1M
      outputPer1M: dbOutputCost * 1000,
    };
  }
  
  // Default fallback (very cheap model estimate)
  return {
    inputPer1M: 0.10,
    outputPer1M: 0.40,
  };
}

export default PRICING_CONFIG;
