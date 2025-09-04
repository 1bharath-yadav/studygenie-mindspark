import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useApi';
import type { User } from '@/types/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [token, setToken] = useState<string | null>(
        localStorage.getItem('authToken')
    );
    const [initialTokenCheck, setInitialTokenCheck] = useState(false);

    const { data: user, isLoading, error, refetch } = useCurrentUser();

    const isAuthenticated = !!user && !!token && !error;

    useEffect(() => {
        // Check if we have a token in URL (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        if (tokenFromUrl) {
            console.log('Found token in URL, storing and setting up auth...');
            setToken(tokenFromUrl);
            localStorage.setItem('authToken', tokenFromUrl);
            apiClient.setToken(tokenFromUrl);

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);

            // Trigger a refetch of user data
            setTimeout(() => {
                refetch();
            }, 100);
        }
        setInitialTokenCheck(true);
    }, [refetch]);

    useEffect(() => {
        if (token) {
            apiClient.setToken(token);
            localStorage.setItem('authToken', token);
        } else {
            apiClient.clearToken();
            localStorage.removeItem('authToken');
        }
    }, [token]);

    // Handle authentication errors (401/403)
    useEffect(() => {
        if (error && initialTokenCheck && token) {
            const errorMessage = error.message || '';
            if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
                console.log('Authentication error detected, clearing token');
                setToken(null);
                apiClient.clearToken();
                localStorage.removeItem('authToken');
            }
        }
    }, [error, initialTokenCheck, token]);

    const login = () => {
        console.log('Redirecting to login...');
        window.location.href = `${apiClient['baseURL']}/api/auth/login`;
    };

    const logout = () => {
        console.log('Logging out...');
        setToken(null);
        apiClient.clearToken();
        localStorage.removeItem('authToken');
        // Redirect to home page
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isLoading: isLoading || !initialTokenCheck,
                isAuthenticated,
                login,
                logout,
                token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
