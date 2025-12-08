// Pricing Configuration for GenAI Lab
// All costs are in INR (Indian Rupees)

export const PRICING_CONFIG = {
  // Student pricing
  ENROLLMENT_FEE: 2000,        // What student pays (₹2,000)
  BUDGET_LIMIT: 1500,          // Actual API budget per student (₹1,500)
  DISPLAY_TOKENS: 50000,       // Virtual tokens shown to student (50,000)
  
  // Profit margin: ₹500 per student (ENROLLMENT_FEE - BUDGET_LIMIT)
};

// Conversion functions
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

// AI Model pricing in INR per unit
// Text models: INR per 1K tokens
// Image models: INR per image
// Audio models: INR per 1K characters
export const MODEL_PRICING_INR: Record<string, {
  inputCostPer1K: number;   // INR per 1K input tokens
  outputCostPer1K: number;  // INR per 1K output tokens
  requestCost?: number;     // INR per request (for image/audio)
}> = {
  // OpenAI Models
  'gpt-4': { inputCostPer1K: 2.50, outputCostPer1K: 7.50 },
  'gpt-4o': { inputCostPer1K: 0.42, outputCostPer1K: 1.25 },
  'gpt-4o-mini': { inputCostPer1K: 0.013, outputCostPer1K: 0.05 },
  'gpt-4.1-mini': { inputCostPer1K: 0.013, outputCostPer1K: 0.05 },
  'gpt-3.5-turbo': { inputCostPer1K: 0.042, outputCostPer1K: 0.125 },
  'dall-e-3': { inputCostPer1K: 0, outputCostPer1K: 0, requestCost: 3.35 }, // ~$0.04/image
  
  // Anthropic Models
  'claude-opus-4.1': { inputCostPer1K: 1.25, outputCostPer1K: 6.25 },
  'claude-sonnet-4.5': { inputCostPer1K: 0.25, outputCostPer1K: 1.25 },
  'claude-haiku-4.5': { inputCostPer1K: 0.067, outputCostPer1K: 0.33 },
  
  // Google Models
  'gemini-2.0-flash': { inputCostPer1K: 0.006, outputCostPer1K: 0.025 },
  'gemini-2.0-flash-lite': { inputCostPer1K: 0.004, outputCostPer1K: 0.017 },
  'gemini-2.5-flash-lite': { inputCostPer1K: 0.004, outputCostPer1K: 0.017 },
  
  // ElevenLabs
  'eleven-multilingual-v2': { inputCostPer1K: 0, outputCostPer1K: 0, requestCost: 0.25 }, // per 1K chars
};

/**
 * Calculate cost in INR for a model usage
 */
export function calculateModelCostINR(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING_INR[modelId];
  if (!pricing) {
    console.warn(`No pricing found for model: ${modelId}`);
    return 0;
  }

  // For request-based models (image/audio)
  if (pricing.requestCost && pricing.requestCost > 0) {
    return pricing.requestCost;
  }

  // For token-based models
  const inputCost = (inputTokens / 1000) * pricing.inputCostPer1K;
  const outputCost = (outputTokens / 1000) * pricing.outputCostPer1K;
  
  return inputCost + outputCost;
}

export default PRICING_CONFIG;
