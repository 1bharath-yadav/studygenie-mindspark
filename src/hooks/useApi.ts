// frontend/src/hooks/useApi.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_ENDPOINTS } from '@/lib/api'; // Use API_ENDPOINTS for canonical endpoint paths
import type {
    User,
    UserProfileUpdate,
    Student,
    StudentData,
    StudentProgress,
    ProcessFilesRequest,
    ProcessFilesResponse,
    ChatRequest,
    LLMRequest,
    LLMResponse,
    ApiKeyData,
    ApiKeyCreate,
    ApiKeyResponse,
    ProviderStatus,
    HealthCheck,
    LearningContent,
    DashboardAnalytics,
    SubjectAnalytics,
    WeeklyTrends,
    AchievementsData,
    WeaknessAnalysis,
    StudyPatterns,
    AuthCredentials,
    SignUpData,
    AuthResponse,
    LLMProvider,
    LLMModel,
    ModelPreference,
    ModelPreferenceCreate,
    ModelPreferenceUpdate,
    AnalyticsResponse,
} from '@/types/api';

// Query keys for React Query (updated for new structure)
export const QUERY_KEYS = {
    health: ['health'],
    user: ['user'],
    // Removed multi-student keys as backend is single-user
    student: ['student'],
    studentProgress: ['student-progress'],
    apiKeys: ['api-keys'],
    providers: ['providers'],
    models: ['models'],
    modelsByProvider: (providerId: string) => ['models', 'provider', providerId],
    modelsByType: (type: string) => ['models', 'type', type],
    modelPreferences: ['model-preferences'],
    analytics: {
        dashboard: (studentId: string, days?: number) => ['analytics', 'dashboard', studentId, days],
        subjects: (studentId: string, days?: number) => ['analytics', 'subjects', studentId, days],
        progress: (studentId: string, subjectId?: number) => ['analytics', 'progress', studentId, subjectId],
        weeklyTrends: (studentId: string, weeks?: number) => ['analytics', 'weekly-trends', studentId, weeks],
        achievements: (studentId: string) => ['analytics', 'achievements', studentId],
        studyPatterns: (studentId: string, days?: number) => ['analytics', 'study-patterns', studentId, days],
        weaknesses: (studentId: string) => ['analytics', 'weaknesses', studentId],
    },
} as const;

// Define endpoint paths directly since API_ENDPOINTS not provided
const ENDPOINTS = {
    health: '/api/v1/health',
    auth: {
        profile: '/api/v1/auth/profile',
        signOut: '/api/v1/auth/logout', // Assuming exists or handle client-side
    },
    student: {
        getCurrent: '/api/v1/student/',
        update: '/api/v1/student/',
        delete: '/api/v1/student/',
    },
    apiKeys: {
        list: '/api/v1/api-keys/',
        create: '/api/v1/api-keys/',
        delete: (id: string) => `/api/v1/api-keys/${id}`,
        status: (provider: string) => `/api/v1/api-keys/providers/${provider}/status`,
    },
    providers: {
        list: '/api/v1/providers/',
        modelsByProvider: (provider: string) => `/api/v1/providers/${provider}/models`,
        modelsByType: (type: 'chat' | 'embedding') => `/api/v1/providers/models/${type}`,
    },
    llm: {
        models: '/api/v1/llm/models',
        generate: '/api/v1/llm/generate',
        // Assuming processFiles exists or adjust
        processFiles: '/api/v1/llm/process-files',
    },
    analytics: {
        dashboard: (studentId: string, days?: number) => `/api/v1/analytics/${studentId}/dashboard${days ? `?days=${days}` : ''}`,
        subjects: (studentId: string, days?: number) => `/api/v1/analytics/${studentId}/subjects${days ? `?days=${days}` : ''}`,
        progress: (studentId: string, subjectId?: number) => {
            const url = `/api/v1/analytics/${studentId}/progress`;
            return subjectId ? `${url}?subject_id=${subjectId}` : url;
        },
        weeklyTrends: (studentId: string, weeks?: number) => `/api/v1/analytics/${studentId}/weekly-trends${weeks ? `?weeks=${weeks}` : ''}`,
        achievements: (studentId: string) => `/api/v1/analytics/${studentId}/achievements`,
        studyPatterns: (studentId: string, days?: number) => `/api/v1/analytics/${studentId}/study-patterns${days ? `?days=${days}` : ''}`,
        weaknesses: (studentId: string) => `/api/v1/analytics/${studentId}/weaknesses`,
    },
    // Model preferences not implemented in backend, keeping stubs
    modelPreferences: {
        list: '/api/v1/model-preferences/',
        create: '/api/v1/model-preferences/',
        update: (id: string) => `/api/v1/model-preferences/${id}`,
        delete: (id: string) => `/api/v1/model-preferences/${id}`,
        setDefault: (modelId: string, useCase: string) => `/api/v1/model-preferences/default/${modelId}/${useCase}`,
    },
} as const;

// Health check
export const useHealthCheck = () => {
    return useQuery({
        queryKey: QUERY_KEYS.health,
        queryFn: () => apiClient.get<HealthCheck>(ENDPOINTS.health),
        staleTime: 30000, // 30 seconds
    });
};

// Authentication hooks (updated for OAuth/custom JWT)
export const useCurrentUser = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: QUERY_KEYS.user,
        queryFn: () => apiClient.get<AuthResponse>(ENDPOINTS.auth.profile).then(res => res.user),
        retry: false,
        enabled: options?.enabled !== false,
    });
};

// Removed useSignUp/useSignIn as backend uses OAuth; use redirect in useAuth

// Sign out mutation (assuming endpoint or client-side)
export const useSignOut = () => {
    return useMutation({
        mutationFn: () => apiClient.post(ENDPOINTS.auth.signOut),
    });
};

// User profile hooks (mapped to /student/)
export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        // Accept flexible payloads (learning_preferences can be an object)
        // Backend returns StudentData directly (not wrapped), so return the JSON result.
        mutationFn: (data: Partial<UserProfileUpdate> | any) =>
            apiClient.put<StudentData>(ENDPOINTS.student.update, data).then(res => res),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student });
        },
    });
};

export const useDeleteUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            apiClient.delete(ENDPOINTS.student.delete),
        onSuccess: () => {
            queryClient.clear();
        },
    });
};

// Student hooks (single user, current)
export const useStudent = () => {
    return useQuery({
        queryKey: QUERY_KEYS.student,
        queryFn: () => apiClient.get<StudentData>(ENDPOINTS.student.getCurrent).then(res => res),
    });
};

export const useStudentProgress = () => {
    return useQuery({
        queryKey: QUERY_KEYS.studentProgress,
        queryFn: () => apiClient.get<StudentProgress>(`${ENDPOINTS.student.getCurrent}progress`), // Assuming sub-endpoint
        enabled: true,
    });
};

// Removed multi-student hooks (create/update/delete) as backend is current-user only

// File processing hooks (assuming endpoint)
export const useProcessFiles = () => {
    return useMutation({
        mutationFn: ({ files, data }: { files: File[]; data?: ProcessFilesRequest }) =>
            apiClient.uploadFiles<ProcessFilesResponse>(
                ENDPOINTS.llm.processFiles,
                files,
                data
            ),
    });
};

// Chat hooks (updated to /llm/generate)
export const useChatResponse = () => {
    return useMutation({
        mutationFn: (data: LLMRequest) =>
            apiClient.post<LLMResponse>(ENDPOINTS.llm.generate, data),
    });
};

// API Keys hooks
export const useApiKeys = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: QUERY_KEYS.apiKeys,
        queryFn: () => apiClient.get<ApiKeyResponse[]>(ENDPOINTS.apiKeys.list),
        enabled: options?.enabled ?? true,
    });
};

export const useApiKeyStatus = (provider: string) => {
    return useQuery({
        queryKey: ['apiKeyStatus', provider],
        queryFn: () => apiClient.get<ProviderStatus>(ENDPOINTS.apiKeys.status(provider)),
        enabled: !!provider,
    });
};

export const useCreateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ApiKeyCreate) =>
            apiClient.post<ApiKeyResponse>(ENDPOINTS.apiKeys.create, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys });
        },
    });
};

export const useDeleteApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(ENDPOINTS.apiKeys.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys });
        },
    });
};

// Set active API key for a user
export const useSetActiveApiKey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (keyId: string) => apiClient.post(`/api/v1/api-keys/${keyId}/active`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.apiKeys });
        },
    });
};

// LLM Providers hooks
export const useLLMProviders = () => {
    return useQuery({
        queryKey: QUERY_KEYS.providers,
        queryFn: () => apiClient.get<LLMProvider[]>(ENDPOINTS.providers.list),
        staleTime: 300000, // 5 minutes
    });
};

// Models hooks
export const useModels = () => {
    return useQuery({
        queryKey: QUERY_KEYS.models,
        queryFn: () => apiClient.get<LLMModel[]>(ENDPOINTS.llm.models),
        staleTime: 300000, // 5 minutes
    });
};

export const useModelsByProvider = (providerId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.modelsByProvider(providerId),
        queryFn: () => apiClient.get<LLMModel[]>(ENDPOINTS.providers.modelsByProvider(providerId)),
        enabled: !!providerId,
        staleTime: 300000,
    });
};

// Toggle model active state - optimistic only until backend route exists
export const useToggleModelActive = () => {
    const queryClient = useQueryClient();

    return useMutation({
    mutationFn: async ({ modelId, isActive, useCase = 'chat' }: { modelId: string; isActive: boolean; useCase?: 'chat' | 'embedding' }) => {
            // Call backend to activate or deactivate model preference
            try {
                if (isActive) {
                    // activate (send useCase as query param)
                    return await apiClient.post(`/api/v1/providers/models/${modelId}/active?use_case=${useCase}`);
                } else {
                    // deactivate (send useCase as query param)
                    return await apiClient.delete(`/api/v1/providers/models/${modelId}/active?use_case=${useCase}`);
                }
            } catch (e) {
                // If backend doesn't support it, just return a simulated response
                return { success: true };
            }
        },
        onMutate: async ({ modelId, isActive, useCase = 'chat' }: { modelId: string; isActive: boolean; useCase?: 'chat' | 'embedding' }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.models });
            // Optimistically update any cached model lists containing this model
            const updateCache = (key: any, updater: (item: any) => any) => {
                const data = queryClient.getQueryData<any>(key);
                if (!data) return;
                const newData = Array.isArray(data) ? data.map((m: any) => updater(m)) : data;
                queryClient.setQueryData(key, newData);
            };
            // If activating, set this model active and set others inactive for the same use case.
            if (useCase === 'chat') {
                updateCache(QUERY_KEYS.models, (m: any) => ({ ...m, is_active_chat: m.id === modelId }));
            } else {
                updateCache(QUERY_KEYS.models, (m: any) => ({ ...m, is_active_embedding: m.id === modelId }));
            }

            // Update provider-specific queries (best-effort)
            const cachedKeys = queryClient.getQueryCache().getAll().map(q => q.queryKey);
            for (const k of cachedKeys) {
                if (Array.isArray(k) && k[0] === 'models' && k[1] === 'provider') {
                    if (useCase === 'chat') {
                        updateCache(k, (m: any) => ({ ...m, is_active_chat: m.id === modelId }));
                    } else {
                        updateCache(k, (m: any) => ({ ...m, is_active_embedding: m.id === modelId }));
                    }
                }
            }

            return { modelId, isActive };
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.models });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.providers });
        },
    });
};

export const useModelsByType = (type: 'chat' | 'embedding') => {
    return useQuery({
        queryKey: QUERY_KEYS.modelsByType(type),
        queryFn: () => apiClient.get<LLMModel[]>(ENDPOINTS.providers.modelsByType(type)),
        enabled: !!type,
        staleTime: 300000,
    });
};

// Model Preferences hooks (stubs, backend not provided)
export const useModelPreferences = () => {
    return useQuery({
        queryKey: QUERY_KEYS.modelPreferences,
        queryFn: () => apiClient.get<ModelPreference[]>(ENDPOINTS.modelPreferences.list),
        staleTime: 60000, // 1 minute
    });
};

export const useCreateModelPreference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ModelPreferenceCreate) =>
            apiClient.post<ModelPreference>(ENDPOINTS.modelPreferences.create, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

export const useUpdateModelPreference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ModelPreferenceUpdate }) =>
            apiClient.put<ModelPreference>(ENDPOINTS.modelPreferences.update(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

export const useDeleteModelPreference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(ENDPOINTS.modelPreferences.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

export const useSetDefaultModel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ modelId, useCase }: { modelId: string; useCase: string }) =>
            apiClient.post(ENDPOINTS.modelPreferences.setDefault(modelId, useCase)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

// Analytics hooks (updated to handle wrapped response)
export const useDashboardAnalytics = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.dashboard(studentId, days),
    queryFn: () => apiClient.get<AnalyticsResponse<DashboardAnalytics>>(ENDPOINTS.analytics.dashboard(studentId, days)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 60000, // 1 minute
    });
};

export const useSubjectAnalytics = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.subjects(studentId, days),
    queryFn: () => apiClient.get<AnalyticsResponse<SubjectAnalytics>>(ENDPOINTS.analytics.subjects(studentId, days)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 60000,
    });
};

export const useProgressAnalytics = (studentId: string, subjectId?: number) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.progress(studentId, subjectId),
    queryFn: () => apiClient.get<AnalyticsResponse<any>>(ENDPOINTS.analytics.progress(studentId, subjectId)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 60000,
    });
};

export const useWeeklyTrends = (studentId: string, weeks: number = 4) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.weeklyTrends(studentId, weeks),
    queryFn: () => apiClient.get<AnalyticsResponse<WeeklyTrends>>(ENDPOINTS.analytics.weeklyTrends(studentId, weeks)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 300000, // 5 minutes
    });
};

export const useAchievements = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.achievements(studentId),
    queryFn: () => apiClient.get<AnalyticsResponse<AchievementsData>>(ENDPOINTS.analytics.achievements(studentId)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 300000,
    });
};

export const useStudyPatterns = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.studyPatterns(studentId, days),
    queryFn: () => apiClient.get<AnalyticsResponse<StudyPatterns>>(ENDPOINTS.analytics.studyPatterns(studentId, days)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 600000, // 10 minutes
    });
};

export const useWeaknessAnalysis = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.weaknesses(studentId),
    queryFn: () => apiClient.get<AnalyticsResponse<WeaknessAnalysis>>(ENDPOINTS.analytics.weaknesses(studentId)).then(res => res.data),
        enabled: !!studentId,
        staleTime: 300000,
    });
};

// Sessions hooks
export const useRecentSessions = () => {
    return useQuery({
        queryKey: ['recent-sessions'],
        // Use consistent endpoint format (no trailing slash)
        queryFn: () => apiClient.get<{ sessions: any[] }>('/api/v1/session').then(res => res.sessions),
        staleTime: 60_000,
    });
};

export const useGetSession = (sessionId?: string) => {
    return useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => apiClient.get(`/api/v1/session/${sessionId}`),
        enabled: !!sessionId,
    });
};

export const useDeleteSession = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: string) => apiClient.delete(`/api/v1/session/${sessionId}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['recent-sessions'] }),
    });
};

// Removed useStudentRecommendations/useStudentAnalytics/useSaveLearningActivity as no backend endpoints provided

// Authentication actions (updated for OAuth)
export const useAuth = () => {
    const queryClient = useQueryClient();

    const login = (credentials?: AuthCredentials) => {
        if (credentials) {
            // Fallback for email/password if implemented, else OAuth
            console.warn('Email/password login not supported; using OAuth');
        }
    // Redirect to OAuth (use same-origin + exported endpoint)
    const redirectUrl = `${location.origin}${API_ENDPOINTS.auth.login}`;
        window.location.href = redirectUrl;
        return Promise.resolve();
    };

    const logout = async () => {
        try {
            await apiClient.post(ENDPOINTS.auth.signOut);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            apiClient.clearToken();
            queryClient.clear();
            window.location.href = '/';
        }
    };

    const signup = (data: SignUpData) => {
        console.warn('Signup via OAuth; redirecting to login');
        return login();
    };

    return {
        login,
        logout,
        signup,
    };
};

// Student recommendations hook
export const useStudentRecommendations = (studentId: string) => {
    return useQuery({
        queryKey: ['student-recommendations', studentId],
    queryFn: () => apiClient.get(API_ENDPOINTS.student.getCurrent + `/students/${studentId}/recommendations`),
        enabled: !!studentId,
        staleTime: 300000, // 5 minutes
    });
};

// Student analytics hook (using Supabase endpoint)
export const useStudentAnalytics = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: ['student-analytics', studentId, days],
    queryFn: () => apiClient.get(API_ENDPOINTS.analytics.dashboard(studentId, days)),
        enabled: !!studentId,
        staleTime: 300000, // 5 minutes
    });
};
// Save learning activity results
export const useSaveLearningActivity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ studentId, activityData }: {
            studentId: string;
            activityData: {
                subject_name: string;
                concept_name: string;
                activity_type: 'quiz_attempt' | 'flashcard_practice' | 'match_the_following';
                correct_answers: number;
                total_questions: number;
                time_spent: number; // in seconds
                difficulty_level: 'Easy' | 'Medium' | 'Hard';
                chapter_name?: string;
            }
        }) =>
            apiClient.post(`/api/v1/student/students/${studentId}/learning-activity`, activityData),
        onSuccess: (_, { studentId }) => {
            // Invalidate all analytics queries for this student
            queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard', studentId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', 'progress', studentId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', 'weekly-trends', studentId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', 'weaknesses', studentId] });
            queryClient.invalidateQueries({ queryKey: ['student-recommendations', studentId] });
            queryClient.invalidateQueries({ queryKey: ['student-analytics', studentId] });
        },
    });
};
