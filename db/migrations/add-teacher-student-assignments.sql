-- Teacher-Student Assignment System
-- Allows assigning teachers to individual students
-- Teachers will only see their assigned students in mobile app

CREATE TABLE IF NOT EXISTS teacher_student_assignments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    teacher_staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    student_lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, teacher_staff_id, student_lead_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_student_assignments(teacher_staff_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_student ON teacher_student_assignments(student_lead_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_org ON teacher_student_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_lookup ON teacher_student_assignments(organization_id, teacher_staff_id);

-- Comments for documentation
COMMENT ON TABLE teacher_student_assignments IS 'Maps teachers to specific students they are responsible for';
COMMENT ON COLUMN teacher_student_assignments.teacher_staff_id IS 'Staff member with role=teacher';
COMMENT ON COLUMN teacher_student_assignments.student_lead_id IS 'Student (lead) assigned to teacher';
COMMENT ON COLUMN teacher_student_assignments.assigned_by IS 'Admin who created the assignment';
