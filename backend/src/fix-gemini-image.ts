/**
 * Script to remove the non-functional Gemini 2.0 Flash Image model
 * The model doesn't actually generate images - it only describes them
 */

import { prisma } from './lib/prisma';

async function fixGeminiImageModel() {
  console.log('🔧 Removing non-functional Gemini Image model...\n');

  try {
    // Get the Gemini image model
    const geminiImageModel = await prisma.aIModel.findFirst({
      where: { modelId: 'models/gemini-2.0-flash-exp-image-generation' }
    });

    if (!geminiImageModel) {
      console.log('ℹ️ Gemini Image model was already removed');
      return;
    }

    console.log(`Found Gemini Image model with ID: ${geminiImageModel.id}`);

    // Check for sessions using this model
    const sessionsUsingModel = await prisma.session.count({
      where: { modelId: geminiImageModel.id }
    });

    console.log(`Found ${sessionsUsingModel} sessions using the Gemini Image model`);

    // Get the DALL-E 3 model to migrate sessions to (lookup outside transaction)
    const dalleModel = await prisma.aIModel.findFirst({
      where: { modelId: 'gpt-image-1' }
    });

    // Wrap all mutation operations in a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      if (sessionsUsingModel > 0) {
        if (dalleModel) {
          console.log(`Migrating sessions to DALL-E 3 (${dalleModel.id})...`);
          
          await tx.session.updateMany({
            where: { modelId: geminiImageModel.id },
            data: { modelId: dalleModel.id }
          });
          console.log('✅ Sessions migrated successfully');
        } else {
          // If no DALL-E model, just delete the sessions
          console.log('No DALL-E model found, deleting sessions and their messages...');
          
          // Delete messages first
          await tx.message.deleteMany({
            where: {
              session: { modelId: geminiImageModel.id }
            }
          });
          
          // Then delete sessions
          await tx.session.deleteMany({
            where: { modelId: geminiImageModel.id }
          });
          console.log('✅ Sessions deleted');
        }
      }

      // Now delete the model
      await tx.aIModel.delete({
        where: { id: geminiImageModel.id }
      });
    });

    console.log('✅ Gemini 2.0 Flash Image model removed successfully');
    console.log('\n📝 Note: For image generation, please use DALL-E 3 which works reliably.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

fixGeminiImageModel();
