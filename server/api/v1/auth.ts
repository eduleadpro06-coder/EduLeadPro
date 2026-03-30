/**
 * Mobile API v1 - Auth Routes
 * Handles login, token refresh, and password management
 */

import express, { Request, Response } from 'express';
import { supabase } from '../../supabase.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../middleware/auth.js';
import { comparePassword, hashPassword } from '../../utils/password.js'; // Security: bcrypt password comparison

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

            // Check password - priority: custom app_password (bcrypt) > phone number > default 1234
            // Use bcrypt for custom passwords, plain comparison for defaults (backward compat)
            let isValidPassword = false;
            if (staff.app_password) {
                isValidPassword = await comparePassword(password, staff.app_password);
            } else {
                // Allow default passwords for accounts without custom password
                isValidPassword = (password === phone || password === '1234');
            }

            if (isValidPassword) {
                // Fetch organization name
                let organizationName = 'School';
                let organizationAddress = '';
                let organizationPhone = '';
                let organizationEmail = '';
                let academicYear = '2026-27';
                if (staff.organization_id) {
                    const { data: org } = await supabase
                        .from('organizations')
                        .select('name, address, phone, email, city, state, pincode, settings')
                        .eq('id', staff.organization_id)
                        .single();
                    if (org) {
                        organizationName = org.name;
                        organizationPhone = org.phone || '';
                        organizationEmail = org.email || '';
                        const orgSettings = (org.settings as any) || {};
                        academicYear = orgSettings.academicYear || '2026-27';
                        // Build full address
                        const addrParts = [org.address, org.city, org.state, org.pincode].filter(Boolean);
                        organizationAddress = addrParts.join(', ');
                    }
                }

                const userRole = staff.role.toLowerCase();
                const isTeacher = userRole.includes('teacher');
                const isDriver = userRole.includes('driver');
                const isSecurity = userRole.includes('security');
                const isSupport = userRole.includes('support');
                
                let normalizedRole = 'staff';
                if (isDriver) normalizedRole = 'driver';
                else if (isTeacher) normalizedRole = 'teacher';
                else if (isSecurity) normalizedRole = 'security';
                else if (isSupport) normalizedRole = 'support_staff';

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
                        organizationName: organizationName,
                        organizationAddress: organizationAddress,
                        organizationPhone: organizationPhone,
                        organizationEmail: organizationEmail,
                        academicYear: academicYear
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
            .select('id, name, class, status, father_first_name, father_last_name, mother_first_name, mother_last_name, father_phone, mother_phone, phone, app_password, organization_id, is_app_active')
            .or(`phone.eq."${phone}",father_phone.eq."${phone}",mother_phone.eq."${phone}"`);

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

        // Use bcrypt for stored passwords, allow default '1234' or their phone number for accounts without password
        if (storedPassword) {
            authenticated = await comparePassword(password, storedPassword);
        } else if (password === '1234' || password === phone) {
            authenticated = true;
        }

        // Force password change if using default password (1234 or phone number)
        if (authenticated && (password === '1234' || password === phone)) {
            requiresChange = true;
        }

        if (!authenticated) {
            return res.status(401).json({ error: 'Invalid Password' });
        }

        const parentRecord = students[0];

        // Fetch Organization Name
        let organizationName = 'School';
        let organizationAddress = '';
        let organizationPhone = '';
        let organizationEmail = '';
        let academicYear = '2026-27';
        if (parentRecord.organization_id) {
            const { data: org } = await supabase
                .from('organizations')
                .select('name, address, phone, email, city, state, pincode, settings')
                .eq('id', parentRecord.organization_id)
                .single();
            if (org) {
                organizationName = org.name;
                organizationPhone = org.phone || '';
                organizationEmail = org.email || '';
                const orgSettings = (org.settings as any) || {};
                academicYear = orgSettings.academicYear || '2026-27';
                // Build full address
                const addrParts = [org.address, org.city, org.state, org.pincode].filter(Boolean);
                organizationAddress = addrParts.join(', ');
            }
        }

        // Determine what phone number and name to return as "parent" info
        // Based on which one matched the login phone
        let activeParentPhone = phone;
        let activeParentName = 'Parent';

        const matchingStudent = students.find(s => 
            s.phone === phone || s.father_phone === phone || s.mother_phone === phone
        );

        if (matchingStudent) {
            if (matchingStudent.father_phone === phone) {
                activeParentName = `${matchingStudent.father_first_name || ''} ${matchingStudent.father_last_name || ''}`.trim() || 'Father';
            } else if (matchingStudent.mother_phone === phone) {
                activeParentName = `${matchingStudent.mother_first_name || ''} ${matchingStudent.mother_last_name || ''}`.trim() || 'Mother';
            } else {
                activeParentName = matchingStudent.name; // Use student name if logged in via student phone
            }
        }

        // Generate JWT tokens for parent
        const accessToken = generateAccessToken(
            parentRecord.id,
            activeParentPhone,
            'parent',
            parentRecord.organization_id
        );
        const refreshToken = generateRefreshToken(
            parentRecord.id,
            activeParentPhone,
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
                name: activeParentName,
                phone: activeParentPhone,
                role: 'parent',
                organization_id: parentRecord.organization_id,
                organizationName: organizationName,
                organizationAddress: organizationAddress,
                organizationPhone: organizationPhone,
                organizationEmail: organizationEmail,
                academicYear: academicYear,
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
            .or(`phone.eq."${phone}",father_phone.eq."${phone}",mother_phone.eq."${phone}"`);

        if (findError) throw findError;

        if (!leads || leads.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const ids = leads.map(l => l.id);

        const hashedPassword = await hashPassword(newPassword);

        const { error: updateError } = await supabase
            .from('leads')
            .update({ app_password: hashedPassword })
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
