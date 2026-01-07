/**
 * Authentication Service
 * Handles JWT token management for web admin panel
 */

interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        name: string;
        role: string;
        organization_id: number;
        organizationName?: string;
    };
}

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    organization_id: number;
    organizationName?: string;
}

class AuthService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private user: User | null = null;

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('accessToken');
            this.refreshToken = localStorage.getItem('refreshToken');
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    this.user = JSON.parse(userStr);
                } catch (e) {
                    console.error('Failed to parse user from localStorage', e);
                }
            }
        }
    }

    async login(email: string, password: string): Promise<User> {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        const data: LoginResponse = await response.json();

        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.user = data.user;

        // Store in localStorage
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        return data.user;
    }

    async refreshAccessToken(): Promise<string> {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
            // Refresh failed, logout
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        const data = await response.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        return data.accessToken;
    }

    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    getUser(): User | null {
        return this.user;
    }

    isAuthenticated(): boolean {
        return !!this.accessToken && !!this.user;
    }

    hasRole(roles: string[]): boolean {
        if (!this.user) return false;
        return roles.includes(this.user.role);
    }

    async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
        };

        let response = await fetch(url, { ...options, headers });

        // If unauthorized, try to refresh token
        if (response.status === 401) {
            try {
                await this.refreshAccessToken();
                // Retry with new token
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(url, { ...options, headers });
            } catch (error) {
                // Refresh failed, redirect to login
                window.location.href = '/login';
                throw error;
            }
        }

        return response;
    }
}

export const authService = new AuthService();
export type { User, LoginResponse };
