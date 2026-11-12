import { LoginResponse } from '../types/user.types';

export interface DemoUserConfig {
    phone: string;
    aliases: string[];
    role: 'parent' | 'teacher' | 'driver' | 'security' | 'admin';
    name: string;
    email: string;
    title: string;
    description: string;
    icon: string;
    loginResponse: LoginResponse;
}

export const DEMO_USERS: Record<string, DemoUserConfig> = {
    parent: {
        phone: '9999900001',
        aliases: ['9000000001'],
        role: 'parent',
        name: 'Pooja Sharma (Demo Parent)',
        email: 'parent.demo@bloomdale.com',
        title: 'Parent',
        description: 'View child Aarav, attendance, fees & leaves',
        icon: 'people',
        loginResponse: {
            success: true,
            accessToken: 'demo-jwt-token-parent-9999900001',
            refreshToken: 'demo-refresh-token-parent-9999900001',
            requiresPasswordChange: false,
            user: {
                id: '999901',
                userId: 999901,
                name: 'Pooja Sharma (Demo Parent)',
                email: 'parent.demo@bloomdale.com',
                role: 'parent',
                organizationId: 1,
                children: [
                    {
                        id: '99901',
                        student_name: 'Aarav Sharma (Demo Child)',
                        class: 'Playgroup',
                        section: 'A',
                        active: true,
                        student_bus_assignments: [
                            {
                                id: 'demo-bus-assign-1',
                                route_id: '1',
                                stop_id: '1',
                                assignment_type: 'both',
                                bus_routes: {
                                    id: '1',
                                    route_name: 'Route 1 - East City',
                                    bus_number: 'MH-12-AB-1234',
                                    driver_name: 'Rajesh Singh',
                                    driver_phone: '9999900003',
                                    is_active: true
                                } as any,
                                bus_stops: {
                                    id: '1',
                                    stop_name: 'Main Gate Stop',
                                    stop_order: 1,
                                    pickup_time: '08:15 AM',
                                    drop_time: '01:30 PM'
                                } as any
                            }
                        ]
                    }
                ]
            }
        }
    },
    teacher: {
        phone: '9999900002',
        aliases: ['9000000002'],
        role: 'teacher',
        name: 'Ananya Verma (Demo Teacher)',
        email: 'teacher.demo@bloomdale.com',
        title: 'Teacher',
        description: 'Take attendance, approve leaves & view students',
        icon: 'school',
        loginResponse: {
            success: true,
            accessToken: 'demo-jwt-token-teacher-9999900002',
            refreshToken: 'demo-refresh-token-teacher-9999900002',
            requiresPasswordChange: false,
            user: {
                id: '999902',
                userId: 999902,
                name: 'Ananya Verma (Demo Teacher)',
                email: 'teacher.demo@bloomdale.com',
                role: 'teacher',
                organizationId: 1
            }
        }
    },
    driver: {
        phone: '9999900003',
        aliases: ['9000000003'],
        role: 'driver',
        name: 'Rajesh Singh (Demo Driver)',
        email: 'driver.demo@bloomdale.com',
        title: 'Driver',
        description: 'Start trips, view route stops & students',
        icon: 'bus',
        loginResponse: {
            success: true,
            accessToken: 'demo-jwt-token-driver-9999900003',
            refreshToken: 'demo-refresh-token-driver-9999900003',
            requiresPasswordChange: false,
            user: {
                id: '999903',
                userId: 999903,
                name: 'Rajesh Singh (Demo Driver)',
                email: 'driver.demo@bloomdale.com',
                role: 'driver',
                organizationId: 1
            }
        }
    },
    security: {
        phone: '9999900004',
        aliases: ['9000000004'],
        role: 'security',
        name: 'Vikram Jadhav (Demo Security)',
        email: 'security.demo@bloomdale.com',
        title: 'Security',
        description: 'Gate pass check-in & visitor logs',
        icon: 'shield-checkmark',
        loginResponse: {
            success: true,
            accessToken: 'demo-jwt-token-security-9999900004',
            refreshToken: 'demo-refresh-token-security-9999900004',
            requiresPasswordChange: false,
            user: {
                id: '999904',
                userId: 999904,
                name: 'Vikram Jadhav (Demo Security)',
                email: 'security.demo@bloomdale.com',
                role: 'security',
                organizationId: 1
            }
        }
    },
    admin: {
        phone: '9999900005',
        aliases: ['9000000005'],
        role: 'admin',
        name: 'Dr. Sunita Kulkarni (Demo Admin)',
        email: 'admin.demo@bloomdale.com',
        title: 'Admin',
        description: 'Full school overview, staff & student metrics',
        icon: 'business',
        loginResponse: {
            success: true,
            accessToken: 'demo-jwt-token-admin-9999900005',
            refreshToken: 'demo-refresh-token-admin-9999900005',
            requiresPasswordChange: false,
            user: {
                id: '999905',
                userId: 999905,
                name: 'Dr. Sunita Kulkarni (Demo Admin)',
                email: 'admin.demo@bloomdale.com',
                role: 'admin',
                organizationId: 1
            }
        }
    }
};

/**
 * Check if the given phone number belongs to any demo user.
 * Supports direct phone and aliases.
 */
export function getDemoUser(phone: string): LoginResponse | null {
    if (!phone) return null;
    const cleanPhone = phone.trim().replace(/\D/g, '');

    for (const key of Object.keys(DEMO_USERS)) {
        const config = DEMO_USERS[key];
        if (config.phone === cleanPhone || config.aliases.includes(cleanPhone)) {
            return JSON.parse(JSON.stringify(config.loginResponse));
        }
    }

    return null;
}

