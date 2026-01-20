import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  modelsApi, 
  sessionsApi, 
  studentApi, 
  chatbotsApi, 
  artifactsApi,
  AIModel,
  Session,
  DashboardStats,
  LeaderboardEntry,
  ActivityCalendar,
  Chatbot,
  Guardrail,
  Artifact,
  SendMessageResult,
} from '@/lib/api';

// ==================== MODELS HOOKS ====================

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await modelsApi.getAll();
      return response.data.models;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useModel = (id: string) => {
  return useQuery({
    queryKey: ['models', id],
    queryFn: async () => {
      const response = await modelsApi.getById(id);
      return response.data.model;
    },
    enabled: !!id,
  });
};

export const useModelsByCategory = (category: string) => {
  return useQuery({
    queryKey: ['models', 'category', category],
    queryFn: async () => {
      const response = await modelsApi.getByCategory(category);
      return response.data.models;
    },
    enabled: !!category,
  });
};

// ==================== SESSIONS HOOKS ====================

export const useSessions = (params?: { page?: number; limit?: number; modelId?: string }) => {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: async () => {
      const response = await sessionsApi.getAll(params);
      return {
        sessions: response.data,
        pagination: response.pagination,
      };
    },
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: async () => {
      const response = await sessionsApi.getById(id);
      return response.data.session;
    },
    enabled: !!id,
  });
};

export const useSessionMessages = (sessionId: string) => {
  return useQuery({
    queryKey: ['sessions', sessionId, 'messages'],
    queryFn: async () => {
      const response = await sessionsApi.getMessages(sessionId);
      return response.data.messages;
    },
    enabled: !!sessionId,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ modelId, chatbotId }: { modelId: string; chatbotId?: string }) =>
      sessionsApi.create({ modelId, chatbotId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      sessionsApi.sendMessage(sessionId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions', variables.sessionId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// ==================== STUDENT HOOKS ====================

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await studentApi.getDashboard();
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useRecentSessions = (limit?: number) => {
  return useQuery({
    queryKey: ['recentSessions', limit],
    queryFn: async () => {
      const response = await studentApi.getRecentSessions(limit);
      return response.data.sessions;
    },
  });
};

export const useLeaderboard = (type: 'institutional' | 'course', courseId?: string) => {
  return useQuery({
    queryKey: ['leaderboard', type, courseId],
    queryFn: async () => {
      const response = await studentApi.getLeaderboard(type, courseId);
      if (response.data?.leaderboard) {
        return response.data.leaderboard;
      }
      return [];
    },
    // For institutional, always enabled. For course, only when courseId is available
    enabled: type === 'institutional' || !!courseId,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
};

export const useCourseRank = () => {
  return useQuery({
    queryKey: ['courseRank'],
    queryFn: async () => {
      const response = await studentApi.getCourseRank();
      return response.data;
    },
  });
};

export const useActivityCalendar = () => {
  return useQuery({
    queryKey: ['activityCalendar'],
    queryFn: async () => {
      const response = await studentApi.getActivityCalendar();
      return response.data;
    },
  });
};

// ==================== CHATBOTS HOOKS ====================

export const useChatbots = () => {
  return useQuery({
    queryKey: ['chatbots'],
    queryFn: async () => {
      const response = await chatbotsApi.getAll();
      return response.data.chatbots;
    },
  });
};

export const useChatbot = (id: string) => {
  return useQuery({
    queryKey: ['chatbots', id],
    queryFn: async () => {
      const response = await chatbotsApi.getById(id);
      return response.data.chatbot;
    },
    enabled: !!id,
  });
};

export const useGuardrails = () => {
  return useQuery({
    queryKey: ['guardrails'],
    queryFn: async () => {
      const response = await chatbotsApi.getGuardrails();
      return response.data.guardrails;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateChatbot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      modelId: string;
      behaviorPrompt?: string;
      strictMode?: boolean;
      guardrailIds?: string[];
    }) => chatbotsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateChatbot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Chatbot> }) =>
      chatbotsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['chatbots', variables.id] });
    },
  });
};

export const useDeleteChatbot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => chatbotsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// ==================== ARTIFACTS HOOKS ====================

export const useArtifacts = (params?: { page?: number; type?: string; bookmarked?: boolean }) => {
  return useQuery({
    queryKey: ['artifacts', params],
    queryFn: async () => {
      const response = await artifactsApi.getAll(params);
      return {
        artifacts: response.data,
        pagination: response.pagination,
      };
    },
  });
};

export const useArtifact = (id: string) => {
  return useQuery({
    queryKey: ['artifacts', id],
    queryFn: async () => {
      const response = await artifactsApi.getById(id);
      return response.data.artifact;
    },
    enabled: !!id,
  });
};

export const useCreateArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      sessionId: string;
      type: 'text' | 'code' | 'image' | 'audio';
      title?: string;
      content: string;
    }) => artifactsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useToggleBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => artifactsApi.toggleBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
    },
  });
};

export const useDeleteArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => artifactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

