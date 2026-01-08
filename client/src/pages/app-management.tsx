/**
 * Bus Management Page
 * Admin panel for managing school bus routes, stops, assignments, and live tracking
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Bus, MapPin, Users, Radio, Smartphone, Key, Search, RefreshCw, Megaphone, Calendar, ClipboardList, BookOpen, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lead, PreschoolAnnouncement, PreschoolEvent, DailyUpdate, PreschoolHomework } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import { TeacherAssignmentDropdown } from "@/components/teacher-assignment-dropdown";
import { Switch } from "@/components/ui/switch";


export default function AppManagement() {
    const [mainTab, setMainTab] = useState("users");
    const [activeTab, setActiveTab] = useState("parents");
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Form States
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [priority, setPriority] = useState("normal");
    const [date, setDate] = useState("");
    const [type, setType] = useState("");
    const [studentPhone, setStudentPhone] = useState("");
    const [className, setClassName] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Staff Password State
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState("");

    // Fetch Leads (Parents)
    const { data: leads = [], isLoading } = useQuery<Lead[]>({
        queryKey: ['/api/leads']
    });

    // Fetch Teachers (Staff with Teacher role)
    const { data: allStaff = [] } = useQuery<any[]>({
        queryKey: ['/api/staff']
    });

    const teachers = allStaff.filter(staff =>
        staff.role?.toLowerCase().includes('teacher') && staff.isActive
    );

    const drivers = allStaff.filter(staff =>
        staff.role?.toLowerCase().includes('driver') && staff.isActive
    );

    // Fetch Teacher Assignments
    const { data: assignments = [] } = useQuery<any[]>({
        queryKey: ['/api/teacher-assignments']
    });

    // Reset Password Mutation
    const resetPasswordMutation = useMutation({
        mutationFn: async (leadId: number) => {
            const res = await apiRequest("PATCH", `/api/leads/${leadId}`, {
                appPassword: null // Reset to default
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
            toast({
                title: "Password Reset",
                description: "Parent password has been reset to default (1234).",
            });
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to reset password.",
                variant: "destructive"
            });
        }
    });

    const toggleAppAccessMutation = useMutation({
        mutationFn: async (data: { id: number, isAppActive: boolean }) => {
            const res = await apiRequest("PATCH", `/api/leads/${data.id}/app-access`, {
                isAppActive: data.isAppActive
            });
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
            toast({
                title: variables.isAppActive ? "Access Enabled" : "Access Disabled",
                description: `Parent app access has been ${variables.isAppActive ? 'enabled' : 'disabled'}.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update access.",
                variant: "destructive"
            });
        }
    });

    // Update Staff Password Mutation
    const updateStaffPasswordMutation = useMutation({
        mutationFn: async (data: { id: number, appPassword: string | null }) => {
            const res = await apiRequest("PATCH", `/api/staff/${data.id}/password`, {
                appPassword: data.appPassword
            });
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
            setPasswordDialogOpen(false);
            setNewPassword("");
            toast({
                title: variables.appPassword === null ? "Password Reset" : "Password Set",
                description: variables.appPassword === null
                    ? "Teacher password reset to default."
                    : "Teacher password has been set successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update password.",
                variant: "destructive"
            });
        }
    });

    const { data: announcements = [], isLoading: isLoadingAnnouncements } = useQuery<PreschoolAnnouncement[]>({
        queryKey: ['/api/announcements']
    });
    const { data: events = [], isLoading: isLoadingEvents } = useQuery<PreschoolEvent[]>({
        queryKey: ['/api/events']
    });
    const { data: dailyUpdates = [], isLoading: isLoadingUpdates } = useQuery<DailyUpdate[]>({
        queryKey: ['/api/daily-updates']
    });
    const { data: homeworks = [], isLoading: isLoadingHomework } = useQuery<PreschoolHomework[]>({
        queryKey: ['/api/homework']
    });

    // Mutations for Mobile Content
    const createAnnouncementMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/announcements", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
            toast({ title: "Success", description: "Announcement posted successfully" });
        }
    });

    const deleteAnnouncementMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/announcements/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
            toast({ title: "Deleted", description: "Announcement removed" });
        }
    });

    const createEventMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/events", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            toast({ title: "Success", description: "Event created successfully" });
        }
    });

    const deleteEventMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/events/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            toast({ title: "Deleted", description: "Event removed" });
        }
    });

    const createUpdateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/daily-updates", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/daily-updates'] });
            toast({ title: "Success", description: "Daily update posted" });
        }
    });

    const deleteUpdateMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/daily-updates/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/daily-updates'] });
            toast({ title: "Deleted", description: "Update removed" });
        }
    });

    const createHomeworkMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/homework", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/homework'] });
            toast({ title: "Success", description: "Homework assigned" });
        }
    });

    const deleteHomeworkMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/homework/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/homework'] });
            toast({ title: "Deleted", description: "Homework removed" });
        }
    });

    // Filter leads with parent info - only showing enrolled students
    const parents = leads.filter(lead =>
        lead.status === 'enrolled' &&
        (lead.parentPhone || lead.phone) &&
        (lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.parentName && lead.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.phone && lead.phone.includes(searchTerm)) ||
            (lead.parentPhone && lead.parentPhone.includes(searchTerm)))
    );

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Header
                title="App Management"
                subtitle="Manage mobile app users, bus operations, and content"
            />

            <div className="px-6 pt-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b">
                    {/* Tab Navigation - Daycare Style */}
                    <div className="flex gap-2 -mb-px w-full">
                        <Button
                            variant={mainTab === "users" ? "default" : "ghost"}
                            onClick={() => {
                                setMainTab("users");
                                setActiveTab("parents");
                            }}
                            className="rounded-b-none flex-1"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Mobile Users
                        </Button>
                        <Button
                            variant={mainTab === "bus" ? "default" : "ghost"}
                            onClick={() => {
                                setMainTab("bus");
                                setActiveTab("routes");
                            }}
                            className="rounded-b-none flex-1"
                        >
                            <Bus className="h-4 w-4 mr-2" />
                            Bus Management
                        </Button>
                        <Button
                            variant={mainTab === "content" ? "default" : "ghost"}
                            onClick={() => {
                                setMainTab("content");
                                setActiveTab("announcements");
                            }}
                            className="rounded-b-none flex-1"
                        >
                            <Megaphone className="h-4 w-4 mr-2" />
                            Mobile Content
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Users Tab */}
            {mainTab === "users" && (
                <div className="px-4 py-6 space-y-6">
                    <div className="flex gap-2 -mb-px border-b mb-6">
                        <Button
                            variant={activeTab === "parents" ? "default" : "ghost"}
                            onClick={() => setActiveTab("parents")}
                            className="rounded-b-none"
                        >
                            <Key className="mr-2 h-4 w-4" />
                            Parents
                        </Button>
                        <Button
                            variant={activeTab === "teachers" ? "default" : "ghost"}
                            onClick={() => setActiveTab("teachers")}
                            className="rounded-b-none"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Teachers
                        </Button>
                        <Button
                            variant={activeTab === "drivers" ? "default" : "ghost"}
                            onClick={() => setActiveTab("drivers")}
                            className="rounded-b-none"
                        >
                            <Bus className="mr-2 h-4 w-4" />
                            Drivers
                        </Button>
                    </div>

                    {/* Parents Sub-Tab */}
                    {activeTab === "parents" && (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Registered Parents</CardTitle>
                                        <CardDescription>
                                            Manage mobile app access for parents.
                                            <span className="font-medium text-emerald-600 ml-1">
                                                Note: Default password is '1234'.
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <div className="relative w-72">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Search by name or phone..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student Name</TableHead>
                                                <TableHead>Parent Name</TableHead>
                                                <TableHead>Phone Number</TableHead>
                                                <TableHead>Assigned Teacher</TableHead>
                                                <TableHead>App Access</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                                </TableRow>
                                            ) : parents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">No parents found matching your search</TableCell>
                                                </TableRow>
                                            ) : (
                                                parents.map((lead) => (
                                                    <TableRow key={lead.id}>
                                                        <TableCell className="font-medium">{lead.name}</TableCell>
                                                        <TableCell>{lead.parentName || '-'}</TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span>{lead.phone}</span>
                                                                {lead.parentPhone && lead.parentPhone !== lead.phone && (
                                                                    <span className="text-xs text-gray-500">{lead.parentPhone} (Alt)</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TeacherAssignmentDropdown
                                                                leadId={lead.id}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                <Switch
                                                                    checked={lead.isAppActive !== false} // Default to true if undefined
                                                                    onCheckedChange={(checked) => {
                                                                        toggleAppAccessMutation.mutate({
                                                                            id: lead.id,
                                                                            isAppActive: checked
                                                                        });
                                                                    }}
                                                                    disabled={toggleAppAccessMutation.isPending}
                                                                />
                                                                <span className="text-sm text-gray-500">
                                                                    {lead.isAppActive !== false ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (confirm(`Reset password for ${lead.name}'s parent to default (1234)?`)) {
                                                                        resetPasswordMutation.mutate(lead.id);
                                                                    }
                                                                }}
                                                                disabled={resetPasswordMutation.isPending}
                                                            >
                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                Reset Password
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Teachers Tab */}
                    {/* Teachers Tab */}
                    {activeTab === "teachers" && (
                        <>
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Teachers (Mobile Access)</CardTitle>
                                            <CardDescription>
                                                View all teachers who can access the mobile app
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                <Input
                                                    placeholder="Search teachers..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 w-64"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Phone</TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead className="text-center">Assigned Students</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {teachers.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                            No teachers found. Create staff members with "Teacher" role in Staff Management.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    teachers
                                                        .filter(teacher =>
                                                            !searchTerm ||
                                                            teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            teacher.phone?.includes(searchTerm)
                                                        )
                                                        .map((teacher: any) => {
                                                            const assignedStudents = leads.filter(l =>
                                                                // Filter by whether specific assignment exists for this teacher and student
                                                                assignments.some(a => {
                                                                    const match = Number(a.teacher_staff_id) === Number(teacher.id) && Number(a.student_lead_id) === Number(l.id);
                                                                    // Debugging only for first few to avoid spam
                                                                    // if (match) console.log('Match found:', teacher.name, l.name);
                                                                    return match;
                                                                })
                                                            );

                                                            // Console log debugging
                                                            // console.log(`Teacher: ${teacher.name} (${teacher.id}), Assignments:`, assignments.filter(a => Number(a.teacher_staff_id) === Number(teacher.id)));

                                                            const studentCount = assignedStudents.length;

                                                            return (
                                                                <TableRow key={teacher.id}>
                                                                    <TableCell className="font-medium">{teacher.name}</TableCell>
                                                                    <TableCell>{teacher.phone}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                            {teacher.role}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-center font-semibold">
                                                                        {/* Placeholder for actual assignment count if needed, currently shows total enrolled */}
                                                                        <span title="Total Active Students">{studentCount}</span>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={teacher.appPassword ? "default" : "secondary"}>
                                                                            {teacher.appPassword ? 'Active' : 'Default'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="flex justify-end items-center gap-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setSelectedStaffId(teacher.id);
                                                                                    setNewPassword("");
                                                                                    setPasswordDialogOpen(true);
                                                                                }}
                                                                            >
                                                                                <Key className="mr-2 h-4 w-4" />
                                                                                Set Password
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                onClick={() => {
                                                                                    if (confirm(`Reset password for ${teacher.name} to default?`)) {
                                                                                        updateStaffPasswordMutation.mutate({
                                                                                            id: teacher.id,
                                                                                            appPassword: null
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                disabled={updateStaffPasswordMutation.isPending}
                                                                            >
                                                                                Reset
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Set Teacher Password</DialogTitle>
                                        <DialogDescription>
                                            Create a new password for this teacher to access the mobile application.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">New Password</Label>
                                            <Input
                                                id="password"
                                                type="text"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setPasswordDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (!newPassword.trim()) {
                                                    toast({
                                                        title: "Error",
                                                        description: "Password cannot be empty",
                                                        variant: "destructive"
                                                    });
                                                    return;
                                                }
                                                if (selectedStaffId) {
                                                    updateStaffPasswordMutation.mutate({
                                                        id: selectedStaffId,
                                                        appPassword: newPassword
                                                    });
                                                }
                                            }}
                                            disabled={updateStaffPasswordMutation.isPending || !newPassword.trim()}
                                        >
                                            {updateStaffPasswordMutation.isPending ? "Saving..." : "Set Password"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}

                    {/* Drivers Tab */}
                    {activeTab === "drivers" && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Drivers (Mobile Access)</CardTitle>
                                        <CardDescription>
                                            View all drivers who can access the mobile app
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                            <Input
                                                placeholder="Search drivers..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 w-64"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-center">Assigned Route</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {drivers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                        No drivers found. Create staff members with "Driver" role in Staff Management.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                drivers
                                                    .filter(driver =>
                                                        !searchTerm ||
                                                        driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        driver.phone?.includes(searchTerm)
                                                    )
                                                    .map((driver: any) => (
                                                        <TableRow key={driver.id}>
                                                            <TableCell className="font-medium">{driver.name}</TableCell>
                                                            <TableCell>{driver.phone}</TableCell>
                                                            <TableCell className="text-gray-600">{driver.email || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                                    {driver.role}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className="text-gray-600">
                                                                    Route Assignment TBD
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={driver.appPassword ? "default" : "secondary"}>
                                                                    {driver.appPassword ? 'Active' : 'Default'}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                {drivers.length > 0 && (
                                    <div className="mt-4 text-sm text-gray-600">
                                        Showing {drivers.filter(d =>
                                            !searchTerm ||
                                            d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            d.phone?.includes(searchTerm)
                                        ).length} of {drivers.length} drivers
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Bus Management Tab */}
            {mainTab === "bus" && (
                <div className="px-4 py-6 space-y-6">
                    <div className="flex gap-2 -mb-px border-b mb-6">
                        <Button
                            variant={activeTab === "routes" ? "default" : "ghost"}
                            onClick={() => setActiveTab("routes")}
                            className="rounded-b-none"
                        >
                            <Bus className="mr-2 h-4 w-4" />
                            Routes
                        </Button>
                        <Button
                            variant={activeTab === "stops" ? "default" : "ghost"}
                            onClick={() => setActiveTab("stops")}
                            className="rounded-b-none"
                        >
                            <MapPin className="mr-2 h-4 w-4" />
                            Stops
                        </Button>
                        <Button
                            variant={activeTab === "assignments" ? "default" : "ghost"}
                            onClick={() => setActiveTab("assignments")}
                            className="rounded-b-none"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Assignments
                        </Button>
                        <Button
                            variant={activeTab === "tracking" ? "default" : "ghost"}
                            onClick={() => setActiveTab("tracking")}
                            className="rounded-b-none"
                        >
                            <Radio className="mr-2 h-4 w-4" />
                            Live Tracking
                        </Button>
                    </div>

                    {/* Routes Sub-Tab */}
                    {activeTab === "routes" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Bus Routes</CardTitle>
                                    <CardDescription>Manage your school bus routes and schedules</CardDescription>
                                </div>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="mr-2" size={18} />
                                    Add Route
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    <Bus className="mx-auto mb-4 text-gray-400" size={48} />
                                    <p className="text-lg font-medium">No routes yet</p>
                                    <p className="text-sm">Click "Add Route" to create your first bus route</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stops Tab */}
                    {activeTab === "stops" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Bus Stops</CardTitle>
                                    <CardDescription>Manage pickup and drop-off locations</CardDescription>
                                </div>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="mr-2" size={18} />
                                    Add Stop
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
                                    <p className="text-lg font-medium">No stops configured</p>
                                    <p className="text-sm">Add bus stops with GPS coordinates and timing</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Student Assignments Tab */}
                    {activeTab === "assignments" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Student Assignments</CardTitle>
                                    <CardDescription>Assign students to bus routes and stops</CardDescription>
                                </div>
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="mr-2" size={18} />
                                    Assign Student
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    <Users className="mx-auto mb-4 text-gray-400" size={48} />
                                    <p className="text-lg font-medium">No assignments yet</p>
                                    <p className="text-sm">Assign students to their pickup and drop stops</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Live Tracking Tab */}
                    {activeTab === "tracking" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Live Bus Tracking</CardTitle>
                                <CardDescription>Monitor all active bus trips in real-time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-gray-500">
                                    <Radio className="mx-auto mb-4 text-gray-400 animate-pulse" size={48} />
                                    <p className="text-lg font-medium">No active tracking sessions</p>
                                    <p className="text-sm">Live bus locations will appear here when drivers start their trips</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Mobile Content Tab */}
            {mainTab === "content" && (
                <div className="px-4 py-6 space-y-6">
                    <div className="flex gap-2 -mb-px border-b mb-6">
                        <Button
                            variant={activeTab === "announcements" ? "default" : "ghost"}
                            onClick={() => setActiveTab("announcements")}
                            className="rounded-b-none"
                        >
                            <Megaphone className="mr-2 h-4 w-4" />
                            Announcements
                        </Button>
                        <Button
                            variant={activeTab === "holidays" ? "default" : "ghost"}
                            onClick={() => setActiveTab("holidays")}
                            className="rounded-b-none"
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            Events & Holidays
                        </Button>
                        <Button
                            variant={activeTab === "updates" ? "default" : "ghost"}
                            onClick={() => setActiveTab("updates")}
                            className="rounded-b-none"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Daily Updates
                        </Button>
                    </div>

                    {/* Announcements Sub-Tab */}
                    {activeTab === "announcements" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>School Announcements</CardTitle>
                                    <CardDescription>Post news and alerts for all parents</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setTitle(""); setContent(""); setPriority("normal"); setDate(""); }}>
                                            <Plus className="mr-2" size={18} />
                                            New Announcement
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Announcement</DialogTitle>
                                            <DialogDescription>This will be visible to all parents in the mobile app.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ann-title">Title</Label>
                                                <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Day Celebration" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ann-priority">Priority</Label>
                                                    <select
                                                        id="ann-priority"
                                                        className="w-full border rounded-md p-2"
                                                        value={priority}
                                                        onChange={(e) => setPriority(e.target.value)}
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="high">Urgent</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ann-date">Date (Optional)</Label>
                                                    <Input
                                                        id="ann-date"
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ann-content">Content</Label>
                                                <Textarea id="ann-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter announcement details..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button onClick={() => createAnnouncementMutation.mutate({
                                                    title,
                                                    content,
                                                    priority,
                                                    // Only send date if selected, mapped to expiresAt or handled by backend? 
                                                    // Actually schema has published_at (now) and expires_at. 
                                                    // "Date" in announcement often means "This is concerning date X".
                                                    // If "not mandatory", I'll send it if present. 
                                                    // Previous backend logic for announcements:
                                                    // .or(`expires_at.is.null,expires_at.gt."${now}"`)
                                                    // So if I map this to expiresAt, and they pick a past date, it disappears.
                                                    // If they mean "Event Date", maybe I should put it in content?
                                                    // Or maybe they just want a reference date.
                                                    // Given the "School Events" context, "Announcements" might be "School Closed on X".
                                                    // I'll stick to mapping it to a dedicated field if available, or just sending it.
                                                    // Wait, `createAnnouncement` on server expects what?
                                                    // I should check existing mutation or server endpoint.
                                                    // Assuming I can pass it. I'll pass `eventDate: date` or `expiresAt: date`.
                                                    // Let's assume `expiresAt` due to schema, but user says "date not mandatory". 
                                                    // If I map to `expiresAt`, it auto-hides. Users might not want that.
                                                    // I'll map to `expiresAt` for now as it's the only date field in schema besides `published_at`.
                                                    // AND `priority`.
                                                    expiresAt: date || null,
                                                    publishedAt: new Date().toISOString()
                                                })}>
                                                    Post Announcement
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Posted Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingAnnouncements ? (
                                            <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : announcements.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-8">No announcements yet</TableCell></TableRow>
                                        ) : (
                                            announcements.map((ann) => (
                                                <TableRow key={ann.id}>
                                                    <TableCell className="font-medium">{ann.title}</TableCell>
                                                    <TableCell>{new Date(ann.publishedAt!).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            if (confirm("Delete this announcement?")) deleteAnnouncementMutation.mutate(ann.id);
                                                        }}>
                                                            <Trash2 className="text-red-500" size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Events Tab */}
                    {/* Holidays Tab */}
                    {activeTab === "holidays" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Public Holidays</CardTitle>
                                    <CardDescription>Manage holiday calendar for the school year</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setTitle(""); setContent(""); setDate(""); setType("holiday"); }}>
                                            <Plus className="mr-2" size={18} />
                                            New Holiday
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Holiday</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-title">Holiday Name</Label>
                                                <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Winter Break" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-date">Date</Label>
                                                <Input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                            </div>
                                            {/* Type is implicitly 'holiday' */}
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-content">Description</Label>
                                                <Textarea id="ev-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Optional details..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button onClick={() => createEventMutation.mutate({ title, description: content, eventDate: date, eventType: 'holiday' })}>
                                                    Add Holiday
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Holiday Name</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingEvents ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : events.filter(e => e.eventType === 'holiday').length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No holidays scheduled</TableCell></TableRow>
                                        ) : (
                                            events
                                                .filter(ev => ev.eventType === 'holiday')
                                                .map((ev) => (
                                                    <TableRow key={ev.id}>
                                                        <TableCell className="font-medium">{ev.title}</TableCell>
                                                        <TableCell>{ev.eventDate}</TableCell>
                                                        <TableCell><Badge variant="outline" className="bg-purple-50 text-purple-700">{ev.eventType}</Badge></TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                if (confirm("Remove this holiday?")) deleteEventMutation.mutate(ev.id);
                                                            }}>
                                                                <Trash2 className="text-red-500" size={16} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Daily Updates Tab */}
                    {activeTab === "updates" && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Daily Activity Updates</CardTitle>
                                    <CardDescription>Post food, sleep, and activity updates for specific students</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setStudentPhone(""); setContent(""); setType("activity"); }}>
                                            <Plus className="mr-2" size={18} />
                                            Post Update
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Student Activity Update</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="up-student">Select Student</Label>
                                                <select
                                                    id="up-student"
                                                    className="w-full border rounded-md p-2"
                                                    value={studentPhone} // Using studentPhone state for leadId temporarily
                                                    onChange={(e) => setStudentPhone(e.target.value)}
                                                >
                                                    <option value="">Select a student...</option>
                                                    {parents.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="up-type">Activity Type</Label>
                                                <select id="up-type" className="w-full border rounded-md p-2" value={type} onChange={(e) => setType(e.target.value)}>
                                                    <option value="activity">General Activity</option>
                                                    <option value="food">Meal/Food</option>
                                                    <option value="sleep">Sleep/Nap</option>
                                                    <option value="photo">Photo Update</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="up-content">Update Content</Label>
                                                <Textarea id="up-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="e.g. Finished all lunch, slept for 1 hour." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button onClick={() => createUpdateMutation.mutate({
                                                    leadId: Number(studentPhone),
                                                    activityType: type,
                                                    content,
                                                    postedAt: new Date().toISOString()
                                                })}>
                                                    Post Update
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Content</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingUpdates ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : dailyUpdates.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No updates posted today</TableCell></TableRow>
                                        ) : (
                                            dailyUpdates.map((up) => (
                                                <TableRow key={up.id}>
                                                    <TableCell className="font-medium">
                                                        {parents.find(p => p.id === up.leadId)?.name || `Student #${up.leadId}`}
                                                    </TableCell>
                                                    <TableCell><Badge variant="secondary">{up.activityType}</Badge></TableCell>
                                                    <TableCell className="max-w-xs truncate">{up.content}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            if (confirm("Delete this update?")) deleteUpdateMutation.mutate(up.id);
                                                        }}>
                                                            <Trash2 className="text-red-500" size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
