import app from './app';
import { config } from './config';
import { prisma } from './lib/prisma';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start server
    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 GenAI Lab Backend Server                            ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║   Port: ${config.port.toString().padEnd(47)}║
║   URL: http://localhost:${config.port.toString().padEnd(35)}║
║                                                           ║
║   API Endpoints:                                          ║
║   - Health: GET /health                                   ║
║   - Auth: /api/auth/*                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

