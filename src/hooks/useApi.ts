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
    SupabaseAuthResponse,
    LLMProvider,
    LLMModel,
    ModelPreference,
    ModelPreferenceCreate,
    ModelPreferenceUpdate,
} from '@/types/api';

// Query keys for React Query (updated for new structure)
export const QUERY_KEYS = {
    health: ['health'],
    user: ['user'],
    students: ['students'],
    student: (id: string) => ['student', id],
    studentProgress: (id: string) => ['student-progress', id],
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

// Health check
export const useHealthCheck = () => {
    return useQuery({
        queryKey: QUERY_KEYS.health,
        queryFn: () => apiClient.get<HealthCheck>(API_ENDPOINTS.health),
        staleTime: 30000, // 30 seconds
    });
};

// Authentication hooks (updated for Supabase JWT)
export const useCurrentUser = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: QUERY_KEYS.user,
        queryFn: () => apiClient.get<User>(API_ENDPOINTS.auth.me),
        retry: false,
        enabled: options?.enabled !== false,
    });
};

// Sign up mutation
export const useSignUp = () => {
    return useMutation({
        mutationFn: (data: SignUpData) =>
            apiClient.post<SupabaseAuthResponse>(API_ENDPOINTS.auth.signUp, data),
    });
};

// Sign in mutation
export const useSignIn = () => {
    return useMutation({
        mutationFn: (data: AuthCredentials) =>
            apiClient.post<SupabaseAuthResponse>(API_ENDPOINTS.auth.signIn, data),
    });
};

// Sign out mutation
export const useSignOut = () => {
    return useMutation({
        mutationFn: () => apiClient.post(API_ENDPOINTS.auth.signOut),
    });
};

// Refresh token mutation
export const useRefreshToken = () => {
    return useMutation({
        mutationFn: () => apiClient.post<SupabaseAuthResponse>(API_ENDPOINTS.auth.refresh),
    });
};

// User profile hooks
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

// API Keys hooks (updated for new functional structure)
export const useApiKeys = (options?: { enabled?: boolean }) => {
    return useQuery({
        queryKey: QUERY_KEYS.apiKeys,
        queryFn: () => apiClient.get<ApiKeyResponse[]>(API_ENDPOINTS.apiKeys.list),
        enabled: options?.enabled ?? true,
    });
};

export const useApiKeyStatus = (provider: string) => {
    return useQuery({
        queryKey: ['apiKeyStatus', provider],
        queryFn: () => apiClient.get<ProviderStatus>(API_ENDPOINTS.apiKeys.status(provider)),
        enabled: !!provider,
    });
};

export const useCreateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ApiKeyCreate) =>
            apiClient.post<ApiKeyResponse>(API_ENDPOINTS.apiKeys.create, data),
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

// LLM Providers hooks (new)
export const useLLMProviders = () => {
    return useQuery({
        queryKey: QUERY_KEYS.providers,
        queryFn: () => apiClient.get<LLMProvider[]>(API_ENDPOINTS.providers.list),
        staleTime: 300000, // 5 minutes
    });
};

// Models hooks (new)
export const useModels = () => {
    return useQuery({
        queryKey: QUERY_KEYS.models,
        queryFn: () => apiClient.get<LLMModel[]>(API_ENDPOINTS.models.list),
        staleTime: 300000, // 5 minutes
    });
};

export const useModelsByProvider = (providerId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.modelsByProvider(providerId),
        queryFn: () => apiClient.get<LLMModel[]>(API_ENDPOINTS.models.byProvider(providerId)),
        enabled: !!providerId,
        staleTime: 300000,
    });
};

export const useModelsByType = (type: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.modelsByType(type),
        queryFn: () => apiClient.get<LLMModel[]>(API_ENDPOINTS.models.byType(type)),
        enabled: !!type,
        staleTime: 300000,
    });
};

// Model Preferences hooks (new)
export const useModelPreferences = () => {
    return useQuery({
        queryKey: QUERY_KEYS.modelPreferences,
        queryFn: () => apiClient.get<ModelPreference[]>(API_ENDPOINTS.modelPreferences.list),
        staleTime: 60000, // 1 minute
    });
};

export const useCreateModelPreference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ModelPreferenceCreate) =>
            apiClient.post<ModelPreference>(API_ENDPOINTS.modelPreferences.create, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

export const useUpdateModelPreference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ModelPreferenceUpdate }) =>
            apiClient.put<ModelPreference>(API_ENDPOINTS.modelPreferences.update(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

export const useDeleteModelPreference = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            apiClient.delete(API_ENDPOINTS.modelPreferences.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

export const useSetDefaultModel = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ modelId, useCase }: { modelId: string; useCase: string }) =>
            apiClient.post(API_ENDPOINTS.modelPreferences.setDefault(modelId, useCase)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modelPreferences });
        },
    });
};

// Analytics hooks (updated for new comprehensive analytics system)
export const useDashboardAnalytics = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.dashboard(studentId, days),
        queryFn: () => apiClient.get<DashboardAnalytics>(API_ENDPOINTS.analytics.dashboard(studentId, days)),
        enabled: !!studentId,
        staleTime: 60000, // 1 minute
    });
};

export const useSubjectAnalytics = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.subjects(studentId, days),
        queryFn: () => apiClient.get<SubjectAnalytics>(API_ENDPOINTS.analytics.subjects(studentId, days)),
        enabled: !!studentId,
        staleTime: 60000,
    });
};

export const useProgressAnalytics = (studentId: string, subjectId?: number) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.progress(studentId, subjectId),
        queryFn: () => apiClient.get(API_ENDPOINTS.analytics.progress(studentId, subjectId)),
        enabled: !!studentId,
        staleTime: 60000,
    });
};

export const useWeeklyTrends = (studentId: string, weeks: number = 4) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.weeklyTrends(studentId, weeks),
        queryFn: () => apiClient.get<WeeklyTrends>(API_ENDPOINTS.analytics.weeklyTrends(studentId, weeks)),
        enabled: !!studentId,
        staleTime: 300000, // 5 minutes
    });
};

export const useAchievements = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.achievements(studentId),
        queryFn: () => apiClient.get<AchievementsData>(API_ENDPOINTS.analytics.achievements(studentId)),
        enabled: !!studentId,
        staleTime: 300000,
    });
};

export const useStudyPatterns = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.studyPatterns(studentId, days),
        queryFn: () => apiClient.get<StudyPatterns>(API_ENDPOINTS.analytics.studyPatterns(studentId, days)),
        enabled: !!studentId,
        staleTime: 600000, // 10 minutes
    });
};

export const useWeaknessAnalysis = (studentId: string) => {
    return useQuery({
        queryKey: QUERY_KEYS.analytics.weaknesses(studentId),
        queryFn: () => apiClient.get<WeaknessAnalysis>(API_ENDPOINTS.analytics.weaknesses(studentId)),
        enabled: !!studentId,
        staleTime: 300000,
    });
};

// Student recommendations hook
export const useStudentRecommendations = (studentId: string) => {
    return useQuery({
        queryKey: ['student-recommendations', studentId],
        queryFn: () => apiClient.get(API_ENDPOINTS.students.recommendations(studentId)),
        enabled: !!studentId,
        staleTime: 300000, // 5 minutes
    });
};

// Student analytics hook (using Supabase endpoint)
export const useStudentAnalytics = (studentId: string, days: number = 30) => {
    return useQuery({
        queryKey: ['student-analytics', studentId, days],
        queryFn: () => apiClient.get(API_ENDPOINTS.students.analytics(studentId) + `?days=${days}`),
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
            apiClient.post(API_ENDPOINTS.students.saveLearningActivity(studentId), activityData),
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

// Authentication actions (updated for Supabase)
export const useAuth = () => {
    const queryClient = useQueryClient();

    const login = (credentials?: AuthCredentials) => {
        if (credentials) {
            // Use sign-in API endpoint for programmatic login
            return apiClient.post<SupabaseAuthResponse>(API_ENDPOINTS.auth.signIn, credentials);
        } else {
            // Redirect to OAuth login (if using OAuth flow)
            const redirectUrl = `${apiClient['baseURL']}${API_ENDPOINTS.auth.signIn}`;
            console.log('Redirecting to OAuth login:', redirectUrl);
            window.location.href = redirectUrl;
        }
    };

    const logout = async () => {
        try {
            // Call sign-out endpoint
            await apiClient.post(API_ENDPOINTS.auth.signOut);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local state regardless of API call success
            apiClient.clearToken();
            queryClient.clear();
            // Redirect to login or home page
            window.location.href = '/';
        }
    };

    const signup = (data: SignUpData) => {
        return apiClient.post<SupabaseAuthResponse>(API_ENDPOINTS.auth.signUp, data);
    };

    return {
        login,
        logout,
        signup,
    };
};
