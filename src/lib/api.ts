// API Client for GenAI Lab Backend

const API_BASE_URL = 'http://localhost:3001/api';

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get stored auth token
const getToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content responses (e.g., from DELETE operations)
  if (response.status === 204) {
    return { success: true, data: null } as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.errors
    );
  }

  return data;
}

// Custom error class
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// ==================== AUTH API ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  registrationId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  registrationId?: string;
  tokenQuota: number;
  tokenUsed: number;
  course?: { id: string; name: string };
  batch?: { id: string; name: string };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiRequest<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: RegisterData) =>
    apiRequest<ApiResponse<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  adminRegister: (data: RegisterData & { adminCode: string }) =>
    apiRequest<ApiResponse<AuthResponse>>('/auth/admin/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () =>
    apiRequest<ApiResponse<{ user: User }>>('/auth/me'),

  updateProfile: (data: { name?: string; email?: string }) =>
    apiRequest<ApiResponse<{ user: User }>>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiRequest<ApiResponse<{ message: string }>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refreshToken: (refreshToken: string) =>
    apiRequest<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// ==================== MODELS API ====================

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  category: 'text' | 'image' | 'audio';
  description?: string;
  inputCost: number;
  outputCost: number;
  maxTokens: number;
  isActive: boolean;
}

export const modelsApi = {
  getAll: () =>
    apiRequest<ApiResponse<{ models: AIModel[] }>>('/models'),

  getById: (id: string) =>
    apiRequest<ApiResponse<{ model: AIModel }>>(`/models/${id}`),

  getByCategory: (category: string) =>
    apiRequest<ApiResponse<{ models: AIModel[] }>>(`/models/category/${category}`),
};

// ==================== SESSIONS API ====================

export interface Session {
  id: string;
  userId: string;
  modelId: string;
  agentId?: string;
  title?: string;
  totalScore: number;
  avgScore: number;
  promptCount: number;
  tokensUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  model: {
    id: string;
    name: string;
    provider: string;
    category: string;
  };
  agent?: {
    id: string;
    name: string;
  };
  messages?: Message[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  score?: number;
  feedback?: string;
  tokens: number;
  createdAt: string;
}

export interface ScoreResult {
  totalScore: number;
  criteria: {
    clarity: number;
    context: number;
    specificity: number;
    structure: number;
    relevance: number;
    constraints: number;
  };
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

export interface SendMessageResult {
  userMessage: Message & { scoreResult: ScoreResult };
  assistantMessage: Message;
  tokensUsed: number;
  isMock: boolean;
  sessionStats: {
    avgScore: number;
    promptCount: number;
    tokensUsed: number;
  };
}

export const sessionsApi = {
  create: (data: { modelId: string; agentId?: string; title?: string }) =>
    apiRequest<ApiResponse<{ session: Session }>>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params?: { page?: number; limit?: number; modelId?: string; agentId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.modelId) query.set('modelId', params.modelId);
    if (params?.agentId) query.set('agentId', params.agentId);
    return apiRequest<PaginatedResponse<Session>>(`/sessions?${query}`);
  },

  getById: (id: string) =>
    apiRequest<ApiResponse<{ session: Session }>>(`/sessions/${id}`),

  sendMessage: (sessionId: string, content: string) =>
    apiRequest<ApiResponse<SendMessageResult>>(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getMessages: (sessionId: string) =>
    apiRequest<ApiResponse<{ messages: Message[] }>>(`/sessions/${sessionId}/messages`),

  end: (sessionId: string) =>
    apiRequest<ApiResponse<{ session: Session }>>(`/sessions/${sessionId}/end`, {
      method: 'POST',
    }),
};

// ==================== STUDENT API ====================

export interface DashboardStats {
  user: {
    id: string;
    name: string;
    course?: { id: string; name: string };
    batch?: { id: string; name: string };
  };
  stats: {
    sessions: number;
    avgScore: number;
    prompts: number;
    artifacts: number;
    agents: number;
  };
  tokens: {
    quota: number;
    used: number;
    remaining: number;
    usagePercent: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    details?: string;
    createdAt: string;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  registrationId?: string;
  course: string;
  avgScore: number;
  sessions: number;
  tokensUsed: number;
}

export interface ActivityCalendar {
  month: number;
  year: number;
  activeDays: number[];
  totalActiveDays: number;
  currentStreak: number;
}

export const studentApi = {
  getDashboard: () =>
    apiRequest<ApiResponse<DashboardStats>>('/students/dashboard'),

  getRecentSessions: (limit?: number) =>
    apiRequest<ApiResponse<{ sessions: Session[] }>>(`/students/recent-sessions${limit ? `?limit=${limit}` : ''}`),

  getLeaderboard: (type: 'institutional' | 'course', courseId?: string) => {
    const query = new URLSearchParams({ type });
    if (courseId) query.set('courseId', courseId);
    return apiRequest<ApiResponse<{ leaderboard: LeaderboardEntry[]; type: string }>>(`/students/leaderboard?${query}`);
  },

  getCourseRank: () =>
    apiRequest<ApiResponse<{ rank: number | null; total: number }>>('/students/rank'),

  getActivityCalendar: () =>
    apiRequest<ApiResponse<ActivityCalendar>>('/students/activity-calendar'),
};

// ==================== AGENTS API ====================

export interface Agent {
  id: string;
  userId: string;
  modelId: string;
  name: string;
  description?: string;
  behaviorPrompt?: string;
  strictMode: boolean;
  knowledgeBase: string[];
  sessionsCount: number;
  messagesCount: number;
  tokensUsed: number;
  status: 'active' | 'inactive';
  model: {
    id: string;
    name: string;
    provider: string;
    category: string;
  };
}

export interface Guardrail {
  id: string;
  type: string;
  title: string;
  instruction: string;
  appliesTo: string;
  priority: number;
  isSystem: boolean;
}

export const agentsApi = {
  getAll: () =>
    apiRequest<ApiResponse<{ agents: Agent[] }>>('/agents'),

  getById: (id: string) =>
    apiRequest<ApiResponse<{ agent: Agent }>>(`/agents/${id}`),

  create: (data: {
    name: string;
    description?: string;
    modelId: string;
    behaviorPrompt?: string;
    strictMode?: boolean;
    knowledgeBase?: string[];
    guardrailIds?: string[];
  }) =>
    apiRequest<ApiResponse<{ agent: Agent }>>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Agent>) =>
    apiRequest<ApiResponse<{ agent: Agent }>>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<ApiResponse<void>>(`/agents/${id}`, {
      method: 'DELETE',
    }),

  getGuardrails: () =>
    apiRequest<ApiResponse<{ guardrails: Guardrail[] }>>('/agents/guardrails'),

  getStats: (id: string) =>
    apiRequest<ApiResponse<{ stats: any }>>(`/agents/${id}/stats`),
};

// ==================== ARTIFACTS API ====================

export interface Artifact {
  id: string;
  userId: string;
  sessionId: string;
  type: 'text' | 'code' | 'image' | 'audio';
  title?: string;
  content: string;
  modelUsed?: string;
  score?: number;
  isBookmarked: boolean;
  createdAt: string;
  session: {
    id: string;
    title?: string;
    model: { name: string; provider: string };
  };
}

export const artifactsApi = {
  getAll: (params?: { page?: number; type?: string; bookmarked?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.type) query.set('type', params.type);
    if (params?.bookmarked) query.set('bookmarked', 'true');
    return apiRequest<PaginatedResponse<Artifact>>(`/artifacts?${query}`);
  },

  getById: (id: string) =>
    apiRequest<ApiResponse<{ artifact: Artifact }>>(`/artifacts/${id}`),

  create: (data: {
    sessionId: string;
    type: 'text' | 'code' | 'image' | 'audio';
    title?: string;
    content: string;
  }) =>
    apiRequest<ApiResponse<{ artifact: Artifact }>>('/artifacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleBookmark: (id: string) =>
    apiRequest<ApiResponse<{ artifact: Artifact }>>(`/artifacts/${id}/bookmark`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiRequest<ApiResponse<void>>(`/artifacts/${id}`, {
      method: 'DELETE',
    }),
};

export default {
  auth: authApi,
  models: modelsApi,
  sessions: sessionsApi,
  student: studentApi,
  agents: agentsApi,
  artifacts: artifactsApi,
};

