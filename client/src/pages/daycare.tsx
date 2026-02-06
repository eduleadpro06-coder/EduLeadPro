import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Keep for internal usage in 'Children' tab
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Baby, Users, UserPlus, Calendar, IndianRupee, Settings as SettingsIcon, TrendingUp, Plus, Clock, CheckCircle, UserCheck, LogOut, AlertTriangle, Phone, Mail, Eye, FileText, Download, Filter, InfoIcon, AlertCircle, User2, Trash2, Pencil } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { useState, useEffect, useMemo } from "react";
import { useQueryState } from "@/hooks/use-query-state";
import { useDaycareStats, useCurrentlyCheckedIn, useDaycareChildren, useDaycareInquiries, useDaycareEnrollments, useTodayAttendance, useDaycarePayments, useActiveBillingConfig, useCreateDaycareChild, useUpdateDaycareChild, useCreateDaycareInquiry, useCreateEnrollment, useCheckInChild, useCheckOutChild, useRecordPayment, useUpdateBillingConfig, useAttendanceReport } from "@/hooks/use-daycare";
import { useOrganization } from "@/hooks/use-organization";
import { generateDaycareAttendancePDF } from "@/lib/daycare-report-generator";
import { generateDaycareReceiptPDF } from "@/lib/daycare-receipt-generator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";

export default function Daycare() {
    const [activeTab, setActiveTab] = useQueryState("tab", "dashboard");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Enrollment form state
    const [enrollmentRate, setEnrollmentRate] = useState('');
    const [enrollmentDays, setEnrollmentDays] = useState('');
    const [dailyHours, setDailyHours] = useState('8');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [selectedReportChildId, setSelectedReportChildId] = useState<string>("");
    const [isAddChildOpen, setIsAddChildOpen] = useState(false);
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
    const [isEditChildOpen, setIsEditChildOpen] = useState(false);
    const [editingChild, setEditingChild] = useState<any>(null);

    const { toast } = useToast();

    // Auto-calculate payment amount when enrollment details change
    useEffect(() => {
        if (enrollmentRate && enrollmentDays && dailyHours) {
            const rate = parseFloat(enrollmentRate);
            const days = parseFloat(enrollmentDays);
            const hours = parseFloat(dailyHours);
            if (!isNaN(rate) && !isNaN(days) && !isNaN(hours)) {
                const total = rate * days;
                setPaymentAmount(total.toFixed(2));
            }
        }
    }, [enrollmentRate, enrollmentDays, dailyHours]);

    // Fetch data
    const stats = useDaycareStats();
    const checkedIn = useCurrentlyCheckedIn();
    const children = useDaycareChildren();
    const inquiries = useDaycareInquiries();
    const enrollments = useDaycareEnrollments();
    const todayAttendance = useTodayAttendance();
    const payments = useDaycarePayments();
    const billingConfig = useActiveBillingConfig();
    const org = useOrganization();

    const attendanceReport = useAttendanceReport(
        selectedReportChildId ? parseInt(selectedReportChildId) : null,
        selectedYear,
        selectedMonth + 1
    );

    // Mutations
    const createChild = useCreateDaycareChild();
    const updateChild = useUpdateDaycareChild();
    const createInquiry = useCreateDaycareInquiry();
    const createEnrollmentMutation = useCreateEnrollment();
    const checkIn = useCheckInChild();
    const checkOut = useCheckOutChild();
    const recordPayment = useRecordPayment();
    const updateBillingConfig = useUpdateBillingConfig();
    const queryClient = useQueryClient();

    const deleteChildMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/daycare/children/${id}`);
            if (!res.ok) throw new Error("Failed to delete child");
            return;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/children"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
            toast({ title: "Child deleted successfully" });
        }
    });

    const deleteEnrollmentMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/daycare/enrollments/${id}`);
            if (!res.ok) throw new Error("Failed to delete enrollment");
            return;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/enrollments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
            toast({ title: "Enrollment deleted successfully" });
        }
    });

    const deletePaymentMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/daycare/payments/${id}`);
            if (!res.ok) throw new Error("Failed to delete payment");
            return;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
            toast({ title: "Payment deleted successfully" });
        }
    });

    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [recordPaymentChildId, setRecordPaymentChildId] = useState<string>("");
    const [recordPaymentMode, setRecordPaymentMode] = useState<string>("");

    const updatePaymentMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("PUT", `/api/daycare/payments/${data.id}`, data.updates);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
            toast({ title: "Payment recorded successfully" });
            setSelectedPayment(null);
        }
    });

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper function to calculate monthly billing
    const calculateMonthlyBilling = (childId: number) => {
        const childEnrollment = enrollments.data?.find((e: any) => e.childId === childId && e.status === 'active');
        if (!childEnrollment) return null;

        const hourlyRate = parseFloat(childEnrollment.customHourlyRate || billingConfig.data?.hourlyRate || '0');

        // Get attendance for the month
        const monthAttendance = todayAttendance.data?.filter((a: any) => {
            const date = new Date(a.attendanceDate);
            return a.enrollmentId === childEnrollment.id &&
                date.getMonth() === selectedMonth &&
                date.getFullYear() === selectedYear;
        }) || [];

        const totalDays = monthAttendance.length;
        const totalMinutes = monthAttendance.reduce((sum: number, a: any) => sum + (a.durationMinutes || 0), 0);
        const totalHours = totalMinutes / 60;
        const amountDue = totalHours * hourlyRate;

        return {
            totalDays,
            totalHours: totalHours.toFixed(2),
            hourlyRate,
            amountDue: amountDue.toFixed(2)
        };
    };

    return (
        <div className="min-h-screen app-bg-gradient transition-all duration-300">
            <Header
                title="Daycare Management"
                subtitle="Manage day to day operations, children, and billing"
            />

            <div className="px-6 pt-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b">
                    {/* Tab Navigation */}
                    <div className="flex gap-2 -mb-px w-full">
                        <Button
                            variant={activeTab === "dashboard" ? "default" : "ghost"}
                            onClick={() => setActiveTab("dashboard")}
                            className="rounded-b-none flex-1"
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            variant={activeTab === "operations" ? "default" : "ghost"}
                            onClick={() => setActiveTab("operations")}
                            className="rounded-b-none flex-1"
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            Daily Operations
                        </Button>
                        <Button
                            variant={activeTab === "children" ? "default" : "ghost"}
                            onClick={() => setActiveTab("children")}
                            className="rounded-b-none flex-1"
                        >
                            <Baby className="h-4 w-4 mr-2" />
                            Children & Plans
                        </Button>
                        <Button
                            variant={activeTab === "billing" ? "default" : "ghost"}
                            onClick={() => setActiveTab("billing")}
                            className="rounded-b-none flex-1"
                        >
                            <IndianRupee className="h-4 w-4 mr-2" />
                            Billing & Payments
                        </Button>
                        <Button
                            variant={activeTab === "reports" ? "default" : "ghost"}
                            onClick={() => setActiveTab("reports")}
                            className="rounded-b-none flex-1"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Reports
                        </Button>
                    </div>
                </div>
            </div>

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (<div className="space-y-6 px-6 py-6">
                {/* Quick Actions */}
                <div className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Quick Check-In
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Quick Check-In</DialogTitle>
                                <DialogDescription>Check in a child for today</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                checkIn.mutate({
                                    enrollmentId: parseInt(formData.get('enrollmentId') as string),
                                    checkInTime: new Date().toISOString()
                                }, {
                                    onSuccess: () => {
                                        toast({ title: "Child checked in successfully" });
                                        e.currentTarget.reset();
                                    }
                                });
                            }}>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="enrollmentId">Select Child *</Label>
                                        <Select name="enrollmentId" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a child" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {enrollments.data?.filter((e: any) => e.status === 'active').map((enrollment: any) => {
                                                    const child = children.data?.find((c: any) => c.id === enrollment.childId);
                                                    return (
                                                        <SelectItem key={enrollment.id} value={enrollment.id.toString()}>
                                                            {child?.childName || `Enrollment #${enrollment.enrollmentNumber}`}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                                        Check In
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <LogOut className="h-4 w-4 mr-2" />
                                Quick Check-Out
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Quick Check-Out</DialogTitle>
                                <DialogDescription>Check out a child</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                checkOut.mutate({
                                    id: parseInt(formData.get('attendanceId') as string),
                                    checkOutTime: new Date().toISOString(),
                                    userId: 1
                                }, {
                                    onSuccess: () => {
                                        toast({ title: "Child checked out successfully" });
                                        e.currentTarget.reset();
                                    }
                                });
                            }}>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="attendanceId">Select Child *</Label>
                                        <Select name="attendanceId" required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a child" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {checkedIn.data?.map((attendance: any) => {
                                                    const enrollment = enrollments.data?.find((e: any) => e.id === attendance.enrollmentId);
                                                    const child = children.data?.find((c: any) => c.id === enrollment?.childId);
                                                    return (
                                                        <SelectItem key={attendance.id} value={attendance.id.toString()}>
                                                            {child?.childName || `Enrollment #${enrollment?.enrollmentNumber}`}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Check Out</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardDescription>Total Children</CardDescription>
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-600" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl">
                                {stats.isLoading ? "..." : stats.data?.totalChildren || 0}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Registered in daycare</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardDescription>Checked In</CardDescription>
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <UserCheck className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl">
                                {stats.isLoading ? "..." : stats.data?.currentlyCheckedIn || 0}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Currently present</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardDescription>Active Enrollments</CardDescription>
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl">
                                {stats.isLoading ? "..." : stats.data?.activeEnrollments || 0}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">Monthly plans active</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardDescription>Month Revenue</CardDescription>
                                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                    <IndianRupee className="h-5 w-5 text-teal-600" />
                                </div>
                            </div>
                            <CardTitle className="text-3xl">
                                ₹{stats.isLoading ? "..." : (stats.data?.monthRevenue || 0).toLocaleString('en-IN')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">This month's earnings</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Currently Checked In */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="bg-white lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Currently Checked In</CardTitle>
                            <CardDescription>
                                {checkedIn.data?.length || 0} children currently in daycare
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {checkedIn.isLoading ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : !checkedIn.data || checkedIn.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                        <p>No children checked in</p>
                                    </div>
                                ) : (
                                    checkedIn.data.map((attendance: any) => {
                                        const enrollment = enrollments.data?.find((e: any) => e.id === attendance.enrollmentId);
                                        const child = children.data?.find((c: any) => c.id === enrollment?.childId);
                                        const checkInTime = new Date(attendance.checkInTime);
                                        const duration = Math.floor((currentTime.getTime() - checkInTime.getTime()) / (1000 * 60));
                                        const hours = Math.floor(duration / 60);
                                        const minutes = duration % 60;

                                        return (
                                            <div key={attendance.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                        {child?.childName?.substring(0, 2).toUpperCase() || 'CH'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{child?.childName || 'Unknown Child'}</p>
                                                        <p className="text-sm text-gray-600">Parent: {child?.parentName}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Clock className="h-3 w-3 text-gray-500" />
                                                            <span className="text-xs text-gray-500">
                                                                In for {hours}h {minutes}m • Since {checkInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => {
                                                        checkOut.mutate({
                                                            id: attendance.id,
                                                            checkOutTime: new Date().toISOString(),
                                                            userId: 1
                                                        });
                                                    }}
                                                >
                                                    Check Out
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="bg-white">
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                            <CardDescription>Today's overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">Today's Check-ins</p>
                                        <p className="text-2xl font-bold">{todayAttendance.data?.filter((a: any) => a.checkInTime).length || 0}</p>
                                    </div>
                                    <UserCheck className="h-8 w-8 text-green-500" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">Today's Check-outs</p>
                                        <p className="text-2xl font-bold">{todayAttendance.data?.filter((a: any) => a.checkOutTime).length || 0}</p>
                                    </div>
                                    <LogOut className="h-8 w-8 text-gray-500" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">Pending Payments</p>
                                        <p className="text-2xl font-bold">{stats.data?.pendingPayments || 0}</p>
                                    </div>
                                    <IndianRupee className="h-8 w-8 text-amber-500" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-600">New Inquiries</p>
                                        <p className="text-2xl font-bold">{stats.data?.newInquiries || 0}</p>
                                    </div>
                                    <UserPlus className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>)}

            {/* Daily Operations Tab */}
            {activeTab === "operations" && (<div className="space-y-6 px-6 py-6">
                <Card className="bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Daily Attendance</CardTitle>
                                <CardDescription>Track check-ins and check-outs for {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span className="font-mono">{currentTime.toLocaleTimeString('en-IN')}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <UserCheck className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-700">
                                        {todayAttendance.data?.filter((a: any) => a.checkInTime && !a.checkOutTime).length || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Currently In</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                                    <LogOut className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-700">
                                        {todayAttendance.data?.filter((a: any) => a.checkOutTime).length || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Checked Out</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-700">
                                        {todayAttendance.data?.length || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Total Today</p>
                                </div>
                            </div>
                        </div>

                        {/* Search */}
                        <SearchInput
                            placeholder="Search children..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            wrapperClassName="mb-6"
                        />

                        {/* Attendance List */}
                        <div className="space-y-3">
                            {todayAttendance.isLoading ? (
                                <div className="text-center py-8 text-gray-500">Loading...</div>
                            ) : !todayAttendance.data || todayAttendance.data.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p>No attendance records today</p>
                                </div>
                            ) : (
                                todayAttendance.data
                                    .filter((attendance: any) => {
                                        if (!searchQuery) return true;
                                        const enrollment = enrollments.data?.find((e: any) => e.id === attendance.enrollmentId);
                                        const child = children.data?.find((c: any) => c.id === enrollment?.childId);
                                        return child?.childName?.toLowerCase().includes(searchQuery.toLowerCase());
                                    })
                                    .map((attendance: any) => {
                                        const enrollment = enrollments.data?.find((e: any) => e.id === attendance.enrollmentId);
                                        const child = children.data?.find((c: any) => c.id === enrollment?.childId);
                                        const isCheckedIn = attendance.checkInTime && !attendance.checkOutTime;
                                        const isCheckedOut = attendance.checkOutTime;
                                        const checkInTime = attendance.checkInTime ? new Date(attendance.checkInTime) : null;
                                        const checkOutTime = attendance.checkOutTime ? new Date(attendance.checkOutTime) : null;
                                        const duration = checkInTime ? Math.floor(((checkOutTime || currentTime).getTime() - checkInTime.getTime()) / (1000 * 60)) : 0;
                                        const hours = Math.floor(duration / 60);
                                        const minutes = duration % 60;

                                        return (
                                            <div key={attendance.id} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isCheckedIn ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                }`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${isCheckedIn ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}>
                                                        {child?.childName?.substring(0, 2).toUpperCase() || 'CH'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{child?.childName || 'Unknown Child'}</p>
                                                        <p className="text-sm text-gray-600">Parent: {child?.parentName}</p>
                                                        {checkInTime && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Clock className="h-3 w-3 text-gray-500" />
                                                                <span className="text-xs text-gray-500">
                                                                    {checkInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                    {checkOutTime && ` - ${checkOutTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                                                                    {' • '}{hours}h {minutes}m
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isCheckedIn && (
                                                        <>
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                ✓ Checked In
                                                            </Badge>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => {
                                                                    checkOut.mutate({
                                                                        id: attendance.id,
                                                                        checkOutTime: new Date().toISOString(),
                                                                        userId: 1
                                                                    });
                                                                }}
                                                            >
                                                                Check Out
                                                            </Button>
                                                        </>
                                                    )}
                                                    {isCheckedOut && (
                                                        <Badge variant="secondary">
                                                            ✓ Checked Out
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>)}

            {/* Children & Plans Tab */}
            {activeTab === "children" && (<div className="space-y-6 px-6 py-6">
                <Card className="bg-white">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Children & Monthly Plans</CardTitle>
                                <CardDescription>Manage child profiles and enrollment plans</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Dialog open={isAddChildOpen} onOpenChange={setIsAddChildOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700">
                                            <Plus className="mr-2 h-4 w-4" /> Add Child
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Add New Child</DialogTitle>
                                            <DialogDescription>Register a new child in the daycare</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget; // Capture form reference
                                            const formData = new FormData(form);
                                            const data = {
                                                childName: formData.get('childName'),
                                                dateOfBirth: formData.get('dateOfBirth'),
                                                gender: formData.get('gender'),
                                                parentName: formData.get('parentName'),
                                                parentPhone: formData.get('parentPhone'),
                                                parentEmail: formData.get('parentEmail'),
                                                address: formData.get('address'),
                                                emergencyContactName: formData.get('emergencyContactName'),
                                                emergencyContactRelation: 'Guardian',
                                                emergencyContactPhone: formData.get('emergencyContactPhone'),
                                                bloodGroup: formData.get('bloodGroup'),
                                                allergies: formData.get('allergies'),
                                                medicalConditions: formData.get('medicalConditions'),
                                                status: 'active'
                                            };
                                            createChild.mutate(data, {
                                                onSuccess: () => {
                                                    // Close modal first to ensure it happens even if other operations fail
                                                    setIsAddChildOpen(false);

                                                    // Force immediate refetch to show new child
                                                    queryClient.refetchQueries({ queryKey: ["/api/daycare/children"] });
                                                    queryClient.refetchQueries({ queryKey: ["/api/daycare/stats"] });

                                                    toast({
                                                        title: "Child profile created",
                                                        description: `${data.childName} has been added successfully.`
                                                    });
                                                    form.reset(); // Use captured form reference
                                                },
                                                onError: (error: any) => { // Added type for error
                                                    toast({
                                                        title: "Failed to create profile",
                                                        description: error.message,
                                                        variant: "destructive"
                                                    });
                                                }
                                            });
                                        }}
                                            className="space-y-4 py-4"
                                        >
                                            <div className="space-y-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="childName">Child Name *</Label>
                                                        <Input id="childName" name="childName" required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                                                        <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="gender">Gender</Label>
                                                    <Select name="gender">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="male">Male</SelectItem>
                                                            <SelectItem value="female">Female</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="parentName">Parent Name *</Label>
                                                        <Input id="parentName" name="parentName" required />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="parentPhone">Parent Phone *</Label>
                                                        <Input id="parentPhone" name="parentPhone" required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="parentEmail">Parent Email</Label>
                                                    <Input id="parentEmail" name="parentEmail" type="email" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="address">Address</Label>
                                                    <Textarea id="address" name="address" rows={2} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="emergencyContactName">Emergency Contact</Label>
                                                        <Input id="emergencyContactName" name="emergencyContactName" />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="emergencyContactPhone">Emergency Phone</Label>
                                                        <Input id="emergencyContactPhone" name="emergencyContactPhone" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="bloodGroup">Blood Group</Label>
                                                    <Input id="bloodGroup" name="bloodGroup" placeholder="e.g., O+" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="allergies">Allergies</Label>
                                                    <Textarea id="allergies" name="allergies" rows={2} placeholder="List any allergies" />
                                                </div>
                                                <div>
                                                    <Label htmlFor="medicalConditions">Medical Conditions</Label>
                                                    <Textarea id="medicalConditions" name="medicalConditions" rows={2} />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                                    Add Child
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                {/* Edit Child Modal */}
                                <Dialog open={isEditChildOpen} onOpenChange={setIsEditChildOpen}>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Child Profile</DialogTitle>
                                            <DialogDescription>Update child information</DialogDescription>
                                        </DialogHeader>
                                        {editingChild && (
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.currentTarget);
                                                const data = {
                                                    childName: formData.get('childName'),
                                                    dateOfBirth: formData.get('dateOfBirth'),
                                                    gender: formData.get('gender'),
                                                    parentName: formData.get('parentName'),
                                                    parentPhone: formData.get('parentPhone'),
                                                    parentEmail: formData.get('parentEmail'),
                                                    address: formData.get('address'),
                                                    emergencyContactName: formData.get('emergencyContactName'),
                                                    emergencyContactRelation: 'Guardian',
                                                    emergencyContactPhone: formData.get('emergencyContactPhone'),
                                                    bloodGroup: formData.get('bloodGroup'),
                                                    allergies: formData.get('allergies'),
                                                    medicalConditions: formData.get('medicalConditions'),
                                                };
                                                updateChild.mutate({
                                                    id: editingChild.id,
                                                    updates: data
                                                }, {
                                                    onSuccess: () => {
                                                        setIsEditChildOpen(false);
                                                        setEditingChild(null);
                                                        queryClient.refetchQueries({ queryKey: ["/api/daycare/children"] });
                                                        toast({
                                                            title: "Profile updated",
                                                            description: `${data.childName}'s information has been updated.`
                                                        });
                                                    },
                                                    onError: (error: any) => {
                                                        toast({
                                                            title: "Update failed",
                                                            description: error.message,
                                                            variant: "destructive"
                                                        });
                                                    }
                                                });
                                            }}
                                                className="space-y-4 py-4"
                                            >
                                                <div className="space-y-4 py-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="edit_childName">Child Name *</Label>
                                                            <Input id="edit_childName" name="childName" defaultValue={editingChild.childName} required />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit_dateOfBirth">Date of Birth *</Label>
                                                            <Input id="edit_dateOfBirth" name="dateOfBirth" type="date" defaultValue={editingChild.dateOfBirth?.split('T')[0]} required />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit_gender">Gender</Label>
                                                        <Select name="gender" defaultValue={editingChild.gender}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select gender" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="male">Male</SelectItem>
                                                                <SelectItem value="female">Female</SelectItem>
                                                                <SelectItem value="other">Other</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="edit_parentName">Parent Name *</Label>
                                                            <Input id="edit_parentName" name="parentName" defaultValue={editingChild.parentName} required />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit_parentPhone">Parent Phone *</Label>
                                                            <Input id="edit_parentPhone" name="parentPhone" defaultValue={editingChild.parentPhone} required />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit_parentEmail">Parent Email</Label>
                                                        <Input id="edit_parentEmail" name="parentEmail" type="email" defaultValue={editingChild.parentEmail || ''} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit_address">Address</Label>
                                                        <Textarea id="edit_address" name="address" rows={2} defaultValue={editingChild.address || ''} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="edit_emergencyContactName">Emergency Contact</Label>
                                                            <Input id="edit_emergencyContactName" name="emergencyContactName" defaultValue={editingChild.emergencyContactName || ''} />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="edit_emergencyContactPhone">Emergency Phone</Label>
                                                            <Input id="edit_emergencyContactPhone" name="emergencyContactPhone" defaultValue={editingChild.emergencyContactPhone || ''} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit_bloodGroup">Blood Group</Label>
                                                        <Input id="edit_bloodGroup" name="bloodGroup" placeholder="e.g., O+" defaultValue={editingChild.bloodGroup || ''} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit_allergies">Allergies</Label>
                                                        <Textarea id="edit_allergies" name="allergies" rows={2} placeholder="List any allergies" defaultValue={editingChild.allergies || ''} />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit_medicalConditions">Medical Conditions</Label>
                                                        <Textarea id="edit_medicalConditions" name="medicalConditions" rows={2} defaultValue={editingChild.medicalConditions || ''} />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => {
                                                        setIsEditChildOpen(false);
                                                        setEditingChild(null);
                                                    }}>
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updateChild.isPending}>
                                                        {updateChild.isPending ? "Updating..." : "Update Child"}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        )}
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={isEnrollmentOpen} onOpenChange={setIsEnrollmentOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Enrollment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Create Monthly Plan Enrollment</DialogTitle>
                                            <DialogDescription>Enroll a child in a monthly plan with custom rates and advance payment</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget; // Capture form reference
                                            const formData = new FormData(form);
                                            const childId = parseInt(formData.get('childId') as string);
                                            const rate = parseFloat(enrollmentRate);
                                            const days = parseFloat(enrollmentDays);
                                            const hours = parseFloat(dailyHours);
                                            const amount = parseFloat(paymentAmount);
                                            // const paymentMode = formData.get('paymentMode') as string; // Removed
                                            // const transactionId = formData.get('transactionId') as string; // Removed

                                            // Create enrollment with custom rate
                                            createEnrollmentMutation.mutate({
                                                childId,
                                                startDate: formData.get('startDate'),
                                                endDate: formData.get('endDate'),
                                                status: 'active',
                                                customHourlyRate: enrollmentRate,
                                                customMonthlyRate: (rate * days).toString() // Explicit formula: Hourly Rate * Total Hours
                                            }, {
                                                onSuccess: (enrollment) => {
                                                    // Force immediate refetch instead of just invalidating
                                                    queryClient.refetchQueries({ queryKey: ["/api/daycare/enrollments"] });
                                                    queryClient.refetchQueries({ queryKey: ["/api/daycare/stats"] });

                                                    toast({ title: "Enrollment created successfully" });

                                                    // Record explicit monthly fee payment as PENDING
                                                    if (amount > 0) {
                                                        recordPayment.mutate({
                                                            childId,
                                                            amount: amount,
                                                            paymentMode: '', // Empty for pending
                                                            userId: 1,
                                                            paymentType: 'monthly_fee',
                                                            enrollmentId: enrollment.id,
                                                            status: 'pending' // Mark as pending
                                                        }, {
                                                            onSuccess: () => {
                                                                toast({
                                                                    title: "Initial bill generated",
                                                                    description: `₹${amount} added to pending payments`
                                                                });
                                                            }
                                                        });
                                                    }

                                                    form.reset(); // Use captured form reference
                                                    // Reset state
                                                    setDailyHours('8');
                                                    setPaymentAmount('');
                                                },
                                                onError: (error: any) => {
                                                    toast({
                                                        title: "Failed to create enrollment",
                                                        description: error.message,
                                                        variant: "destructive"
                                                    });
                                                },
                                                onSettled: () => {
                                                    // Always close modal when mutation settles (success or error)
                                                    setIsEnrollmentOpen(false);
                                                }
                                            });
                                        }}>
                                            <div className="space-y-4 py-4">
                                                {/* Child Selection */}
                                                <div>
                                                    <Label htmlFor="childId">Select Child *</Label>
                                                    <Select name="childId" required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a child" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {children.data?.map((child: any) => (
                                                                <SelectItem key={child.id} value={child.id.toString()}>
                                                                    {child.childName} ({child.childId})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Start Date */}
                                                <div>
                                                    <Label htmlFor="startDate">Start Date *</Label>
                                                    <Input id="startDate" name="startDate" type="date" required />
                                                </div>

                                                {/* End Date */}
                                                <div>
                                                    <Label htmlFor="endDate">End Date *</Label>
                                                    <Input id="endDate" name="endDate" type="date" required />
                                                    <p className="text-xs text-gray-500 mt-1">Enrollment will expire on this date. Parent will be notified 1 day before expiration.</p>
                                                </div>

                                                {/* Billing Details Section */}
                                                <div className="border-t pt-4 mt-4">
                                                    <h4 className="font-semibold text-sm mb-3">Billing Details</h4>

                                                    <div className="grid grid-cols-3 gap-4">
                                                        {/* Hourly Rate */}
                                                        <div>
                                                            <Label htmlFor="customHourlyRate">Hourly Rate (₹) *</Label>
                                                            <Input
                                                                id="customHourlyRate"
                                                                name="customHourlyRate"
                                                                type="number"
                                                                step="0.01"
                                                                value={enrollmentRate}
                                                                onChange={(e) => setEnrollmentRate(e.target.value)}
                                                                required
                                                                placeholder="Enter hourly rate"
                                                            />
                                                        </div>

                                                        {/* Monthly Days */}
                                                        <div>
                                                            <Label htmlFor="monthlyDays">Total Monthly Hours *</Label>
                                                            <Input
                                                                id="monthlyDays"
                                                                name="monthlyDays"
                                                                type="number"
                                                                value={enrollmentDays}
                                                                onChange={(e) => setEnrollmentDays(e.target.value)}
                                                                required
                                                                placeholder="e.g., 60"
                                                            />
                                                        </div>

                                                    </div>

                                                    {/* Calculation Preview */}
                                                    {enrollmentRate && enrollmentDays && (
                                                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                                                            <p className="text-sm text-blue-800 font-medium">Calculation Summary</p>
                                                            <div className="flex flex-col gap-1 text-sm mt-1 text-blue-900">
                                                                <span>Hourly Rate × Total Hours = Monthly Fee</span>
                                                                <span>₹{enrollmentRate} × {enrollmentDays} hours = <strong>₹{paymentAmount}</strong></span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Payment Section - Renamed to Bill Generation */}
                                                <div className="border-t pt-4 mt-4">
                                                    <h4 className="font-semibold text-sm mb-3">Initial Bill Generation</h4>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        {/* Payment Amount */}
                                                        <div>
                                                            <Label htmlFor="amount">Bill Amount (₹)</Label>
                                                            <Input
                                                                id="amount"
                                                                name="amount"
                                                                type="number"
                                                                step="0.01"
                                                                value={paymentAmount}
                                                                onChange={(e) => setPaymentAmount(e.target.value)}
                                                                placeholder="0.00"
                                                                readOnly // Make it read-only as it's calculated
                                                                className="bg-gray-50"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">This amount will be added to pending payments.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={createEnrollmentMutation.isPending}>
                                                    {createEnrollmentMutation.isPending ? "Processing..." : "Create Enrollment & Generate Bill"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Search */}
                        <SearchInput
                            placeholder="Search by name or parent..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            wrapperClassName="mb-6"
                        />

                        {children.isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : !children.data || children.data.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Baby className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <p>No children registered</p>
                                <p className="text-sm mt-2">Click "Add Child" to register</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="children_list" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4 bg-purple-50 p-1 rounded-lg">
                                    <TabsTrigger
                                        value="children_list"
                                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                                    >
                                        Children Directory
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="enrollments_list"
                                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                                    >
                                        Enrollments
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="children_list">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Child</TableHead>
                                                <TableHead>Age</TableHead>
                                                <TableHead>Parent / Guardian</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Enrollment Status</TableHead>
                                                <TableHead>Plan Type</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {children.data
                                                .filter((child: any) => {
                                                    if (!searchQuery) return true;
                                                    return child.childName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                        child.parentName?.toLowerCase().includes(searchQuery.toLowerCase());
                                                })
                                                .map((child: any) => {
                                                    const age = child.ageYears || (child.dateOfBirth ? Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : '-');
                                                    const enrollment = enrollments.data?.find((e: any) => e.childId === child.id && e.status === 'active');

                                                    return (
                                                        <TableRow key={child.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-9 w-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold">
                                                                        {child.childName.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium">{child.childName}</p>
                                                                        <p className="text-xs text-gray-500">{child.childId}</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{age} yrs</TableCell>
                                                            <TableCell>{child.parentName}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-1">
                                                                    <a
                                                                        href={`tel:${child.parentPhone}`}
                                                                        className="text-sm font-medium text-purple-600 hover:text-purple-800 flex items-center gap-2"
                                                                    >
                                                                        <Phone className="h-3 w-3" />
                                                                        {child.parentPhone || "No Phone"}
                                                                    </a>
                                                                    {child.parentEmail && (
                                                                        <a
                                                                            href={`mailto:${child.parentEmail}`}
                                                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-2"
                                                                        >
                                                                            <Mail className="h-3 w-3" />
                                                                            {child.parentEmail}
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {enrollment ? (
                                                                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                                                                ) : (
                                                                    <Badge variant="secondary">Not Enrolled</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {enrollment ? (
                                                                    <Badge variant="outline">Monthly Plan</Badge>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0"
                                                                        onClick={() => setSelectedChild(child)}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                                        onClick={() => {
                                                                            setEditingChild(child);
                                                                            setIsEditChildOpen(true);
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => {
                                                                            if (confirm(`Are you sure you want to delete ${child.childName}? This will remove them from the active list.`)) {
                                                                                deleteChildMutation.mutate(child.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </TabsContent>

                                <TabsContent value="enrollments_list">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Enrollment #</TableHead>
                                                <TableHead>Child Name</TableHead>
                                                <TableHead>Start Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {enrollments.data?.map((enrollment: any) => {
                                                const child = children.data?.find((c: any) => c.id === enrollment.childId);
                                                return (
                                                    <TableRow key={enrollment.id}>
                                                        <TableCell className="font-mono">{enrollment.enrollmentNumber}</TableCell>
                                                        <TableCell>
                                                            {child ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold">
                                                                        {child.childName.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <span className="font-medium">{child.childName}</span>
                                                                </div>
                                                            ) : 'Unknown Child'}
                                                        </TableCell>
                                                        <TableCell>{new Date(enrollment.startDate).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'} className={enrollment.status === 'active' ? 'bg-green-100 text-green-700' : ''}>
                                                                {enrollment.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => {
                                                                    if (confirm("Are you sure you want to delete this enrollment? This will NOT delete the child profile.")) {
                                                                        deleteEnrollmentMutation.mutate(enrollment.id);
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {(!enrollments.data || enrollments.data.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                        No active enrollments found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TabsContent>
                            </Tabs>
                        )}

                        <Dialog open={!!selectedChild} onOpenChange={(open) => !open && setSelectedChild(null)}>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Child Profile: {selectedChild?.childName}</DialogTitle>
                                    <DialogDescription>
                                        Student ID: {selectedChild?.childId}
                                    </DialogDescription>
                                </DialogHeader>

                                {selectedChild && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-lg text-purple-700 border-b pb-2">Personal Details</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <span className="text-gray-500">Age:</span>
                                                <span>
                                                    {selectedChild.dateOfBirth && Math.floor((new Date().getTime() - new Date(selectedChild.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                                                </span>
                                                <span className="text-gray-500">Gender:</span>
                                                <span className="capitalize">{selectedChild.gender || '-'}</span>
                                                <span className="text-gray-500">Blood Group:</span>
                                                <span>{selectedChild.bloodGroup || '-'}</span>
                                                <span className="text-gray-500">Date of Birth:</span>
                                                <span>{selectedChild.dateOfBirth ? new Date(selectedChild.dateOfBirth).toLocaleDateString('en-IN') : '-'}</span>
                                            </div>

                                            <h4 className="font-semibold text-lg text-purple-700 border-b pb-2 mt-6">Emergency Contact</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <span className="text-gray-500">Contact Name:</span>
                                                <span className="font-medium">{selectedChild.emergencyContactName || '-'}</span>
                                                <span className="text-gray-500">Relationship:</span>
                                                <span className="capitalize">{selectedChild.emergencyContactRelation || '-'}</span>
                                                <span className="text-gray-500">Phone:</span>
                                                <span>{selectedChild.emergencyContactPhone || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-lg text-purple-700 border-b pb-2">Parent / Guardian</h4>
                                            <div className="grid grid-cols-1 gap-3 text-sm">
                                                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                        <User2 className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{selectedChild.parentName}</p>
                                                        <p className="text-xs text-gray-500">Primary Guardian</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <a
                                                        href={`tel:${selectedChild.parentPhone}`}
                                                        className="flex items-center gap-3 text-purple-600 hover:text-purple-800 transition-colors"
                                                    >
                                                        <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                                            <Phone className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-medium">{selectedChild.parentPhone || "No Phone Number"}</span>
                                                    </a>
                                                    {selectedChild.parentEmail && (
                                                        <a
                                                            href={`mailto:${selectedChild.parentEmail}`}
                                                            className="flex items-center gap-3 text-blue-600 hover:text-blue-800 transition-colors"
                                                        >
                                                            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                                                <Mail className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-medium">{selectedChild.parentEmail}</span>
                                                        </a>
                                                    )}
                                                </div>

                                                <div className="mt-4">
                                                    <h5 className="font-medium text-gray-900 mb-2">Address</h5>
                                                    <p className="text-gray-600 bg-gray-50 p-3 rounded text-xs leading-relaxed">
                                                        {selectedChild.address}
                                                        {selectedChild.city && `, ${selectedChild.city}`}
                                                        {selectedChild.state && `, ${selectedChild.state}`}
                                                        {selectedChild.pincode && ` - ${selectedChild.pincode}`}
                                                    </p>
                                                </div>

                                                {(selectedChild.allergies || selectedChild.medicalConditions) && (
                                                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded">
                                                        <div className="flex items-center gap-2 text-red-800 mb-2">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <span className="font-semibold">Medical Info</span>
                                                        </div>
                                                        {selectedChild.allergies && (
                                                            <p className="text-xs text-red-700 mb-1"><span className="font-medium">Allergies:</span> {selectedChild.allergies}</p>
                                                        )}
                                                        {selectedChild.medicalConditions && (
                                                            <p className="text-xs text-red-700"><span className="font-medium">Conditions:</span> {selectedChild.medicalConditions}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>)
            }

            {/* Billing & Payments Tab */}
            {
                activeTab === "billing" && (<div className="space-y-6 px-6 py-6">
                    <Card className="bg-white">
                        <CardHeader>
                            <div className="flex items-end justify-between">
                                <div>
                                    <CardTitle>Billing & Payments History</CardTitle>
                                    <CardDescription>Track all payment records and transactions</CardDescription>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-600 hover:bg-purple-700">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Record Payment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Record Payment</DialogTitle>
                                            <DialogDescription>Record a payment with transaction details</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);

                                            // Validate required fields from controlled state
                                            if (!recordPaymentChildId || !recordPaymentMode) {
                                                toast({
                                                    title: "Missing Information",
                                                    description: "Please select a child and payment mode",
                                                    variant: "destructive"
                                                });
                                                return;
                                            }

                                            const amount = parseFloat(formData.get('amount') as string);
                                            if (isNaN(amount) || amount <= 0) {
                                                toast({
                                                    title: "Invalid Amount",
                                                    description: "Please enter a valid amount",
                                                    variant: "destructive"
                                                });
                                                return;
                                            }

                                            recordPayment.mutate({
                                                childId: parseInt(recordPaymentChildId),
                                                amount: amount,
                                                paymentMode: recordPaymentMode,
                                                transactionId: formData.get('transactionId') as string || undefined,
                                                userId: 1,
                                                paymentType: 'monthly_fee',
                                                status: 'completed'
                                            }, {
                                                onSuccess: () => {
                                                    toast({ title: "Payment recorded successfully" });
                                                    e.currentTarget.reset();
                                                    setRecordPaymentChildId("");
                                                    setRecordPaymentMode("");
                                                }
                                            });
                                        }}>
                                            <div className="space-y-4 py-4">
                                                <div>
                                                    <Label htmlFor="childId">Select Child *</Label>
                                                    <Select value={recordPaymentChildId} onValueChange={setRecordPaymentChildId} required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a child" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {children.data?.map((child: any) => (
                                                                <SelectItem key={child.id} value={child.id.toString()}>
                                                                    {child.childName} ({child.childId})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="amount">Amount (₹) *</Label>
                                                    <Input id="amount" name="amount" type="number" step="0.01" required />
                                                </div>
                                                <div>
                                                    <Label htmlFor="paymentMode">Payment Mode *</Label>
                                                    <Select value={recordPaymentMode} onValueChange={setRecordPaymentMode} required>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select mode" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="UPI">UPI</SelectItem>
                                                            <SelectItem value="Cash">Cash</SelectItem>
                                                            <SelectItem value="Card">Card</SelectItem>
                                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="transactionId">Transaction ID</Label>
                                                    <Input id="transactionId" name="transactionId" placeholder="Optional" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={recordPayment.isPending}>
                                                    {recordPayment.isPending ? "Recording..." : "Record Payment"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>



                            {/* Payment History */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                                {payments.isLoading ? (
                                    <div className="text-center py-8">Loading...</div>
                                ) : !payments.data || payments.data.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <IndianRupee className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                        <p>No payments recorded</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Receipt #</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Child</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead>Mode</TableHead>
                                                <TableHead>Transaction ID</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {payments.data.map((payment: any) => {
                                                const child = children.data?.find((c: any) => c.id === payment.childId);
                                                return (
                                                    <TableRow key={payment.id}>
                                                        <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                                                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</TableCell>
                                                        <TableCell>{child?.childName || 'Unknown'}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            ₹{parseFloat(payment.totalAmount).toLocaleString('en-IN')}
                                                        </TableCell>
                                                        <TableCell className="capitalize">{payment.paymentMode?.replace('_', ' ')}</TableCell>
                                                        <TableCell className="font-mono text-xs">{payment.transactionId || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                                                {payment.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end items-center gap-1">
                                                                {payment.status === 'completed' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                                        onClick={() => generateDaycareReceiptPDF({
                                                                            receiptNumber: payment.receiptNumber,
                                                                            paymentDate: payment.paymentDate,
                                                                            childName: child?.childName || 'N/A',
                                                                            amount: payment.totalAmount,
                                                                            paymentMode: payment.paymentMode,
                                                                            transactionId: payment.transactionId,
                                                                            organization: {
                                                                                name: org.name,
                                                                                address: org.address,
                                                                                phone: org.phone
                                                                            }
                                                                        })}
                                                                        title="Print Receipt"
                                                                    >
                                                                        <FileText className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                {payment.status === 'pending' && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-7 bg-amber-500 hover:bg-amber-600 text-white px-2"
                                                                        onClick={() => setSelectedPayment(payment)}
                                                                    >
                                                                        Pay
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => {
                                                                        if (confirm("Are you sure you want to delete this payment record?")) {
                                                                            deletePaymentMutation.mutate(payment.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>)
            }

            {
                activeTab === "reports" && (<div className="space-y-6 px-6 py-6">
                    <Card className="bg-white">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Reports & Analytics</CardTitle>
                                    <CardDescription>Attendance and revenue reports</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="w-48">
                                        <Select
                                            value={selectedReportChildId}
                                            onValueChange={setSelectedReportChildId}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select child" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {children.data?.map((child: any) => (
                                                    <SelectItem key={child.id} value={child.id.toString()}>
                                                        {child.childName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-32">
                                        <Select
                                            value={selectedMonth.toString()}
                                            onValueChange={(val) => setSelectedMonth(parseInt(val))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 12 }, (_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Select
                                            value={selectedYear.toString()}
                                            onValueChange={(val) => setSelectedYear(parseInt(val))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2024, 2025, 2026].map(year => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (!attendanceReport.data) return;
                                            const child = children.data?.find((c: any) => c.id === parseInt(selectedReportChildId));
                                            generateDaycareAttendancePDF({
                                                childName: child?.childName || "N/A",
                                                parentName: child?.parentName || "N/A",
                                                month: new Date(0, selectedMonth).toLocaleString('default', { month: 'long' }),
                                                year: selectedYear,
                                                totalDays: attendanceReport.data.totalDays,
                                                totalHours: attendanceReport.data.totalHours.toFixed(2),
                                                attendances: attendanceReport.data.attendances,
                                                organization: {
                                                    name: org.name,
                                                    address: org.address,
                                                    phone: org.phone
                                                }
                                            });
                                        }}
                                        disabled={!selectedReportChildId || attendanceReport.isLoading}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export PDF
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!selectedReportChildId ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Baby className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p>Please select a child to view the attendance report</p>
                                </div>
                            ) : attendanceReport.isLoading ? (
                                <div className="text-center py-12">Loading report data...</div>
                            ) : !attendanceReport.data || attendanceReport.data.attendances.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                    <p>No attendance records found for the selected period.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                            <p className="text-sm text-purple-600 font-medium">Monthly Days</p>
                                            <p className="text-2xl font-bold text-gray-900">{attendanceReport.data.totalDays}</p>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-sm text-blue-600 font-medium">Total Hours</p>
                                            <p className="text-2xl font-bold text-gray-900">{attendanceReport.data.totalHours.toFixed(2)} hrs</p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                            <p className="text-sm text-green-600 font-medium">Est. Usage Charges</p>
                                            <p className="text-2xl font-bold text-gray-900">₹{attendanceReport.data.totalCharges.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-gray-50">
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Check-In</TableHead>
                                                    <TableHead>Check-Out</TableHead>
                                                    <TableHead>Duration</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {attendanceReport.data.attendances.map((att: any) => (
                                                    <TableRow key={att.id}>
                                                        <TableCell className="font-medium">
                                                            {new Date(att.attendanceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-green-600">
                                                            {new Date(att.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-blue-600">
                                                            {att.checkOutTime
                                                                ? new Date(att.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                                                                : <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {att.durationMinutes
                                                                ? `${(att.durationMinutes / 60).toFixed(2)} hrs`
                                                                : "-"
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className="capitalize" variant={att.status === 'present' ? 'default' : 'secondary'}>
                                                                {att.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>)
            }
            {/* Pay Pending Bill Dialog */}
            <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Recording payment for receipt #{selectedPayment?.receiptNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const paymentMode = formData.get('paymentMode') as string;
                        const transactionId = formData.get('transactionId') as string;

                        updatePaymentMutation.mutate({
                            id: selectedPayment.id,
                            updates: {
                                status: 'completed',
                                paymentMode,
                                transactionId: transactionId || undefined,
                                paymentDate: new Date().toISOString() // Update to actual payment date
                            }
                        });
                    }}>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Amount Due</Label>
                                <div className="text-2xl font-bold text-purple-600">
                                    ₹{parseFloat(selectedPayment?.totalAmount || '0').toLocaleString('en-IN')}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="payMode">Payment Mode *</Label>
                                <Select name="paymentMode" defaultValue="cash" required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Card">Card</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="payTxId">Transaction ID (Optional)</Label>
                                <Input id="payTxId" name="transactionId" placeholder="Enter ID if applicable" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Complete Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div >
    );
}
