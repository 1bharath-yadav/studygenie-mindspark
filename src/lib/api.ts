// API configuration and base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API client class for making requests to the backend
class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token: string) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Remove authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Generic request method
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    errorData?.detail ||
                    errorData?.message ||
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // GET request
    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    // POST request
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // Upload files
    async uploadFiles<T>(endpoint: string, files: File[], additionalData?: Record<string, any>): Promise<T> {
        const formData = new FormData();

        files.forEach((file, index) => {
            formData.append(`files`, file);
        });

        if (additionalData) {
            Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
            });
        }

        return this.request<T>(endpoint, {
            method: 'POST',
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
            body: formData,
        });
    }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
    // Health check
    health: '/health',

    // Authentication (updated for new Supabase JWT system)
    auth: {
        signUp: '/api/v1/auth/sign-up',
        signIn: '/api/v1/auth/login', // Fixed: use the actual OAuth login endpoint
        signOut: '/api/v1/auth/sign-out',
        refresh: '/api/v1/auth/refresh',
        me: '/api/v1/auth/profile', // Updated to match backend route
        protected: '/api/v1/auth/protected',
        verify: '/api/v1/auth/verify', // Keep for backward compatibility
        login: '/api/v1/auth/login', // OAuth login endpoint
        callback: '/api/v1/auth/callback', // Keep if needed for OAuth
    },

    // LLM services (updated for new functional structure)
    llm: {
        processFiles: '/api/v1/llm/process-files',
        chatResponse: '/api/v1/llm/chat-response',
        generateContent: '/api/v1/llm/generate-content',
        generateStructured: '/api/v1/llm/generate-structured',
        providers: '/api/v1/llm/providers',
        models: '/api/v1/llm/models',
        capabilities: '/api/v1/llm/capabilities',
    },

    // Students (updated for new functional structure)
    students: {
        list: '/api/v1/students',
        create: '/api/v1/students',
        getById: (id: string) => `/api/v1/students/${id}`,
        update: (id: string) => `/api/v1/students/${id}`,
        delete: (id: string) => `/api/v1/students/${id}`,
        progress: (id: string) => `/api/v1/students/${id}/progress`,
        recommendations: (id: string) => `/api/v1/students/${id}/recommendations`,
        analytics: (id: string) => `/api/v1/students/${id}/analytics`,
        saveLearningActivity: (id: string) => `/api/v1/students/${id}/learning-activity`,
    },

    // User profile (kept for compatibility)
    users: {
        me: '/api/v1/auth/profile', // Updated to match backend route
        updateProfile: '/api/v1/users/me',
        deleteProfile: '/api/v1/users/me',
    },

    // API Keys (updated for new functional structure)
    apiKeys: {
        list: '/api/v1/api-keys',
        create: '/api/v1/api-keys',
        delete: (id: string) => `/api/v1/api-keys/${id}`,
        status: (provider: string) => `/api/v1/api-keys/providers/${provider}/status`,
        checkProvider: (provider: string) => `/api/v1/api-keys/providers/${provider}/status`,
    },

    // Analytics (updated for new comprehensive analytics)
    analytics: {
        dashboard: (studentId: string, days?: number) => 
            `/api/v1/analytics/${studentId}/dashboard${days ? `?days=${days}` : ''}`,
        subjects: (studentId: string, days?: number) => 
            `/api/v1/analytics/${studentId}/subjects${days ? `?days=${days}` : ''}`,
        progress: (studentId: string, subjectId?: number) => 
            `/api/v1/analytics/${studentId}/progress${subjectId ? `?subject_id=${subjectId}` : ''}`,
        achievements: (studentId: string) => 
            `/api/v1/analytics/${studentId}/achievements`,
        weeklyTrends: (studentId: string, weeks?: number) => 
            `/api/v1/analytics/${studentId}/weekly-trends${weeks ? `?weeks=${weeks}` : ''}`,
        weaknesses: (studentId: string) => 
            `/api/v1/analytics/${studentId}/weaknesses`,
        studyPatterns: (studentId: string, days?: number) => 
            `/api/v1/analytics/${studentId}/study-patterns${days ? `?days=${days}` : ''}`,
        
        // Legacy endpoints for backward compatibility
        weeklyTrendsLegacy: (studentId: string) => `/api/analytics/${studentId}/weekly-trends`,
        dashboardLegacy: (studentId: string) => `/api/analytics/${studentId}/dashboard`,
    },

    // Provider management (new endpoints)
    providers: {
        list: '/api/v1/providers',
        create: '/api/v1/providers',
        getById: (id: string) => `/api/v1/providers/${id}`,
        update: (id: string) => `/api/v1/providers/${id}`,
        delete: (id: string) => `/api/v1/providers/${id}`,
        models: (id: string) => `/api/v1/providers/${id}/models`,
    },

    // Model management (new endpoints)
    models: {
        list: '/api/v1/models',
        getById: (id: string) => `/api/v1/models/${id}`,
        byProvider: (providerId: string) => `/api/v1/providers/${providerId}/models`,
        byType: (type: string) => `/api/v1/models?type=${type}`,
    },

    // User Model Preferences (new endpoints)
    modelPreferences: {
        list: '/api/v1/model-preferences',
        create: '/api/v1/model-preferences',
        update: (id: string) => `/api/v1/model-preferences/${id}`,
        delete: (id: string) => `/api/v1/model-preferences/${id}`,
        setDefault: (modelId: string, useCase: string) => `/api/v1/model-preferences/default?model_id=${modelId}&use_case=${useCase}`,
    },
} as const;

export default apiClient;
