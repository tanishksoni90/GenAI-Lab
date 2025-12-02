import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create AI Models
  console.log('Creating AI Models...');
  const models = await Promise.all([
    // OpenAI Models
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'gpt-4o' } },
      update: {},
      create: {
        name: 'GPT-4o',
        provider: 'openai',
        modelId: 'gpt-4o',
        category: 'text',
        description: 'Most capable GPT-4 model with vision capabilities',
        inputCost: 0.005,
        outputCost: 0.015,
        maxTokens: 128000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'gpt-4o-mini' } },
      update: {},
      create: {
        name: 'GPT-4o Mini',
        provider: 'openai',
        modelId: 'gpt-4o-mini',
        category: 'text',
        description: 'Affordable and intelligent small model for fast tasks',
        inputCost: 0.00015,
        outputCost: 0.0006,
        maxTokens: 128000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'gpt-3.5-turbo' } },
      update: {},
      create: {
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        modelId: 'gpt-3.5-turbo',
        category: 'text',
        description: 'Fast and efficient for simple tasks',
        inputCost: 0.0005,
        outputCost: 0.0015,
        maxTokens: 16385,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'openai', modelId: 'dall-e-3' } },
      update: {},
      create: {
        name: 'DALL-E 3',
        provider: 'openai',
        modelId: 'dall-e-3',
        category: 'image',
        description: 'Most advanced image generation model',
        inputCost: 0.04,
        outputCost: 0,
        maxTokens: 0,
      },
    }),
    // Google Models
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'google', modelId: 'gemini-2.0-flash' } },
      update: {},
      create: {
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        modelId: 'gemini-2.0-flash',
        category: 'text',
        description: 'Fast and versatile multimodal model',
        inputCost: 0.00035,
        outputCost: 0.0014,
        maxTokens: 1000000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'google', modelId: 'gemini-2.5-flash-lite' } },
      update: {},
      create: {
        name: 'Gemini 2.5 Flash Lite',
        provider: 'google',
        modelId: 'gemini-2.5-flash-lite',
        category: 'text',
        description: 'Lightweight model for quick responses',
        inputCost: 0.00015,
        outputCost: 0.0006,
        maxTokens: 500000,
      },
    }),
    // Anthropic Models
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'anthropic', modelId: 'claude-sonnet-4.5' } },
      update: {},
      create: {
        name: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        modelId: 'claude-sonnet-4.5',
        category: 'text',
        description: 'Balanced performance and speed',
        inputCost: 0.003,
        outputCost: 0.015,
        maxTokens: 200000,
      },
    }),
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'anthropic', modelId: 'claude-haiku-4.5' } },
      update: {},
      create: {
        name: 'Claude Haiku 4.5',
        provider: 'anthropic',
        modelId: 'claude-haiku-4.5',
        category: 'text',
        description: 'Fast and efficient for simple tasks',
        inputCost: 0.0008,
        outputCost: 0.004,
        maxTokens: 200000,
      },
    }),
    // ElevenLabs
    prisma.aIModel.upsert({
      where: { provider_modelId: { provider: 'elevenlabs', modelId: 'eleven_multilingual_v2' } },
      update: {},
      create: {
        name: 'Eleven Multilingual v2',
        provider: 'elevenlabs',
        modelId: 'eleven_multilingual_v2',
        category: 'audio',
        description: 'High-quality multilingual text-to-speech',
        inputCost: 0.00024,
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
      tokenQuota: 10000,
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

