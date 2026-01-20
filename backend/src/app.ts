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
import chatbotRoutes from './routes/chatbot.routes';
import artifactRoutes from './routes/artifact.routes';
import adminRoutes from './routes/admin.routes';
import comparisonRoutes from './routes/comparison.routes';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// Request body size limits - prevent DoS via large payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request ID middleware for tracing/debugging
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

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
      // Return false for proper CORS rejection (not an error/500)
      callback(null, false);
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
  // SECURITY NOTE: JWT is decoded but NOT verified here for performance.
  // This is acceptable because:
  // 1. IP-based fallback is the primary defense
  // 2. An attacker crafting fake JWTs still faces IP rate limiting
  // 3. Full JWT verification on every request would add latency
  // 4. Authenticated endpoints verify JWT properly via auth middleware
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

// Health check endpoint (before routes, no auth required)
app.get('/health', async (_req, res) => {
  try {
    // Quick DB connectivity check
    const { prisma } = await import('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: 'connected',
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      database: 'disconnected',
      error: config.isDev ? String(error) : 'Database connection failed',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chatbots', chatbotRoutes);
app.use('/api/artifacts', artifactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comparison', comparisonRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
