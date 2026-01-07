/**
 * Authentication React Hook
 * Provides auth state and methods to React components
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(authService.getUser());
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authenticated on mount
        const currentUser = authService.getUser();
        setUser(currentUser);
        setIsLoading(false);

        // If not authenticated and not on login page, redirect
        if (!currentUser && window.location.pathname !== '/login') {
            navigate('/login');
        }
    }, [navigate]);

    const login = async (email: string, password: string) => {
        try {
            const loggedInUser = await authService.login(email, password);
            setUser(loggedInUser);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        navigate('/login');
    };

    const hasRole = (roles: string[]): boolean => {
        return authService.hasRole(roles);
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: authService.isAuthenticated(),
        isLoading,
        login,
        logout,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
