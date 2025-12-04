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

// Get refresh token
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

// Save tokens
const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// Clear tokens
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Refresh access token
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.tokens) {
      saveTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      return data.data.tokens.accessToken;
    }
    return null;
  } catch {
    clearTokens();
    return null;
  }
};

// API request helper with automatic token refresh
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
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

  // Handle 401 Unauthorized - attempt token refresh
  if (response.status === 401 && retryCount === 0 && !endpoint.includes('/auth/')) {
    // Try to refresh the token
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      
      if (newToken) {
        onTokenRefreshed(newToken);
        // Retry the original request with new token
        return apiRequest<T>(endpoint, options, retryCount + 1);
      } else {
        // Refresh failed - redirect to login
        clearTokens();
        window.location.href = '/admin/signin';
        throw new ApiError('Session expired. Please login again.', 401);
      }
    } else {
      // Wait for token refresh to complete
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          if (newToken) {
            try {
              const result = await apiRequest<T>(endpoint, options, retryCount + 1);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new ApiError('Session expired. Please login again.', 401));
          }
        });
      });
    }
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
  enabled: boolean;
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

// ==================== ADMIN API ====================

export interface AdminStudent {
  id: string;
  email: string;
  name: string;
  registrationId: string;
  tokenQuota: number;
  tokenUsed: number;
  isActive: boolean;
  isVerified: boolean;
  avgScore?: number | null;
  createdAt: string;
  lastLoginAt?: string;
  course?: { id: string; name: string };
  batch?: { id: string; name: string };
  _count?: {
    sessions: number;
    agents: number;
    artifacts: number;
  };
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  instructor?: string;
  duration?: number;
  isActive: boolean;
  createdAt: string;
  batches?: Batch[];
  _count?: {
    students: number;
    batches: number;
  };
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  isActive: boolean;
  createdAt: string;
  course?: { id: string; name: string };
  _count?: {
    students: number;
  };
}

export interface APIKey {
  id: string;
  provider: string;
  apiKey: string | null;
  baseUrl?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface AdminGuardrail {
  id: string;
  type: string;
  title: string;
  instruction: string;
  appliesTo: string;
  priority: number;
  isSystem: boolean;
  isActive: boolean;
}

export interface AdminAnalytics {
  overview: {
    totalStudents: number;
    activeStudents: number;
    totalSessions: number;
    totalPrompts: number;
    totalTokensUsed: number;
    totalAgents?: number;
  };
  // Time-based analytics
  activeUsers?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  sessions?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  prompts?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  tokensUsed?: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  agentsCreated?: {
    total: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  // Cost analytics (in dollars)
  costs?: {
    total: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  dailyActivity: Array<{ createdAt: string; _count: number }>;
  modelUsage: Array<{
    modelId: string;
    _count: number;
    _sum: { tokensUsed: number };
    model?: { id: string; name: string; provider: string };
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    registrationId: string;
    tokenUsed: number;
    avgScore: number;
    sessionsCount: number;
  }>;
}

export const adminApi = {
  // Students
  getStudents: (params?: { page?: number; limit?: number; courseId?: string; batchId?: string; search?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.courseId) query.set('courseId', params.courseId);
    if (params?.batchId) query.set('batchId', params.batchId);
    if (params?.search) query.set('search', params.search);
    if (params?.isActive !== undefined) query.set('isActive', params.isActive.toString());
    return apiRequest<PaginatedResponse<AdminStudent>>(`/admin/students?${query}`);
  },

  getStudent: (id: string) =>
    apiRequest<ApiResponse<{ student: AdminStudent }>>(`/admin/students/${id}`),

  createStudent: (data: {
    email: string;
    name: string;
    registrationId: string;
    courseId?: string;
    batchId?: string;
    tokenLimit?: number;
  }) =>
    apiRequest<ApiResponse<{ student: AdminStudent; defaultPassword: string }>>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, data: {
    name?: string;
    email?: string;
    courseId?: string | null;
    batchId?: string | null;
    tokenQuota?: number;
    isActive?: boolean;
  }) =>
    apiRequest<ApiResponse<{ student: AdminStudent }>>(`/admin/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string, permanent?: boolean) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/students/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
    }),

  resetStudentPassword: (id: string) =>
    apiRequest<ApiResponse<{ newPassword: string }>>(`/admin/students/${id}/reset-password`, {
      method: 'POST',
    }),

  bulkOperation: (data: {
    operation: 'update_status' | 'update_tokens' | 'reset_passwords' | 'delete';
    registrationIds: string[];
    value?: any;
  }) =>
    apiRequest<ApiResponse<{ operation: string; affected: number; result: any }>>('/admin/students/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  importStudents: (data: {
    students: Array<{ email: string; name: string; registrationId: string }>;
    batchId?: string;
  }) =>
    apiRequest<ApiResponse<{ success: string[]; failed: Array<{ registrationId: string; error: string }> }>>('/admin/students/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Courses
  getCourses: () =>
    apiRequest<ApiResponse<Course[]>>('/admin/courses'),

  createCourse: (data: {
    name: string;
    description?: string;
    instructor?: string;
    duration?: number;
  }) =>
    apiRequest<ApiResponse<Course>>('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCourse: (id: string, data: Partial<{ name: string; description: string; instructor: string; duration: number }>) =>
    apiRequest<ApiResponse<Course>>(`/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCourse: (id: string) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/courses/${id}`, {
      method: 'DELETE',
    }),

  // Batches
  getBatches: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : '';
    return apiRequest<ApiResponse<Batch[]>>(`/admin/batches${query}`);
  },

  createBatch: (data: { courseId: string; name: string }) =>
    apiRequest<ApiResponse<Batch>>('/admin/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteBatch: (id: string) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/batches/${id}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalytics: () =>
    apiRequest<ApiResponse<AdminAnalytics>>('/admin/analytics'),

  // API Keys
  getAPIKeys: () =>
    apiRequest<ApiResponse<{ keys: APIKey[] }>>('/admin/api-keys'),

  updateAPIKey: (provider: string, data: { apiKey: string; baseUrl?: string }) =>
    apiRequest<ApiResponse<APIKey>>(`/admin/api-keys/${provider}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  testAPIKey: (provider: string) =>
    apiRequest<ApiResponse<{ success: boolean; message: string }>>(`/admin/api-keys/${provider}/test`, {
      method: 'POST',
    }),

  deleteAPIKey: (provider: string) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/api-keys/${provider}`, {
      method: 'DELETE',
    }),

  // Guardrails
  getGuardrails: () =>
    apiRequest<ApiResponse<AdminGuardrail[]>>('/admin/guardrails'),

  createGuardrail: (data: {
    type: string;
    title: string;
    instruction: string;
    appliesTo?: string;
    priority?: number;
  }) =>
    apiRequest<ApiResponse<AdminGuardrail>>('/admin/guardrails', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGuardrail: (id: string, data: Partial<{ type: string; title: string; instruction: string; appliesTo: string; priority: number; enabled: boolean }>) =>
    apiRequest<ApiResponse<AdminGuardrail>>(`/admin/guardrails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGuardrail: (id: string) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/guardrails/${id}`, {
      method: 'DELETE',
    }),

  // Model Management (Admin gets all models including inactive)
  getAllModels: () =>
    apiRequest<ApiResponse<{ models: any[] }>>('/admin/models'),

  updateModel: (modelId: string, data: { isActive?: boolean; maxTokens?: number; description?: string }) =>
    apiRequest<ApiResponse<any>>(`/admin/models/${modelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleModelActive: (modelId: string) =>
    apiRequest<ApiResponse<{ model: any; message: string }>>(`/admin/models/${modelId}/toggle`, {
      method: 'POST',
    }),

  testModel: (modelId: string) =>
    apiRequest<ApiResponse<{ success: boolean; message: string }>>(`/admin/models/${modelId}/test`, {
      method: 'POST',
    }),

  // Model Access
  getModelAccess: (modelId: string) =>
    apiRequest<ApiResponse<any[]>>(`/admin/models/${modelId}/access`),

  addModelAccess: (data: { modelId: string; courseId?: string; batchId?: string; studentId?: string }) =>
    apiRequest<ApiResponse<any>>('/admin/models/access', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeModelAccess: (id: string) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/models/access/${id}`, {
      method: 'DELETE',
    }),

  // Settings
  getSettings: () =>
    apiRequest<ApiResponse<{ settings: TokenSettings }>>('/admin/settings'),

  updateSettings: (data: Partial<TokenSettings>) =>
    apiRequest<ApiResponse<{ settings: TokenSettings }>>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Settings interface
export interface TokenSettings {
  id: string;
  // Token settings
  defaultTokenQuota: number;
  autoRefill: boolean;
  lowBalanceAlert: boolean;
  hardLimitEnforcement: boolean;
  lowBalanceThreshold: number;
  // Guardrails settings
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  aiIntentDetection: boolean;
  strictMode: boolean;
}

export default {
  auth: authApi,
  models: modelsApi,
  sessions: sessionsApi,
  student: studentApi,
  agents: agentsApi,
  artifacts: artifactsApi,
  admin: adminApi,
};

