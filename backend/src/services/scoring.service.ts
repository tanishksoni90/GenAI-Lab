/**
 * Scoring Service - Uses Gemini for intelligent prompt analysis
 * 
 * This service analyzes student prompts and provides feedback on:
 * - Clarity (how clear and understandable the prompt is)
 * - Specificity (how detailed and precise the requirements are)
 * - Context (how well background information is provided)
 * - Goal Orientation (how clearly the desired outcome is defined)
 * 
 * The analysis cost is deducted from the student's real ₹1,500 budget
 * but is NOT shown in the session's token usage display.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import prisma from '../lib/prisma';

// Use gemini-2.0-flash for cost-effective analysis (latest stable model)
// Pricing: Very low cost for flash models
const ANALYSIS_MODEL = 'gemini-2.0-flash';
const INPUT_COST_PER_MILLION = 0.075; // USD per 1M input tokens
const OUTPUT_COST_PER_MILLION = 0.30; // USD per 1M output tokens

// Cache for Gemini client (refreshed when API key changes)
let cachedGeminiClient: { client: GoogleGenerativeAI; apiKey: string } | null = null;
let apiKeyCacheTime = 0;
const API_KEY_CACHE_TTL = 60000; // 1 minute

/**
 * Get Gemini client with API key from database
 */
async function getGeminiClient(): Promise<GoogleGenerativeAI | null> {
  // Check if cache is still valid
  if (cachedGeminiClient && Date.now() - apiKeyCacheTime < API_KEY_CACHE_TTL) {
    return cachedGeminiClient.client;
  }

  // Fetch API key from database
  const apiKeyRecord = await prisma.aPIKey.findUnique({
    where: { provider: 'google' },
  });

  if (!apiKeyRecord || !apiKeyRecord.apiKey || !apiKeyRecord.isActive) {
    cachedGeminiClient = null;
    return null;
  }

  // Create new client if API key changed
  if (!cachedGeminiClient || cachedGeminiClient.apiKey !== apiKeyRecord.apiKey) {
    cachedGeminiClient = {
      client: new GoogleGenerativeAI(apiKeyRecord.apiKey),
      apiKey: apiKeyRecord.apiKey,
    };
  }

  apiKeyCacheTime = Date.now();
  return cachedGeminiClient.client;
}

export interface ScoreCriterion {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface ScoreResult {
  totalScore: number;
  maxPossibleScore: number;
  criteria: ScoreCriterion[];
  feedback: string;
  comparison?: string;
  analysisSource: 'gemini' | 'rule-based';
}

interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * Calculate the cost of Gemini API usage in INR
 */
function calculateCostInINR(inputTokens: number, outputTokens: number): number {
  const inputCostUSD = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCostUSD = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  const totalUSD = inputCostUSD + outputCostUSD;
  return totalUSD * config.pricing.usdToInr;
}

/**
 * Estimate token count (rough approximation: 4 chars ≈ 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Update user's budget in the database (hidden from session tokens)
 */
async function deductAnalysisCost(userId: string, costINR: number): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        budgetUsed: {
          increment: costINR,
        },
      },
    });
  } catch (error) {
    console.error('Failed to deduct analysis cost:', error);
    // Don't throw - analysis should still proceed even if budget update fails
  }
}

/**
 * Score a prompt using Gemini AI for intelligent analysis
 */
async function scoreWithGemini(
  prompt: string,
  conversationHistory: ConversationMessage[],
  userId?: string
): Promise<ScoreResult | null> {
  const genAI = await getGeminiClient();
  
  if (!genAI) {
    console.log('Gemini API not configured in database, falling back to rule-based scoring');
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: ANALYSIS_MODEL });

    // Build context from conversation history (limit to last 2 messages, truncated)
    const contextSummary = conversationHistory.length > 0
      ? conversationHistory.slice(-2).map(m => `${m.role}: ${m.content.substring(0, 150)}...`).join('\n')
      : 'No previous conversation';

    // For long prompts, analyze the structure without including full text
    // This keeps the analysis focused and avoids token limits
    const promptLength = prompt.length;
    const promptForAnalysis = promptLength > 1500 
      ? `${prompt.substring(0, 800)}\n\n[... middle section of ${Math.round((promptLength - 1200) / 100) * 100} characters omitted for brevity ...]\n\n${prompt.substring(prompt.length - 400)}`
      : prompt;

    const analysisPrompt = `You are an expert prompt engineering evaluator. Analyze the following prompt and provide a detailed assessment.

## Student's Prompt to Analyze:
"${promptForAnalysis}"

${promptLength > 1500 ? `\n(Note: This is a ${promptLength}-character prompt. Full structure analysis follows.)\n` : ''}
## Recent Conversation Context:
${contextSummary}

## Scoring Criteria (score each from 0-25, total max 100):

1. **Clarity** (0-25): How clear and understandable is the prompt? Is the language precise? Are there any ambiguities?

2. **Specificity** (0-25): How detailed and specific are the requirements? Does it include necessary constraints, formats, or parameters?

3. **Context** (0-25): Is relevant background information provided? Does the prompt give enough context for the AI to understand the situation?

4. **Goal Orientation** (0-25): Is the desired outcome clearly defined? Does the prompt clearly state what the user wants to achieve?

## Response Format (JSON only):
Respond with ONLY a valid JSON object in this exact format, no markdown code blocks:
{
  "clarity": {
    "score": <number 0-25>,
    "feedback": "<specific feedback about clarity, what's good and what could be improved>"
  },
  "specificity": {
    "score": <number 0-25>,
    "feedback": "<specific feedback about specificity>"
  },
  "context": {
    "score": <number 0-25>,
    "feedback": "<specific feedback about context provision>"
  },
  "goalOrientation": {
    "score": <number 0-25>,
    "feedback": "<specific feedback about goal clarity>"
  },
  "overallFeedback": "<2-3 sentence summary of the prompt's strengths and areas for improvement>",
  "improvedPromptSuggestion": "<brief suggestion for how the prompt could be rewritten to be more effective>"
}`;

    console.log(`[Gemini Analysis] Starting analysis for ${prompt.length}-char prompt...`);
    
    const result = await model.generateContent(analysisPrompt);
    const response = result.response;
    const text = response.text();

    console.log(`[Gemini Analysis] Received ${text.length}-char response`);

    // Calculate cost and deduct from user budget
    const inputTokens = estimateTokens(analysisPrompt);
    const outputTokens = estimateTokens(text);
    const costINR = calculateCostInINR(inputTokens, outputTokens);

    console.log(`[Gemini Analysis] Cost: ₹${costINR.toFixed(4)} (${inputTokens} in + ${outputTokens} out tokens)`);

    // Deduct cost from user's budget (not shown in session)
    if (userId) {
      await deductAnalysisCost(userId, costINR);
    }

    // Parse the JSON response
    let parsed;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.slice(7);
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.slice(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.slice(0, -3);
      }
      cleanText = cleanText.trim();
      
      parsed = JSON.parse(cleanText);
      console.log(`[Gemini Analysis] Successfully parsed response with scores: Clarity=${parsed.clarity?.score}, Specificity=${parsed.specificity?.score}, Context=${parsed.context?.score}, GoalOrientation=${parsed.goalOrientation?.score}`);
    } catch (parseError) {
      console.error('[Gemini Analysis] Failed to parse response:', text.substring(0, 500));
      return null;
    }

    // Build the score result
    const criteria: ScoreCriterion[] = [
      {
        name: 'Clarity',
        score: Math.min(25, Math.max(0, parsed.clarity?.score || 0)),
        maxScore: 25,
        feedback: parsed.clarity?.feedback || 'Unable to assess clarity',
      },
      {
        name: 'Specificity',
        score: Math.min(25, Math.max(0, parsed.specificity?.score || 0)),
        maxScore: 25,
        feedback: parsed.specificity?.feedback || 'Unable to assess specificity',
      },
      {
        name: 'Context',
        score: Math.min(25, Math.max(0, parsed.context?.score || 0)),
        maxScore: 25,
        feedback: parsed.context?.feedback || 'Unable to assess context',
      },
      {
        name: 'Goal Orientation',
        score: Math.min(25, Math.max(0, parsed.goalOrientation?.score || 0)),
        maxScore: 25,
        feedback: parsed.goalOrientation?.feedback || 'Unable to assess goal orientation',
      },
    ];

    const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

    return {
      totalScore,
      maxPossibleScore: 100,
      criteria,
      feedback: parsed.overallFeedback || 'Analysis complete',
      comparison: parsed.improvedPromptSuggestion,
      analysisSource: 'gemini',
    };
  } catch (error: any) {
    console.error('Gemini analysis failed:', error.message);
    return null;
  }
}

/**
 * Rule-based scoring as fallback when AI is unavailable
 */
function scoreWithRules(prompt: string, conversationHistory: ConversationMessage[]): ScoreResult {
  const criteria: ScoreCriterion[] = [];
  let totalScore = 0;

  // 1. Clarity Score (0-25)
  let clarityScore = 15; // Base score
  const clarityFeedback: string[] = [];

  // Check sentence structure
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length >= 1 && sentences.length <= 5) {
    clarityScore += 5;
    clarityFeedback.push('Good sentence structure');
  } else if (sentences.length > 5) {
    clarityScore -= 3;
    clarityFeedback.push('Consider being more concise');
  }

  // Check for question marks or clear requests
  if (prompt.includes('?') || /please|help|explain|describe|create|write|make/i.test(prompt)) {
    clarityScore += 5;
    clarityFeedback.push('Clear request type identified');
  }

  clarityScore = Math.min(25, Math.max(0, clarityScore));
  criteria.push({
    name: 'Clarity',
    score: clarityScore,
    maxScore: 25,
    feedback: clarityFeedback.length > 0 ? clarityFeedback.join('. ') : 'Clarity could be improved with clearer language',
  });
  totalScore += clarityScore;

  // 2. Specificity Score (0-25)
  let specificityScore = 10; // Base score
  const specificityFeedback: string[] = [];

  // Check for specific details
  if (/\d+/.test(prompt)) {
    specificityScore += 5;
    specificityFeedback.push('Includes specific numbers/quantities');
  }
  if (prompt.length > 100) {
    specificityScore += 5;
    specificityFeedback.push('Good level of detail');
  }
  if (/format|structure|style|example|like/i.test(prompt)) {
    specificityScore += 5;
    specificityFeedback.push('Includes format/style guidance');
  }
  if (prompt.length < 30) {
    specificityScore -= 5;
    specificityFeedback.push('Consider adding more details');
  }

  specificityScore = Math.min(25, Math.max(0, specificityScore));
  criteria.push({
    name: 'Specificity',
    score: specificityScore,
    maxScore: 25,
    feedback: specificityFeedback.length > 0 ? specificityFeedback.join('. ') : 'Add more specific requirements',
  });
  totalScore += specificityScore;

  // 3. Context Score (0-25)
  let contextScore = 12; // Base score
  const contextFeedback: string[] = [];

  // Check for context indicators
  if (/background|context|situation|scenario|i am|i'm|we are|we're/i.test(prompt)) {
    contextScore += 8;
    contextFeedback.push('Background context provided');
  }
  if (conversationHistory.length > 0) {
    contextScore += 5;
    contextFeedback.push('Building on conversation context');
  }
  if (/because|since|given that|considering/i.test(prompt)) {
    contextScore += 5;
    contextFeedback.push('Reasoning provided');
  }

  contextScore = Math.min(25, Math.max(0, contextScore));
  criteria.push({
    name: 'Context',
    score: contextScore,
    maxScore: 25,
    feedback: contextFeedback.length > 0 ? contextFeedback.join('. ') : 'Consider providing more background context',
  });
  totalScore += contextScore;

  // 4. Goal Orientation Score (0-25)
  let goalScore = 12; // Base score
  const goalFeedback: string[] = [];

  // Check for clear goals
  if (/want|need|goal|objective|aim|purpose|outcome|result/i.test(prompt)) {
    goalScore += 8;
    goalFeedback.push('Clear goal stated');
  }
  if (/should|must|will|expect/i.test(prompt)) {
    goalScore += 5;
    goalFeedback.push('Expectations defined');
  }
  if (/step|process|how to|guide/i.test(prompt)) {
    goalScore += 5;
    goalFeedback.push('Process-oriented approach');
  }

  goalScore = Math.min(25, Math.max(0, goalScore));
  criteria.push({
    name: 'Goal Orientation',
    score: goalScore,
    maxScore: 25,
    feedback: goalFeedback.length > 0 ? goalFeedback.join('. ') : 'Clarify the desired outcome',
  });
  totalScore += goalScore;

  // Generate overall feedback
  let overallFeedback = '';
  if (totalScore >= 80) {
    overallFeedback = 'Excellent prompt! Well-structured with clear goals and good context.';
  } else if (totalScore >= 60) {
    overallFeedback = 'Good prompt with room for improvement. Consider adding more specifics.';
  } else if (totalScore >= 40) {
    overallFeedback = 'Decent prompt but lacks detail. Try to be more specific about your requirements.';
  } else {
    overallFeedback = 'This prompt needs improvement. Add context, be specific, and clearly state your goal.';
  }

  return {
    totalScore,
    maxPossibleScore: 100,
    criteria,
    feedback: overallFeedback,
    analysisSource: 'rule-based',
  };
}

/**
 * Main scoring function - attempts Gemini first, falls back to rules
 */
export async function scorePrompt(
  prompt: string,
  conversationHistory: ConversationMessage[] = [],
  userId?: string
): Promise<ScoreResult> {
  // Try Gemini-based analysis first
  const geminiResult = await scoreWithGemini(prompt, conversationHistory, userId);
  
  if (geminiResult) {
    return geminiResult;
  }

  // Fall back to rule-based scoring
  console.log('Using rule-based scoring fallback');
  return scoreWithRules(prompt, conversationHistory);
}

/**
 * Calculate average session score from an array of scores
 */
export function calculateSessionScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

export default {
  scorePrompt,
  calculateSessionScore,
};

