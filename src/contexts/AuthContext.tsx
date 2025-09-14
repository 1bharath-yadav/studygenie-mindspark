import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useCurrentUser, useAuth as useAuthActions } from '@/hooks/useApi';
import type { User, AuthCredentials, SignUpData } from '@/types/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials?: AuthCredentials) => Promise<any> | void;
    logout: () => Promise<void>;
    signup: (data: SignUpData) => Promise<any>;
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

    const { data: user, isLoading, error, refetch } = useCurrentUser({ 
        enabled: initialTokenCheck 
    });
    const authActions = useAuthActions();

    const isAuthenticated = !!user && !!token && !error;

    // Debug authentication state
    useEffect(() => {
        console.log('AuthContext state update:', {
            hasUser: !!user,
            hasToken: !!token,
            hasError: !!error,
            isAuthenticated,
            initialTokenCheck,
            isLoading,
            error: error?.message
        });
    }, [user, token, error, isAuthenticated, initialTokenCheck, isLoading]);

    useEffect(() => {
        // Check if we have a token in URL (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');

        console.log('AuthContext: Checking for token in URL...', {
            currentUrl: window.location.href,
            hasToken: !!tokenFromUrl,
            tokenLength: tokenFromUrl?.length || 0
        });

        if (tokenFromUrl) {
            console.log('Found token in URL, storing and setting up auth...');
            setToken(tokenFromUrl);
            localStorage.setItem('authToken', tokenFromUrl);
            apiClient.setToken(tokenFromUrl);

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Force refetch user data after token is set
            setTimeout(() => {
                console.log('Refetching user data after token setup...');
                refetch();
            }, 100);
        }

        setInitialTokenCheck(true);
    }, []);

    useEffect(() => {
        if (token) {
            apiClient.setToken(token);
        }
    }, [token]);

    useEffect(() => {
        // Clear token if user fetch failed with auth error
        if (error && token && initialTokenCheck) {
            console.log('User fetch failed, clearing token...');
            if (error.message?.includes('401') || error.message?.includes('403')) {
                setToken(null);
                apiClient.clearToken();
                localStorage.removeItem('authToken');
            }
        }
    }, [error, initialTokenCheck, token]);

    // Enhanced login function that accepts credentials
    const login = async (credentials?: AuthCredentials) => {
        if (credentials) {
            try {
                const response = await authActions.login(credentials);
                if (response && response.access_token) {
                    setToken(response.access_token);
                    localStorage.setItem('authToken', response.access_token);
                    apiClient.setToken(response.access_token);
                    // Refetch user data
                    await refetch();
                    return response;
                }
            } catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        } else {
            // Redirect-based login for OAuth
            console.log('Redirecting to login...');
            authActions.login();
        }
    };

    // Enhanced logout function
    const logout = async () => {
        console.log('Logging out...');
        try {
            await authActions.logout();
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with local logout even if API call fails
        }
        
        setToken(null);
        apiClient.clearToken();
        localStorage.removeItem('authToken');
        // The authActions.logout() already handles redirect
    };

    // Signup function
    const signup = async (data: SignUpData) => {
        try {
            const response = await authActions.signup(data);
            if (response && response.access_token) {
                setToken(response.access_token);
                localStorage.setItem('authToken', response.access_token);
                apiClient.setToken(response.access_token);
                // Refetch user data
                await refetch();
                return response;
            }
            return response;
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user: user || null,
                isLoading: isLoading || !initialTokenCheck,
                isAuthenticated,
                login,
                logout,
                signup,
                token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};