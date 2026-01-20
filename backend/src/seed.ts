import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== PRICING REFERENCE ====================
// All prices in USD per 1M tokens (industry standard)
// Sources: Official pricing pages of each provider
// Last updated: December 2024
// 
// Note: inputCost and outputCost in the database are LEGACY fields (per 1K tokens)
// The pricing config (backend/src/config/pricing.ts) has the authoritative per 1M prices
// These DB values are used as fallback only

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create AI Models
  // Note: inputCost/outputCost are USD per 1K tokens (legacy) - actual pricing is in config/pricing.ts
  console.log('Creating AI Models...');
  const models = await Promise.all([
    // ==================== OpenAI Models ====================
    // Source: https://openai.com/pricing
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'gpt-4o' } },
      update: {
        description: "GPT-4o (\"o\" for \"omni\") is OpenAI's most advanced multimodal model. It accepts text and image inputs and produces text outputs. GPT-4o is faster, cheaper, and offers higher rate limits compared to GPT-4 Turbo.",
        maxTokens: 128000,
        // USD per 1K tokens (per 1M: input=$2.50, output=$10.00)
        inputCost: 0.0025,
        outputCost: 0.01,
      },
      create: {
        name: 'GPT-4o',
        provider: 'openai',
        modelId: 'gpt-4o',
        category: 'text',
        description: "GPT-4o (\"o\" for \"omni\") is OpenAI's most advanced multimodal model. It accepts text and image inputs and produces text outputs. GPT-4o is faster, cheaper, and offers higher rate limits compared to GPT-4 Turbo.",
        inputCost: 0.0025,  // $2.50/1M = $0.0025/1K
        outputCost: 0.01,   // $10.00/1M = $0.01/1K
        maxTokens: 128000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'gpt-4o-mini' } },
      update: {
        description: "GPT-4o mini is OpenAI's affordable small model for lightweight tasks. It is multimodal, accepting text or image inputs and outputting text. Ideal for fine-tuning and multi-step workflows.",
        maxTokens: 128000,
        inputCost: 0.00015,  // $0.15/1M
        outputCost: 0.0006,  // $0.60/1M
      },
      create: {
        name: 'GPT-4o Mini',
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        category: 'text',
        description: "GPT-4o mini is OpenAI's affordable small model for lightweight tasks. It is multimodal, accepting text or image inputs and outputting text. Ideal for fine-tuning and multi-step workflows.",
        inputCost: 0.00015,  // $0.15/1M = $0.00015/1K
        outputCost: 0.0006,  // $0.60/1M = $0.0006/1K
        maxTokens: 128000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'gpt-3.5-turbo' } },
      update: {
        description: "GPT-3.5 Turbo is optimized for dialogue. It supports a 16K token context and excels at understanding and generating natural language or code.",
        maxTokens: 16385,
        inputCost: 0.0005,   // $0.50/1M
        outputCost: 0.0015,  // $1.50/1M
      },
      create: {
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        category: 'text',
        description: "GPT-3.5 Turbo is optimized for dialogue. It supports a 16K token context and excels at understanding and generating natural language or code.",
        inputCost: 0.0005,   // $0.50/1M = $0.0005/1K
        outputCost: 0.0015,  // $1.50/1M = $0.0015/1K
        maxTokens: 16385,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'dall-e-3' } },
      update: {
        description: 'Most advanced image generation model from OpenAI. $0.04 per image (1024x1024).',
        inputCost: 0.04,  // Per image cost (not per token)
        outputCost: 0,
      },
      create: {
        name: 'DALL-E 3',
        provider: 'openai',
        modelId: 'dall-e-3',
        category: 'image',
        description: 'Most advanced image generation model from OpenAI. $0.04 per image (1024x1024).',
        inputCost: 0.04,  // Per image cost
        outputCost: 0,
        maxTokens: 0,
      },
    }),
    
    // ==================== Google Models ====================
    // Source: https://ai.google.dev/pricing
    // Note: modelId must use 'models/' prefix for Google API
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'google', modelId: 'models/gemini-2.5-flash' } },
      update: {
        description: "Gemini 2.5 Flash - Google's latest fast model with enhanced reasoning capabilities. Optimized for speed and efficiency.",
        maxTokens: 1048576,
        inputCost: 0.00015,  // $0.15/1M
        outputCost: 0.0006,  // $0.60/1M
      },
      create: {
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        modelId: 'models/gemini-2.5-flash',
        category: 'text',
        description: "Gemini 2.5 Flash - Google's latest fast model with enhanced reasoning capabilities. Optimized for speed and efficiency.",
        inputCost: 0.00015,  // $0.15/1M = $0.00015/1K
        outputCost: 0.0006,  // $0.60/1M = $0.0006/1K
        maxTokens: 1048576,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'google', modelId: 'models/gemini-2.5-pro' } },
      update: {
        description: "Gemini 2.5 Pro - Google's most capable model for complex reasoning, coding, and analysis tasks. Best for advanced use cases.",
        maxTokens: 1048576,
        inputCost: 0.00125,  // $1.25/1M
        outputCost: 0.005,   // $5.00/1M
      },
      create: {
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        modelId: 'models/gemini-2.5-pro',
        category: 'text',
        description: "Gemini 2.5 Pro - Google's most capable model for complex reasoning, coding, and analysis tasks. Best for advanced use cases.",
        inputCost: 0.00125,  // $1.25/1M = $0.00125/1K
        outputCost: 0.005,   // $5.00/1M = $0.005/1K
        maxTokens: 1048576,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'google', modelId: 'models/gemini-2.0-flash' } },
      update: {
        description: "Gemini 2.0 Flash - Fast, high-performing multimodal model. Delivers low-latency responses. Ideal for real-time applications.",
        maxTokens: 1000000,
        inputCost: 0.0001,   // $0.10/1M
        outputCost: 0.0004,  // $0.40/1M
      },
      create: {
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        modelId: 'models/gemini-2.0-flash',
        category: 'text',
        description: "Gemini 2.0 Flash - Fast, high-performing multimodal model. Delivers low-latency responses. Ideal for real-time applications.",
        inputCost: 0.0001,   // $0.10/1M = $0.0001/1K
        outputCost: 0.0004,  // $0.40/1M = $0.0004/1K
        maxTokens: 1000000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'google', modelId: 'models/gemini-2.0-flash-exp-image-generation' } },
      update: {
        description: "Gemini 2.0 Flash Image Generation - Experimental model for AI image generation. Creates images from text prompts.",
        maxTokens: 0,
        inputCost: 0.04,   // Per image cost estimate - verify actual pricing
        outputCost: 0,
      },
      create: {
        name: 'Gemini 2.0 Flash Image',
        provider: 'google',
        modelId: 'models/gemini-2.0-flash-exp-image-generation',
        // NOTE: This is an experimental model ("exp" in name). May be deprecated or changed without notice.
        // Pricing is estimated - verify actual per-image cost from Google's API pricing page.
        category: 'image',
        description: "Gemini 2.0 Flash Image Generation - Experimental model for AI image generation. Creates images from text prompts.",
        inputCost: 0.04,   // Per image cost estimate - verify actual pricing
        outputCost: 0,
        maxTokens: 0,
      },
    }),
    
    // ==================== Anthropic Models ====================
    // Source: https://www.anthropic.com/pricing
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'anthropic', modelId: 'claude-sonnet-4-20250514' } },
      update: {
        description: "Claude Sonnet 4 - Anthropic's balanced model with 200K context. Excellent for coding, analysis, and complex reasoning tasks.",
        maxTokens: 200000,
        inputCost: 0.003,   // $3.00/1M
        outputCost: 0.015,  // $15.00/1M
      },
      create: {
        name: 'Claude Sonnet 4',
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
        category: 'text',
        description: "Claude Sonnet 4 - Anthropic's balanced model with 200K context. Excellent for coding, analysis, and complex reasoning tasks.",
        inputCost: 0.003,   // $3.00/1M = $0.003/1K
        outputCost: 0.015,  // $15.00/1M = $0.015/1K
        maxTokens: 200000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'anthropic', modelId: 'claude-3-5-haiku-20241022' } },
      update: {
        description: "Claude 3.5 Haiku - Anthropic's fastest model for quick responses. 200K context, ideal for customer support and real-time interactions.",
        maxTokens: 200000,
        inputCost: 0.0008,  // $0.80/1M
        outputCost: 0.004,  // $4.00/1M
      },
      create: {
        name: 'Claude 3.5 Haiku',
        provider: 'anthropic',
        modelId: 'claude-3-5-haiku-20241022',
        category: 'text',
        description: "Claude 3.5 Haiku - Anthropic's fastest model for quick responses. 200K context, ideal for customer support and real-time interactions.",
        inputCost: 0.0008,  // $0.80/1M = $0.0008/1K
        outputCost: 0.004,  // $4.00/1M = $0.004/1K
        maxTokens: 200000,
      },
    }),
    
    // ==================== ElevenLabs ====================
    // Source: https://elevenlabs.io/pricing
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'elevenlabs', modelId: 'eleven_multilingual_v2' } },
      update: {
        description: 'High-quality multilingual text-to-speech. ~$0.30 per 1K characters.',
        inputCost: 0.0003,  // Per character pricing
        outputCost: 0,
      },
      create: {
        name: 'Eleven Multilingual v2',
        provider: 'elevenlabs',
        modelId: 'eleven_multilingual_v2',
        category: 'audio',
        description: 'High-quality multilingual text-to-speech. ~$0.30 per 1K characters.',
        inputCost: 0.0003,  // ~$0.30 per 1K chars
        outputCost: 0,
        maxTokens: 0,
      },
    }),
  ]);
  console.log(`✅ Created ${models.length} AI models\n`);

  // Create System Guardrails
  console.log('Creating System Guardrails...');
  const guardrails = await Promise.all([
    prisma.guardrail.upsert({
      where: { id: 'guardrail-educational-integrity' },
      update: {},
      create: {
        id: 'guardrail-educational-integrity',
        type: 'educational_integrity',
        title: 'Academic Honesty',
        instruction: 'Prevent direct answers to homework/exam questions. Encourage learning through hints and explanations.',
        appliesTo: 'both',
        priority: 10,
        isSystem: true,
      },
    }),
    prisma.guardrail.upsert({
      where: { id: 'guardrail-content-safety' },
      update: {},
      create: {
        id: 'guardrail-content-safety',
        type: 'content_safety',
        title: 'Safe Content',
        instruction: 'Block inappropriate, harmful, or offensive content. Maintain professional educational environment.',
        appliesTo: 'both',
        priority: 10,
        isSystem: true,
      },
    }),
    prisma.guardrail.upsert({
      where: { id: 'guardrail-behavioral' },
      update: {},
      create: {
        id: 'guardrail-behavioral',
        type: 'behavioral_guidelines',
        title: 'Professional Behavior',
        instruction: 'Maintain respectful, educational tone. Avoid bias and encourage critical thinking.',
        appliesTo: 'output',
        priority: 8,
        isSystem: true,
      },
    }),
  ]);
  console.log(`✅ Created ${guardrails.length} guardrails\n`);

  // Create API Key placeholders for providers
  console.log('Creating API Key provider placeholders...');
  const apiKeyProviders = ['openai', 'google', 'anthropic', 'elevenlabs', 'groq', 'mistral'];
  const apiKeys = await Promise.all(
    apiKeyProviders.map(provider =>
      prisma.aPIKey.upsert({
        where: { provider },
        update: {},
        create: {
          provider,
          apiKey: '', // Empty - admin needs to configure
          baseUrl: null,
          isActive: false,
        },
      })
    )
  );
  console.log(`✅ Created ${apiKeys.length} API key placeholders\n`);

  // Create Demo Course and Batch
  console.log('Creating Demo Course and Batch...');
  const course = await prisma.course.upsert({
    where: { id: 'course-demo' },
    update: {},
    create: {
      id: 'course-demo',
      name: 'Prompt Engineering Fundamentals',
      description: 'Learn the art of crafting effective AI prompts',
      instructor: 'Dr. AI Trainer',
      duration: 8,
    },
  });

  const batch = await prisma.batch.upsert({
    where: { id: 'batch-demo-1' },
    update: {},
    create: {
      id: 'batch-demo-1',
      name: 'Batch 2025-A',
      courseId: course.id,
    },
  });
  console.log(`✅ Created course: ${course.name} with batch: ${batch.name}\n`);

  // Create Demo Admin
  console.log('Creating Demo Admin...');
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@genailab.com' },
    update: {},
    create: {
      email: 'admin@genailab.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      isVerified: true,
    },
  });
  console.log(`✅ Created admin: ${admin.email} (password: Admin@123)\n`);

  // Create Demo Student
  console.log('Creating Demo Student...');
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@genailab.com' },
    update: {},
    create: {
      email: 'student@genailab.com',
      password: studentPassword,
      name: 'Demo Student',
      role: 'student',
      registrationId: 'STU001',
      courseId: course.id,
      batchId: batch.id,
      tokenQuota: 50000,       // Virtual display tokens
      budgetLimit: 18,         // USD budget limit (~₹1,500 @ 84 INR/USD)
      budgetUsed: 0,           // USD spent
      isVerified: true,
    },
  });
  console.log(`✅ Created student: ${student.email} (password: Student@123)\n`);

  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Database seeded successfully!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\nDemo Credentials:');
  console.log('  Admin:   admin@genailab.com / Admin@123');
  console.log('  Student: student@genailab.com / Student@123');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

