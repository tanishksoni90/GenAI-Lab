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
// Note: Google API requires 'models/' prefix for model IDs
const ANALYSIS_MODEL = 'models/gemini-2.0-flash';
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
  justification?: string;
}

export interface ImprovementItem {
  issue: string;
  explanation: string;
  howToFix: string;
}

export interface ScoreResult {
  totalScore: number;
  maxPossibleScore: number;
  criteria: ScoreCriterion[];
  feedback: string;
  comparison?: string;
  analysisSource: 'gemini' | 'rule-based';
  /** Analysis cost in USD - for transparency to students */
  analysisCostUSD?: number;
  /** Detailed list of strengths */
  strengths?: string[];
  /** Detailed improvements with explanations */
  improvements?: ImprovementItem[];
  /** Example of how the prompt should be written */
  goodVersionExample?: string;
  /** Example of a poor version for contrast */
  badVersionExample?: string;
  /** Overall actionable suggestion */
  overallSuggestion?: string;
}

interface ConversationMessage {
  role: string;
  content: string;
}

/**
 * Calculate the cost of Gemini API usage in USD
 * NOTE: budgetUsed is stored in USD across the entire codebase
 */
function calculateCostInUSD(inputTokens: number, outputTokens: number): number {
  const inputCostUSD = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCostUSD = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCostUSD + outputCostUSD;
}

/**
 * Estimate token count (rough approximation: 4 chars ≈ 1 token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Update user's budget in the database (hidden from session tokens)
 * NOTE: costUSD should be in USD to match budgetUsed storage format
 */
async function deductAnalysisCost(userId: string, costUSD: number): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        budgetUsed: {
          increment: costUSD,
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

    const analysisPrompt = `You are an expert prompt engineering evaluator and teacher. Your job is to help students learn to write better prompts by providing detailed, educational feedback.

## Student's Prompt to Analyze:
"""
${promptForAnalysis}
"""

${promptLength > 1500 ? `\n(Note: This is a ${promptLength}-character prompt. Full structure analysis follows.)\n` : ''}
## Recent Conversation Context:
${contextSummary}

## Your Task:
Analyze this prompt across 4 dimensions (0-25 points each, total 100). Provide comprehensive educational feedback including:
- Detailed score justifications
- Specific strengths (at least 2-3 points)
- Actionable improvements with explanations
- Example of how this prompt SHOULD be written (good version)
- Example of how this prompt should NOT be written (bad version - for contrast)
- Overall actionable advice

## Scoring Criteria:

1. **Clarity** (0-25): Is the language precise? Are instructions unambiguous? Is it easy to understand?

2. **Specificity** (0-25): Are requirements detailed? Does it include constraints, formats, parameters, examples?

3. **Context** (0-25): Is background information provided? Does the AI have enough context to understand the situation?

4. **Goal Orientation** (0-25): Is the desired outcome clearly defined? Is success measurable?

## IMPORTANT: Response Format
You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no explanations outside JSON.

{
  "clarity": {
    "score": <number 0-25>,
    "feedback": "<2-3 sentences about clarity - what's clear and what's confusing>",
    "justification": "<explain scoring: 'Earned X points for..., Lost Y points because...'>"
  },
  "specificity": {
    "score": <number 0-25>,
    "feedback": "<2-3 sentences about how specific/detailed the prompt is>",
    "justification": "<explain scoring: 'Earned X points for..., Lost Y points because...'>"
  },
  "context": {
    "score": <number 0-25>,
    "feedback": "<2-3 sentences about context provided>",
    "justification": "<explain scoring: 'Earned X points for..., Lost Y points because...'>"
  },
  "goalOrientation": {
    "score": <number 0-25>,
    "feedback": "<2-3 sentences about goal clarity>",
    "justification": "<explain scoring: 'Earned X points for..., Lost Y points because...'>"
  },
  "strengths": [
    "<Specific strength 1 - mention exact phrases or techniques used that work well>",
    "<Specific strength 2 - explain why this aspect is effective>",
    "<Specific strength 3 - if applicable>"
  ],
  "improvements": [
    {
      "issue": "<What's missing or problematic - be specific>",
      "explanation": "<Why this matters - how it affects AI's ability to respond>",
      "howToFix": "<Concrete actionable advice - what exactly to add/change>"
    },
    {
      "issue": "<Another area for improvement>",
      "explanation": "<Why this matters>",
      "howToFix": "<How to fix it>"
    }
  ],
  "goodVersionExample": "<Rewrite the student's prompt as an EXCELLENT example. Show how it should be written with all improvements applied. Make it practical and realistic. Keep similar intent but improve structure, clarity, and detail.>",
  "badVersionExample": "<Show a POOR version of this type of prompt - what mistakes to avoid. Make it obviously flawed but educational. Show common mistakes.>",
  "overallSuggestion": "<2-3 sentences of specific, actionable advice tailored to this prompt. What's the #1 thing they should focus on improving?>"
}`;

    console.log(`[Gemini Analysis] Starting analysis for ${prompt.length}-char prompt...`);
    
    const result = await model.generateContent(analysisPrompt);
    const response = result.response;
    const text = response.text();

    console.log(`[Gemini Analysis] Received ${text.length}-char response`);

    // Calculate cost and deduct from user budget (in USD to match budgetUsed storage)
    const inputTokens = estimateTokens(analysisPrompt);
    const outputTokens = estimateTokens(text);
    const costUSD = calculateCostInUSD(inputTokens, outputTokens);

    console.log(`[Gemini Analysis] Cost: $${costUSD.toFixed(6)} (${inputTokens} in + ${outputTokens} out tokens)`);

    // Deduct cost from user's budget (not shown in session)
    if (userId) {
      await deductAnalysisCost(userId, costUSD);
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
        justification: parsed.clarity?.justification || '',
      },
      {
        name: 'Specificity',
        score: Math.min(25, Math.max(0, parsed.specificity?.score || 0)),
        maxScore: 25,
        feedback: parsed.specificity?.feedback || 'Unable to assess specificity',
        justification: parsed.specificity?.justification || '',
      },
      {
        name: 'Context',
        score: Math.min(25, Math.max(0, parsed.context?.score || 0)),
        maxScore: 25,
        feedback: parsed.context?.feedback || 'Unable to assess context',
        justification: parsed.context?.justification || '',
      },
      {
        name: 'Goal Orientation',
        score: Math.min(25, Math.max(0, parsed.goalOrientation?.score || 0)),
        maxScore: 25,
        feedback: parsed.goalOrientation?.feedback || 'Unable to assess goal orientation',
        justification: parsed.goalOrientation?.justification || '',
      },
    ];

    const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

    // Parse improvements array
    const improvements: ImprovementItem[] = (parsed.improvements || []).map((imp: any) => ({
      issue: imp.issue || '',
      explanation: imp.explanation || '',
      howToFix: imp.howToFix || '',
    }));

    return {
      totalScore,
      maxPossibleScore: 100,
      criteria,
      feedback: parsed.overallSuggestion || 'Analysis complete',
      comparison: parsed.goodVersionExample,
      analysisSource: 'gemini',
      analysisCostUSD: costUSD,
      strengths: parsed.strengths || [],
      improvements,
      goodVersionExample: parsed.goodVersionExample,
      badVersionExample: parsed.badVersionExample,
      overallSuggestion: parsed.overallSuggestion,
    };
  } catch (error: any) {
    // Log the error but DON'T silently return null
    // This was causing grades to silently fail
    console.error('[Gemini Analysis] Analysis failed:', error.message);
    
    // For rate limiting or quota errors, we should fallback to rule-based
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate')) {
      console.warn('[Gemini Analysis] Rate limited, falling back to rule-based scoring');
      return null; // Allow fallback for rate limiting
    }
    
    // For API key issues, also fallback gracefully
    if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      console.warn('[Gemini Analysis] API key issue, falling back to rule-based scoring');
      return null;
    }
    
    // For other errors, still fallback but log as warning
    console.warn('[Gemini Analysis] Unexpected error, falling back to rule-based scoring');
    return null;
  }
}

/**
 * Rule-based scoring as fallback when AI is unavailable
 * This provides intelligent, detailed analysis of prompts using heuristics
 */
function scoreWithRules(prompt: string, conversationHistory: ConversationMessage[]): ScoreResult {
  const criteria: ScoreCriterion[] = [];
  let totalScore = 0;
  const promptLower = prompt.toLowerCase();
  const wordCount = prompt.split(/\s+/).filter(w => w.length > 0).length;
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Detect prompt type for tailored feedback
  const isQuestion = prompt.includes('?') || /^(what|who|when|where|why|how|can|could|would|should|is|are|do|does)/i.test(prompt);
  const isCodeRelated = /code|function|program|script|api|database|algorithm|programming|developer|software|debug|error|syntax|variable|class|method|html|css|javascript|python|java|react|node/i.test(prompt);
  const isCreativeWriting = /write|create|compose|draft|story|article|blog|essay|poem|content|copy|headline|title|script|dialogue/i.test(prompt);
  const isExplanation = /explain|describe|what is|how does|why|define|meaning|concept|understand|learn/i.test(prompt);
  const isAnalysis = /analyze|evaluate|assess|review|critique|compare|contrast|pros|cons|advantage|disadvantage/i.test(prompt);
  const isTask = /make|build|generate|list|find|search|calculate|convert|translate|summarize/i.test(prompt);
  
  // Extract key topic from prompt for personalized examples
  const topicMatch = prompt.match(/(?:about|regarding|for|on|of)\s+([^,.?!]+)/i);
  const mainTopic = topicMatch ? topicMatch[1].trim() : prompt.split(/\s+/).slice(0, 5).join(' ');
  
  // ========================================
  // 1. CLARITY SCORE (0-25)
  // ========================================
  let clarityScore = 10; // Base score
  const clarityPositives: string[] = [];
  const clarityNegatives: string[] = [];

  // Check sentence structure
  if (sentences.length >= 1 && sentences.length <= 4) {
    clarityScore += 4;
    clarityPositives.push('Well-organized sentence structure that\'s easy to follow');
  } else if (sentences.length > 6) {
    clarityScore -= 2;
    clarityNegatives.push('Multiple sentences may cause information overload - consider being more concise');
  }

  // Check for clear request type
  if (isQuestion || /please|help|explain|describe|create|write|make|give me|show me|tell me/i.test(prompt)) {
    clarityScore += 4;
    clarityPositives.push('Clear request type - the AI knows exactly what kind of response you expect');
  }

  // Check for grammatically complete sentences
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length > 0 && trimmedPrompt[0] === trimmedPrompt[0].toUpperCase() && /[.!?]$/.test(trimmedPrompt)) {
    clarityScore += 3;
    clarityPositives.push('Proper sentence structure with capitalization and punctuation');
  }
  
  // Check for action verbs
  if (/^(explain|describe|write|create|list|analyze|compare|help|show|generate|build|find|tell)/i.test(prompt)) {
    clarityScore += 3;
    clarityPositives.push('Starts with a clear action verb that directs the AI');
  }
  
  // Check for ambiguous language
  if (/something|stuff|things|whatever|etc|some|any|maybe|kind of|sort of/i.test(prompt)) {
    clarityScore -= 3;
    clarityNegatives.push('Contains vague words like "something", "stuff", "things" - be more specific');
  }
  
  // Penalize very short prompts
  if (wordCount < 5) {
    clarityScore -= 3;
    clarityNegatives.push('Very short prompt - AI may not understand the full request');
  }

  clarityScore = Math.min(25, Math.max(0, clarityScore));
  const clarityFeedback = clarityPositives.length > 0 
    ? clarityPositives.join('. ') 
    : clarityNegatives.length > 0 
      ? clarityNegatives.join('. ')
      : 'Consider using clearer, more direct language';
      
  const clarityJustification = `Your prompt has ${wordCount} words in ${sentences.length} sentence(s). ` +
    (clarityPositives.length > 0 ? `Strengths: ${clarityPositives.join('; ')}. ` : '') +
    (clarityNegatives.length > 0 ? `Areas to improve: ${clarityNegatives.join('; ')}.` : '');

  criteria.push({
    name: 'Clarity',
    score: clarityScore,
    maxScore: 25,
    feedback: clarityFeedback,
    justification: clarityJustification,
  });
  totalScore += clarityScore;

  // ========================================
  // 2. SPECIFICITY SCORE (0-25)
  // ========================================
  let specificityScore = 8; // Base score
  const specificityPositives: string[] = [];
  const specificityNegatives: string[] = [];

  // Check for specific numbers or quantities
  if (/\d+/.test(prompt)) {
    specificityScore += 4;
    specificityPositives.push('Includes specific numbers/quantities which helps set clear expectations');
  } else {
    specificityNegatives.push('Consider adding specific numbers (e.g., "give me 5 examples" instead of "give me some examples")');
  }
  
  // Check for length/format specifications
  if (/\b(short|long|brief|detailed|concise|comprehensive|paragraph|list|bullet|table|steps)\b/i.test(prompt)) {
    specificityScore += 4;
    specificityPositives.push('Specifies desired response format/length');
  } else {
    specificityNegatives.push('Add format preferences (e.g., "in bullet points", "as a table", "in 2-3 paragraphs")');
  }
  
  // Check for good level of detail
  if (prompt.length > 80) {
    specificityScore += 3;
    specificityPositives.push('Good level of detail provided in the prompt');
  } else if (prompt.length > 40) {
    specificityScore += 1;
  } else {
    specificityNegatives.push('Prompt is quite short - add more details about what you need');
  }
  
  // Check for constraints or boundaries
  if (/only|must|should|don't|avoid|without|except|limit|maximum|minimum|at least|no more than/i.test(prompt)) {
    specificityScore += 4;
    specificityPositives.push('Includes constraints/boundaries that help focus the response');
  }
  
  // Check for examples or references
  if (/example|like|such as|similar to|based on|following|template/i.test(prompt)) {
    specificityScore += 4;
    specificityPositives.push('References examples which clarifies expectations');
  }
  
  // Check for target audience
  if (/for (a |my |the )?(beginner|student|expert|professional|child|adult|team|audience|reader)/i.test(prompt)) {
    specificityScore += 3;
    specificityPositives.push('Specifies target audience for tailored response');
  }

  specificityScore = Math.min(25, Math.max(0, specificityScore));
  const specificityFeedback = specificityPositives.length > 0 
    ? specificityPositives.join('. ') 
    : specificityNegatives.length > 0 
      ? specificityNegatives.join('. ')
      : 'Add more specific requirements and constraints';
      
  const specificityJustification = `Your prompt is ${prompt.length} characters with ${wordCount} words. ` +
    (specificityPositives.length > 0 ? `Good specificity: ${specificityPositives.join('; ')}. ` : '') +
    (specificityNegatives.length > 0 ? `Missing: ${specificityNegatives.join('; ')}.` : '');

  criteria.push({
    name: 'Specificity',
    score: specificityScore,
    maxScore: 25,
    feedback: specificityFeedback,
    justification: specificityJustification,
  });
  totalScore += specificityScore;

  // ========================================
  // 3. CONTEXT SCORE (0-25)
  // ========================================
  let contextScore = 8; // Base score
  const contextPositives: string[] = [];
  const contextNegatives: string[] = [];

  // Check for personal context
  if (/i am|i'm|i have|i need|i want|i work|my (job|role|project|team|company|work|task)/i.test(prompt)) {
    contextScore += 5;
    contextPositives.push('Provides personal context about who you are or your situation');
  } else {
    contextNegatives.push('Add context about yourself (e.g., "I am a student learning..." or "I work as a...")');
  }
  
  // Check for purpose/reason
  if (/because|since|so that|in order to|for (my|the|a)|purpose|reason|to help|to learn|to understand/i.test(prompt)) {
    contextScore += 4;
    contextPositives.push('Explains the purpose or reason behind the request');
  } else {
    contextNegatives.push('Explain why you need this (e.g., "for a class project", "to prepare for an interview")');
  }
  
  // Check for background information
  if (/background|context|situation|scenario|currently|already|previously|before|after/i.test(prompt)) {
    contextScore += 4;
    contextPositives.push('Includes relevant background information');
  }
  
  // Check for domain/field specification
  if (/in (the field of|the area of|the context of|the domain of|programming|marketing|business|education|healthcare|finance|technology)/i.test(prompt)) {
    contextScore += 4;
    contextPositives.push('Specifies the domain or field of expertise');
  }
  
  // Conversation context bonus
  if (conversationHistory.length > 0) {
    contextScore += 4;
    contextPositives.push(`Building on ${conversationHistory.length} previous message(s) in the conversation`);
  }
  
  // Check for time-related context
  if (/today|tomorrow|this week|this month|in 202\d|recently|currently|now|latest|modern|updated/i.test(prompt)) {
    contextScore += 3;
    contextPositives.push('Includes temporal context for relevant, up-to-date information');
  }

  contextScore = Math.min(25, Math.max(0, contextScore));
  const contextFeedback = contextPositives.length > 0 
    ? contextPositives.join('. ') 
    : contextNegatives.length > 0 
      ? contextNegatives.join('. ')
      : 'Provide more background about your situation and why you need this';
      
  const contextJustification = `Context analysis: ` +
    (contextPositives.length > 0 ? `Present: ${contextPositives.join('; ')}. ` : 'No strong context indicators found. ') +
    (contextNegatives.length > 0 ? `Missing: ${contextNegatives.join('; ')}.` : '');

  criteria.push({
    name: 'Context',
    score: contextScore,
    maxScore: 25,
    feedback: contextFeedback,
    justification: contextJustification,
  });
  totalScore += contextScore;

  // ========================================
  // 4. GOAL ORIENTATION SCORE (0-25)
  // ========================================
  let goalScore = 8; // Base score
  const goalPositives: string[] = [];
  const goalNegatives: string[] = [];

  // Check for explicit goal statement
  if (/i want|i need|goal|objective|aim|purpose|outcome|result|hoping to|trying to|looking for|looking to/i.test(prompt)) {
    goalScore += 5;
    goalPositives.push('States a clear goal or desired outcome');
  } else {
    goalNegatives.push('Add what you want to achieve (e.g., "I want to learn...", "My goal is to...")');
  }
  
  // Check for success criteria
  if (/should (be|have|include|contain)|must|expect|needs to|has to|important that/i.test(prompt)) {
    goalScore += 4;
    goalPositives.push('Defines expectations or success criteria');
  } else {
    goalNegatives.push('Describe what a good response looks like to you');
  }
  
  // Check for process orientation
  if (/step|steps|process|guide|tutorial|how to|instructions|procedure/i.test(prompt)) {
    goalScore += 4;
    goalPositives.push('Process-oriented approach with clear structure expectations');
  }
  
  // Check for deliverable specification
  if (/give me|provide|create|generate|write|list|explain|describe|show/i.test(prompt)) {
    goalScore += 3;
    goalPositives.push('Specifies the type of deliverable expected');
  }
  
  // Check for use case
  if (/so (i|we) can|to use (for|in|with)|will (help|use|apply)|for (my|a|the)/i.test(prompt)) {
    goalScore += 4;
    goalPositives.push('Mentions how the output will be used');
  }
  
  // Check for action focus
  if (/help me (to |with )?/i.test(prompt)) {
    goalScore += 2;
    goalPositives.push('Uses collaborative language for problem-solving');
  }

  goalScore = Math.min(25, Math.max(0, goalScore));
  const goalFeedback = goalPositives.length > 0 
    ? goalPositives.join('. ') 
    : goalNegatives.length > 0 
      ? goalNegatives.join('. ')
      : 'Clarify what success looks like for this request';
      
  const goalJustification = `Goal analysis: ` +
    (goalPositives.length > 0 ? `Clear goals: ${goalPositives.join('; ')}. ` : 'No explicit goals found. ') +
    (goalNegatives.length > 0 ? `Could add: ${goalNegatives.join('; ')}.` : '');

  criteria.push({
    name: 'Goal Orientation',
    score: goalScore,
    maxScore: 25,
    feedback: goalFeedback,
    justification: goalJustification,
  });
  totalScore += goalScore;

  // ========================================
  // GENERATE DETAILED STRENGTHS
  // ========================================
  const strengths: string[] = [];
  
  // Add score-based strengths
  if (clarityScore >= 18) {
    strengths.push('✓ Excellent clarity - your prompt is easy to understand and well-structured');
  } else if (clarityScore >= 14) {
    strengths.push('✓ Good clarity - your request is understandable');
  }
  
  if (specificityScore >= 18) {
    strengths.push('✓ Great specificity - you included detailed requirements and constraints');
  } else if (specificityScore >= 14) {
    strengths.push('✓ Reasonable level of detail in your request');
  }
  
  if (contextScore >= 18) {
    strengths.push('✓ Strong context provided - the AI has enough background to give a tailored response');
  } else if (contextScore >= 14) {
    strengths.push('✓ Some helpful context included');
  }
  
  if (goalScore >= 18) {
    strengths.push('✓ Clear goal orientation - you defined what success looks like');
  } else if (goalScore >= 14) {
    strengths.push('✓ Your objective is reasonably clear');
  }
  
  // Add technique-based strengths
  if (isQuestion) strengths.push('✓ Framed as a clear question which helps the AI focus its response');
  if (/\d+/.test(prompt)) strengths.push('✓ Included specific numbers which sets clear expectations');
  if (/example|like|such as/i.test(prompt)) strengths.push('✓ Referenced examples to clarify what you want');
  if (/step|steps|list|bullet/i.test(prompt)) strengths.push('✓ Requested structured output format');
  if (wordCount >= 15 && wordCount <= 50) strengths.push('✓ Good prompt length - detailed but not overwhelming');
  
  // Ensure at least one strength
  if (strengths.length === 0) {
    if (wordCount > 3) strengths.push('✓ You articulated a request for the AI to respond to');
    else strengths.push('✓ You initiated a conversation with the AI');
  }

  // ========================================
  // GENERATE DETAILED IMPROVEMENTS
  // ========================================
  const improvements: ImprovementItem[] = [];
  
  if (clarityScore < 18) {
    const clarityIssues = clarityNegatives.length > 0 ? clarityNegatives[0] : 'Your prompt could be clearer';
    improvements.push({
      issue: 'Clarity: ' + clarityIssues,
      explanation: 'When prompts are unclear or contain vague language, the AI may misinterpret your request. For example, words like "something", "stuff", or "things" don\'t give the AI enough information to understand what you actually want.',
      howToFix: `Rewrite using specific, concrete language. Instead of vague terms, name exactly what you want. Start with an action verb like "Explain...", "List...", "Create...". For your prompt, try: "${prompt.split(/\s+/).slice(0, 3).join(' ')}... [add specific details about what exactly you need]"`,
    });
  }
  
  if (specificityScore < 18) {
    const specificIssues = specificityNegatives.length > 0 ? specificityNegatives[0] : 'More details would improve results';
    improvements.push({
      issue: 'Specificity: ' + specificIssues,
      explanation: 'Vague prompts produce generic responses. Without specific requirements, the AI has to guess what you want, often resulting in responses that don\'t match your needs. The more specific you are, the more tailored and useful the response will be.',
      howToFix: `Add these details to your prompt: (1) Desired format (bullet points, paragraphs, table, code), (2) Length expectations (brief, detailed, 3-5 points), (3) Specific constraints or requirements. For example: "...in bullet point format with 5 key points, each 1-2 sentences"`,
    });
  }
  
  if (contextScore < 18) {
    const contextIssues = contextNegatives.length > 0 ? contextNegatives[0] : 'Background context is missing';
    improvements.push({
      issue: 'Context: ' + contextIssues,
      explanation: 'Without context, the AI cannot personalize its response to your situation. A prompt about "best programming language" will get a generic answer, but adding "for a beginner wanting to build web apps" gets a much more relevant response.',
      howToFix: `Add context by including: (1) Who you are: "I am a [student/professional/beginner]...", (2) Your purpose: "...for [a project/learning/work]...", (3) Any relevant background: "I already know about X and want to learn Y"`,
    });
  }
  
  if (goalScore < 18) {
    const goalIssues = goalNegatives.length > 0 ? goalNegatives[0] : 'The desired outcome is unclear';
    improvements.push({
      issue: 'Goal: ' + goalIssues,
      explanation: 'When the AI doesn\'t know what success looks like for you, it can\'t optimize its response. Stating your goal helps the AI understand what kind of answer would actually be useful to you.',
      howToFix: `Make your goal explicit: (1) State what you want to achieve: "I want to understand...", "I need to create...", (2) Describe the ideal outcome: "The response should help me...", (3) Mention how you\'ll use it: "...so I can apply it to..."`,
    });
  }

  // ========================================
  // GENERATE GOOD/BAD EXAMPLES BASED ON ACTUAL PROMPT
  // ========================================
  
  // Extract the core topic/intent from the prompt (use different name to avoid conflict)
  const extractedCoreWords = prompt.match(/\b[a-zA-Z]{3,}\b/g) || [];
  const extractedUniqueWords = [...new Set(extractedCoreWords.map(w => w.toLowerCase()))];
  const extractedTopicWords = extractedUniqueWords.filter(w => !['the', 'and', 'for', 'that', 'this', 'with', 'what', 'how', 'why', 'can', 'could', 'would', 'should', 'will', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'does', 'did', 'but', 'not', 'you', 'your', 'they', 'them', 'from', 'into', 'some', 'any', 'all', 'most', 'more', 'than', 'very', 'just', 'also', 'about'].includes(w)).slice(0, 5);
  const topicForExamples = extractedTopicWords.join(' ') || 'the topic';
  
  // Create a BAD version - overly vague, missing key elements
  let badVersionExample = '';
  if (isQuestion) {
    badVersionExample = `Tell me about ${extractedTopicWords.slice(0, 2).join(' ') || 'this'}`;
  } else if (isCodeRelated) {
    badVersionExample = `Write code for ${extractedTopicWords.slice(0, 2).join(' ') || 'this'}`;
  } else if (isCreativeWriting) {
    badVersionExample = `Write something about ${extractedTopicWords.slice(0, 2).join(' ') || 'this topic'}`;
  } else {
    badVersionExample = `Help me with ${extractedTopicWords.slice(0, 2).join(' ') || 'something'}`;
  }
  badVersionExample += '\n\n❌ Problems: Too vague, no context, no format specified, unclear goal';
  
  // Create a GOOD version - enhanced with all the missing elements
  let goodVersionExample = '';
  const originalPromptCleaned = prompt.replace(/\s+/g, ' ').trim();
  
  if (isQuestion) {
    goodVersionExample = `I am a [your role, e.g., student/developer/professional] who needs to understand ${topicForExamples}.\n\n${originalPromptCleaned}\n\nPlease provide:\n- A clear explanation suitable for [beginner/intermediate/expert] level\n- 2-3 practical examples or use cases\n- Key points in bullet format\n- Any important considerations or caveats`;
  } else if (isCodeRelated) {
    goodVersionExample = `I am working on [project type] and need help with ${topicForExamples}.\n\n${originalPromptCleaned}\n\nRequirements:\n- Programming language: [specify]\n- Include code comments explaining the logic\n- Handle edge cases and errors\n- Provide example input/output`;
  } else if (isCreativeWriting) {
    goodVersionExample = `I need ${topicForExamples} content for [purpose, e.g., my blog, a presentation, a report].\n\n${originalPromptCleaned}\n\nSpecifications:\n- Target audience: [who will read this]\n- Tone: [professional/casual/educational]\n- Length: [word count or paragraph count]\n- Key points to include: [list 2-3 main ideas]`;
  } else if (isAnalysis) {
    goodVersionExample = `I need to analyze ${topicForExamples} for [purpose, e.g., decision-making, research, comparison].\n\n${originalPromptCleaned}\n\nPlease include:\n- Key factors to consider\n- Pros and cons analysis\n- Comparison with alternatives (if applicable)\n- Actionable recommendations`;
  } else {
    goodVersionExample = `Context: I am [your situation] and need help with ${topicForExamples}.\n\n${originalPromptCleaned}\n\nGoal: I want to [specific desired outcome].\n\nPlease provide:\n- [Specific format, e.g., step-by-step guide, summary, list]\n- [Any specific requirements]\n- [How detailed the response should be]`;
  }
  
  goodVersionExample += '\n\n✓ Improvements: Added context, specified format, clear goal, actionable structure';

  // ========================================
  // GENERATE OVERALL FEEDBACK & SUGGESTION
  // ========================================
  let overallFeedback = '';
  let overallSuggestion = '';
  
  if (totalScore >= 80) {
    overallFeedback = 'Excellent prompt! Your request is well-structured with clear goals and good context.';
    overallSuggestion = 'Great job! To make it even better, you could add an example of your ideal output or specify any constraints the AI should work within.';
  } else if (totalScore >= 60) {
    overallFeedback = 'Good prompt with room for improvement. You\'ve communicated your basic need but could add more detail.';
    const weakestArea = clarityScore <= specificityScore && clarityScore <= contextScore && clarityScore <= goalScore ? 'clarity' :
                        specificityScore <= contextScore && specificityScore <= goalScore ? 'specificity' :
                        contextScore <= goalScore ? 'context' : 'goal orientation';
    overallSuggestion = `Your biggest opportunity for improvement is ${weakestArea}. Adding more ${weakestArea === 'clarity' ? 'direct and specific language' : weakestArea === 'specificity' ? 'concrete details and requirements' : weakestArea === 'context' ? 'background information about your situation' : 'explicit goals and success criteria'} would significantly improve the AI\'s response.`;
  } else if (totalScore >= 40) {
    overallFeedback = 'Your prompt gets the basic idea across but lacks the detail needed for a great AI response.';
    overallSuggestion = 'Try the "5W1H" framework: Who (are you), What (do you need), When (is this for), Where (will it be used), Why (do you need it), and How (should it be delivered). Adding even 2-3 of these elements will dramatically improve your results.';
  } else {
    overallFeedback = 'This prompt needs significant improvement to get useful AI responses.';
    overallSuggestion = 'Start with this template: "I am [who you are] and I need [what you want] because [why you need it]. Please provide [format] that includes [specific requirements]. The response should [goal/success criteria]."';
  }

  return {
    totalScore,
    maxPossibleScore: 100,
    criteria,
    feedback: overallFeedback,
    analysisSource: 'rule-based',
    analysisCostUSD: 0,
    strengths,
    improvements,
    goodVersionExample,
    badVersionExample,
    overallSuggestion,
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

