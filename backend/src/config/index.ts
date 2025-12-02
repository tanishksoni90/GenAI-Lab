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
  
  // Default token quota for new students
  defaultTokenQuota: 10000,
};

export default config;

