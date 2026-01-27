import { Router } from 'express';
import { jwtMiddleware, roleGuard } from '../../middleware/auth.js';
import { storage } from '../../storage.js';

const router = Router();

// Hybrid Authentication Middleware
// Supports both JWT (Mobile) and Session/Header (Web Admin)
const ensureAdminAuth = async (req: any, res: any, next: any) => {
    // 1. Try JWT (Mobile Request)
    if (req.headers.authorization?.startsWith('Bearer ')) {
        return jwtMiddleware(req, res, (err) => {
            if (err) return next(err);
            // Check role after JWT auth
            if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
                return res.status(403).json({ error: 'Access denied' });
            }
            next();
        });
    }

    // 2. Try Header/Session (Web Admin Request)
    try {
        // Check for x-user-name header which Web Admin sends
        const username = req.headers['x-user-name'];

        if (username) {
            const user = await storage.getUserByUsername(username as string);
            if (user) {
                req.user = {
                    userId: user.id,
                    username: user.username,
                    role: user.role,
                    organizationId: user.organizationId
                };

                // Allow admin/super_admin or teacher (teachers can view their own assignments)
                // But for management actions, we restrict to admin usually.
                // However, let's allow basic access and routes can check further if needed.
                // For now, mirroring the roleGuard(['admin', 'super_admin'])
                // Correction: Teachers might need to hit some endpoints too? 
                // The original code restricted entire router to admin/super_admin.

                if (user.role === 'admin' || user.role === 'super_admin') {
                    return next();
                }
            }
        }

        // If we get here, neither auth method worked
        return res.status(401).json({
            success: false,
            error: {
                code: 'NO_TOKEN',
                message: 'Authorization token or session required'
            }
        });

    } catch (error) {
        console.error("Auth error:", error);
        return res.status(500).json({ error: "Authentication failed" });
    }
};

// Apply hybrid auth to all routes
router.use(ensureAdminAuth);

// Get all teacher assignments for organization
router.get('/', async (req, res) => {
    try {
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { data, error } = await supabase
            .from('teacher_student_assignments')
            .select(`
                id,
                teacher_staff_id,
                student_lead_id,
                assigned_at,
                assigned_by,
                notes,
                teacher:staff!teacher_staff_id(id, name, email),
                student:leads!student_lead_id(id, name, father_first_name, father_last_name, father_phone, mother_first_name, mother_last_name, mother_phone, class, stream)
            `)
            .eq('organization_id', organizationId)
            .order('assigned_at', { ascending: false });

        if (error) throw error;

        // Clean up response to match frontend expectations
        const mappedData = (data || []).map((assignment: any) => {
            if (assignment.student) {
                const s = assignment.student;
                // Construct parent_name
                let parentName = '';
                if (s.father_first_name) {
                    parentName = `${s.father_first_name} ${s.father_last_name || ''}`.trim();
                } else if (s.mother_first_name) {
                    parentName = `${s.mother_first_name} ${s.mother_last_name || ''}`.trim();
                }

                // Construct parent_phone if needed (though usually separate field)
                // Assuming frontend expects it in parent_name for display or parent_phone

                return {
                    ...assignment,
                    student: {
                        ...s,
                        parent_name: parentName || 'N/A'
                    }
                };
            }
            return assignment;
        });

        res.json(mappedData);
    } catch (error: any) {
        console.error('Error fetching teacher assignments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get students assigned to a specific teacher
router.get('/teacher/:staffId', async (req, res) => {
    try {
        const { staffId } = req.params;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { data, error } = await supabase
            .from('teacher_student_assignments')
            .select(`
                id,
                student_lead_id,
                assigned_at,
                student:leads!student_lead_id(*)
            `)
            .eq('organization_id', organizationId)
            .eq('teacher_staff_id', parseInt(staffId));

        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('Error fetching teacher students:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get teachers assigned to a specific student
router.get('/student/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { data, error } = await supabase
            .from('teacher_student_assignments')
            .select(`
                id,
                teacher_staff_id,
                assigned_at,
                teacher:staff!teacher_staff_id(id, name, email, role)
            `)
            .eq('organization_id', organizationId)
            .eq('student_lead_id', parseInt(leadId));

        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('Error fetching student teachers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new teacher-student assignment
router.post('/', async (req, res) => {
    try {
        const { teacherStaffId, studentLeadId, notes } = req.body;
        const organizationId = req.user!.organizationId;
        const assignedBy = req.user!.username;

        if (!teacherStaffId || !studentLeadId) {
            return res.status(400).json({ error: 'Teacher and student IDs are required' });
        }

        const { supabase } = await import('../../supabase.js');

        // Verify teacher belongs to organization and has teacher role
        // Also ensure role checking is case-insensitive
        const { data: teacher, error: teacherError } = await supabase
            .from('staff')
            .select('id, role')
            .eq('id', teacherStaffId)
            .eq('organization_id', organizationId)
            .single();

        // Note: Some systems might use 'Teacher' or 'teacher', checking strictly might be issue.
        // But previously we filtered by 'teacher' role in UI.
        if (teacherError || !teacher || !teacher.role.toLowerCase().includes('teacher')) {
            return res.status(400).json({ error: 'Invalid teacher ID or not a teacher role' });
        }

        // Verify student belongs to organization
        const { data: student, error: studentError } = await supabase
            .from('leads')
            .select('id')
            .eq('id', studentLeadId)
            .eq('organization_id', organizationId)
            .single();

        if (studentError || !student) {
            return res.status(400).json({ error: 'Invalid student ID' });
        }

        const { data, error } = await supabase
            .from('teacher_student_assignments')
            .insert({
                organization_id: organizationId,
                teacher_staff_id: teacherStaffId,
                student_lead_id: studentLeadId,
                assigned_by: assignedBy,
                notes
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return res.status(400).json({ error: 'This teacher is already assigned to this student' });
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (error: any) {
        console.error('Error creating teacher assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete teacher-student assignment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = req.user!.organizationId;

        const { supabase } = await import('../../supabase.js');

        const { error } = await supabase
            .from('teacher_student_assignments')
            .delete()
            .eq('id', parseInt(id))
            .eq('organization_id', organizationId);

        if (error) throw error;

        res.json({ message: 'Assignment deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting teacher assignment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk assign teacher to multiple students
router.post('/bulk', async (req, res) => {
    try {
        const { teacherStaffId, studentLeadIds, notes } = req.body;
        const organizationId = req.user!.organizationId;
        const assignedBy = req.user!.username;

        if (!teacherStaffId || !studentLeadIds || !Array.isArray(studentLeadIds)) {
            return res.status(400).json({ error: 'Teacher ID and array of student IDs required' });
        }

        const { supabase } = await import('../../supabase.js');

        const assignments = studentLeadIds.map(studentLeadId => ({
            organization_id: organizationId,
            teacher_staff_id: teacherStaffId,
            student_lead_id: studentLeadId,
            assigned_by: assignedBy,
            notes
        }));

        const { data, error } = await supabase
            .from('teacher_student_assignments')
            .insert(assignments)
            .select();

        if (error) throw error;

        res.status(201).json({ message: `${data.length} assignments created`, data });
    } catch (error: any) {
        console.error('Error creating bulk assignments:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
