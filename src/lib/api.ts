// API Client for GenAI Lab Backend

// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

// Get the current auth role from URL or stored value
const getCurrentAuthRole = (): 'admin' | 'student' => {
  // Check URL path first
  if (window.location.pathname.startsWith('/admin')) {
    return 'admin';
  }
  // Fallback to stored role or default to student
  return (localStorage.getItem('currentAuthRole') as 'admin' | 'student') || 'student';
};

// Set the current auth role
export const setCurrentAuthRole = (role: 'admin' | 'student') => {
  localStorage.setItem('currentAuthRole', role);
};

// Get stored auth token (role-specific)
const getToken = (): string | null => {
  const role = getCurrentAuthRole();
  return localStorage.getItem(`${role}_accessToken`);
};

// Get refresh token (role-specific)
const getRefreshToken = (): string | null => {
  const role = getCurrentAuthRole();
  return localStorage.getItem(`${role}_refreshToken`);
};

// Save tokens (role-specific)
const saveTokens = (accessToken: string, refreshToken: string, role?: 'admin' | 'student') => {
  const authRole = role || getCurrentAuthRole();
  localStorage.setItem(`${authRole}_accessToken`, accessToken);
  localStorage.setItem(`${authRole}_refreshToken`, refreshToken);
  setCurrentAuthRole(authRole);
};

// Clear tokens (role-specific)
const clearTokens = (role?: 'admin' | 'student') => {
  const authRole = role || getCurrentAuthRole();
  localStorage.removeItem(`${authRole}_accessToken`);
  localStorage.removeItem(`${authRole}_refreshToken`);
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
  const role = getCurrentAuthRole();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clearTokens(role);
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.tokens) {
      saveTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken, role);
      return data.data.tokens.accessToken;
    }
    return null;
  } catch {
    clearTokens(role);
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
        // Refresh failed - redirect to login based on role
        const role = getCurrentAuthRole();
        clearTokens(role);
        window.location.href = role === 'admin' ? '/admin/signin' : '/';
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
  mustChangePassword?: boolean;
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

  setNewPassword: (data: { newPassword: string }) =>
    apiRequest<ApiResponse<{ message: string }>>('/auth/set-new-password', {
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
  chatbotId?: string;
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
  chatbot?: {
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
  create: (data: { modelId: string; chatbotId?: string; title?: string }) =>
    apiRequest<ApiResponse<{ session: Session }>>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params?: { page?: number; limit?: number; modelId?: string; chatbotId?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.modelId) query.set('modelId', params.modelId);
    if (params?.chatbotId) query.set('chatbotId', params.chatbotId);
    return apiRequest<PaginatedResponse<Session>>(`/sessions?${query}`);
  },

  getById: (id: string) =>
    apiRequest<ApiResponse<{ session: Session }>>(`/sessions/${id}`),

  sendMessage: (sessionId: string, content: string) =>
    apiRequest<ApiResponse<SendMessageResult>>(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Streaming version of sendMessage
  sendMessageStreaming: async function* (sessionId: string, content: string) {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }

    // Process any remaining data
    if (buffer.startsWith('data: ')) {
      const data = JSON.parse(buffer.slice(6));
      yield data;
    }
  },

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
    chatbots: number;
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

// ==================== CHATBOTS API ====================

export interface Chatbot {
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
    modelId: string;
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

export const chatbotsApi = {
  getAll: () =>
    apiRequest<ApiResponse<{ chatbots: Chatbot[] }>>('/chatbots'),

  getById: (id: string) =>
    apiRequest<ApiResponse<{ chatbot: Chatbot }>>(`/chatbots/${id}`),

  create: (data: {
    name: string;
    description?: string;
    modelId: string;
    behaviorPrompt?: string;
    strictMode?: boolean;
    knowledgeBase?: string[];
    guardrailIds?: string[];
  }) =>
    apiRequest<ApiResponse<{ chatbot: Chatbot }>>('/chatbots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Chatbot>) =>
    apiRequest<ApiResponse<{ chatbot: Chatbot }>>(`/chatbots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<ApiResponse<void>>(`/chatbots/${id}`, {
      method: 'DELETE',
    }),

  getGuardrails: () =>
    apiRequest<ApiResponse<{ guardrails: Guardrail[] }>>('/chatbots/guardrails'),

  getStats: (id: string) =>
    apiRequest<ApiResponse<{ stats: any }>>(`/chatbots/${id}/stats`),
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
    chatbots: number;
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
    totalChatbots?: number;
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
  chatbotsCreated?: {
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

  createModel: (data: {
    name: string;
    provider: string;
    modelId: string;
    category: string;
    description?: string;
    inputCost?: number;
    outputCost?: number;
    maxTokens?: number;
    isActive?: boolean;
  }) =>
    apiRequest<ApiResponse<{ model: any }>>('/admin/models', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateModel: (modelId: string, data: { isActive?: boolean; maxTokens?: number; description?: string }) =>
    apiRequest<ApiResponse<any>>(`/admin/models/${modelId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteModel: (modelId: string) =>
    apiRequest<ApiResponse<{ message: string }>>(`/admin/models/${modelId}`, {
      method: 'DELETE',
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

// ==================== Comparison API ====================

export interface ComparisonModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  category: string;
  description: string | null;
  maxTokens: number;
}

export interface ComparisonResponse {
  modelId: string;
  modelName: string;
  provider: string;
  response: string;
  tokensUsed: number;
  responseTimeMs: number;
  score: number | null;
  isMock: boolean;
  error: string | null;
}

export interface CompareResult {
  comparisonSessionId: string;
  exchangeId: string;
  prompt: string;
  responses: ComparisonResponse[];
  totalTokensUsed: number;
}

export interface StartExchangeResult {
  comparisonSessionId: string;
  exchangeId: string;
  prompt: string;
  promptScore: number | null;
  models: Array<{
    id: string;
    name: string;
    provider: string;
  }>;
}

export interface ComparisonSessionSummary {
  id: string;
  category: string;
  title: string | null;
  totalTokensUsed: number;
  exchangeCount: number;
  lastPrompt: string | null;
  modelsUsed: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ComparisonExchange {
  id: string;
  prompt: string;
  responses: Array<{
    id: string;
    modelId: string;
    modelName: string;
    provider: string;
    response: string;
    tokensUsed: number;
    responseTimeMs: number;
    score: number | null;
    isMock: boolean;
    error: string | null;
    createdAt: string;
  }>;
  createdAt: string;
}

export interface ComparisonSessionDetails {
  id: string;
  category: string;
  title: string | null;
  totalTokensUsed: number;
  createdAt: string;
  updatedAt: string;
  exchanges: ComparisonExchange[];
}

export const comparisonApi = {
  // Get available categories
  getCategories: () =>
    apiRequest<ApiResponse<string[]>>('/comparison/categories'),

  // Get models by category
  getModelsByCategory: (category: string) =>
    apiRequest<ApiResponse<ComparisonModel[]>>(`/comparison/models/${category}`),

  // Start a comparison exchange - creates session/exchange, returns IDs
  startExchange: (data: {
    category: string;
    modelIds: string[];
    prompt: string;
    comparisonSessionId?: string;
  }) =>
    apiRequest<ApiResponse<StartExchangeResult>>('/comparison/start-exchange', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Run a single model comparison - called independently for each model
  runSingleModel: (data: {
    modelId: string;
    prompt: string;
    exchangeId: string;
  }) =>
    apiRequest<ApiResponse<ComparisonResponse>>('/comparison/run-model', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Stream a single model's response - returns an async generator
  streamSingleModel: async function* (data: {
    modelId: string;
    prompt: string;
    exchangeId: string;
  }): AsyncGenerator<{
    type: 'start' | 'chunk' | 'done' | 'error';
    content?: string;
    modelId?: string;
    modelName?: string;
    provider?: string;
    tokensUsed?: number;
    responseTimeMs?: number;
    isMock?: boolean;
    error?: string;
  }> {
    const token = getToken();
    
    const response = await fetch(`${API_BASE_URL}/comparison/stream-model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Process any remaining data
    if (buffer.startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        yield data;
      } catch (e) {
        // Skip invalid JSON
      }
    }
  },

  // Compare models (legacy - waits for all)
  compare: (data: {
    category: string;
    modelIds: string[];
    prompt: string;
    comparisonSessionId?: string;
  }) =>
    apiRequest<ApiResponse<CompareResult>>('/comparison/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get user's comparison sessions
  getSessions: () =>
    apiRequest<ApiResponse<ComparisonSessionSummary[]>>('/comparison/sessions'),

  // Get session details
  getSessionDetails: (sessionId: string) =>
    apiRequest<ApiResponse<ComparisonSessionDetails>>(`/comparison/sessions/${sessionId}`),

  // Delete session
  deleteSession: (sessionId: string) =>
    apiRequest<ApiResponse<null>>(`/comparison/sessions/${sessionId}`, {
      method: 'DELETE',
    }),
};

export default {
  auth: authApi,
  models: modelsApi,
  sessions: sessionsApi,
  student: studentApi,
  chatbots: chatbotsApi,
  artifacts: artifactsApi,
  admin: adminApi,
  comparison: comparisonApi,
};

