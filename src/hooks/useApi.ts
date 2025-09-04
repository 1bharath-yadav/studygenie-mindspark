import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api';
import type {
    User,
    UserProfileUpdate,
    Student,
    StudentProgress,
    ProcessFilesRequest,
    ProcessFilesResponse,
    ChatRequest,
    ChatResponse,
    ApiKey,
    CreateApiKeyRequest,
    HealthCheck,
    LearningContent,
} from '@/types/api';

// Query keys for React Query
export const QUERY_KEYS = {
    health: ['health'],
    user: ['user'],
    students: ['students'],
    student: (id: string) => ['student', id],
    studentProgress: (id: string) => ['student-progress', id],
    apiKeys: ['api-keys'],
    analytics: {
        dashboard: (studentId: string) => ['analytics', 'dashboard', studentId],
        progress: (studentId: string) => ['analytics', 'progress', studentId],
        weeklyTrends: (studentId: string) => ['analytics', 'weekly-trends', studentId],
        achievements: (studentId: string) => ['analytics', 'achievements', studentId],
        studyPatterns: (studentId: string) => ['analytics', 'study-patterns', studentId],
        weaknesses: (studentId: string) => ['analytics', 'weaknesses', studentId],
    },
} as const;

// Health check
export const useHealthCheck = () => {
    return useQuery({
        queryKey: QUERY_KEYS.health,
        queryFn: () => apiClient.get<HealthCheck>(API_ENDPOINTS.health),
        staleTime: 30000, // 30 seconds
    });
};

// Authentication hooks
export const useCurrentUser = () => {
    return useQuery({
        queryKey: QUERY_KEYS.user,
        queryFn: () => apiClient.get<User>(API_ENDPOINTS.auth.me),
        retry: false,
        staleTime: 300000, // 5 minutes
    });
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UserProfileUpdate) =>
            apiClient.put<User>(API_ENDPOINTS.users.updateProfile, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
        },
    });
};

export const useDeleteUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            apiClient.delete(API_ENDPOINTS.users.deleteProfile),
        onSuccess: () => {
            queryClient.clear();
        },
    });
};

// Students hooks
export const useStudents = () => {
    return useQuery({
        queryKey: QUERY_KEYS.students,
        queryFn: () => apiClient.get<Student[]>(API_ENDPOINTS.students.list),
    });
};

export const useStudent = (id: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.student(id),
        queryFn: () => apiClient.get<Student>(API_ENDPOINTS.students.getById(id)),
        enabled: !!id,
    });
};

export const useStudentProgress = (id: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.studentProgress(id),
        queryFn: () => apiClient.get<StudentProgress>(API_ENDPOINTS.students.progress(id)),
        enabled: !!id,
    });
};

export const useCreateStudent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Student>) =>
            apiClient.post<Student>(API_ENDPOINTS.students.create, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
        },
    });
};

export const useUpdateStudent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
            apiClient.put<Student>(API_ENDPOINTS.students.update(id), data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student(id) });
        },
    });
};

export const useDeleteStudent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(API_ENDPOINTS.students.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.students });
        },
    });
};

// File processing hooks
export const useProcessFiles = () => {
    return useMutation({
        mutationFn: ({ files, data }: { files: File[]; data?: ProcessFilesRequest }) =>
            apiClient.uploadFiles<ProcessFilesResponse>(
                API_ENDPOINTS.llm.processFiles,
                files,
                data
            ),
    });
};

// Chat hooks
export const useChatResponse = () => {
    return useMutation({
        mutationFn: (data: ChatRequest) =>
            apiClient.post<ChatResponse>(API_ENDPOINTS.llm.chatResponse, data),
    });
};

// API Keys hooks
export const useApiKeys = () => {
    return useQuery({
        queryKey: QUERY_KEYS.apiKeys,
        queryFn: () => apiClient.get<ApiKey[]>(API_ENDPOINTS.apiKeys.list),
    });
};

export const useApiKeyStatus = () => {
    return useQuery({
        queryKey: ['apiKeyStatus'],
        queryFn: () => apiClient.get<{ hasActiveApiKey: boolean }>(API_ENDPOINTS.apiKeys.status),
    });
};

export const useCreateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateApiKeyRequest) =>
            apiClient.post<ApiKey>(API_ENDPOINTS.apiKeys.create, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys });
        },
    });
};

export const useDeleteApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(API_ENDPOINTS.apiKeys.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys });
        },
    });
};

// Authentication actions
export const useAuth = () => {
    const queryClient = useQueryClient();

    const login = () => {
        window.location.href = `${apiClient['baseURL']}${API_ENDPOINTS.auth.login}`;
    };

    const logout = () => {
        apiClient.clearToken();
        queryClient.clear();
        // Redirect to login or home page
        window.location.href = '/';
    };

    return {
        login,
        logout,
    };
};

// Analytics hooks
export const useDashboardAnalytics = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.dashboard(studentId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.dashboard(studentId)),
        enabled: !!studentId,
        staleTime: 60000, // 1 minute
    });
};

export const useProgressAnalytics = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.progress(studentId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.progress(studentId)),
        enabled: !!studentId,
        staleTime: 60000,
    });
};

export const useWeeklyTrends = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.weeklyTrends(studentId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.weeklyTrends(studentId)),
        enabled: !!studentId,
        staleTime: 300000, // 5 minutes
    });
};

export const useAchievements = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.achievements(studentId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.achievements(studentId)),
        enabled: !!studentId,
        staleTime: 300000,
    });
};

export const useStudyPatterns = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.studyPatterns(studentId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.studyPatterns(studentId)),
        enabled: !!studentId,
        staleTime: 600000, // 10 minutes
    });
};

export const useWeaknessAnalysis = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.weaknesses(studentId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.weaknesses(studentId)),
        enabled: !!studentId,
        staleTime: 300000,
    });
};
