import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import modelRoutes from './routes/model.routes';
import sessionRoutes from './routes/session.routes';
import agentRoutes from './routes/agent.routes';
import artifactRoutes from './routes/artifact.routes';
import adminRoutes from './routes/admin.routes';
import comparisonRoutes from './routes/comparison.routes';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - supports multiple origins
// Set FRONTEND_URL as comma-separated list: "http://localhost:3000,https://app.example.com"
const allowedOrigins = config.frontendUrl.split(',').map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting - protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15-minute window
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limiting for AI-intensive endpoints (per-user)
// This prevents a single user from exhausting their budget too quickly
// or causing excessive API costs through rapid-fire requests
const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Max 10 AI requests per minute per user
  message: { 
    success: false, 
    error: 'Too many AI requests. Please wait a moment before sending more messages.',
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID from JWT token as key (falls back to IP if not authenticated)
  keyGenerator: (req) => {
    // Extract user ID from Authorization header if present
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        // Decode JWT payload (base64) to get userId - don't verify here, just extract
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        if (payload.userId) {
          return `user_${payload.userId}`;
        }
      } catch {
        // Fall through to IP-based limiting
      }
    }
    return req.ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for non-message endpoints within sessions/comparison
    // Only apply to actual AI generation endpoints
    const isMessageEndpoint = req.path.includes('/messages') && req.method === 'POST';
    const isCompareEndpoint = req.path.includes('/compare') && req.method === 'POST';
    return !isMessageEndpoint && !isCompareEndpoint;
  },
});

// Apply stricter rate limiting to AI-intensive routes
app.use('/api/sessions', aiRateLimiter);
app.use('/api/comparison', aiRateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comparison', comparisonRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
