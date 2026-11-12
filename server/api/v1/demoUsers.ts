/**
 * Demo / Test Users configuration for Mobile App
 * Complete bypass for testing without database dependencies or credentials.
 */

import { generateAccessToken, generateRefreshToken } from '../../middleware/auth.js';

export interface DemoUserDef {
    phone: string;
    aliases: string[];
    role: 'parent' | 'teacher' | 'driver' | 'security' | 'admin';
    name: string;
    email: string;
    id: number;
    organization_id: number;
    organizationName: string;
    organizationAddress: string;
    organizationPhone: string;
    organizationEmail: string;
    academicYear: string;
    class?: string;
    children?: any[];
}

export const SERVER_DEMO_USERS: Record<string, DemoUserDef> = {
    parent: {
        id: 999901,
        phone: '9999900001',
        aliases: ['9000000001'],
        role: 'parent',
        name: 'Pooja Sharma (Demo Parent)',
        email: 'parent.demo@bloomdale.com',
        organization_id: 1,
        organizationName: 'Bloomdale International School',
        organizationAddress: '123 Education Boulevard, Pune, MH, 411001',
        organizationPhone: '+91 98765 43210',
        organizationEmail: 'info@bloomdale.com',
        academicYear: '2026-27',
        children: [
            {
                id: 99901,
                student_name: 'Aarav Sharma (Demo Child)',
                name: 'Aarav Sharma (Demo Child)',
                class: 'Playgroup',
                section: 'A',
                status: 'enrolled',
                active: true,
                student_bus_assignments: [
                    {
                        id: 'demo-bus-assign-1',
                        route_id: '1',
                        stop_id: '1',
                        assignment_type: 'both',
                        bus_routes: {
                            id: 1,
                            route_name: 'Route 1 - East City',
                            bus_number: 'MH-12-AB-1234',
                            driver_name: 'Rajesh Singh',
                            driver_phone: '9999900003',
                            is_active: true
                        },
                        bus_stops: {
                            id: 1,
                            stop_name: 'Main Gate Stop',
                            stop_order: 1,
                            pickup_time: '08:15 AM',
                            drop_time: '01:30 PM'
                        }
                    }
                ]
            }
        ]
    },
    teacher: {
        id: 999902,
        phone: '9999900002',
        aliases: ['9000000002'],
        role: 'teacher',
        name: 'Ananya Verma (Demo Teacher)',
        email: 'teacher.demo@bloomdale.com',
        organization_id: 1,
        organizationName: 'Bloomdale International School',
        organizationAddress: '123 Education Boulevard, Pune, MH, 411001',
        organizationPhone: '+91 98765 43210',
        organizationEmail: 'info@bloomdale.com',
        academicYear: '2026-27',
        class: 'Playgroup A'
    },
    driver: {
        id: 999903,
        phone: '9999900003',
        aliases: ['9000000003'],
        role: 'driver',
        name: 'Rajesh Singh (Demo Driver)',
        email: 'driver.demo@bloomdale.com',
        organization_id: 1,
        organizationName: 'Bloomdale International School',
        organizationAddress: '123 Education Boulevard, Pune, MH, 411001',
        organizationPhone: '+91 98765 43210',
        organizationEmail: 'info@bloomdale.com',
        academicYear: '2026-27'
    },
    security: {
        id: 999904,
        phone: '9999900004',
        aliases: ['9000000004'],
        role: 'security',
        name: 'Vikram Jadhav (Demo Security)',
        email: 'security.demo@bloomdale.com',
        organization_id: 1,
        organizationName: 'Bloomdale International School',
        organizationAddress: '123 Education Boulevard, Pune, MH, 411001',
        organizationPhone: '+91 98765 43210',
        organizationEmail: 'info@bloomdale.com',
        academicYear: '2026-27'
    },
    admin: {
        id: 999905,
        phone: '9999900005',
        aliases: ['9000000005'],
        role: 'admin',
        name: 'Dr. Sunita Kulkarni (Demo Admin)',
        email: 'admin.demo@bloomdale.com',
        organization_id: 1,
        organizationName: 'Bloomdale International School',
        organizationAddress: '123 Education Boulevard, Pune, MH, 411001',
        organizationPhone: '+91 98765 43210',
        organizationEmail: 'info@bloomdale.com',
        academicYear: '2026-27'
    }
};

export function isDemoPhone(phone?: string): DemoUserDef | null {
    if (!phone) return null;
    const cleanPhone = phone.trim().replace(/\D/g, '');
    for (const key of Object.keys(SERVER_DEMO_USERS)) {
        const user = SERVER_DEMO_USERS[key];
        if (user.phone === cleanPhone || user.aliases.includes(cleanPhone)) {
            return user;
        }
    }
    return null;
}

export function isDemoUser(userId?: number): boolean {
    return !!userId && userId >= 999900 && userId <= 999999;
}

export function getDemoAuthPayload(phone?: string) {
    const userDef = isDemoPhone(phone);
    if (!userDef) return null;

    const accessToken = generateAccessToken(userDef.id, userDef.phone, userDef.role, userDef.organization_id);
    const refreshToken = generateRefreshToken(userDef.id, userDef.phone, userDef.role, userDef.organization_id);

    return {
        success: true,
        accessToken,
        refreshToken,
        user: {
            userId: userDef.id,
            staffId: userDef.id,
            id: String(userDef.id),
            name: userDef.name,
            phone: userDef.phone,
            email: userDef.email,
            role: userDef.role,
            organization_id: userDef.organization_id,
            organizationName: userDef.organizationName,
            organizationAddress: userDef.organizationAddress,
            organizationPhone: userDef.organizationPhone,
            organizationEmail: userDef.organizationEmail,
            academicYear: userDef.academicYear,
            children: userDef.children || []
        },
        requiresPasswordChange: false,
        students: userDef.children || []
    };
}

