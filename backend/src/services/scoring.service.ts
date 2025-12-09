/**
 * Prompt Scoring Service
 * 
 * Scores prompts based on multiple criteria:
 * - Clarity (20%): Is the prompt clear and understandable?
 * - Context (20%): Does it provide necessary background?
 * - Specificity (15%): Are requirements detailed?
 * - Structure (15%): Is it well-organized?
 * - Relevance (15%): Related to conversation flow?
 * - Constraints (15%): Does it set boundaries/format?
 */

export interface ScoringCriteria {
  clarity: number;      // 0-100
  context: number;      // 0-100
  specificity: number;  // 0-100
  structure: number;    // 0-100
  relevance: number;    // 0-100
  constraints: number;  // 0-100
}

export interface ScoreResult {
  totalScore: number;
  criteria: ScoringCriteria;
  feedback: {
    strengths: string[];
    improvements: string[];
    biggestGap: string;
    suggestion: string;
  };
  comparison: {
    weakExample: { prompt: string; issue: string };
    strongExample: { prompt: string; why: string };
  };
}

// Analyze prompt clarity
const analyzeClarity = (prompt: string): number => {
  let score = 50; // Base score

  // Check for question marks or clear requests
  if (prompt.includes('?') || /please|can you|could you|help me/i.test(prompt)) {
    score += 10;
  }

  // Check for ambiguous words
  const ambiguousWords = ['stuff', 'things', 'something', 'whatever', 'etc'];
  const hasAmbiguous = ambiguousWords.some(word => 
    prompt.toLowerCase().includes(word)
  );
  if (hasAmbiguous) score -= 15;

  // Length check - too short is unclear
  if (prompt.length < 20) score -= 20;
  if (prompt.length > 50) score += 10;
  if (prompt.length > 100) score += 10;

  // Check for complete sentences
  if (/[.!?]$/.test(prompt.trim())) score += 10;

  return Math.max(0, Math.min(100, score));
};

// Analyze context provided
const analyzeContext = (
  prompt: string, 
  previousMessages: Array<{ role: string; content: string }>
): number => {
  let score = 40; // Base score

  // Check for context-setting phrases
  const contextPhrases = [
    'I am working on', 'I need to', 'I want to', 'My goal is',
    'In the context of', 'Given that', 'Considering', 'Based on',
    'I have', 'I\'m trying to', 'The situation is'
  ];
  
  const hasContext = contextPhrases.some(phrase => 
    prompt.toLowerCase().includes(phrase.toLowerCase())
  );
  if (hasContext) score += 25;

  // Check if building on previous conversation
  if (previousMessages.length > 0) {
    const lastMessage = previousMessages[previousMessages.length - 1];
    // Check for references to previous content
    if (/this|that|it|above|previous|mentioned/i.test(prompt)) {
      score += 15;
    }
  }

  // Check for domain/topic specification
  if (/in \w+|for \w+|about \w+|regarding/i.test(prompt)) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

// Analyze specificity
const analyzeSpecificity = (prompt: string): number => {
  let score = 40;

  // Check for specific numbers or quantities
  if (/\d+|few|several|multiple|specific/i.test(prompt)) score += 15;

  // Check for specific terms (technical words, proper nouns)
  const words = prompt.split(/\s+/);
  const capitalizedWords = words.filter(w => /^[A-Z][a-z]/.test(w));
  if (capitalizedWords.length > 0) score += 10;

  // Check for detailed requirements
  const detailIndicators = [
    'including', 'such as', 'for example', 'specifically',
    'exactly', 'must', 'should', 'require'
  ];
  const hasDetails = detailIndicators.some(ind => 
    prompt.toLowerCase().includes(ind)
  );
  if (hasDetails) score += 20;

  // Penalize very generic prompts
  const genericPhrases = ['tell me about', 'what is', 'explain'];
  const isGeneric = genericPhrases.some(phrase => 
    prompt.toLowerCase().startsWith(phrase)
  );
  if (isGeneric && prompt.length < 50) score -= 15;

  return Math.max(0, Math.min(100, score));
};

// Analyze structure
const analyzeStructure = (prompt: string): number => {
  let score = 50;

  // Check for bullet points or numbered lists
  if (/[-•*]\s|^\d+[.)]/m.test(prompt)) score += 20;

  // Check for sections or headers
  if (/:\s*\n|^#+\s/m.test(prompt)) score += 15;

  // Check for logical connectors
  const connectors = ['first', 'then', 'next', 'finally', 'also', 'additionally'];
  const hasConnectors = connectors.some(c => 
    prompt.toLowerCase().includes(c)
  );
  if (hasConnectors) score += 10;

  // Check for proper punctuation
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length > 1) score += 10;

  return Math.max(0, Math.min(100, score));
};

// Analyze relevance to conversation
const analyzeRelevance = (
  prompt: string,
  previousMessages: Array<{ role: string; content: string }>
): number => {
  if (previousMessages.length === 0) {
    return 70; // First message, neutral relevance
  }

  let score = 50;

  // Get keywords from previous messages
  const previousContent = previousMessages
    .map(m => m.content)
    .join(' ')
    .toLowerCase();
  
  const promptWords = prompt.toLowerCase().split(/\s+/);
  const previousWords = new Set(previousContent.split(/\s+/));

  // Check for shared keywords (excluding common words)
  const commonWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'and', 'in', 'that', 'it', 'for']);
  const sharedWords = promptWords.filter(w => 
    previousWords.has(w) && !commonWords.has(w) && w.length > 3
  );

  if (sharedWords.length > 0) score += 15;
  if (sharedWords.length > 3) score += 15;

  // Check for follow-up indicators
  const followUpPhrases = [
    'can you also', 'additionally', 'furthermore', 'building on',
    'following up', 'related to', 'going back to'
  ];
  const isFollowUp = followUpPhrases.some(p => 
    prompt.toLowerCase().includes(p)
  );
  if (isFollowUp) score += 20;

  return Math.max(0, Math.min(100, score));
};

// Analyze constraints
const analyzeConstraints = (prompt: string): number => {
  let score = 40;

  // Check for format specifications
  const formatIndicators = [
    'format', 'json', 'markdown', 'list', 'table', 'bullet',
    'code', 'example', 'template'
  ];
  const hasFormat = formatIndicators.some(f => 
    prompt.toLowerCase().includes(f)
  );
  if (hasFormat) score += 20;

  // Check for length constraints
  if (/\b(brief|short|concise|detailed|comprehensive|summary)\b/i.test(prompt)) {
    score += 15;
  }

  // Check for tone/style constraints
  if (/\b(formal|informal|technical|simple|professional|casual)\b/i.test(prompt)) {
    score += 15;
  }

  // Check for limitations
  if (/\b(only|don't|avoid|without|limit|maximum|minimum)\b/i.test(prompt)) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

// Generate feedback based on scores
const generateFeedback = (criteria: ScoringCriteria): ScoreResult['feedback'] => {
  const strengths: string[] = [];
  const improvements: string[] = [];

  // Analyze each criterion
  if (criteria.clarity >= 70) {
    strengths.push('Your prompt is clear and easy to understand');
  } else {
    improvements.push('Try to be more explicit about what you\'re asking for');
  }

  if (criteria.context >= 70) {
    strengths.push('Good job providing context for your request');
  } else {
    improvements.push('Add more background information about your situation');
  }

  if (criteria.specificity >= 70) {
    strengths.push('Your requirements are specific and detailed');
  } else {
    improvements.push('Include more specific details about what you need');
  }

  if (criteria.structure >= 70) {
    strengths.push('Well-structured prompt with good organization');
  } else {
    improvements.push('Consider organizing your prompt with bullet points or steps');
  }

  if (criteria.constraints >= 70) {
    strengths.push('Good use of constraints and format specifications');
  } else {
    improvements.push('Specify the format or constraints for the response');
  }

  // Find biggest gap
  const lowestScore = Math.min(
    criteria.clarity,
    criteria.context,
    criteria.specificity,
    criteria.structure,
    criteria.constraints
  );

  let biggestGap = 'Overall prompt quality';
  if (criteria.clarity === lowestScore) biggestGap = 'Clarity - Make your request more explicit';
  else if (criteria.context === lowestScore) biggestGap = 'Context - Provide more background';
  else if (criteria.specificity === lowestScore) biggestGap = 'Specificity - Add more details';
  else if (criteria.structure === lowestScore) biggestGap = 'Structure - Organize better';
  else if (criteria.constraints === lowestScore) biggestGap = 'Constraints - Define expected format';

  const suggestion = improvements[0] || 'Keep up the great work with your prompts!';

  return { strengths, improvements, biggestGap, suggestion };
};

// Generate comparison examples
const generateComparison = (prompt: string): ScoreResult['comparison'] => {
  // Extract the topic/intent from the prompt
  const words = prompt.split(/\s+/).slice(0, 5).join(' ');
  
  return {
    weakExample: {
      prompt: `Tell me about ${words}...`,
      issue: "Too vague, lacks context and specific requirements"
    },
    strongExample: {
      prompt: `I'm working on [specific project]. Can you explain ${words} in detail, specifically focusing on [aspect]? Please provide examples and format the response as a bullet list.`,
      why: "Provides context, specifics, and output format"
    },
  };
};

// Main scoring function
export const scorePrompt = (
  prompt: string,
  previousMessages: Array<{ role: string; content: string }> = []
): ScoreResult => {
  const criteria: ScoringCriteria = {
    clarity: analyzeClarity(prompt),
    context: analyzeContext(prompt, previousMessages),
    specificity: analyzeSpecificity(prompt),
    structure: analyzeStructure(prompt),
    relevance: analyzeRelevance(prompt, previousMessages),
    constraints: analyzeConstraints(prompt),
  };

  // Calculate weighted total score
  const weights = {
    clarity: 0.20,
    context: 0.20,
    specificity: 0.15,
    structure: 0.15,
    relevance: 0.15,
    constraints: 0.15,
  };

  const totalScore = Math.round(
    criteria.clarity * weights.clarity +
    criteria.context * weights.context +
    criteria.specificity * weights.specificity +
    criteria.structure * weights.structure +
    criteria.relevance * weights.relevance +
    criteria.constraints * weights.constraints
  );

  const feedback = generateFeedback(criteria);
  const comparison = generateComparison(prompt);

  return {
    totalScore,
    criteria,
    feedback,
    comparison,
  };
};

// Calculate session average score
export const calculateSessionScore = (promptScores: number[]): number => {
  if (promptScores.length === 0) return 0;
  const sum = promptScores.reduce((a, b) => a + b, 0);
  return Math.round((sum / promptScores.length) * 10) / 10;
};

