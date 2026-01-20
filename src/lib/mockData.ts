// Mock data for the GenAI learning platform

export interface Student {
  id: string;
  name: string;
  email: string;
  tokensUsed: number;
  tokensLimit: number;
  coursesEnrolled: number;
  lastActive: string;
  status: "active" | "inactive";
  course?: string;
  batch?: string;
  rank?: number;
  sessions?: number;
  artifacts?: number;
  prompts?: number;
  avgScore?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  curriculum?: string;
  instructions?: string;
  students: number;
  duration: string | number;
  status: "active" | "draft";
  progress?: number;
  instructor?: string;
  aiModels?: string[];
  maxStudents?: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  tokensPerRequest: number;
  enabled: boolean;
  description: string;
  category: "text" | "image" | "audio" | "video" | "other";
  features?: string[];
  requestCount?: number;
  company?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  messages: number;
  tokens: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  tokensUsed: number;
  accuracy: number;
}

export interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  grade?: string;
}

export const mockStudents: Student[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@university.edu",
    tokensUsed: 12500,
    tokensLimit: 50000,
    coursesEnrolled: 2,
    lastActive: "2 hours ago",
    status: "active",
    course: "Introduction to Large Language Models",
    batch: "Spring 2025",
    rank: 5,
    sessions: 45,
    artifacts: 23,
    prompts: 180,
    avgScore: 85,
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@university.edu",
    tokensUsed: 8200,
    tokensLimit: 50000,
    coursesEnrolled: 1,
    lastActive: "1 day ago",
    status: "active",
    course: "Prompt Engineering Masterclass",
    batch: "Summer 2025",
    rank: 12,
    sessions: 32,
    artifacts: 15,
    prompts: 120,
    avgScore: 78,
  },
  {
    id: "3",
    name: "Carol Williams",
    email: "carol@university.edu",
    tokensUsed: 18900,
    tokensLimit: 50000,
    coursesEnrolled: 3,
    lastActive: "5 hours ago",
    status: "active",
    course: "Introduction to Large Language Models",
    batch: "Fall 2024",
    rank: 2,
    sessions: 67,
    artifacts: 41,
    prompts: 280,
    avgScore: 92,
  }
];

export const mockCourses: Course[] = [
  {
    id: "1",
    title: "Introduction to Large Language Models",
    description: "Learn the fundamentals of LLMs and their applications",
    curriculum: "Week 1: Introduction, Week 2: Architecture...",
    instructions: "This course covers the basics of large language models, including architecture, training, and applications.",
    students: 45,
    duration: 8,
    status: "active",
    progress: 65,
    instructor: "Dr. Sarah Chen",
    aiModels: ["1", "2"],
    maxStudents: 50,
  },
  {
    id: "2",
    title: "Prompt Engineering Masterclass",
    description: "Master the art of crafting effective prompts",
    curriculum: "Week 1: Basics, Week 2: Advanced Techniques...",
    instructions: "Learn advanced techniques for prompt engineering across different AI models.",
    students: 38,
    duration: 6,
    status: "active",
    progress: 40,
    instructor: "Prof. Michael Roberts",
    aiModels: ["1", "2", "3"],
    maxStudents: 40,
  },
  {
    id: "3",
    title: "AI Ethics and Responsible AI",
    description: "Understanding ethical implications of AI systems",
    curriculum: "Week 1: Ethics, Week 2: Bias...",
    instructions: "Explore the ethical implications of AI and learn how to build responsible AI systems.",
    students: 28,
    duration: 4,
    status: "draft",
    progress: 0,
    instructor: "Dr. Emily Watson",
    aiModels: ["2"],
    maxStudents: 35,
  }
];

export const mockAIModels: AIModel[] = [
  // Text Models
  { id: "1", name: "GPT-4", provider: "OpenAI", description: "Most capable GPT model for complex tasks", tokensPerRequest: 1.0, enabled: true, category: "text", features: ["Advanced reasoning", "Long context", "Multimodal"], requestCount: 1250, company: "OpenAI" },
  { id: "2", name: "GPT-3.5 Turbo", provider: "OpenAI", description: "Fast and efficient for most tasks", tokensPerRequest: 0.5, enabled: true, category: "text", features: ["Fast responses", "Cost-effective", "Good for chat"], requestCount: 3450, company: "OpenAI" },
  { id: "3", name: "Claude 3 Opus", provider: "Anthropic", description: "Powerful model with strong reasoning", tokensPerRequest: 1.2, enabled: true, category: "text", features: ["Excellent reasoning", "Reliable", "Long context"], requestCount: 890, company: "Anthropic" },
  { id: "4", name: "Claude 3 Sonnet", provider: "Anthropic", description: "Balanced performance and cost", tokensPerRequest: 0.8, enabled: true, category: "text", features: ["Balanced", "Reliable", "Fast"], requestCount: 2100, company: "Anthropic" },
  { id: "5", name: "Gemini Pro", provider: "Google", description: "Google's advanced AI model", tokensPerRequest: 0.7, enabled: false, category: "text", features: ["Multimodal", "Fast", "Long context"], requestCount: 450, company: "Google" },
  
  // Image Models
  { id: "6", name: "DALL-E 3", provider: "OpenAI", description: "Advanced image generation", tokensPerRequest: 2.0, enabled: true, category: "image", features: ["High quality", "Creative", "Text rendering"], requestCount: 680, company: "OpenAI" },
  { id: "7", name: "Midjourney", provider: "Midjourney", description: "Artistic image generation", tokensPerRequest: 1.8, enabled: true, category: "image", features: ["Artistic", "Stylized", "High detail"], requestCount: 920, company: "Midjourney" },
  { id: "8", name: "Stable Diffusion XL", provider: "Stability AI", description: "Open-source image generation", tokensPerRequest: 1.5, enabled: false, category: "image", features: ["Open source", "Customizable", "Fast"], requestCount: 320, company: "Stability AI" },
  
  // Audio Models
  { id: "9", name: "Whisper", provider: "OpenAI", description: "Speech-to-text transcription", tokensPerRequest: 0.6, enabled: true, category: "audio", features: ["Accurate", "Multilingual", "Fast"], requestCount: 540, company: "OpenAI" },
  { id: "10", name: "ElevenLabs TTS", provider: "ElevenLabs", description: "Natural text-to-speech", tokensPerRequest: 0.8, enabled: true, category: "audio", features: ["Natural voices", "Emotional", "Voice cloning"], requestCount: 380, company: "ElevenLabs" },
  
  // Video Models
  { id: "11", name: "Runway Gen-2", provider: "Runway", description: "AI video generation", tokensPerRequest: 3.0, enabled: false, category: "video", features: ["Video generation", "Style transfer", "High quality"], requestCount: 120, company: "Runway" },
  { id: "12", name: "Pika", provider: "Pika Labs", description: "Creative video AI", tokensPerRequest: 2.5, enabled: false, category: "video", features: ["Creative", "Easy to use", "Fast"], requestCount: 85, company: "Pika Labs" },
  
  // Other
  { id: "13", name: "Code Interpreter", provider: "OpenAI", description: "Execute and analyze code", tokensPerRequest: 1.0, enabled: true, category: "other", features: ["Code execution", "Data analysis", "File handling"], requestCount: 670, company: "OpenAI" },
  { id: "14", name: "Web Search", provider: "Perplexity", description: "Real-time web search and answers", tokensPerRequest: 0.9, enabled: true, category: "other", features: ["Real-time data", "Citations", "Accurate"], requestCount: 1050, company: "Perplexity" },
];

export const mockChatSessions: ChatSession[] = [
  {
    id: "1",
    title: "Introduction to Transformers",
    model: "GPT-4",
    messages: 15,
    tokens: 3500,
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    title: "Prompt Engineering Basics",
    model: "Claude 3 Opus",
    messages: 8,
    tokens: 2100,
    createdAt: "2024-01-14"
  },
  {
    id: "3",
    title: "RAG Implementation",
    model: "GPT-3.5 Turbo",
    messages: 22,
    tokens: 5800,
    createdAt: "2024-01-13"
  }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Carol Williams", tokensUsed: 45000, accuracy: 94 },
  { rank: 2, name: "Alice Johnson", tokensUsed: 12500, accuracy: 92 },
  { rank: 3, name: "Bob Smith", tokensUsed: 8900, accuracy: 89 },
  { rank: 4, name: "David Brown", tokensUsed: 2300, accuracy: 87 }
];

export const mockAssignments: Assignment[] = [
  {
    id: "1",
    title: "LLM Fundamentals Quiz",
    course: "Introduction to Large Language Models",
    dueDate: "2024-01-20",
    status: "pending"
  },
  {
    id: "2",
    title: "Prompt Design Project",
    course: "Prompt Engineering Masterclass",
    dueDate: "2024-01-18",
    status: "submitted"
  },
  {
    id: "3",
    title: "AI Ethics Essay",
    course: "AI Ethics and Responsible AI",
    dueDate: "2024-01-12",
    status: "graded",
    grade: "A"
  }
];

export const mockEnrolledCourses: Course[] = [
  {
    id: "1",
    title: "Introduction to Large Language Models",
    description: "Learn the fundamentals of LLMs and their applications",
    students: 45,
    duration: "6 weeks",
    status: "active",
    progress: 65,
    instructor: "Dr. Sarah Chen"
  },
  {
    id: "2",
    title: "Prompt Engineering Masterclass",
    description: "Master the art of crafting effective prompts",
    students: 38,
    duration: "4 weeks",
    status: "active",
    progress: 40,
    instructor: "Prof. Michael Roberts"
  },
  {
    id: "3",
    title: "AI Ethics and Responsible AI",
    description: "Understanding ethical implications of AI systems",
    students: 52,
    duration: "3 weeks",
    status: "active",
    progress: 85,
    instructor: "Dr. Emily Watson"
  }
];

// AI Chatbots & Guardrails
export interface Guardrail {
  id: string;
  type: "educational-integrity" | "content-safety" | "behavioral" | "custom";
  appliesTo: "prompts" | "responses" | "both";
  title: string;
  instruction: string;
  priority: number;
  description?: string;
  enabled?: boolean;
}

export interface AIChatbot {
  id: string;
  name: string;
  description: string;
  modelId: string;
  modelName: string;
  guardrails: Guardrail[];
  behavioralPrompt: string;
  knowledgeBase?: string[];
  createdAt: string;
  sessionsCount: number;
}

export const mockGuardrails: Guardrail[] = [
  { id: "1", type: "educational-integrity", appliesTo: "both", title: "Educational Integrity", instruction: "Encourage understanding over direct answers. Guide students to learn.", priority: 9, description: "Ensures academic honesty", enabled: true },
  { id: "2", type: "content-safety", appliesTo: "responses", title: "Content Safety", instruction: "Filter inappropriate or harmful content from responses.", priority: 10, description: "Filters inappropriate content", enabled: true },
  { id: "3", type: "behavioral", appliesTo: "prompts", title: "Behavioral Guidelines", instruction: "Ensure all interactions maintain professional and respectful tone.", priority: 7, description: "Maintains professional tone", enabled: true },
];

export const mockBatches = [
  { id: "1", name: "Spring 2025", courseId: "1" },
  { id: "2", name: "Fall 2024", courseId: "1" },
  { id: "3", name: "Summer 2025", courseId: "2" },
];

export const mockAPIProviders = [
  { id: "1", name: "OpenAI", models: ["GPT-4", "GPT-3.5 Turbo", "DALL-E 3", "Whisper", "Code Interpreter"] },
  { id: "2", name: "Anthropic", models: ["Claude 3 Opus", "Claude 3 Sonnet"] },
  { id: "3", name: "Google", models: ["Gemini Pro"] },
  { id: "4", name: "Midjourney", models: ["Midjourney"] },
  { id: "5", name: "Stability AI", models: ["Stable Diffusion XL"] },
  { id: "6", name: "ElevenLabs", models: ["ElevenLabs TTS"] },
  { id: "7", name: "Runway", models: ["Runway Gen-2"] },
  { id: "8", name: "Pika Labs", models: ["Pika"] },
  { id: "9", name: "Perplexity", models: ["Web Search"] },
];

export const mockAdmins = [
  { id: "1", name: "John Admin", email: "john@university.edu", role: "Super Admin" },
  { id: "2", name: "Sarah Manager", email: "sarah@university.edu", role: "Course Manager" },
];

export const mockAIChatbots: AIChatbot[] = [
  {
    id: "1",
    name: "Python Tutor",
    description: "Specialized chatbot for learning Python programming with step-by-step guidance",
    modelId: "1",
    modelName: "GPT-4",
    guardrails: [mockGuardrails[0], mockGuardrails[1]],
    behavioralPrompt: "You are a patient Python programming tutor. Guide students through concepts with examples and encourage them to solve problems independently.",
    knowledgeBase: ["python_basics.pdf", "algorithms_guide.pdf"],
    createdAt: "2024-02-20",
    sessionsCount: 12,
  },
  {
    id: "2",
    name: "Research Assistant",
    description: "Helps with academic research, citations, and paper structure",
    modelId: "3",
    modelName: "Claude 3 Opus",
    guardrails: [mockGuardrails[0], mockGuardrails[2]],
    behavioralPrompt: "You are an academic research assistant. Help students find credible sources, structure their papers, and maintain academic integrity.",
    knowledgeBase: ["apa_style.pdf"],
    createdAt: "2024-02-18",
    sessionsCount: 8,
  },
  {
    id: "3",
    name: "Creative Writing Coach",
    description: "Provides feedback on creative writing and storytelling techniques",
    modelId: "4",
    modelName: "Claude 3 Sonnet",
    guardrails: [mockGuardrails[1]],
    behavioralPrompt: "You are a creative writing coach. Provide constructive feedback on narrative structure, character development, and writing style.",
    createdAt: "2024-02-15",
    sessionsCount: 5,
  },
];

// Artifacts
export interface Artifact {
  id: string;
  title: string;
  type: "image" | "code" | "document";
  modelName: string;
  sessionId: string;
  sessionTitle: string;
  preview?: string;
  content: string;
  createdAt: string;
}

export const mockArtifacts: Artifact[] = [
  { id: "1", title: "Python Sorting Algorithm", type: "code", modelName: "GPT-4", sessionId: "1", sessionTitle: "Algorithm Learning", content: "def bubble_sort(arr):\n  ...", createdAt: "2024-03-01", preview: "Python code snippet" },
  { id: "2", title: "Mountain Landscape", type: "image", modelName: "DALL-E 3", sessionId: "2", sessionTitle: "Image Generation", content: "image_url", createdAt: "2024-02-28", preview: "/placeholder.svg" },
  { id: "3", title: "Essay Outline", type: "document", modelName: "Claude 3 Opus", sessionId: "3", sessionTitle: "Essay Writing", content: "I. Introduction\nII. Body...", createdAt: "2024-02-27", preview: "Markdown document" },
  { id: "4", title: "Data Visualization", type: "code", modelName: "GPT-4", sessionId: "4", sessionTitle: "Data Science", content: "import matplotlib...", createdAt: "2024-02-26", preview: "Python visualization" },
  { id: "5", title: "Sunset Scene", type: "image", modelName: "Midjourney", sessionId: "5", sessionTitle: "Art Creation", content: "image_url", createdAt: "2024-02-25", preview: "/placeholder.svg" },
  { id: "6", title: "Research Notes", type: "document", modelName: "Claude 3 Sonnet", sessionId: "6", sessionTitle: "Literature Review", content: "Key findings...", createdAt: "2024-02-24", preview: "Research summary" },
];

// Enhanced Analytics
export const mockAnalytics = {
  tokenUsage: { used: 12500, limit: 50000 },
  promptsThisWeek: { count: 47, trend: "+12%" },
  failedPrompts: { count: 3 },
  promptsToday: { count: 8 },
  rank: { position: 2, total: 4 },
};

// Chat Artifacts (for real-time chat interface)
export interface ChatArtifact {
  id: string;
  title: string;
  timeAgo: string;
  content: string;
  characterCount: number;
  promptQuality: number;
}

export const mockChatArtifacts: ChatArtifact[] = [
  {
    id: "1",
    title: "Python Function Implementation",
    timeAgo: "2 minutes ago",
    content: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)`,
    characterCount: 120,
    promptQuality: 85
  },
  {
    id: "2",
    title: "Algorithm Explanation",
    timeAgo: "5 minutes ago",
    content: "The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones. This recursive implementation demonstrates the basic concept...",
    characterCount: 245,
    promptQuality: 72
  },
  {
    id: "3",
    title: "Code Review Summary",
    timeAgo: "10 minutes ago",
    content: "1. Consider using memoization to optimize the recursive function\n2. Add input validation for negative numbers\n3. Document the time complexity (O(2^n))",
    characterCount: 178,
    promptQuality: 65
  }
];
