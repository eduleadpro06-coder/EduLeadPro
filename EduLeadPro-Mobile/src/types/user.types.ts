/**
 * User and Authentication Types
 */

export interface User {
    id: string;
    userId: number;
    name: string;
    email: string;
    role: 'parent' | 'teacher' | 'driver' | 'admin';
    organizationId: number;
    children?: Student[];
}

export interface Student {
    id: string;
    student_name: string;
    class: string;
    section: string;
    active: boolean;
    student_bus_assignments?: BusAssignment[];
}

export interface BusAssignment {
    id: string;
    route_id: string;
    stop_id: string;
    assignment_type: 'pickup' | 'drop' | 'both';
    bus_routes: BusRoute;
    bus_stops: BusStop;
}

export interface LoginRequest {
    phone: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    token: string;
    refreshToken: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
