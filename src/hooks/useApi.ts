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
    // Analytics-related types removed
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
    // analytics removed
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
    // analytics endpoints removed
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

// Resolve a potentially non-canonical student identifier (for example an email)
// to the canonical `student_id` provided by the server. This hook always
// calls `useStudent()` so it can replace email-like identifiers with the
// authenticated user's canonical id.
export const useResolveStudentId = (studentIdentifier?: string | null | undefined) => {
    const { data: currentStudent } = useStudent();
    // If no identifier provided or it looks like an email, prefer the canonical id
    if (!studentIdentifier) return currentStudent?.student_id;
    if (typeof studentIdentifier === 'string' && studentIdentifier.includes('@')) {
        return currentStudent?.student_id;
    }
    return studentIdentifier;
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
            if (isActive) {
                // activate (send useCase as query param)
                return await apiClient.post(`/api/v1/providers/models/${modelId}/active?use_case=${useCase}`);
            } else {
                // deactivate (send useCase as query param)
                return await apiClient.delete(`/api/v1/providers/models/${modelId}/active?use_case=${useCase}`);
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
// Analytics feature removed — hooks deleted

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

export const useRenameSession = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sessionId, sessionName }: { sessionId: string; sessionName: string }) =>
            apiClient.patch(`/api/v1/session/${sessionId}`, { session_name: sessionName }),
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
    // Redirect to OAuth: prefer configured API base URL so in production
    // the frontend redirects to the backend host (VITE_API_BASE_URL).
    // Fallback to location.origin for development convenience.
    const base = (typeof import.meta !== 'undefined' && (import.meta.env && import.meta.env.VITE_API_BASE_URL)) || location.origin;
    // If API_BASE_URL is exported from the api client, prefer it (use try/catch to avoid runtime errors during tests)
    let redirectBase = base;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const api = require('@/lib/api');
        if (api && api.API_BASE_URL) redirectBase = api.API_BASE_URL;
    } catch (e) {
        // ignore - fallback already set
    }
    const redirectUrl = `${redirectBase}${API_ENDPOINTS.auth.login}`;
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

// Student recommendations removed

// Student analytics hook (using Supabase endpoint)
// student analytics removed
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
            // Resolve canonical id for invalidation to match query keys
            const resolvedId = useResolveStudentId(studentId);
            const id = resolvedId || studentId;
            // Invalidate student progress caches
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studentProgress });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student });
        },
    });
};
