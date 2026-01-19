import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ==================== SECURITY VALIDATION ====================
// In production, JWT secrets MUST be set via environment variables
// Using default/fallback secrets in production is a critical security risk
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('change-in-production')) {
    console.error('FATAL: JWT_SECRET environment variable must be set in production');
    process.exit(1);
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('change-in-production')) {
    console.error('FATAL: JWT_REFRESH_SECRET environment variable must be set in production');
    process.exit(1);
  }
}

// Development fallbacks - ONLY for local development convenience
const devJwtSecret = 'dev-only-secret-do-not-use-in-production-' + Date.now();
const devRefreshSecret = 'dev-only-refresh-do-not-use-in-production-' + Date.now();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // JWT - No predictable fallbacks in production
  jwt: {
    secret: process.env.JWT_SECRET || (isProduction ? '' : devJwtSecret),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (isProduction ? '' : devRefreshSecret),
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // AI Providers
  // ⚠️ API KEYS ARE NOW MANAGED VIA ADMIN DASHBOARD (stored in database)
  // These config values are kept for backwards compatibility but are no longer used.
  // All API key lookups now go through the database via admin.service.ts
  ai: {
    openai: {
      apiKey: '', // Managed via Admin Dashboard → API Keys
      baseUrl: 'https://api.openai.com/v1',
    },
    google: {
      apiKey: '', // Managed via Admin Dashboard → API Keys
    },
    anthropic: {
      apiKey: '', // Managed via Admin Dashboard → API Keys
    },
    elevenlabs: {
      apiKey: '', // Managed via Admin Dashboard → API Keys
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

