/**
 * Permission definitions and utilities
 * Defines role-based access control (RBAC) for the admin panel
 */

export type UserRole = 'admin' | 'manager' | 'counselor' | 'accountant' | 'teacher' | 'driver';

export interface Permission {
    resource: string;
    actions: ('read' | 'create' | 'update' | 'delete')[];
}

// Role-based permissions matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'leads', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'students', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'staff', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'expenses', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'fees', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'settings', actions: ['read', 'update'] },
        { resource: 'daycare', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'communication', actions: ['read', 'create'] },
        { resource: 'ai-features', actions: ['read', 'create'] },
    ],

    manager: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'leads', actions: ['read', 'create', 'update'] },
        { resource: 'students', actions: ['read', 'create', 'update'] },
        { resource: 'staff', actions: ['read', 'create', 'update'] },
        { resource: 'expenses', actions: ['read'] },
        { resource: 'fees', actions: ['read', 'update'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'daycare', actions: ['read', 'create', 'update'] },
        { resource: 'communication', actions: ['read', 'create'] },
    ],

    counselor: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'leads', actions: ['read', 'create', 'update'] },
        { resource: 'communication', actions: ['read', 'create'] },
    ],

    accountant: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'expenses', actions: ['read', 'create', 'update', 'delete'] },
        { resource: 'fees', actions: ['read', 'create', 'update'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'inventory', actions: ['read'] },
    ],

    teacher: [
        { resource: 'dashboard', actions: ['read'] },
        { resource: 'students', actions: ['read'] },
        { resource: 'daycare', actions: ['read', 'create', 'update'] },
    ],

    driver: [
        { resource: 'dashboard', actions: ['read'] },
    ],
};

// Page-to-resource mapping
export const PAGE_RESOURCES: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/lead-management': 'leads',
    '/leads': 'leads',
    '/students': 'students',
    '/staff': 'staff',
    '/expenses': 'expenses',
    '/student-fees': 'fees',
    '/reports': 'reports',
    '/settings': 'settings',
    '/daycare': 'daycare',
    '/inventory': 'inventory',
    '/communication': 'communication',
    '/ai-enhanced-dashboard': 'ai-features',
    '/staff-ai': 'ai-features',
    '/marketing': 'ai-features',
    '/forecasting': 'ai-features',
};

/**
 * Check if a role has permission to access a resource
 */
export function hasPermission(
    role: UserRole,
    resource: string,
    action: 'read' | 'create' | 'update' | 'delete' = 'read'
): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    return resourcePermission.actions.includes(action);
}

/**
 * Check if a role can access a page
 */
export function canAccessPage(role: UserRole, path: string): boolean {
    const resource = PAGE_RESOURCES[path];
    if (!resource) return true; // Allow access to unmapped pages (like login, 404)

    return hasPermission(role, resource, 'read');
}

/**
 * Get all accessible pages for a role
 */
export function getAccessiblePages(role: UserRole): string[] {
    return Object.entries(PAGE_RESOURCES)
        .filter(([path, resource]) => hasPermission(role, resource, 'read'))
        .map(([path]) => path);
}
