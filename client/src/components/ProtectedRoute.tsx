/**
 * Protected Route Component
 * Restricts access to routes based on user roles and permissions
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { canAccessPage, UserRole } from '../lib/permissions';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
    requireAuth?: boolean;
}

export function ProtectedRoute({
    children,
    allowedRoles,
    requireAuth = true,
}: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if authentication required and user not authenticated
    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if roles specified
    if (allowedRoles && user) {
        const hasAccess = allowedRoles.includes(user.role as UserRole);
        if (!hasAccess) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    // Check page-level permissions based on current path
    if (user && !canAccessPage(user.role as UserRole, location.pathname)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}
