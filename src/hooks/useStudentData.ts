/**
 * React Query hooks for Student Dashboard data
 * Replaces mock UserContext data with real backend API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  studentApi, 
  sessionsApi, 
  chatbotsApi, 
  artifactsApi,
  modelsApi,
  DashboardStats,
  Session,
  Chatbot,
  Artifact,
  LeaderboardEntry,
  AIModel,
  Guardrail
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Query keys for cache management
export const queryKeys = {
  dashboard: ['student', 'dashboard'] as const,
  sessions: ['student', 'sessions'] as const,
  recentSessions: (limit?: number) => ['student', 'sessions', 'recent', limit] as const,
  session: (id: string) => ['student', 'sessions', id] as const,
  chatbotSessions: (chatbotId: string) => ['student', 'sessions', 'chatbot', chatbotId] as const,
  chatbots: ['student', 'chatbots'] as const,
  chatbot: (id: string) => ['student', 'chatbots', id] as const,
  artifacts: (params?: { type?: string; bookmarked?: boolean }) => ['student', 'artifacts', params] as const,
  leaderboard: (type: string, courseId?: string) => ['student', 'leaderboard', type, courseId] as const,
  models: ['models'] as const,
  guardrails: ['guardrails'] as const,
};

// ==================== DASHBOARD STATS ====================

export const useDashboardStats = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await studentApi.getDashboard();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5000, // 5 seconds - short so stats update quickly
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch when component mounts
  });
};

// ==================== SESSIONS ====================

export const useRecentSessions = (limit?: number) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.recentSessions(limit),
    queryFn: async () => {
      const response = await studentApi.getRecentSessions(limit);
      return response.data.sessions;
    },
    enabled: isAuthenticated,
    staleTime: 5000, // 5 seconds - short so session counts update quickly
    refetchOnMount: 'always',
  });
};

export const useSessions = (params?: { page?: number; limit?: number; modelId?: string }) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: [...queryKeys.sessions, params],
    queryFn: async () => {
      const response = await sessionsApi.getAll(params);
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
};

export const useSession = (sessionId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.session(sessionId),
    queryFn: async () => {
      const response = await sessionsApi.getById(sessionId);
      return response.data.session;
    },
    enabled: isAuthenticated && !!sessionId,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ modelId, chatbotId, title }: { modelId: string; chatbotId?: string; title?: string }) => {
      const response = await sessionsApi.create({ modelId, chatbotId, title });
      return response.data.session;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (variables.chatbotId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chatbotSessions(variables.chatbotId) });
      }
    },
  });
};

// Get sessions for a specific chatbot
export const useChatbotSessions = (chatbotId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.chatbotSessions(chatbotId),
    queryFn: async () => {
      const response = await sessionsApi.getAll({ chatbotId, limit: 50 });
      return response.data;
    },
    enabled: isAuthenticated && !!chatbotId,
    staleTime: 5000,
    refetchOnMount: 'always',
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const response = await sessionsApi.sendMessage(sessionId, content);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate session data
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) });
      // Invalidate dashboard stats (for prompt count)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      // Invalidate recent sessions list
      queryClient.invalidateQueries({ queryKey: ['student', 'sessions'] });
    },
  });
};

// ==================== CHATBOTS ====================

export const useChatbots = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.chatbots,
    queryFn: async () => {
      const response = await chatbotsApi.getAll();
      return response.data.chatbots;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
};

export const useChatbot = (chatbotId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.chatbot(chatbotId),
    queryFn: async () => {
      const response = await chatbotsApi.getById(chatbotId);
      return response.data.chatbot;
    },
    enabled: isAuthenticated && !!chatbotId,
  });
};

export const useCreateChatbot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      modelId: string;
      behaviorPrompt?: string;
      strictMode?: boolean;
      knowledgeBase?: string[];
      guardrailIds?: string[];
    }) => {
      const response = await chatbotsApi.create(data);
      return response.data.chatbot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatbots });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

export const useUpdateChatbot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Chatbot> }) => {
      const response = await chatbotsApi.update(id, data);
      return response.data.chatbot;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatbots });
      queryClient.invalidateQueries({ queryKey: queryKeys.chatbot(variables.id) });
    },
  });
};

export const useDeleteChatbot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await chatbotsApi.delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatbots });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// ==================== ARTIFACTS ====================

export const useArtifacts = (params?: { type?: string; bookmarked?: boolean; page?: number }) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.artifacts(params),
    queryFn: async () => {
      const response = await artifactsApi.getAll(params);
      return response;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
};

export const useCreateArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      sessionId: string;
      type: 'text' | 'code' | 'image' | 'audio';
      title?: string;
      content: string;
    }) => {
      const response = await artifactsApi.create(data);
      return response.data.artifact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'artifacts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await artifactsApi.toggleBookmark(id);
      return response.data.artifact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'artifacts'] });
    },
  });
};

export const useDeleteArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await artifactsApi.delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'artifacts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
};

// ==================== LEADERBOARD ====================

export const useLeaderboard = (type: 'institutional' | 'course', courseId?: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.leaderboard(type, courseId),
    queryFn: async () => {
      const response = await studentApi.getLeaderboard(type, courseId);
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 60000, // 1 minute - leaderboard doesn't change that often
  });
};

// ==================== MODELS ====================

export const useModels = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.models,
    queryFn: async () => {
      const response = await modelsApi.getAll();
      return response.data.models;
    },
    enabled: isAuthenticated,
    staleTime: 300000, // 5 minutes - models don't change often
  });
};

// ==================== GUARDRAILS ====================

export const useGuardrails = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.guardrails,
    queryFn: async () => {
      const response = await chatbotsApi.getGuardrails();
      return response.data.guardrails;
    },
    enabled: isAuthenticated,
    staleTime: 300000, // 5 minutes
  });
};
