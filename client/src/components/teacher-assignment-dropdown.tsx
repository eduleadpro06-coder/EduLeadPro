import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TeacherAssignmentDropdownProps {
    leadId: number;
}

export function TeacherAssignmentDropdown({ leadId }: TeacherAssignmentDropdownProps) {
    const { toast } = useToast();
    const [selectedTeacher, setSelectedTeacher] = useState<string>('');

    // Fetch all teachers
    const { data: allStaff = [] } = useQuery<any[]>({
        queryKey: ['/api/staff']
    });

    const teachers = allStaff.filter(staff =>
        staff.role?.toLowerCase().includes('teacher') && (staff.isActive !== false)
    );

    // Fetch current assignment for this student
    const { data: assignments, isLoading } = useQuery<any[]>({
        queryKey: [`/api/v1/mobile/teacher-assignments/student/${leadId}`],
        enabled: !!leadId
    });

    // Set default selected teacher when data loads
    useEffect(() => {
        if (assignments && assignments.length > 0) {
            setSelectedTeacher(String(assignments[0].teacher_staff_id));
        } else {
            setSelectedTeacher('');
        }
    }, [assignments]);

    // Create assignment mutation
    const createAssignment = useMutation({
        mutationFn: async (teacherStaffId: number) => {
            const res = await apiRequest('POST', '/api/v1/mobile/teacher-assignments', {
                teacherStaffId,
                studentLeadId: leadId
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/v1/mobile/teacher-assignments/student/${leadId}`] });
            toast({
                title: 'Success',
                description: 'Teacher assigned successfully'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to assign teacher',
                variant: 'destructive'
            });
        }
    });

    // Delete assignment mutation
    const deleteAssignment = useMutation({
        mutationFn: async (assignmentId: number) => {
            await apiRequest('DELETE', `/api/v1/mobile/teacher-assignments/${assignmentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/v1/mobile/teacher-assignments/student/${leadId}`] });
            toast({
                title: 'Success',
                description: 'Teacher assignment removed'
            });
        }
    });

    const handleTeacherChange = async (value: string) => {
        setSelectedTeacher(value);

        if (value === '' || value === 'unassign') {
            // Remove assignment
            if (assignments && assignments.length > 0) {
                await deleteAssignment.mutateAsync(assignments[0].id);
            }
            setSelectedTeacher('');
        } else {
            // Check if already assigned to remove old one first
            if (assignments && assignments.length > 0) {
                await deleteAssignment.mutateAsync(assignments[0].id);
            }
            // Create new assignment
            await createAssignment.mutateAsync(parseInt(value));
        }
    };

    if (isLoading) {
        return <Badge variant="secondary">Loading...</Badge>;
    }

    return (
        <Select value={selectedTeacher} onValueChange={handleTeacherChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="No teacher" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassign">
                    <span className="text-gray-500">No teacher</span>
                </SelectItem>
                {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={String(teacher.id)}>
                        {teacher.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
