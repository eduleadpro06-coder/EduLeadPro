/**
 * Mobile App API Routes
 * Handles authentication and data for Parent/Teacher/Driver mobile apps
 * Last updated: 2026-01-07 - Staff password management
 */

import express, { Request, Response } from 'express';
import { supabase } from './supabase.js';
import { getOrganizationId } from './utils.js';
import { generateAccessToken, generateRefreshToken } from './middleware/auth.js';

const router = express.Router();
import { db } from './db.js';
import { sql } from 'drizzle-orm';

// TEMPORARY MIGRATION ROUTE
router.get('/auth/run-migration', async (_req, res) => {
    try {
        await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS app_password TEXT`);
        await db.execute(sql`UPDATE leads SET is_app_active = false`);

        // Bus Management Tables
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS bus_routes (
              id SERIAL PRIMARY KEY,
              organization_id INTEGER NOT NULL REFERENCES organizations(id),
              route_name VARCHAR(100) NOT NULL,
              vehicle_number VARCHAR(50) NOT NULL,
              driver_id INTEGER REFERENCES staff(id),
              helper_name VARCHAR(100),
              helper_phone VARCHAR(20),
              capacity INTEGER,
              start_time VARCHAR(10),
              end_time VARCHAR(10),
              status VARCHAR(20) DEFAULT 'active',
              created_at TIMESTAMP DEFAULT NOW() NOT NULL,
              updated_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS bus_stops (
              id SERIAL PRIMARY KEY,
              route_id INTEGER NOT NULL REFERENCES bus_routes(id),
              stop_name VARCHAR(100) NOT NULL,
              latitude DECIMAL(10, 8),
              longitude DECIMAL(11, 8),
              arrival_time VARCHAR(10),
              pickup_price DECIMAL(10, 2) DEFAULT 0,
              stop_order INTEGER NOT NULL,
              created_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS student_bus_assignments (
              id SERIAL PRIMARY KEY,
              student_id INTEGER NOT NULL REFERENCES leads(id),
              route_id INTEGER NOT NULL REFERENCES bus_routes(id),
              pickup_stop_id INTEGER REFERENCES bus_stops(id),
              drop_stop_id INTEGER REFERENCES bus_stops(id),
              assigned_at TIMESTAMP DEFAULT NOW() NOT NULL
            );
        `);

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS student_trip_status (
              id SERIAL PRIMARY KEY,
              student_id INTEGER NOT NULL REFERENCES leads(id),
              route_id INTEGER NOT NULL REFERENCES bus_routes(id),
              session_id INTEGER,
              status VARCHAR(20) NOT NULL, -- 'boarded', 'dropped', 'pending'
              updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
              date DATE DEFAULT CURRENT_DATE
            );
        `);

        res.send('Migration Success: app_password column added, leads set to inactive, and Bus tables created.');
    } catch (e: any) {
        res.status(500).send('Migration Failed: ' + e.message);
    }
});

// MEDIA UPLOAD ENDPOINT
router.post('/media/upload', express.json({ limit: '50mb' }), async (req: Request, res: Response) => {
    try {
        const { image, folder } = req.body;
        if (!image) return res.status(400).json({ error: 'No image data provided' });

        // Upload to Supabase Storage
        const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const fileName = `${folder || 'activities'}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        const { data, error } = await supabase.storage
            .from('media')
            .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(fileName);

        res.json({ success: true, url: publicUrl });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

/**
 * Mobile login
 * POST /api/mobile/auth/login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
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
        // If all are inactive, then deny login
        const hasActiveAccount = students.some(s => s.is_app_active !== false); // Default to true if null

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
        // Use lead_id as userId for parents (linked to first child)
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
                organizationName: organizationName
            },
            requiresPasswordChange: requiresChange,
            students: students.map(s => ({
                id: s.id,
                name: s.name,
                class: s.class,
                status: s.status
            }))
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
 * POST /api/mobile/auth/change-password
 */
router.post('/auth/change-password', async (req: Request, res: Response) => {
    try {
        const { phone, newPassword } = req.body;

        if (!phone || !newPassword) {
            return res.status(400).json({ error: 'Phone and new password required' });
        }

        // 1. Find leads matching this phone (check both columns)
        // Note: Using explicit quotes for string values in .or filter
        const { data: leads, error: findError } = await supabase
            .from('leads')
            .select('id')
            .or(`parent_phone.eq."${phone}",phone.eq."${phone}"`);

        if (findError) {
            console.error('Error finding user for password change:', findError);
            throw findError;
        }

        if (!leads || leads.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const ids = leads.map(l => l.id);

        // 2. Update password for found IDs
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

// Change password for STAFF (Teachers/Drivers)
router.post('/auth/change-password-staff', async (req, res) => {
    try {
        const { phone, oldPassword, newPassword } = req.body;

        if (!phone || !newPassword) {
            return res.status(400).json({ error: 'Phone and new password are required' });
        }

        // Find staff member
        const { data: staffMembers, error: findError } = await supabase
            .from('staff')
            .select('id, phone, app_password')
            .eq('phone', phone)
            .eq('is_active', true);

        if (findError || !staffMembers || staffMembers.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        const staff = staffMembers[0];

        // Verify old password if provided (or allow defaults)
        if (oldPassword) {
            const isValidOld = staff.app_password
                ? oldPassword === staff.app_password
                : (oldPassword === phone || oldPassword === '1234');

            if (!isValidOld) {
                return res.status(401).json({ error: 'Invalid old password' });
            }
        }

        // Update password
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
 * Refresh token
 * POST /api/mobile/auth/refresh
 */
router.post('/auth/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (error) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        res.json({
            success: true,
            token: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Logout
 * POST /api/mobile/auth/logout
 */
router.post('/auth/logout', async (req: Request, res: Response) => {
    try {
        const { deviceToken } = req.body;

        // Deactivate device token if provided
        if (deviceToken) {
            await supabase
                .from('parent_device_tokens')
                .update({ active: false })
                .eq('device_token', deviceToken);
        }

        await supabase.auth.signOut();

        res.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =====================================================
// TEACHER ENDPOINTS
// =====================================================

/**
 * Teacher Dashboard
 * GET /api/mobile/teacher/dashboard/:staffId
 */
router.get('/teacher/dashboard/:staffId', async (req: Request, res: Response) => {
    try {
        const staffId = parseInt(req.params.staffId);

        // Get teacher info
        const { data: teacher, error: teacherError } = await supabase
            .from('staff')
            .select('id, name, role, organization_id')
            .eq('id', staffId)
            .single();

        if (teacherError || !teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        // Get today's date
        const today = new Date().toISOString().split('T')[0];

        // Get attendance summary for today (for enrolled students in this org)
        const { data: todayAttendance } = await supabase
            .from('student_attendance')
            .select('lead_id, status, check_in_time')
            .eq('organization_id', teacher.organization_id)
            .eq('date', today);

        // Get recent daily updates posted by this teacher
        const { data: recentUpdates } = await supabase
            .from('daily_updates')
            .select('id, lead_id, activity_type, content, posted_at')
            .eq('organization_id', teacher.organization_id)
            .eq('teacher_name', teacher.name)
            .order('posted_at', { ascending: false })
            .limit(10);

        // Get enrolled students for this organization (teacher sees all students)
        const { data: students } = await supabase
            .from('leads')
            .select('id, name, class, parent_phone')
            .eq('organization_id', teacher.organization_id)
            .eq('status', 'enrolled')
            .order('class', { ascending: true });

        res.json({
            teacher: {
                id: teacher.id,
                name: teacher.name,
                role: teacher.role
            },
            todayAttendance: todayAttendance || [],
            recentUpdates: recentUpdates || [],
            students: students || []
        });
    } catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Mark Attendance
 * POST /api/mobile/attendance/mark
 */
router.post('/attendance/mark', async (req: Request, res: Response) => {
    try {
        const { leadId, status, checkInTime, markedBy, organizationId } = req.body;

        if (!leadId || !status || !organizationId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const today = new Date().toISOString().split('T')[0];

        // Check if attendance already exists for today
        const { data: existing } = await supabase
            .from('student_attendance')
            .select('id')
            .eq('lead_id', leadId)
            .eq('date', today)
            .single();

        if (existing) {
            // Update existing
            const { error } = await supabase
                .from('student_attendance')
                .update({
                    status,
                    check_in_time: checkInTime || null,
                    marked_by: markedBy,
                    marked_at: new Date().toISOString()
                })
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            // Create new
            const { error } = await supabase
                .from('student_attendance')
                .insert({
                    organization_id: organizationId,
                    lead_id: leadId,
                    date: today,
                    status,
                    check_in_time: checkInTime || null,
                    marked_by: markedBy,
                    marked_at: new Date().toISOString()
                });

            if (error) throw error;
        }

        res.json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

/**
 * Post Daily Update
 * POST /api/mobile/daily-updates/post
 */
router.post('/daily-updates/post', async (req: Request, res: Response) => {
    try {
        const { leadIds, activityType, content, mediaUrl, teacherName, organizationId } = req.body;

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Lead IDs are required' });
        }

        if (!activityType || !content) {
            return res.status(400).json({ error: 'Activity type and content are required' });
        }

        // Insert daily updates for each student
        const updates = leadIds.map(leadId => ({
            organization_id: organizationId,
            lead_id: leadId,
            activity_type: activityType,
            content,
            media_url: mediaUrl || null,
            teacher_name: teacherName,
            posted_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('daily_updates')
            .insert(updates);

        if (error) throw error;

        res.json({ success: true, message: `Daily update posted for ${leadIds.length} student(s)` });
    } catch (error) {
        console.error('Post daily update error:', error);
        res.status(500).json({ error: 'Failed to post daily update' });
    }
});

// =====================================================
// DRIVER ENDPOINTS
// =====================================================

/**
 * Driver Dashboard
 * GET /api/mobile/driver/dashboard/:staffId
 */
router.get('/driver/dashboard/:staffId', async (req: Request, res: Response) => {
    try {
        const staffId = parseInt(req.params.staffId);

        // Get driver info
        const { data: driver, error: driverError } = await supabase
            .from('staff')
            .select('id, name, phone, organization_id')
            .eq('id', staffId)
            .single();

        if (driverError || !driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Get assigned bus route (assuming driver's name or ID matches bus route assignment)
        const { data: routes } = await supabase
            .from('bus_routes')
            .select('id, route_name, route_number, start_time, end_time')
            .eq('organization_id', driver.organization_id)
            .limit(1); // For now, get first route (can enhance later with driver assignment)

        let assignedRoute = routes && routes.length > 0 ? routes[0] : null;

        // Get students assigned to this route
        let assignedStudents = [];
        if (assignedRoute) {
            const { data: studentAssignments } = await supabase
                .from('student_bus_assignments')
                .select('lead_id, pickup_stop_id, dropoff_stop_id')
                .eq('route_id', assignedRoute.id);

            if (studentAssignments && studentAssignments.length > 0) {
                const leadIds = studentAssignments.map(sa => sa.lead_id);
                const { data: students } = await supabase
                    .from('leads')
                    .select('id, name, class, parent_phone')
                    .in('id', leadIds);

                assignedStudents = students || [];
            }
        }

        res.json({
            driver: {
                id: driver.id,
                name: driver.name,
                phone: driver.phone
            },
            route: assignedRoute,
            assignedStudents
        });
    } catch (error) {
        console.error('Driver dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update Bus Location
 * POST /api/mobile/bus-location/update
 */
router.post('/bus-location/update', async (req: Request, res: Response) => {
    try {
        const { routeId, latitude, longitude, speed, heading } = req.body;

        if (!routeId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store location in bus_location_history
        const { error } = await supabase
            .from('bus_location_history')
            .insert({
                route_id: routeId,
                latitude,
                longitude,
                speed: speed || 0,
                heading: heading || 0,
                recorded_at: new Date().toISOString()
            });

        if (error) throw error;

        res.json({ success: true, message: 'Location updated' });
    } catch (error) {
        console.error('Update bus location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

// =====================================================
// PARENT LIVE DATA ENDPOINTS
// =====================================================

/**
 * Get Child Fees
 * GET /api/mobile/child/:childId/fees
 */
router.get('/child/:childId/fees', async (req: Request, res: Response) => {
    try {
        const childId = parseInt(req.params.childId);

        if (isNaN(childId)) {
            return res.status(400).json({ error: 'Invalid child ID' });
        }

        // 1. Get Child Details (to know class/stream if needed)
        const { data: child, error: childError } = await supabase
            .from('leads')
            .select('id, class, stream, organization_id')
            .eq('id', childId)
            .single();

        if (childError || !child) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // 2. Determine Total Fees
        let totalFees = 0;
        let feeSource = 'default'; // 'emi_plan', 'fee_structure', 'none'

        // Check for EMI Plan (specific to student)
        const { data: emiPlan } = await supabase
            .from('emi_plans')
            .select('total_amount, status')
            .eq('student_id', childId)
            .eq('status', 'active')
            .order('created_at', { ascending: false }) // Get latest active plan
            .limit(1)
            .single();

        if (emiPlan) {
            totalFees = parseFloat(emiPlan.total_amount);
            feeSource = 'emi_plan';
        } else {
            // Fallback to Class/Stream Fee Structure
            // Note: Stream might be null for lower classes
            let query = supabase
                .from('fee_structure')
                .select('total_fees')
                .eq('organization_id', child.organization_id)
                .eq('class', child.class);

            if (child.stream) {
                query = query.eq('stream', child.stream);
            }

            const { data: feeStructure } = await query.limit(1).single();

            if (feeStructure) {
                totalFees = parseFloat(feeStructure.total_fees);
                feeSource = 'fee_structure';
            }
        }

        // 3. Calculate Paid Amount
        const { data: payments } = await supabase
            .from('fee_payments')
            .select('id, amount, payment_date, payment_mode, status, receipt_number')
            .eq('lead_id', childId)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false });

        const paidAmount = (payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const outstandingAmount = Math.max(0, totalFees - paidAmount);

        res.json({
            totalFees,
            paidAmount,
            outstandingAmount,
            currency: 'INR',
            feeSource,
            payments: (payments || []).map(p => ({
                id: p.id,
                amount: parseFloat(p.amount),
                date: p.payment_date,
                mode: p.payment_mode,
                status: p.status,
                receiptNumber: p.receipt_number
            }))
        });

    } catch (error) {
        console.error('Fetch fees error:', error);
        res.status(500).json({ error: 'Failed to fetch fee details' });
    }
});

/**
 * Get Bus Location for Student
 * GET /api/mobile/bus-location/:leadId
 */
router.get('/bus-location/:leadId', async (req: Request, res: Response) => {
    try {
        const leadId = parseInt(req.params.leadId);

        // Find student's bus assignment
        const { data: assignment } = await supabase
            .from('student_bus_assignments')
            .select('route_id')
            .eq('lead_id', leadId)
            .single();

        if (!assignment) {
            return res.json({
                isLive: false,
                message: 'No bus route assigned'
            });
        }

        // Get route info
        const { data: route } = await supabase
            .from('bus_routes')
            .select('route_name, route_number')
            .eq('id', assignment.route_id)
            .single();

        // Get latest location
        const { data: latestLocation } = await supabase
            .from('bus_location_history')
            .select('latitude, longitude, recorded_at')
            .eq('route_id', assignment.route_id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        if (!latestLocation) {
            return res.json({
                isLive: false,
                busNumber: route?.route_number || 'N/A',
                message: 'Bus location not available'
            });
        }

        // Check if location is recent (within last 5 minutes)
        const now = new Date();
        const recordedTime = new Date(latestLocation.recorded_at);
        const diffMinutes = (now.getTime() - recordedTime.getTime()) / (1000 * 60);
        const isLive = diffMinutes < 5;

        res.json({
            isLive,
            busNumber: route?.route_number || 'N/A',
            location: `${latestLocation.latitude}, ${latestLocation.longitude}`,
            lastUpdate: latestLocation.recorded_at,
            eta: '~15 mins' // TODO: Calculate actual ETA based on route
        });
    } catch (error) {
        console.error('Get bus location error:', error);
        res.status(500).json({ error: 'Failed to get bus location' });
    }
});

/**
 * Get Parent Messages
 * GET /api/mobile/parent-messages/:leadId
 */
router.get('/parent-messages/:leadId', async (req: Request, res: Response) => {
    try {
        const leadId = parseInt(req.params.leadId);

        const { data: messages, error } = await supabase
            .from('parent_teacher_messages')
            .select('id, from_name, subject, message, created_at, is_read')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json(messages || []);
    } catch (error) {
        console.error('Get parent messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});


// =====================================================
// BUS TRACKING ENDPOINTS
// =====================================================

/**
 * Get active bus sessions for a route
 * GET /api/mobile/bus/:routeId/active-session
 */
router.get('/bus/:routeId/active-session', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;

        const { data: session, error } = await supabase
            .from('active_bus_sessions')
            .select(`
        *,
        bus_routes(id, route_name, bus_number),
        users(id, name, phone)
      `)
            .eq('route_id', routeId)
            .eq('status', 'active')
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        res.json({ session: session || null });
    } catch (error) {
        console.error('Error fetching active session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get route details with stops
 * GET /api/mobile/bus/:routeId/route
 */
router.get('/bus/:routeId/route', async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;

        const { data: route, error } = await supabase
            .from('bus_routes')
            .select(`
        *,
        bus_stops(
          id,
          stop_name,
          stop_address,
          latitude,
          longitude,
          stop_order,
          estimated_arrival_time
        ),
        users(id, name, phone)
      `)
            .eq('id', routeId)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Route not found' });
        }

        // Sort stops by order
        if (route.bus_stops) {
            route.bus_stops.sort((a: any, b: any) => a.stop_order - b.stop_order);
        }

        res.json({ route });
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get location history for a session
 * GET /api/mobile/bus/session/:sessionId/history
 */
router.get('/bus/session/:sessionId/history', async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;

        const { data: history, error } = await supabase
            .from('bus_location_history')
            .select('latitude, longitude, speed, heading, recorded_at')
            .eq('session_id', sessionId)
            .order('recorded_at', { ascending: true });

        if (error) {
            throw error;
        }

        res.json({ history });
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get student's assigned bus route
 * GET /api/mobile/students/:studentId/bus-assignment
 */
router.get('/students/:studentId/bus-assignment', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        // Perform a join to get necessary details
        const { data: assignments, error } = await supabase
            .from('student_bus_assignments')
            .select(`
                *,
                bus_routes (
                    id, 
                    route_name, 
                    bus_number, 
                    route_type,
                    driver_id,
                    helper_name,
                    helper_phone
                ),
                bus_stops (
                    id, 
                    stop_name, 
                    stop_address, 
                    latitude, 
                    longitude, 
                    estimated_arrival_time
                )
            `)
            .eq('student_id', studentId)
            .eq('active', true);

        if (error) {
            throw error;
        }

        // Manually fetch driver details if needed since nested joins can be complex/limited
        // or if staff table is separate
        const enhancedAssignments = await Promise.all((assignments || []).map(async (assignment) => {
            let driverName = 'Driver';
            let driverPhone = '';

            if (assignment.bus_routes?.driver_id) {
                const { data: driver } = await supabase
                    .from('staff')
                    .select('name, phone')
                    .eq('id', assignment.bus_routes.driver_id)
                    .single();

                if (driver) {
                    driverName = driver.name;
                    driverPhone = driver.phone;
                }
            }

            return {
                ...assignment,
                driver_name: driverName,
                driver_phone: driverPhone
            };
        }));

        res.json({ assignments: enhancedAssignments });
    } catch (error) {
        console.error('Error fetching bus assignment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get Live Bus Location (Parent)
 * GET /api/mobile/parent/bus/:routeId/live-location
 */
router.get('/parent/bus/:routeId/live-location', async (req: Request, res: Response) => {
    try {
        const routeId = parseInt(req.params.routeId);

        // Get recent location history
        const { data: locationHistory } = await supabase
            .from('bus_location_history')
            .select('latitude, longitude, speed, heading, recorded_at')
            .eq('route_id', routeId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

        // Get student status from active session if available
        // We might want to pass studentId to this endpoint if we want specific student status
        // For now, let's keep it generic for the bus

        // Active session check
        const { data: activeSession } = await supabase
            .from('active_bus_sessions')
            .select('id, status')
            .eq('route_id', routeId)
            .eq('status', 'active')
            .single();

        const isLive = !!activeSession && !!locationHistory;

        // Check if data is stale (older than 5 mins)
        if (locationHistory) {
            const lastUpdate = new Date(locationHistory.recorded_at).getTime();
            const now = new Date().getTime();
            if (now - lastUpdate > 5 * 60 * 1000) {
                // isLive = false; // Optional: mark not live if stale
            }
        }

        const responseJson = {
            isLive,
            location: locationHistory ? {
                latitude: locationHistory.latitude,
                longitude: locationHistory.longitude,
                speed: locationHistory.speed,
                heading: locationHistory.heading,
                timestamp: locationHistory.recorded_at
            } : null,
        };

        if (req.query.studentId) {
            const studentId = parseInt(req.query.studentId as string);
            const today = new Date().toISOString().split('T')[0];

            const { data: statusData } = await supabase
                .from('student_trip_status')
                .select('status, updated_at')
                .eq('student_id', studentId)
                .eq('date', today)
                .order('updated_at', { ascending: false }) // Get latest
                .limit(1)
                .single();

            if (statusData) {
                (responseJson as any).studentStatus = statusData.status;
                (responseJson as any).statusTime = statusData.updated_at;
            }
        }

        res.json(responseJson);

    } catch (error) {
        console.error('Error fetching live bus location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =====================================================
// DRIVER ENDPOINTS
// =====================================================

/**
 * Get driver's assigned routes
 * GET /api/mobile/driver/routes
 */
router.get('/driver/routes', async (req: Request, res: Response) => {
    try {
        const userName = req.headers['x-user-name'] as string;

        if (!userName) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Get driver user
        const { data: driver } = await supabase
            .from('users')
            .select('id')
            .eq('email', userName)
            .eq('role', 'driver')
            .single();

        if (!driver) {
            return res.status(403).json({ error: 'Not authorized as driver' });
        }

        const { data: routes, error } = await supabase
            .from('bus_routes')
            .select(`
        *,
        bus_stops(id, stop_name, latitude, longitude, stop_order, estimated_arrival_time)
      `)
            .eq('driver_id', driver.id)
            .eq('active', true)
            .order('route_name');

        if (error) {
            throw error;
        }

        // Sort stops for each route
        routes?.forEach((route: any) => {
            if (route.bus_stops) {
                route.bus_stops.sort((a: any, b: any) => a.stop_order - b.stop_order);
            }
        });

        res.json({ routes });
    } catch (error) {
        console.error('Error fetching driver routes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update Student Trip Status (Boarded/Dropped)
 * POST /api/mobile/driver/student-status
 */
router.post('/driver/student-status', async (req: Request, res: Response) => {
    try {
        const { studentId, sessionId, routeId, status } = req.body;

        if (!studentId || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert or update status for today
        const today = new Date().toISOString().split('T')[0];

        // Check if record exists for today/session
        const { data: existing } = await supabase
            .from('student_trip_status')
            .select('id')
            .eq('student_id', studentId)
            .eq('date', today)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('student_trip_status')
                .update({
                    status,
                    session_id: sessionId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('student_trip_status')
                .insert({
                    student_id: studentId,
                    route_id: routeId,
                    session_id: sessionId,
                    status,
                    date: today,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
        }

        res.json({ success: true, status });
    } catch (error) {
        console.error('Error updating student status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

/**
 * Get driver's trip history
 * GET /api/mobile/driver/history
 */
router.get('/driver/history', async (req: Request, res: Response) => {
    try {
        const userName = req.headers['x-user-name'] as string;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!userName) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { data: driver } = await supabase
            .from('users')
            .select('id')
            .eq('email', userName)
            .single();

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        const { data: sessions, error } = await supabase
            .from('active_bus_sessions')
            .select(`
        *,
        bus_routes(id, route_name, bus_number)
      `)
            .eq('driver_id', driver.id)
            .order('started_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching driver history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =====================================================
// STUDENT & PARENT ENDPOINTS
// =====================================================

/**
 * Get student details
 * GET /api/mobile/students/:studentId
 */
router.get('/students/:studentId', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        const { data: student, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ student });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get student attendance
 * GET /api/mobile/students/:studentId/attendance
 */
router.get('/students/:studentId/attendance', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;

        let query = supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('date', { ascending: false });

        if (month && year) {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
            query = query.gte('date', startDate).lte('date', endDate);
        }

        const { data: attendance, error } = await query;

        if (error) {
            throw error;
        }

        res.json({ attendance });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =====================================================
// NOTIFICATIONS ENDPOINTS
// =====================================================

/**
 * Register device token for push notifications
 * POST /api/mobile/notifications/register-device
 */
router.post('/notifications/register-device', async (req: Request, res: Response) => {
    try {
        const { deviceToken, deviceType, deviceName } = req.body;
        const userName = req.headers['x-user-name'] as string;

        if (!userName || !deviceToken) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', userName)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Upsert device token
        const { error } = await supabase
            .from('parent_device_tokens')
            .upsert({
                user_id: user.id,
                device_token: deviceToken,
                device_type: deviceType,
                device_name: deviceName,
                active: true,
                last_used: new Date().toISOString(),
            }, {
                onConflict: 'device_token',
            });

        if (error) {
            throw error;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error registering device token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get user notifications
 * GET /api/mobile/notifications
 */
router.get('/notifications', async (req: Request, res: Response) => {
    try {
        const userName = req.headers['x-user-name'] as string;
        const limit = parseInt(req.query.limit as string) || 50;

        if (!userName) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', userName)
            .single();

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { data: notifications, error } = await supabase
            .from('mobile_notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('sent_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Mark notification as read
 * PUT /api/mobile/notifications/:notificationId/read
 */
router.put('/notifications/:notificationId/read', async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        const { error } = await supabase
            .from('mobile_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (error) {
            throw error;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// =====================================================
// SCHOOL MANAGEMENT ENDPOINTS (Daily Updates, Homework, etc.)
// =====================================================

/**
 * Get parent's enrolled children from leads table
 * GET /api/mobile/children/:parentEmail
 */
router.get('/children/:parentEmail', async (req: Request, res: Response) => {
    try {
        const { parentEmail } = req.params;

        const { data: children, error } = await supabase
            .from('leads')
            .select('*')
            .eq('email', parentEmail)
            .eq('status', 'enrolled')
            .order('name');

        if (error) throw error;

        res.json({ children });
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get daily updates for a student
 * GET /api/mobile/daily-updates/:leadId
 */
router.get('/daily-updates/:leadId', async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;

        // Get the child's class
        const { data: child } = await supabase
            .from('leads')
            .select('class')
            .eq('id', leadId)
            .single();

        if (!child) {
            return res.status(404).json({ error: 'Child not found' });
        }

        // Get updates for this specific child OR class-wide updates
        const { data: updates, error } = await supabase
            .from('daily_updates')
            .select('*')
            .or(`lead_id.eq.${leadId},and(class_name.eq.${child.class},lead_id.is.null)`)
            .order('posted_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json({ updates });
    } catch (error) {
        console.error('Error fetching daily updates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get homework for a class
 * GET /api/mobile/homework/:class
 */
router.get('/homework/:class', async (req: Request, res: Response) => {
    try {
        const className = req.params.class;
        const today = new Date().toISOString().split('T')[0];

        const { data: homework, error } = await supabase
            .from('preschool_homework')
            .select('*')
            .eq('class_name', className)
            .gte('due_date', today)
            .order('due_date')
            .limit(10);

        if (error) throw error;

        res.json({ homework });
    } catch (error) {
        console.error('Error fetching homework:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get attendance history for a student
 * GET /api/mobile/attendance/:leadId
 */
router.get('/attendance/:leadId', async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;
        const days = parseInt(req.query.days as string) || 30;

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - days);
        const dateStr = daysAgo.toISOString().split('T')[0];

        const { data: attendance, error } = await supabase
            .from('student_attendance')
            .select('*')
            .eq('lead_id', leadId)
            .gte('date', dateStr)
            .order('date', { ascending: false });

        if (error) throw error;

        res.json({ attendance });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get today's attendance for a student
 * GET /api/mobile/today-attendance/:leadId
 */
router.get('/today-attendance/:leadId', async (req: Request, res: Response) => {
    try {
        const { leadId } = req.params;
        const today = new Date().toISOString().split('T')[0];

        const { data: attendance, error } = await supabase
            .from('student_attendance')
            .select('*')
            .eq('lead_id', leadId)
            .eq('date', today)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({ attendance: attendance || null });
    } catch (error) {
        console.error('Error fetching today attendance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get recent announcements
 * GET /api/mobile/announcements
 */
router.get('/announcements', async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.query;

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        const now = new Date().toISOString();

        const { data: announcements, error } = await supabase
            .from('preschool_announcements')
            .select('*')
            .eq('organization_id', organizationId)
            .or(`expires_at.is.null,expires_at.gt."${now}"`)
            .order('published_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.json({ announcements });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get upcoming events
 * GET /api/mobile/events
 */
router.get('/events', async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.query;
        const today = new Date().toISOString().split('T')[0];

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID required' });
        }

        const { data: events, error } = await supabase
            .from('preschool_events')
            .select('*')
            .eq('organization_id', organizationId)
            .gte('event_date', today)
            .order('event_date')
            .limit(10);

        if (error) throw error;

        res.json({ events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

