// frontend/src/lib/api.ts
// API configuration and base URL

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

        // If the body is a FormData instance, do NOT set a Content-Type header
        // so the browser can set the correct multipart/form-data boundary.
        const isFormDataBody = options.body instanceof FormData;

        const config: RequestInit = {
            // Spread other options first so callers can override method/body/etc.
            ...options,
            headers: {
                // Only set JSON content type for non-FormData bodies
                ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                // Merge any caller-provided headers (these can override defaults)
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                // Try to parse structured error body and include it in the thrown Error
                const errorData = await response.json().catch(() => null);
                let message: string;
                if (!errorData) {
                    message = `HTTP ${response.status}: ${response.statusText}`;
                } else if (typeof errorData === 'string') {
                    message = errorData;
                } else {
                    // Prefer common properties, else stringify the whole body
                    message = (errorData.detail || errorData.message) ? (errorData.detail || errorData.message) : JSON.stringify(errorData);
                }

                // Attach status for easier debugging
                const err = new Error(message);
                // @ts-ignore - attach extra debug info
                err.status = response.status;
                throw err;
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

    // PATCH request
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
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

// API endpoints (updated to match backend routes, removed trailing slashes)
export const API_ENDPOINTS = {
    // Health check
    health: '/health',

    // Authentication (OAuth with custom JWT)
    auth: {
        login: '/api/v1/auth/login', // GET for OAuth redirect
        callback: '/api/v1/auth/callback', // GET for OAuth callback
        verify: '/api/v1/auth/verify', // POST for token verification
        profile: '/api/v1/auth/profile', // GET for user profile
    },

    // Student (single current user)
    student: {
        getCurrent: '/api/v1/student',
        update: '/api/v1/student',
        delete: '/api/v1/student',
        progress: '/api/v1/student/progress', // Assuming sub-endpoint if exists
    },

    // LLM services
    llm: {
        generate: '/api/v1/llm/generate',
        studyContent: '/api/v1/llm/study-content',
        qa: '/api/v1/llm/qa',
        userProviders: '/api/v1/llm/providers',
        userModels: '/api/v1/llm/models',
        systemProviders: '/api/v1/llm/system/providers',
        processFiles: '/api/v1/llm/process-files', // Assuming exists
    },

    // API Keys
    apiKeys: {
        list: '/api/v1/api-keys',
        create: '/api/v1/api-keys',
        delete: (id: string) => `/api/v1/api-keys/${id}`,
        status: (provider: string) => `/api/v1/api-keys/providers/${provider}/status`,
    },

    // Providers
    providers: {
        list: '/api/v1/providers',
        modelsByProvider: (provider: string) => `/api/v1/providers/${provider}/models`,
        modelsChat: '/api/v1/providers/models/chat',
        modelsEmbedding: '/api/v1/providers/models/embedding',
        modelById: (modelId: string) => `/api/v1/providers/models/${modelId}`,
        availableChat: '/api/v1/providers/models/available/chat',
        availableEmbedding: '/api/v1/providers/models/available/embedding',
        availableAll: '/api/v1/providers/models/available',
    },

    // analytics removed

    // Model preferences (not implemented in backend, stubs - consider removing calls if causing 404)
    modelPreferences: {
        list: '/api/v1/model-preferences',
        create: '/api/v1/model-preferences',
        update: (id: string) => `/api/v1/model-preferences/${id}`,
        delete: (id: string) => `/api/v1/model-preferences/${id}`,
        setDefault: (modelId: string, useCase: string) => `/api/v1/model-preferences/default/${modelId}/${useCase}`,
    },
} as const;

export default apiClient;