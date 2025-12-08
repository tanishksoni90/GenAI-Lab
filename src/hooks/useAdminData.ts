import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminStudent, Course, Batch, APIKey, AdminGuardrail, AdminAnalytics } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const adminKeys = {
  all: ['admin'] as const,
  students: () => [...adminKeys.all, 'students'] as const,
  studentsList: (params?: Record<string, any>) => [...adminKeys.students(), 'list', params] as const,
  student: (id: string) => [...adminKeys.students(), id] as const,
  courses: () => [...adminKeys.all, 'courses'] as const,
  batches: (courseId?: string) => [...adminKeys.all, 'batches', courseId] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  apiKeys: () => [...adminKeys.all, 'apiKeys'] as const,
  guardrails: () => [...adminKeys.all, 'guardrails'] as const,
  modelAccess: (modelId: string) => [...adminKeys.all, 'modelAccess', modelId] as const,
};

// ==================== STUDENTS HOOKS ====================

export function useAdminStudents(params?: {
  page?: number;
  limit?: number;
  courseId?: string;
  batchId?: string;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: adminKeys.studentsList(params),
    queryFn: () => adminApi.getStudents(params),
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: false,
  });
}

export function useAdminStudent(id: string) {
  return useQuery({
    queryKey: adminKeys.student(id),
    queryFn: () => adminApi.getStudent(id),
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createStudent>[0]) =>
      adminApi.createStudent(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students() });
      toast({
        title: 'Student Created',
        description: `Student created successfully. Default password: ${response.data?.defaultPassword}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create student',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.updateStudent>[1] }) =>
      adminApi.updateStudent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students() });
      queryClient.invalidateQueries({ queryKey: adminKeys.student(variables.id) });
      toast({
        title: 'Student Updated',
        description: 'Student information updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent?: boolean }) =>
      adminApi.deleteStudent(id, permanent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students() });
      toast({
        title: 'Student Deleted',
        description: 'Student has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete student',
        variant: 'destructive',
      });
    },
  });
}

export function useResetStudentPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.resetStudentPassword(id),
    onSuccess: (response) => {
      toast({
        title: 'Password Reset',
        description: `New password: ${response.data?.newPassword}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkOperation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.bulkOperation>[0]) =>
      adminApi.bulkOperation(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students() });
      toast({
        title: 'Bulk Operation Complete',
        description: `${response.data?.affected || 0} students affected`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to perform bulk operation',
        variant: 'destructive',
      });
    },
  });
}

export function useImportStudents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.importStudents>[0]) =>
      adminApi.importStudents(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.students() });
      const successCount = response.data?.success?.length || 0;
      const failedCount = response.data?.failed?.length || 0;
      toast({
        title: 'Import Complete',
        description: `${successCount} students imported, ${failedCount} failed`,
        variant: failedCount > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import students',
        variant: 'destructive',
      });
    },
  });
}

// ==================== COURSES HOOKS ====================

export function useCourses() {
  return useQuery({
    queryKey: adminKeys.courses(),
    queryFn: () => adminApi.getCourses(),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createCourse>[0]) =>
      adminApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
      toast({
        title: 'Course Created',
        description: 'Course has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.updateCourse>[1] }) =>
      adminApi.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
      toast({
        title: 'Course Updated',
        description: 'Course information updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCourse(id),
    onSuccess: () => {
      // Invalidate both courses and batches since deleting a course also deletes its batches
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
      queryClient.invalidateQueries({ queryKey: adminKeys.batches() });
      toast({
        title: 'Course Deleted',
        description: 'Course and its batches have been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'destructive',
      });
    },
  });
}

// ==================== BATCHES HOOKS ====================

export function useBatches(courseId?: string) {
  return useQuery({
    queryKey: adminKeys.batches(courseId),
    queryFn: () => adminApi.getBatches(courseId),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createBatch>[0]) =>
      adminApi.createBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.batches() });
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
      toast({
        title: 'Batch Created',
        description: 'Batch has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create batch',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.batches() });
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
      toast({
        title: 'Batch Deleted',
        description: 'Batch has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete batch',
        variant: 'destructive',
      });
    },
  });
}

// ==================== ANALYTICS HOOKS ====================

export function useAdminAnalytics() {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: () => adminApi.getAnalytics(),
    staleTime: 60000, // 1 minute
  });
}

// ==================== API KEYS HOOKS ====================

export function useAPIKeys() {
  return useQuery({
    queryKey: adminKeys.apiKeys(),
    queryFn: () => adminApi.getAPIKeys(),
    staleTime: 30000, // 30 seconds
  });
}

export function useUpdateAPIKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ provider, data }: { provider: string; data: Parameters<typeof adminApi.updateAPIKey>[1] }) =>
      adminApi.updateAPIKey(provider, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.apiKeys() });
      toast({
        title: 'API Key Updated',
        description: 'API key has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update API key',
        variant: 'destructive',
      });
    },
  });
}

export function useTestAPIKey() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (provider: string) => adminApi.testAPIKey(provider),
    onSuccess: (response) => {
      toast({
        title: response.data?.success ? 'API Key Valid' : 'API Key Invalid',
        description: response.data?.message,
        variant: response.data?.success ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to test API key',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAPIKey() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (provider: string) => adminApi.deleteAPIKey(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.apiKeys() });
      toast({
        title: 'Provider Deleted',
        description: 'Custom provider has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete provider',
        variant: 'destructive',
      });
    },
  });
}

// ==================== MODEL MANAGEMENT HOOKS ====================

export function useCreateModel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      name: string;
      provider: string;
      modelId: string;
      category: string;
      description?: string;
      inputCost?: number;
      outputCost?: number;
      maxTokens?: number;
      isActive?: boolean;
    }) => adminApi.createModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast({
        title: 'Model Created',
        description: 'New AI model has been added',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Create Failed',
        description: error.message || 'Failed to create model',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (modelId: string) => adminApi.deleteModel(modelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast({
        title: 'Model Deleted',
        description: 'AI model has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete model',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateModel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ modelId, data }: { modelId: string; data: { isActive?: boolean; maxTokens?: number; description?: string } }) =>
      adminApi.updateModel(modelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      queryClient.invalidateQueries({ queryKey: ['models'] }); // Also invalidate student-facing models
      toast({
        title: 'Model Updated',
        description: 'Model settings have been updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update model',
        variant: 'destructive',
      });
    },
  });
}

export function useToggleModelActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (modelId: string) => adminApi.toggleModelActive(modelId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'models'] });
      queryClient.invalidateQueries({ queryKey: ['models'] }); // Also invalidate student-facing models
      toast({
        title: response.data?.model?.isActive ? 'Model Activated' : 'Model Deactivated',
        description: response.data?.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Toggle Failed',
        description: error.message || 'Failed to toggle model status',
        variant: 'destructive',
      });
    },
  });
}

export function useTestModel() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (modelId: string) => adminApi.testModel(modelId),
    onSuccess: (response) => {
      toast({
        title: response.data?.success ? 'Model Ready' : 'Model Test Failed',
        description: response.data?.message,
        variant: response.data?.success ? 'default' : 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to test model',
        variant: 'destructive',
      });
    },
  });
}

export function useModelAccess(modelId: string) {
  return useQuery({
    queryKey: ['modelAccess', modelId],
    queryFn: () => adminApi.getModelAccess(modelId),
    enabled: !!modelId,
  });
}

export function useAddModelAccess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { modelId: string; courseId?: string; batchId?: string; studentId?: string }) =>
      adminApi.addModelAccess(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modelAccess', variables.modelId] });
      toast({
        title: 'Access Added',
        description: 'Model access rule has been added',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Add Failed',
        description: error.message || 'Failed to add access rule',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveModelAccess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ accessId, modelId }: { accessId: string; modelId: string }) =>
      adminApi.removeModelAccess(accessId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modelAccess', variables.modelId] });
      toast({
        title: 'Access Removed',
        description: 'Model access rule has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Remove Failed',
        description: error.message || 'Failed to remove access rule',
        variant: 'destructive',
      });
    },
  });
}

// ==================== GUARDRAILS HOOKS ====================

export function useGuardrails() {
  return useQuery({
    queryKey: adminKeys.guardrails(),
    queryFn: () => adminApi.getGuardrails(),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateGuardrail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createGuardrail>[0]) =>
      adminApi.createGuardrail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.guardrails() });
      toast({
        title: 'Guardrail Created',
        description: 'Guardrail has been created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create guardrail',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGuardrail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminApi.updateGuardrail>[1] }) =>
      adminApi.updateGuardrail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.guardrails() });
      toast({
        title: 'Guardrail Updated',
        description: 'Guardrail has been updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update guardrail',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGuardrail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteGuardrail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.guardrails() });
      toast({
        title: 'Guardrail Deleted',
        description: 'Guardrail has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete guardrail',
        variant: 'destructive',
      });
    },
  });
}

// ==================== SETTINGS ====================

export function useSettings() {
  return useQuery({
    queryKey: [...adminKeys.all, 'settings'],
    queryFn: async () => {
      const response = await adminApi.getSettings();
      return response.data.settings;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: {
      defaultTokenQuota?: number;
      // Token settings
      autoRefill?: boolean;
      lowBalanceAlert?: boolean;
      hardLimitEnforcement?: boolean;
      lowBalanceThreshold?: number;
      // Guardrails settings
      maxTokensPerRequest?: number;
      maxRequestsPerMinute?: number;
      aiIntentDetection?: boolean;
      strictMode?: boolean;
    }) => adminApi.updateSettings(data),
    onMutate: async (newSettings) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...adminKeys.all, 'settings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData([...adminKeys.all, 'settings']);

      // Optimistically update to the new value
      queryClient.setQueryData([...adminKeys.all, 'settings'], (old: any) => ({
        ...old,
        ...newSettings,
      }));

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onError: (error: Error, _newSettings, context) => {
      // Roll back to the previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData([...adminKeys.all, 'settings'], context.previousSettings);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Settings have been saved successfully',
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'settings'] });
    },
  });
}
