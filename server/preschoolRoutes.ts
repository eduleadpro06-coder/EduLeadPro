// Preschool Mobile APIs - Daily Updates, Homework, Attendance
import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from './db';

const router = Router();

// =====================================================
// DAILY UPDATES - Parent & Teacher
// =====================================================

// Get daily updates feed for parent
router.get('/daily-updates/feed', async (req: Request, res: Response) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        // Get parent's children
        const children = await db.query(
            `SELECT id, name, class_id FROM students 
       WHERE parent_email = (SELECT email FROM users WHERE id = $1)`,
            [userId]
        );

        if (children.rows.length === 0) {
            return res.json({ updates: [] });
        }

        const studentIds = children.rows.map((c: any) => c.id);
        const classIds = children.rows.map((c: any) => c.class_id);

        // Get updates for child's class or individual child
        const updates = await db.query(
            `SELECT 
        du.id,
        du.title,
        du.content,
        du.media_urls,
        du.activity_type,
        du.mood,
        du.posted_at,
        du.student_id,
        t.name as teacher_name,
        c.name as class_name,
        c.section,
        CASE 
          WHEN du.student_id IS NULL THEN 'class'
          ELSE 'individual'
        END as update_type
      FROM daily_updates du
      JOIN users t ON du.teacher_id = t.id
      JOIN classes c ON du.class_id = c.id
      WHERE (du.student_id = ANY($1) OR (du.student_id IS NULL AND du.class_id = ANY($2)))
        AND du.posted_at >= NOW() - INTERVAL '7 days'
      ORDER BY du.posted_at DESC
      LIMIT 50`,
            [studentIds, classIds]
        );

        res.json({
            success: true,
            updates: updates.rows,
            children: children.rows
        });
    } catch (error) {
        console.error('Error fetching daily updates:', error);
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

// Get updates for a specific class (Teacher view)
router.get('/daily-updates/class/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;

        const updates = await db.query(
            `SELECT 
        du.id,
        du.title,
        du.content,
        du.media_urls,
        du.activity_type,
        du.mood,
        du.posted_at,
        du.student_id,
        s.name as student_name,
        t.name as teacher_name
      FROM daily_updates du
      JOIN users t ON du.teacher_id = t.id
      LEFT JOIN students s ON du.student_id = s.id
      WHERE du.class_id = $1
        AND du.posted_at >= NOW() - INTERVAL '30 days'
      ORDER BY du.posted_at DESC`,
            [classId]
        );

        res.json({ success: true, updates: updates.rows });
    } catch (error) {
        console.error('Error fetching class updates:', error);
        res.status(500).json({ error: 'Failed to fetch updates' });
    }
});

// Post daily update (Teacher)
router.post('/daily-updates', async (req: Request, res: Response) => {
    try {
        const {
            teacherId,
            classId,
            studentId,
            title,
            content,
            activityType,
            mood,
            mediaUrls
        } = req.body;

        if (!teacherId || !classId || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get organization_id from teacher
        const teacher = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [teacherId]
        );

        if (teacher.rows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const orgId = teacher.rows[0].organization_id;

        const result = await db.query(
            `INSERT INTO daily_updates 
        (organization_id, class_id, student_id, teacher_id, title, content, activity_type, mood, media_urls)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
            [orgId, classId, studentId || null, teacherId, title, content, activityType, mood, mediaUrls || []]
        );

        res.json({ success: true, update: result.rows[0] });
    } catch (error) {
        console.error('Error creating daily update:', error);
        res.status(500).json({ error: 'Failed to create update' });
    }
});

// =====================================================
// HOMEWORK - Parent & Teacher
// =====================================================

// Get homework for parent's children
router.get('/homework/parent/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const homework = await db.query(
            `SELECT 
        h.id,
        h.subject,
        h.title,
        h.description,
        h.media_urls,
        h.due_date,
        h.posted_at,
        c.name as class_name,
        c.section,
        t.name as teacher_name,
        s.id as student_id,
        s.name as student_name,
        hs.id as submission_id,
        hs.status as submission_status,
        hs.submitted_at
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN homework h ON h.class_id = c.id
      JOIN users t ON h.teacher_id = t.id
      LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id = s.id
      WHERE s.parent_email = (SELECT email FROM users WHERE id = $1)
        AND h.due_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY h.due_date ASC`,
            [userId]
        );

        res.json({ success: true, homework: homework.rows });
    } catch (error) {
        console.error('Error fetching homework:', error);
        res.status(500).json({ error: 'Failed to fetch homework' });
    }
});

// Get homework for class (Teacher view)
router.get('/homework/class/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;

        const homework = await db.query(
            `SELECT 
        h.id,
        h.subject,
        h.title,
        h.description,
        h.media_urls,
        h.due_date,
        h.posted_at,
        COUNT(hs.id) as submissions_count,
        COUNT(CASE WHEN hs.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN hs.status = 'reviewed' THEN 1 END) as reviewed_count
      FROM homework h
      LEFT JOIN homework_submissions hs ON hs.homework_id = h.id
      WHERE h.class_id = $1
      GROUP BY h.id
      ORDER BY h.posted_at DESC`,
            [classId]
        );

        res.json({ success: true, homework: homework.rows });
    } catch (error) {
        console.error('Error fetching class homework:', error);
        res.status(500).json({ error: 'Failed to fetch homework' });
    }
});

// Create homework (Teacher)
router.post('/homework', async (req: Request, res: Response) => {
    try {
        const { teacherId, classId, subject, title, description, dueDate, mediaUrls } = req.body;

        if (!teacherId || !classId || !title) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const teacher = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [teacherId]
        );

        if (teacher.rows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const orgId = teacher.rows[0].organization_id;

        const result = await db.query(
            `INSERT INTO homework 
        (organization_id, class_id, teacher_id, subject, title, description, due_date, media_urls)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [orgId, classId, teacherId, subject, title, description, dueDate, mediaUrls || []]
        );

        res.json({ success: true, homework: result.rows[0] });
    } catch (error) {
        console.error('Error creating homework:', error);
        res.status(500).json({ error: 'Failed to create homework' });
    }
});

// =====================================================
// ATTENDANCE - Parent & Teacher
// =====================================================

// Get attendance for parent's children (last 30 days)
router.get('/attendance/parent/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const attendance = await db.query(
            `SELECT 
        s.id as student_id,
        s.name as student_name,
        a.date,
        a.status,
        a.notes,
        a.marked_at
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id 
        AND a.date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE s.parent_email = (SELECT email FROM users WHERE id = $1)
      ORDER BY s.name, a.date DESC`,
            [userId]
        );

        // Calculate stats
        const stats: any = {};
        attendance.rows.forEach((record: any) => {
            if (!stats[record.student_id]) {
                stats[record.student_id] = {
                    studentName: record.student_name,
                    present: 0,
                    absent: 0,
                    total: 0
                };
            }
            if (record.status) {
                stats[record.student_id].total++;
                if (record.status === 'present') stats[record.student_id].present++;
                if (record.status === 'absent') stats[record.student_id].absent++;
            }
        });

        res.json({
            success: true,
            attendance: attendance.rows,
            stats: Object.values(stats)
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Mark attendance (Teacher)
router.post('/attendance/mark', async (req: Request, res: Response) => {
    try {
        const { teacherId, classId, date, attendanceRecords } = req.body;
        // attendanceRecords: [{studentId, status, notes}]

        if (!teacherId || !classId || !date || !attendanceRecords) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const teacher = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [teacherId]
        );

        if (teacher.rows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const orgId = teacher.rows[0].organization_id;

        // Bulk insert/update attendance
        const values: any[] = [];
        const placeholders: string[] = [];
        let paramIndex = 5; // Starting after org_id, class_id, date, teacher_id

        attendanceRecords.forEach((record: any, index: number) => {
            values.push(record.studentId, record.status, record.notes || null);
            placeholders.push(`($1, $2, $${paramIndex}, $3, $4, $${paramIndex + 1}, $${paramIndex + 2})`);
            paramIndex += 3;
        });

        const query = `
      INSERT INTO attendance 
        (organization_id, class_id, student_id, date, marked_by, status, notes)
      VALUES ${placeholders.join(', ')}
      ON CONFLICT (student_id, date) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        marked_by = EXCLUDED.marked_by,
        marked_at = NOW()
      RETURNING *
    `;

        const result = await db.query(query, [orgId, classId, date, teacherId, ...values]);

        res.json({ success: true, records: result.rows });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

// =====================================================
// ANNOUNCEMENTS
// =====================================================

// Get announcements for parent
router.get('/announcements/parent/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Get parent's organization
        const user = await db.query(
            'SELECT organization_id FROM users WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const orgId = user.rows[0].organization_id;

        const announcements = await db.query(
            `SELECT 
        a.id,
        a.title,
        a.content,
        a.media_url,
        a.priority,
        a.published_at,
        u.name as created_by_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
      WHERE a.organization_id = $1
        AND 'parent' = ANY(a.target_roles)
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      ORDER BY a.published_at DESC
      LIMIT 20`,
            [orgId]
        );

        res.json({ success: true, announcements: announcements.rows });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

// =====================================================
// TEACHER DASHBOARD
// =====================================================

// Get teacher's classes and students
router.get('/teacher/dashboard/:teacherId', async (req: Request, res: Response) => {
    try {
        const { teacherId } = req.params;

        // Get teacher's classes
        const classes = await db.query(
            `SELECT 
        c.id,
        c.name,
        c.section,
        c.capacity,
        c.is_class_teacher,
        ta.subject,
        COUNT(s.id) as student_count
      FROM teacher_assignments ta
      JOIN classes c ON ta.class_id = c.id
      LEFT JOIN students s ON s.class_id = c.id
      WHERE ta.teacher_id = $1
      GROUP BY c.id, c.name, c.section, c.capacity, c.is_class_teacher, ta.subject
      ORDER BY c.name, c.section`,
            [teacherId]
        );

        // Get today's attendance stats
        const attendanceToday = await db.query(
            `SELECT 
        c.id as class_id,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(a.id) as total_marked
      FROM classes c
      JOIN teacher_assignments ta ON ta.class_id = c.id
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = CURRENT_DATE
      WHERE ta.teacher_id = $1
      GROUP BY c.id`,
            [teacherId]
        );

        res.json({
            success: true,
            classes: classes.rows,
            attendanceToday: attendanceToday.rows
        });
    } catch (error) {
        console.error('Error fetching teacher dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// Get students in teacher's class
router.get('/teacher/students/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;

        const students = await db.query(
            `SELECT 
        s.id,
        s.name,
        s.parent_name,
        s.parent_email,
        s.phone,
        sp.photo_url,
        sp.blood_group,
        a.status as today_status
      FROM students s
      LEFT JOIN student_profiles sp ON sp.student_id = s.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = CURRENT_DATE
      WHERE s.class_id = $1
      ORDER BY s.name`,
            [classId]
        );

        res.json({ success: true, students: students.rows });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

export default router;
