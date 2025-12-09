import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // AI Providers (optional - will use mock if not provided)
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    },
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY || '',
    },
  },
  
  // ==================== PRICING CONFIGURATION ====================
  // Student Billing Model:
  // - Student pays: ₹2,000 per enrollment
  // - Actual API budget: ₹1,500 (real cost limit)
  // - Profit margin: ₹500 per student
  // - Virtual display tokens: 50,000 (just for UI display)
  
  pricing: {
    // Enrollment fee charged to student (₹)
    enrollmentFee: 2000,
    
    // Actual API budget per student (₹) - this is the real spending limit
    studentBudgetINR: 1500,
    
    // Virtual tokens shown to student (display only)
    virtualTokenQuota: 50000,
    
    // USD to INR conversion rate (update periodically)
    usdToInr: 84,
  },
  
  // Default token quota for new students (virtual tokens)
  defaultTokenQuota: 50000,
};

// Helper functions for token/budget conversion
export const pricingHelpers = {
  /**
   * Convert actual INR spent to virtual tokens used
   * Formula: Virtual Tokens Used = (Actual ₹ Spent / Budget) × Virtual Quota
   */
  inrToVirtualTokens: (inrSpent: number): number => {
    const { studentBudgetINR, virtualTokenQuota } = config.pricing;
    return Math.round((inrSpent / studentBudgetINR) * virtualTokenQuota);
  },
  
  /**
   * Convert virtual tokens to INR equivalent
   * Formula: INR = (Virtual Tokens / Virtual Quota) × Budget
   */
  virtualTokensToInr: (tokens: number): number => {
    const { studentBudgetINR, virtualTokenQuota } = config.pricing;
    return (tokens / virtualTokenQuota) * studentBudgetINR;
  },
  
  /**
   * Get remaining virtual tokens from INR spent
   */
  getRemainingVirtualTokens: (inrSpent: number): number => {
    const { studentBudgetINR, virtualTokenQuota } = config.pricing;
    const remaining = Math.max(0, studentBudgetINR - inrSpent);
    return Math.round((remaining / studentBudgetINR) * virtualTokenQuota);
  },
  
  /**
   * Get remaining budget in INR
   */
  getRemainingBudgetINR: (inrSpent: number): number => {
    return Math.max(0, config.pricing.studentBudgetINR - inrSpent);
  },
  
  /**
   * Convert USD to INR
   */
  usdToInr: (usd: number): number => {
    return usd * config.pricing.usdToInr;
  },
};

export default config;

