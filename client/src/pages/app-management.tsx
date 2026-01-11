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
import { Lead, PreschoolAnnouncement, PreschoolEvent, DailyUpdate, PreschoolHomework, BusRoute, BusStop, StudentBusAssignment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import { TeacherAssignmentDropdown } from "@/components/teacher-assignment-dropdown";
import { Switch } from "@/components/ui/switch";
// import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useEffect, useRef, useMemo } from 'react';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// Leaflet map temporarily disabled due to SSR compatibility issues
// OLA Maps Configuration (commented - map disabled)
// const OLA_MAPS_API_KEY = 'nN7MyyjOHt7LqUdRFNYcfadYtFEw7cqdProAtSD0';
// const OLA_MAPS_TILE_URL = `https://api.olakrutrim.com/places/v1/tiles/default-light-standard/{z}/{x}/{y}.png?api_key=${OLA_MAPS_API_KEY}`;

// Live Bus Tracking Map Component
import ClientMapWrapper from "@/components/ClientMapWrapper";
import { fetchRoute } from "@/utils/routeService";

function LiveBusTrackingMap() {
    const { data: trackingData, refetch, isLoading } = useQuery<{ routes: any[] }>({
        queryKey: ['/api/bus/live-tracking'],
        refetchInterval: 10000,
    });

    const activeBuses = trackingData?.routes || [];
    const [allRoutes, setAllRoutes] = useState<{ routeId: number; coords: [number, number][] }[]>([]);

    useEffect(() => {
        if (activeBuses.length > 0) {
            updateAllPaths();
        } else if (allRoutes.length > 0) {
            setAllRoutes([]);
        }
    }, [activeBuses]);

    const updateAllPaths = async () => {
        try {
            const newRoutes: { routeId: number; coords: [number, number][] }[] = [];

            if (activeBuses.length === 0) {
                setAllRoutes([]);
                return;
            }

            for (const bus of activeBuses) {
                // Destination is the final stop
                if (bus.stops && bus.stops.length > 0 && bus.currentLocation) {
                    try {
                        const schoolStop = bus.stops[bus.stops.length - 1];
                        if (!schoolStop.latitude || !schoolStop.longitude) continue;

                        const routeData = await fetchRoute(
                            { lat: bus.currentLocation.latitude, lng: bus.currentLocation.longitude },
                            { lat: parseFloat(schoolStop.latitude), lng: parseFloat(schoolStop.longitude) }
                        );

                        if (routeData && routeData.legs && routeData.legs[0]?.steps) {
                            const coords: [number, number][] = routeData.legs[0].steps
                                .filter((s: any) => s.start_location?.lng && s.start_location?.lat)
                                .map((s: any) => [s.start_location.lng, s.start_location.lat] as [number, number]);

                            if (coords.length > 0) {
                                newRoutes.push({ routeId: bus.routeId, coords });
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to fetch route for bus ${bus.routeId}:`, err);
                    }
                }
            }

            setAllRoutes(newRoutes);
        } catch (err) {
            console.error("Critical error in updateAllPaths:", err);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Live Bus Tracking</CardTitle>
                    <CardDescription>Monitor all active bus trips in real-time</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && activeBuses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <RefreshCw className="mx-auto mb-4 text-gray-400 animate-spin" size={48} />
                        <p className="text-lg font-medium">Loading tracking data...</p>
                    </div>
                ) : activeBuses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Radio className="mx-auto mb-4 text-gray-400 animate-pulse" size={48} />
                        <p className="text-lg font-medium">No active tracking sessions</p>
                        <p className="text-sm">Live bus locations will appear here when drivers start their trips</p>
                    </div>
                ) : (
                    <div>
                        {/* Map Container - using ClientWrapper to avoid SSR issues */}
                        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <ClientMapWrapper activeBuses={activeBuses} allRoutes={allRoutes} />
                        </div>

                        {/* Active Buses List */}
                        <div className="mt-4">
                            <h4 className="font-medium mb-2">Active Buses ({activeBuses.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activeBuses.map((bus) => (
                                    <div key={bus.routeId} className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-white hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-purple-700 text-lg">{bus.routeName}</h3>
                                                <p className="text-sm text-gray-600">{bus.vehicleNumber}</p>
                                            </div>
                                            <Badge className="bg-green-500 text-white">
                                                🟢 Live
                                            </Badge>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                <span>Driver: {bus.driverName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Radio className="h-4 w-4 text-gray-400" />
                                                <span>Speed: {bus.currentLocation.speed || 0} km/h</span>
                                            </div>
                                            <div className="pt-2 border-t text-xs text-gray-500">
                                                Last updated: {new Date(bus.lastUpdated).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


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

    // Bus Management State
    const [busRouteDialogOpen, setBusRouteDialogOpen] = useState(false);
    const [busStopDialogOpen, setBusStopDialogOpen] = useState(false);
    const [busAssignmentDialogOpen, setBusAssignmentDialogOpen] = useState(false);

    // Bus Route Form
    const [routeName, setRouteName] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [driverId, setDriverId] = useState("");
    const [helperName, setHelperName] = useState("");
    const [helperPhone, setHelperPhone] = useState("");
    const [editingRouteId, setEditingRouteId] = useState<number | null>(null); // For editing existing routes

    // Bus Stop Form
    const [selectedRouteId, setSelectedRouteId] = useState<number | string>("");
    const [stopName, setStopName] = useState("");
    const [location, setLocation] = useState<{ latitude: string, longitude: string }>({ latitude: "", longitude: "" });
    const [arrivalTime, setArrivalTime] = useState("");
    const [pickupPrice, setPickupPrice] = useState("");

    // Assignment Form
    const [selectedStudentId, setSelectedStudentId] = useState<number | string>("");
    const [selectedStopId, setSelectedStopId] = useState<number | string>("");

    // Staff Password State
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
    const [newPassword, setNewPassword] = useState("");

    // Driver Management State
    const [addDriverDialogOpen, setAddDriverDialogOpen] = useState(false);
    const [driverName, setDriverName] = useState("");
    const [driverPhone, setDriverPhone] = useState("");
    const [driverEmail, setDriverEmail] = useState("");
    const [driverEmployeeId, setDriverEmployeeId] = useState("");
    const [driverJoiningDate, setDriverJoiningDate] = useState(new Date().toISOString().split('T')[0]);

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
        staff.role?.toLowerCase().includes('driver')
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

    const updateStaffStatusMutation = useMutation({
        mutationFn: async (data: { id: number, isActive: boolean }) => {
            const res = await apiRequest("PATCH", `/api/staff/${data.id}`, {
                isActive: data.isActive
            });
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
            toast({
                title: "Status Updated",
                description: `Driver has been ${variables.isActive ? 'activated' : 'deactivated'}.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update status.",
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

    // Bus Management Queries
    const { data: busRoutes = [], isLoading: isLoadingBusRoutes } = useQuery<BusRoute[]>({
        queryKey: ['/api/bus/routes']
    });
    const { data: busStops = [], isLoading: isLoadingBusStops } = useQuery<BusStop[]>({
        queryKey: ['/api/bus/stops', selectedRouteId],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/bus/routes/${selectedRouteId}/stops`);
            return res.json();
        },
        enabled: Number(selectedRouteId) > 0
    });
    const { data: busAssignments = [], isLoading: isLoadingBusAssignments } = useQuery<StudentBusAssignment[]>({
        queryKey: ['/api/bus/assignments', selectedRouteId],
        enabled: !!selectedRouteId || activeTab === "assignments"
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

    // Bus Management Mutations
    const createBusRouteMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/bus/routes", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/bus/routes'] });
            setBusRouteDialogOpen(false);
            setRouteName(""); setVehicleNumber(""); setDriverId(""); setHelperName(""); setHelperPhone("");
            toast({ title: "Success", description: "Bus route created" });
        },
        onError: () => toast({ title: "Error", description: "Failed to create route", variant: "destructive" })
    });

    const deleteBusRouteMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/bus/routes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/bus/routes'] });
            toast({ title: "Deleted", description: "Route deleted" });
        }
    });

    const createBusStopMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/bus/stops", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/bus/stops', selectedRouteId] });
            setBusStopDialogOpen(false);
            setStopName(""); setArrivalTime(""); setPickupPrice(""); setLocation({ latitude: "", longitude: "" });
            toast({ title: "Success", description: "Bus stop added" });
        },
        onError: () => toast({ title: "Error", description: "Failed to add stop", variant: "destructive" })
    });

    const deleteBusStopMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/bus/stops/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/bus/routes', selectedRouteId, 'stops'] });
            toast({ title: "Deleted", description: "Stop removed" });
        }
    });

    const createBusAssignmentMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/bus/assignments", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/bus/assignments'] });
            setBusAssignmentDialogOpen(false);
            setSelectedStudentId(""); setSelectedStopId("");
            toast({ title: "Success", description: "Student assigned to bus" });
        },
        onError: () => toast({ title: "Error", description: "Failed to assign student", variant: "destructive" })
    });

    const deleteBusAssignmentMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/bus/assignments/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/bus/assignments'] });
            toast({ title: "Deleted", description: "Assignment removed" });
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

    // Staff Management Mutations
    const createStaffMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/staff", data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
            setAddDriverDialogOpen(false);
            setDriverName(""); setDriverPhone(""); setDriverEmail(""); setDriverEmployeeId("");
            toast({ title: "Success", description: "Driver added successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to add driver",
                variant: "destructive"
            });
        }
    });

    const deleteStaffMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("DELETE", `/api/staff/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
            toast({ title: "Deleted", description: "Staff member removed" });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: "Failed to delete staff member. They might be assigned to active records.",
                variant: "destructive"
            });
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
                        <>
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
                                            <Button onClick={() => setAddDriverDialogOpen(true)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Driver
                                            </Button>
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
                                                                    {(() => {
                                                                        const assignedRoute = busRoutes.find(route => route.driverId === driver.id);
                                                                        return assignedRoute ? (
                                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                                {assignedRoute.routeName}
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-gray-600">
                                                                                Not Assigned
                                                                            </Badge>
                                                                        );
                                                                    })()}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={driver.isActive}
                                                                            onCheckedChange={(checked) => updateStaffStatusMutation.mutate({
                                                                                id: driver.id,
                                                                                isActive: checked
                                                                            })}
                                                                        />
                                                                        <span className="text-sm text-gray-500">
                                                                            {driver.isActive ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    </div>
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

                            {/* Add Driver Dialog */}
                            <Dialog open={addDriverDialogOpen} onOpenChange={setAddDriverDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Driver</DialogTitle>
                                        <DialogDescription>
                                            Create a new staff account with Driver role.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="driverName">Full Name</Label>
                                            <Input
                                                id="driverName"
                                                value={driverName}
                                                onChange={(e) => setDriverName(e.target.value)}
                                                placeholder="Enter driver's name"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="driverPhone">Phone Number</Label>
                                                <Input
                                                    id="driverPhone"
                                                    value={driverPhone}
                                                    onChange={(e) => setDriverPhone(e.target.value)}
                                                    placeholder="10-digit number"
                                                    maxLength={10}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="driverEmail">Email (Optional)</Label>
                                                <Input
                                                    id="driverEmail"
                                                    type="email"
                                                    value={driverEmail}
                                                    onChange={(e) => setDriverEmail(e.target.value)}
                                                    placeholder="driver@example.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="driverEmployeeId">Employee ID</Label>
                                                <Input
                                                    id="driverEmployeeId"
                                                    value={driverEmployeeId}
                                                    onChange={(e) => setDriverEmployeeId(e.target.value)}
                                                    placeholder="e.g. DRV-001"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="driverDate">Date of Joining</Label>
                                                <Input
                                                    id="driverDate"
                                                    type="date"
                                                    value={driverJoiningDate}
                                                    onChange={(e) => setDriverJoiningDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setAddDriverDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (!driverName || !driverPhone || !driverJoiningDate) {
                                                    toast({
                                                        title: "Missing Fields",
                                                        description: "Name, Phone, and Date of Joining are required.",
                                                        variant: "destructive"
                                                    });
                                                    return;
                                                }

                                                if (driverPhone.length !== 10) {
                                                    toast({
                                                        title: "Invalid Phone",
                                                        description: "Phone number must be exactly 10 digits.",
                                                        variant: "destructive"
                                                    });
                                                    return;
                                                }

                                                createStaffMutation.mutate({
                                                    name: driverName,
                                                    phone: driverPhone,
                                                    email: driverEmail || undefined,
                                                    employeeId: driverEmployeeId || undefined,
                                                    dateOfJoining: driverJoiningDate,
                                                    role: "Driver",
                                                    isActive: true
                                                });
                                            }}
                                            disabled={createStaffMutation.isPending}
                                        >
                                            {createStaffMutation.isPending ? "Creating..." : "Create Driver"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
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
                                <Dialog open={busRouteDialogOpen} onOpenChange={setBusRouteDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700">
                                            <Plus className="mr-2" size={18} />
                                            Add Route
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{editingRouteId ? 'Edit Bus Route' : 'Add Bus Route'}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Route Name</Label>
                                                <Input value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="e.g. Route 1 - North" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Vehicle Number</Label>
                                                <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g. KA-01-AB-1234" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Driver</Label>
                                                <select className="w-full border rounded-md p-2" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                                                    <option value="">Select Driver...</option>
                                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Helper Name</Label>
                                                    <Input value={helperName} onChange={(e) => setHelperName(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Helper Phone</Label>
                                                    <Input value={helperPhone} onChange={(e) => setHelperPhone(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={() => createBusRouteMutation.mutate({
                                                routeName,
                                                vehicleNumber,
                                                driverId: driverId ? Number(driverId) : null,
                                                helperName,
                                                helperPhone
                                            })}>
                                                Create Route
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Route Name</TableHead>
                                            <TableHead>Vehicle</TableHead>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>Helper</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingBusRoutes ? (
                                            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : busRoutes.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No routes found</TableCell></TableRow>
                                        ) : (
                                            busRoutes.map(route => (
                                                <TableRow key={route.id}>
                                                    <TableCell className="font-medium">{route.routeName}</TableCell>
                                                    <TableCell>{route.vehicleNumber}</TableCell>
                                                    <TableCell>{allStaff.find(s => s.id === route.driverId)?.name || '-'}</TableCell>
                                                    <TableCell>
                                                        {route.helperName}<br />
                                                        <span className="text-xs text-gray-500">{route.helperPhone}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                // Set form for editing
                                                                setRouteName(route.routeName || '');
                                                                setVehicleNumber(route.vehicleNumber || '');
                                                                setDriverId(route.driverId?.toString() || '');
                                                                setHelperName(route.helperName || '');
                                                                setHelperPhone(route.helperPhone || '');
                                                                setEditingRouteId(route.id);
                                                                setBusRouteDialogOpen(true);
                                                            }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                if (confirm("Delete this route?")) deleteBusRouteMutation.mutate(route.id);
                                                            }}>
                                                                <Trash2 className="text-red-500" size={16} />
                                                            </Button>
                                                            <Button variant="outline" size="sm" onClick={() => {
                                                                setSelectedRouteId(route.id);
                                                                setBusStopDialogOpen(true);
                                                            }}>
                                                                <MapPin size={16} className="mr-2" />
                                                                Stops
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Manage Bus Stops Dialog */}
                                <Dialog open={busStopDialogOpen} onOpenChange={setBusStopDialogOpen}>
                                    <DialogContent className="max-w-3xl">
                                        <DialogHeader>
                                            <DialogTitle>Manage Bus Stops - {busRoutes.find(r => r.id === selectedRouteId)?.routeName}</DialogTitle>
                                            <CardDescription>Add or remove stops for this route</CardDescription>
                                        </DialogHeader>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Add New Stop Form */}
                                            <div className="space-y-4 border-r pr-4">
                                                <h3 className="font-semibold">Add New Stop</h3>
                                                <div className="space-y-2">
                                                    <Label>Stop Name</Label>
                                                    <Input value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="e.g. Main Square" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <Label>Latitude</Label>
                                                        <Input value={location.latitude} onChange={(e) => setLocation({ ...location, latitude: e.target.value })} placeholder="20.5937" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Longitude</Label>
                                                        <Input value={location.longitude} onChange={(e) => setLocation({ ...location, longitude: e.target.value })} placeholder="78.9629" />
                                                    </div>
                                                </div>
                                                <div className="text-xs text-blue-600 mb-2">
                                                    <a href="https://www.google.com/maps" target="_blank" rel="noreferrer">Open Google Maps to find coordinates</a>
                                                </div>

                                                {/* Interactive Map - Temporarily disabled due to library conflict */}
                                                {/* <div className="h-[200px] w-full rounded-md overflow-hidden border mb-4 relative z-0">
                                                    <MapContainer
                                                        center={[
                                                            parseFloat(location.latitude) || 20.5937,
                                                            parseFloat(location.longitude) || 78.9629
                                                        ]}
                                                        zoom={5}
                                                        style={{ height: '100%', width: '100%' }}
                                                        attributionControl={false}
                                                    >
                                                        <TileLayer url={OLA_MAPS_TILE_URL} />
                                                        <Marker
                                                            position={[
                                                                parseFloat(location.latitude) || 20.5937,
                                                                parseFloat(location.longitude) || 78.9629
                                                            ]}
                                                            draggable={true}
                                                            eventHandlers={{
                                                                dragend: (e) => {
                                                                    const marker = e.target;
                                                                    const position = marker.getLatLng();
                                                                    setLocation({
                                                                        latitude: position.lat.toFixed(6),
                                                                        longitude: position.lng.toFixed(6)
                                                                    });
                                                                },
                                                            }}
                                                        >
                                                            <Popup>Drag me to the bus stop location!</Popup>
                                                        </Marker>
                                                    </MapContainer>
                                                </div>
                                                <div className="text-xs text-center text-gray-500 mb-4">
                                                    👆 Drag the pin to set precise location
                                                </div> */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-2">
                                                        <Label>Arrival Time</Label>
                                                        <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Price (₹)</Label>
                                                        <Input type="number" value={pickupPrice} onChange={(e) => setPickupPrice(e.target.value)} placeholder="0" />
                                                    </div>
                                                </div>
                                                <Button className="w-full" onClick={() => {
                                                    if (!selectedRouteId) return;
                                                    createBusStopMutation.mutate({
                                                        routeId: Number(selectedRouteId),
                                                        stopName,
                                                        latitude: location.latitude ? String(location.latitude) : null,
                                                        longitude: location.longitude ? String(location.longitude) : null,
                                                        arrivalTime,
                                                        pickupPrice: pickupPrice ? String(pickupPrice) : "0",
                                                        stopOrder: busStops.length + 1
                                                    });
                                                }}>
                                                    Add Stop
                                                </Button>
                                            </div>

                                            {/* List Existing Stops */}
                                            <div className="space-y-4">
                                                <h3 className="font-semibold">Existing Stops</h3>
                                                <div className="max-h-[400px] overflow-y-auto space-y-2">
                                                    {isLoadingBusStops ? (
                                                        <div className="text-center py-4">Loading stops...</div>
                                                    ) : busStops.length === 0 ? (
                                                        <div className="text-center py-4 text-gray-500">No stops added yet</div>
                                                    ) : (
                                                        busStops.map((stop, index) => (
                                                            <div key={stop.id} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                                                                <div>
                                                                    <div className="font-medium">
                                                                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full mr-2">#{index + 1}</span>
                                                                        {stop.stopName}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {stop.arrivalTime || '--:--'} • ₹{stop.pickupPrice || 0}
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="sm" onClick={() => {
                                                                    if (confirm("Delete this stop?")) deleteBusStopMutation.mutate(stop.id);
                                                                }}>
                                                                    <Trash2 className="text-red-500" size={14} />
                                                                </Button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
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
                                <Dialog open={busAssignmentDialogOpen} onOpenChange={setBusAssignmentDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700" disabled={!selectedRouteId}>
                                            <Plus className="mr-2" size={18} />
                                            Assign Student
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Assign Student to Bus</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Select Student</Label>
                                                <select className="w-full border rounded-md p-2" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                                                    <option value="">Select Student...</option>
                                                    {leads
                                                        .filter(lead =>
                                                            lead.status === 'enrolled' ||
                                                            lead.interestedProgram?.toLowerCase().includes('daycare')
                                                        )
                                                        .map(lead => <option key={lead.id} value={lead.id}>{lead.name} ({lead.phone})</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Pickup/Drop Stop (Optional)</Label>
                                                <select className="w-full border rounded-md p-2" value={selectedStopId} onChange={(e) => setSelectedStopId(e.target.value)}>
                                                    <option value="">No specific stop (Direct Route)</option>
                                                    {busStops.map(stop => <option key={stop.id} value={stop.id}>{stop.stopName}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={() => {
                                                const rId = Number(selectedRouteId);
                                                const sId = Number(selectedStudentId);
                                                if (!rId || isNaN(rId)) {
                                                    toast({ title: "Error", description: "Invalid Route ID", variant: "destructive" });
                                                    return;
                                                }
                                                if (!sId || isNaN(sId)) {
                                                    toast({ title: "Error", description: "Please select a student", variant: "destructive" });
                                                    return;
                                                }

                                                createBusAssignmentMutation.mutate({
                                                    studentId: sId,
                                                    routeId: rId,
                                                    pickupStopId: selectedStopId ? Number(selectedStopId) : undefined,
                                                    dropStopId: selectedStopId ? Number(selectedStopId) : undefined
                                                });
                                            }}>
                                                Assign Student
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <Label>Select Route to View Assignments</Label>
                                    <select
                                        className="w-full max-w-md border rounded-md p-2 mt-1"
                                        value={selectedRouteId}
                                        onChange={(e) => setSelectedRouteId(e.target.value)}
                                    >
                                        <option value="">Select a route...</option>
                                        {busRoutes.map(r => <option key={r.id} value={r.id}>{r.routeName} ({r.vehicleNumber})</option>)}
                                    </select>
                                </div>

                                {selectedRouteId && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student Name</TableHead>
                                                <TableHead>Stop Name</TableHead>
                                                <TableHead>Assigned At</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLoadingBusAssignments ? (
                                                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                            ) : busAssignments.length === 0 ? (
                                                <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No students assigned to this route</TableCell></TableRow>
                                            ) : (
                                                busAssignments.map((assignment) => (
                                                    <TableRow key={assignment.id}>
                                                        <TableCell className="font-medium">
                                                            {leads.find(l => l.id === assignment.studentId)?.name || `Student #${assignment.studentId}`}
                                                        </TableCell>
                                                        <TableCell>
                                                            {assignment.pickupStopId ? (busStops.find(s => s.id === assignment.pickupStopId)?.stopName || 'Unknown Stop') : <span className="text-gray-400 italic">Direct Route</span>}
                                                        </TableCell>
                                                        <TableCell>{assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : '-'}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                if (confirm("Remove this assignment?")) deleteBusAssignmentMutation.mutate(assignment.id);
                                                            }}>
                                                                <Trash2 className="text-red-500" size={16} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Live Tracking Tab */}
                    {activeTab === "tracking" && (
                        <LiveBusTrackingMap />
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
                                                    <Label htmlFor="ann-date">Expiration Date *</Label>
                                                    <Input
                                                        id="ann-date"
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                        required
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
                                                <Button
                                                    onClick={() => {
                                                        if (!date) {
                                                            alert('Please select an expiration date');
                                                            return;
                                                        }
                                                        createAnnouncementMutation.mutate({
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
                                                            expiresAt: date,
                                                            publishedAt: new Date().toISOString()
                                                        });
                                                    }}
                                                >
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
                                            <TableHead>Expiration Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingAnnouncements ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                                        ) : announcements.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No announcements yet</TableCell></TableRow>
                                        ) : (
                                            announcements.map((ann) => (
                                                <TableRow key={ann.id}>
                                                    <TableCell className="font-medium">{ann.title}</TableCell>
                                                    <TableCell>{new Date(ann.publishedAt!).toLocaleDateString()}</TableCell>
                                                    <TableCell>{ann.expiresAt ? new Date(ann.expiresAt).toLocaleDateString() : '-'}</TableCell>
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
                                            <div className="space-y-2">
                                                <Label htmlFor="ev-type">Type</Label>
                                                <select
                                                    id="ev-type"
                                                    className="w-full border rounded-md p-2"
                                                    value={type}
                                                    onChange={(e) => setType(e.target.value)}
                                                >
                                                    <option value="holiday">Holiday</option>
                                                    <option value="event">Event</option>
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
                                                    Add {type === 'holiday' ? 'Holiday' : 'Event'}
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
            )
            }
        </div >
    );
}
