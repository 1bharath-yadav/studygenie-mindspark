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

    // Authentication
    auth: {
        login: '/api/auth/login',
        callback: '/api/auth/callback',
        verify: '/api/auth/verify',
        me: '/api/users/me',
    },

    // LLM services
    llm: {
        processFiles: '/api/process-files',
        chatResponse: '/api/chat-response',
        generateContent: '/api/generate-content',
    },

    // Students
    students: {
        list: '/api/students',
        create: '/api/students',
        getById: (id: string) => `/api/students/${id}`,
        update: (id: string) => `/api/students/${id}`,
        delete: (id: string) => `/api/students/${id}`,
        progress: (id: string) => `/api/students/${id}/progress`,
    },

    // User profile
    users: {
        me: '/api/users/me',
        updateProfile: '/api/users/me',
        deleteProfile: '/api/users/me',
    },

    // API Keys
    apiKeys: {
        list: '/api/api-keys',
        create: '/api/api-keys',
        delete: (id: string) => `/api/api-keys/${id}`,
        status: '/api/api-keys/status',
    },

    // Analytics
    analytics: {
        dashboard: (studentId: string) => `/api/analytics/${studentId}/dashboard`,
        progress: (studentId: string) => `/api/analytics/${studentId}/progress`,
        weeklyTrends: (studentId: string) => `/api/analytics/${studentId}/weekly-trends`,
        achievements: (studentId: string) => `/api/analytics/${studentId}/achievements`,
        studyPatterns: (studentId: string) => `/api/analytics/${studentId}/study-patterns`,
        weaknesses: (studentId: string) => `/api/analytics/${studentId}/weaknesses`,
    },
} as const;

export default apiClient;
