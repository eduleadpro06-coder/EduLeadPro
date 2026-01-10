/**
 * Mobile API v1 - Auth Routes
 * Handles login, token refresh, and password management
 */

import express, { Request, Response } from 'express';
import { supabase } from '../../supabase.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../middleware/auth.js';

const router = express.Router();

/**
 * Mobile login
 * POST /api/v1/mobile/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone number and password required' });
        }

        // First, check if this is a STAFF member (Teacher/Driver)
        const { data: staffMembers, error: staffError } = await supabase
            .from('staff')
            .select('id, name, phone, role, organization_id, email, app_password')
            .eq('phone', phone)
            .eq('is_active', true);

        if (staffError) {
            console.error('[Login] Staff fetch error:', staffError);
            throw staffError;
        }

        if (!staffError && staffMembers && staffMembers.length > 0) {
            const staff = staffMembers[0];

            // Check password - priority: custom app_password > phone number > default 1234
            const isValidPassword = staff.app_password
                ? password === staff.app_password  // If custom password set, must match
                : (password === phone || password === '1234');  // Otherwise allow defaults

            if (isValidPassword) {
                // Fetch organization name
                let organizationName = 'School';
                if (staff.organization_id) {
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('name')
                        .eq('id', staff.organization_id)
                        .single();
                    if (org) organizationName = org.name;
                }

                const userRole = staff.role.toLowerCase();
                const isTeacher = userRole.includes('teacher');
                const isDriver = userRole.includes('driver');
                const normalizedRole = isDriver ? 'driver' : (isTeacher ? 'teacher' : 'staff');

                // Generate JWT tokens
                const accessToken = generateAccessToken(
                    staff.id,
                    staff.phone,
                    normalizedRole,
                    staff.organization_id
                );
                const refreshToken = generateRefreshToken(
                    staff.id,
                    staff.phone,
                    normalizedRole,
                    staff.organization_id
                );

                return res.json({
                    success: true,
                    accessToken,
                    refreshToken,
                    user: {
                        userId: staff.id,
                        staffId: staff.id,
                        name: staff.name,
                        phone: staff.phone,
                        email: staff.email,
                        role: normalizedRole,
                        organization_id: staff.organization_id,
                        organizationName: organizationName
                    },
                    requiresPasswordChange: false,
                    students: []
                });
            } else {
                return res.status(401).json({ error: 'Invalid Password' });
            }
        }

        // If not staff, check for PARENT (existing logic)
        const { data: students, error: fetchError } = await supabase
            .from('leads')
            .select('id, name, class, status, parent_name, parent_phone, phone, app_password, organization_id, is_app_active')
            .or(`parent_phone.eq."${phone}",phone.eq."${phone}"`);

        if (fetchError) {
            console.error('[Login] Parent/Student fetch error:', fetchError);
            throw fetchError;
        }

        if (!students || students.length === 0) {
            return res.status(404).json({ error: 'No account found with this phone number' });
        }

        // Check if any student record associated with this phone number is active
        const hasActiveAccount = students.some(s => s.is_app_active !== false);

        if (!hasActiveAccount) {
            return res.status(403).json({ error: 'Account deactivated. Please contact administration.' });
        }

        // Check Password
        const studentWithPassword = students.find(s => s.app_password);
        const storedPassword = studentWithPassword ? studentWithPassword.app_password : null;

        let authenticated = false;
        let requiresChange = false;

        if (storedPassword && storedPassword === password) {
            authenticated = true;
        } else if (!storedPassword && password === '1234') {
            authenticated = true;
            requiresChange = true;
        }

        if (!authenticated) {
            return res.status(401).json({ error: 'Invalid Password' });
        }

        const parentRecord = students[0];

        // Fetch Organization Name
        let organizationName = 'School';
        if (parentRecord.organization_id) {
            const { data: org } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', parentRecord.organization_id)
                .single();
            if (org) {
                organizationName = org.name;
            }
        }

        // Generate JWT tokens for parent
        const accessToken = generateAccessToken(
            parentRecord.id,
            parentRecord.parent_phone,
            'parent',
            parentRecord.organization_id
        );
        const refreshToken = generateRefreshToken(
            parentRecord.id,
            parentRecord.parent_phone,
            'parent',
            parentRecord.organization_id
        );

        const children = students.map(s => ({
            id: s.id,
            student_name: s.name,
            name: s.name,
            class: s.class,
            status: s.status,
            student_bus_assignments: [] // Placeholder if needed
        }));

        return res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                userId: parentRecord.id,
                name: parentRecord.parent_name || 'Parent',
                phone: parentRecord.parent_phone,
                role: 'parent',
                organization_id: parentRecord.organization_id,
                organizationName: organizationName,
                children: children
            },
            requiresPasswordChange: requiresChange,
            students: children
        });

    } catch (error) {
        console.error('[API] Login error details:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});

/**
 * Change Password
 */
router.post('/change-password', async (req: Request, res: Response) => {
    try {
        const { phone, newPassword } = req.body;

        if (!phone || !newPassword) {
            return res.status(400).json({ error: 'Phone and new password required' });
        }

        const { data: leads, error: findError } = await supabase
            .from('leads')
            .select('id')
            .or(`parent_phone.eq."${phone}",phone.eq."${phone}"`);

        if (findError) throw findError;

        if (!leads || leads.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const ids = leads.map(l => l.id);

        const { error: updateError } = await supabase
            .from('leads')
            .update({ app_password: newPassword })
            .in('id', ids);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

/**
 * Change Password for STAFF
 */
router.post('/change-password-staff', async (req, res: Response) => {
    try {
        const { phone, oldPassword, newPassword } = req.body;

        if (!phone || !newPassword) {
            return res.status(400).json({ error: 'Phone and new password are required' });
        }

        const { data: staffMembers, error: findError } = await supabase
            .from('staff')
            .select('id, phone, app_password')
            .eq('phone', phone)
            .eq('is_active', true);

        if (findError || !staffMembers || staffMembers.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        const staff = staffMembers[0];

        if (oldPassword) {
            const isValidOld = staff.app_password
                ? oldPassword === staff.app_password
                : (oldPassword === phone || oldPassword === '1234');

            if (!isValidOld) {
                return res.status(401).json({ error: 'Invalid old password' });
            }
        }

        const { error: updateError } = await supabase
            .from('staff')
            .update({ app_password: newPassword })
            .eq('id', staff.id);

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Staff password change error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

/**
 * Logout
 */
router.post('/logout', async (req: Request, res: Response) => {
    try {
        const { deviceToken } = req.body;
        if (deviceToken) {
            await supabase
                .from('parent_device_tokens')
                .update({ active: false })
                .eq('device_token', deviceToken);
        }
        await supabase.auth.signOut();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Refresh Token
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const decoded = verifyToken(refreshToken);

        if (!decoded || decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const newAccessToken = generateAccessToken(
            decoded.userId,
            decoded.username,
            decoded.role,
            decoded.organizationId
        );

        res.json({
            success: true,
            token: newAccessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
