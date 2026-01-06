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

export default function AppManagement() {
    const [activeTab, setActiveTab] = useState("parents");
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();

    // Form States
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [date, setDate] = useState("");
    const [type, setType] = useState("");
    const [studentPhone, setStudentPhone] = useState("");
    const [className, setClassName] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Fetch Leads (Parents)
    const { data: leads = [], isLoading } = useQuery<Lead[]>({
        queryKey: ['/api/leads']
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Smartphone className="text-purple-600" size={32} />
                                App Management
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage parent access, bus features, and mobile app settings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border border-gray-200 p-1 rounded-lg shadow-sm">
                        <TabsTrigger
                            value="parents"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <Key className="mr-2" size={18} />
                            Parent Access
                        </TabsTrigger>
                        <TabsTrigger
                            value="routes"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <Bus className="mr-2" size={18} />
                            Bus Routes
                        </TabsTrigger>
                        <TabsTrigger
                            value="stops"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <MapPin className="mr-2" size={18} />
                            Stops
                        </TabsTrigger>
                        <TabsTrigger
                            value="assignments"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <Users className="mr-2" size={18} />
                            Assignments
                        </TabsTrigger>
                        <TabsTrigger
                            value="tracking"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <Radio className="mr-2" size={18} />
                            Live Tracking
                        </TabsTrigger>
                        <TabsTrigger
                            value="announcements"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <Megaphone className="mr-2" size={18} />
                            Announcements
                        </TabsTrigger>
                        <TabsTrigger
                            value="events"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <Calendar className="mr-2" size={18} />
                            Events
                        </TabsTrigger>
                        <TabsTrigger
                            value="updates"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <ClipboardList className="mr-2" size={18} />
                            Daily Updates
                        </TabsTrigger>
                        <TabsTrigger
                            value="homework"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-6 py-2.5 rounded-md transition-all"
                        >
                            <BookOpen className="mr-2" size={18} />
                            Homework
                        </TabsTrigger>
                    </TabsList>

                    {/* Parents Tab */}
                    <TabsContent value="parents">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Registered Parents</CardTitle>
                                        <CardDescription>Manage mobile app access for parents</CardDescription>
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
                                                <TableHead>App Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                                </TableRow>
                                            ) : parents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No parents found matching your search</TableCell>
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
                                                            <Badge variant={lead.appPassword ? "default" : "secondary"}>
                                                                {lead.appPassword ? 'Active' : 'Default (1234)'}
                                                            </Badge>
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
                                                                disabled={!lead.appPassword || resetPasswordMutation.isPending}
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
                    </TabsContent>

                    {/* Routes Tab */}
                    <TabsContent value="routes">
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
                    </TabsContent>

                    {/* Stops Tab */}
                    <TabsContent value="stops">
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
                    </TabsContent>

                    {/* Student Assignments Tab */}
                    <TabsContent value="assignments">
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
                    </TabsContent>

                    {/* Live Tracking Tab */}
                    <TabsContent value="tracking">
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
                    </TabsContent>
                    {/* Announcements Tab */}
                    <TabsContent value="announcements">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>School Announcements</CardTitle>
                                    <CardDescription>Post news and alerts for all parents</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setTitle(""); setContent(""); }}>
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
                                            <div className="space-y-2">
                                                <Label htmlFor="ann-content">Content</Label>
                                                <Textarea id="ann-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Enter announcement details..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button onClick={() => createAnnouncementMutation.mutate({ title, content, publishedAt: new Date().toISOString() })}>
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
                    </TabsContent>

                    {/* Events Tab */}
                    <TabsContent value="events">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>School Events</CardTitle>
                                    <CardDescription>Manage holiday calendar and school events</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setTitle(""); setContent(""); setDate(""); setType("event"); }}>
                                            <Plus className="mr-2" size={18} />
                                            New Event
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Event</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-title">Event Name</Label>
                                                <Input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Winter Break" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-date">Date</Label>
                                                <Input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-type">Type</Label>
                                                <select id="ev-type" className="w-full border rounded-md p-2" value={type} onChange={(e) => setType(e.target.value)}>
                                                    <option value="event">School Event</option>
                                                    <option value="holiday">Public Holiday</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-content">Description</Label>
                                                <Textarea id="ev-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Optional details..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button onClick={() => createEventMutation.mutate({ title, description: content, eventDate: date, eventType: type })}>
                                                    Create Event
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
                                            <TableHead>Event</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingEvents ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : events.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No events scheduled</TableCell></TableRow>
                                        ) : (
                                            events.map((ev) => (
                                                <TableRow key={ev.id}>
                                                    <TableCell className="font-medium">{ev.title}</TableCell>
                                                    <TableCell>{ev.eventDate}</TableCell>
                                                    <TableCell><Badge variant="outline">{ev.eventType}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            if (confirm("Remove this event?")) deleteEventMutation.mutate(ev.id);
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
                    </TabsContent>

                    {/* Daily Updates Tab */}
                    <TabsContent value="updates">
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
                    </TabsContent>

                    {/* Homework Tab */}
                    <TabsContent value="homework">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Homework Assignments</CardTitle>
                                    <CardDescription>Assign tasks to specific classes</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setClassName(""); setTitle(""); setContent(""); setDueDate(""); }}>
                                            <Plus className="mr-2" size={18} />
                                            New Homework
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Assign Homework</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-class">Class Name</Label>
                                                <Input id="hw-class" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Nursery-A" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-title">Subject/Topic</Label>
                                                <Input id="hw-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Number Practice" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-due">Due Date</Label>
                                                <Input id="hw-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hw-content">Instructions</Label>
                                                <Textarea id="hw-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Describe the homework..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button onClick={() => createHomeworkMutation.mutate({ className, title, description: content, dueDate, postedAt: new Date().toISOString() })}>
                                                    Assign Homework
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
                                            <TableHead>Class</TableHead>
                                            <TableHead>Topic</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingHomework ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : homeworks.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No homework assigned</TableCell></TableRow>
                                        ) : (
                                            homeworks.map((hw) => (
                                                <TableRow key={hw.id}>
                                                    <TableCell className="font-semibold">{hw.className}</TableCell>
                                                    <TableCell>{hw.title}</TableCell>
                                                    <TableCell><Badge variant="outline">{hw.dueDate}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => {
                                                            if (confirm("Remove this homework?")) deleteHomeworkMutation.mutate(hw.id);
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
                    </TabsContent>
                </Tabs>

                {/* Database Migration Notice */}
                <Card className="mt-6 border-purple-200 bg-purple-50">
                    <CardHeader>
                        <CardTitle className="text-purple-900 flex items-center gap-2">
                            ⚠️ Setup Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm text-purple-800">
                            <p>
                                <strong>Backend is ready!</strong> To start using Bus Management features:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 ml-4">
                                <li>Apply the database migration in Supabase (see <code className="bg-purple-100 px-2 py-1 rounded">database_migration_guide.md</code>)</li>
                                <li>Restart the backend server</li>
                                <li>Use the mobile app for parents and drivers to track buses in real-time</li>
                            </ol>
                            <p className="mt-4 pt-4 border-t border-purple-200">
                                <strong>Mobile App:</strong> Parents can track their child's bus in real-time, and drivers can send GPS updates from their phones.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
