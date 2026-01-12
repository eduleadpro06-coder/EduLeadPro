
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, Plus, Trash2, Calendar, User, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function TaskManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedStaffId, setSelectedStaffId] = useState("");

    // Fetch Tasks
    const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<any[]>({
        queryKey: ['/api/admin/tasks'],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/admin/tasks");
            return res.json();
        }
    });

    // Fetch Teachers for dropdown
    const { data: allStaff = [] } = useQuery<any[]>({
        queryKey: ['/api/staff'],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/staff");
            return res.json();
        }
    });

    const teachers = allStaff.filter(staff =>
        staff.role?.toLowerCase().includes('teacher') && staff.isActive
    );

    // Create Task Mutation
    const createTaskMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/admin/tasks", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
            setIsCreateDialogOpen(false);
            resetForm();
            toast({ title: "Success", description: "Task assigned successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to assign task",
                variant: "destructive"
            });
        }
    });

    // Delete Task Mutation
    const deleteTaskMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/admin/tasks/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
            toast({ title: "Deleted", description: "Task removed" });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
        }
    });

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDueDate("");
        setSelectedStaffId("");
    };

    const handleCreateTask = () => {
        if (!selectedStaffId || !title) {
            toast({
                title: "Validation Error",
                description: "Please select a teacher and enter a task title",
                variant: "destructive"
            });
            return;
        }

        createTaskMutation.mutate({
            staffId: parseInt(selectedStaffId),
            title,
            description,
            dueDate: dueDate || null
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Teacher Tasks</h2>
                    <p className="text-sm text-gray-500">Assign and track tasks for teachers</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#643ae5] hover:bg-[#552dbf]">
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Task
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task Title</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingTasks ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2 text-gray-500">Loading tasks...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="bg-gray-100 p-3 rounded-full">
                                            <Calendar className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <p className="font-medium">No tasks found</p>
                                        <p className="text-sm">Assign a task to a teacher to get started.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">
                                        <div>{task.title}</div>
                                        {task.description && (
                                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                                                {task.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-700 font-medium">
                                                {task.staff?.name?.charAt(0) || 'T'}
                                            </div>
                                            <div className="text-sm">
                                                <div className="font-medium">{task.staff?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-400">{task.staff?.department || 'Staff'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {task.due_date ? (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <Calendar className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                                {format(new Date(task.due_date), "MMM d, yyyy")}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {task.is_completed ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Completed
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-50">
                                                <Clock className="w-3 h-3 mr-1" /> Pending
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                        {format(new Date(task.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this task?")) {
                                                    deleteTaskMutation.mutate(task.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Task Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Assign To <span className="text-red-500">*</span></Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.length === 0 ? (
                                        <div className="p-2 text-sm text-gray-500 text-center">No active teachers found</div>
                                    ) : (
                                        teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                {teacher.name} ({teacher.department || 'General'})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Task Title <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. Preparing Report Cards"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Add specific details about the task..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreateTask}
                            disabled={createTaskMutation.isPending || !selectedStaffId || !title}
                            className="bg-[#643ae5] hover:bg-[#552dbf]"
                        >
                            {createTaskMutation.isPending ? "Assigning..." : "Assign Task"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
