import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryState } from "@/hooks/use-query-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import Header from "@/components/layout/header";
import {
  Bot,
  TrendingUp,
  Users,
  Calendar,
  IndianRupee,
  Award,
  AlertTriangle,
  Target,
  BookOpen,
  Star,
  Plus,
  Download,
  Calculator,
  FileText,
  CheckCircle,
  BarChart3,
  PieChart,
  TrendingDown,
  Smile,
  Loader2,
  MessageSquare,
  Clock,
  Trash2,
  Upload,
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  Building,
  Pencil,
} from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Pie,
  Cell
} from "recharts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertStaffSchema, type InsertStaff } from "@shared/schema";
import { z } from "zod";
// import { useHashState } from "@/hooks/use-hash-state";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import React from "react";
import StaffDetailModal from "@/components/staff/StaffDetailModal";
import StaffCSVImport from "@/components/staff/csv-import";
import StaffActivityTab from "@/components/staff/staff-activity-tab";
import StaffLeavesTab from "@/components/staff/staff-leaves-tab";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/layout/page-header";

const STAFF_ROLES = [
  "Teacher",
  "Counselor",
  "Accountant",
  "Care Giver",
  "Security Guard",
  "Peon/Office Assistant",
  "Principal"
] as const;

interface Staff {
  id: number;
  name: string;
  employeeId: string;
  role: string;
  department: string;
  salary: number;
  dateOfJoining: string;
  phone?: string;
  email?: string;
  address?: string;
  qualifications?: string;
  isActive?: boolean;
  bankAccountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  emergencyContact?: string;
}

interface Attendance {
  id: number;
  staffId: number;
  date: string;
  status: string;
  hoursWorked: number;
  remarks?: string;
}

interface StaffPerformanceAnalysis {
  staffId: number;
  performanceScore: number;
  attendancePattern: string;
  salaryRecommendation: number;
  trainingNeeds: string[];
  promotionEligibility: boolean;
  insights: string[];
}

interface Payroll {
  id: number;
  staffId: number;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  attendedDays?: number;
  status: string;
  overtime?: number;
  generatedAt: string;
}

interface PayrollGeneration {
  staffId: number;
  month: number;
  year: number;
  workingDays: number;
  attendedDays: number;
  overtimeHours: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  employeeName: string;
  status: string;
}

interface DepartmentAnalytics {
  department: string;
  totalStaff: number;
  averageSalary: number;
  averagePerformance: number;
  averageAttendance: number;
  budgetUtilization: number;
  projectCompletion: number;
  employeeSatisfaction: number;
  monthlyTrends: {
    month: string;
    performance: number;
    attendance: number;
    salary: number;
  }[];
}

interface PayrollDetails {
  workingDays: number;
  attendedDays: number;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
  attendanceRate: number;
  basicSalary: number;
  allowances: number;
  totalAllowances: number;
  deductions: {
    absent: number;
  };
  totalDeductions: number;
  grossSalary: number;
  netSalary: number;
}



export default function StaffAI() {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [payrollGenerationOpen, setPayrollGenerationOpen] = useState(false);
  const [bulkPayrollOpen, setBulkPayrollOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useQueryState<string>("view", "All Employees");
  const [activeTab, setActiveTab] = useQueryState<string>("tab", "overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [editablePayrollData, setEditablePayrollData] = useState<{
    [key: number]: {
      attendedDays: number | '';
      basicSalary: number | '';
      allowances: number | ''; // Added allowances
      deductions: number | ''; // Added deductions
      overtime: number | '';   // Added overtime
      netSalary: number
    }
  }>(() => {
    // Load from localStorage on component mount with month/year key
    const key = 'editablePayrollData_' + selectedMonth + '_' + selectedYear;
    const saved = localStorage.getItem(key);
    console.log('Loading editablePayrollData from localStorage with key:', key, 'data:', saved);
    return saved ? JSON.parse(saved) : {};
  });
  const [manualPayrollInputs, setManualPayrollInputs] = useState<{
    [key: number]: {
      daysWorked: string | number;
      basicSalary: number | '';
      isManual: boolean;
    }
  }>(() => {
    // Load from localStorage on component mount with month/year key
    const key = 'manualPayrollInputs_' + selectedMonth + '_' + selectedYear;
    const saved = localStorage.getItem(key);
    console.log('Loading manualPayrollInputs from localStorage with key:', key, 'data:', saved);
    return saved ? JSON.parse(saved) : {};
  });

  // Track which payroll is currently being edited
  const [editingPayrollStaffId, setEditingPayrollStaffId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  // const [whatsappModal, setWhatsappModal] = useState<{
  //   open: boolean;
  //   staff: Staff | null;
  //   netSalary: number;
  // }>({ open: false, staff: null, netSalary: 0 });

  // Track previous month/year to detect actual changes
  const [prevMonth, setPrevMonth] = useState(selectedMonth);
  const [prevYear, setPrevYear] = useState(selectedYear);

  // Get user role for permissions
  const userRole = localStorage.getItem('userRole') || 'counselor';
  const isAdmin = userRole === 'admin';
  const canManageStaff = true; // Always allow staff management
  const canViewAnalytics = isAdmin || userRole === 'hr' || userRole === 'marketing_head';

  // Debug: Log the current user role
  console.log('Current user role:', userRole);
  console.log('canManageStaff:', canManageStaff);

  // Fetch data
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"]
  });
  const displayStaff: Staff[] = (staff as Staff[]).filter(member => member.role !== 'Driver');
  // Note: Attendance endpoint not available - using empty array
  const attendance: Attendance[] = [];
  const { data: payroll = [] } = useQuery({ queryKey: ["/api/payroll"] });

  // Save payroll state to localStorage whenever it changes
  useEffect(() => {
    const key = 'editablePayrollData_' + selectedMonth + '_' + selectedYear;
    console.log('Saving editablePayrollData to localStorage with key:', key, 'data:', editablePayrollData);
    localStorage.setItem(key, JSON.stringify(editablePayrollData));
  }, [editablePayrollData, selectedMonth, selectedYear]);

  useEffect(() => {
    const key = 'manualPayrollInputs_' + selectedMonth + '_' + selectedYear;
    console.log('Saving manualPayrollInputs to localStorage with key:', key, 'data:', manualPayrollInputs);
    localStorage.setItem(key, JSON.stringify(manualPayrollInputs));
  }, [manualPayrollInputs, selectedMonth, selectedYear]);

  // Clear localStorage only when month/year actually changes (not on initial mount)
  useEffect(() => {
    if ((prevMonth !== selectedMonth || prevYear !== selectedYear) &&
      (prevMonth !== 0 && prevYear !== 0)) { // Skip initial mount
      console.log('Month/Year changed, clearing localStorage');
      const oldKey1 = 'editablePayrollData_' + prevMonth + '_' + prevYear;
      const oldKey2 = 'manualPayrollInputs_' + prevMonth + '_' + prevYear;
      localStorage.removeItem(oldKey1);
      localStorage.removeItem(oldKey2);
      setEditablePayrollData({});
      setManualPayrollInputs({});
    }
    setPrevMonth(selectedMonth);
    setPrevYear(selectedYear);
  }, [selectedMonth, selectedYear, prevMonth, prevYear]);

  // Load existing payroll data from database when month/year changes
  useEffect(() => {
    if (payroll && Array.isArray(payroll) && staff && Array.isArray(staff)) {
      const existingPayrollData: {
        [key: number]: {
          attendedDays: number | '';
          basicSalary: number | '';
          allowances: number | '';
          deductions: number | '';
          overtime: number | '';
          netSalary: number
        }
      } = {};
      const existingManualInputs: { [key: number]: { daysWorked: string | number; basicSalary: number | ''; isManual: boolean } } = {};

      (staff as Staff[]).forEach((member: Staff) => {
        const existingPayroll = (payroll as Payroll[]).find(
          p => p.staffId === member.id && p.month === selectedMonth && p.year === selectedYear
        );

        if (existingPayroll) {
          existingPayrollData[member.id] = {
            attendedDays: existingPayroll.attendedDays || 30,
            basicSalary: existingPayroll.basicSalary,
            allowances: existingPayroll.allowances || 0,
            deductions: existingPayroll.deductions || 0,
            overtime: existingPayroll.overtime || 0,
            netSalary: existingPayroll.netSalary
          };
        }
      });

      if (Object.keys(existingPayrollData).length > 0) {
        setEditablePayrollData(existingPayrollData);
        const key = 'editablePayrollData_' + selectedMonth + '_' + selectedYear;
        localStorage.setItem(key, JSON.stringify(existingPayrollData));
      }
    }
  }, [payroll, staff, selectedMonth, selectedYear]);

  // AI Analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: async (staffId: number) => {
      const staffMember = (staff as Staff[]).find(s => s.id === staffId);
      const staffAttendance = (attendance as Attendance[]).filter(a => a.staffId === staffId);

      if (!staffMember) throw new Error("Staff member not found");

      const response = await fetch("/api/ai/staff-performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId,
          attendance: staffAttendance.map(a => ({
            date: a.date,
            status: a.status,
            hoursWorked: a.hoursWorked
          })),
          salary: staffMember.salary,
          role: staffMember.role,
          dateOfJoining: staffMember.dateOfJoining
        }),
      });

      if (!response.ok) throw new Error("Failed to generate AI analysis");
      return response.json() as Promise<StaffPerformanceAnalysis>;
    },
    onSuccess: () => {
      toast({
        title: "AI Analysis Complete",
        description: "Staff performance analysis generated successfully",
      });
    },
  });

  // Payroll generation mutation
  const generatePayrollMutation = useMutation({
    mutationFn: async (payrollData: PayrollGeneration) => {
      console.log('Generating payroll with data:', payrollData);
      const response = await apiRequest("POST", "/api/payroll", payrollData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      fetchPayrollOverview();
      // Clear localStorage after successful generation
      const key1 = 'editablePayrollData_' + selectedMonth + '_' + selectedYear;
      const key2 = 'manualPayrollInputs_' + selectedMonth + '_' + selectedYear;
      localStorage.removeItem(key1);
      localStorage.removeItem(key2);
      setEditablePayrollData({});
      setManualPayrollInputs({});
      toast({
        title: "Payroll Generated Successfully",
        description: "Payroll for " + selectedMonth + "/" + selectedYear + " has been generated and saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generating Payroll",
        description: error.message || "Failed to generate payroll. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Bulk payroll generation mutation
  const generateBulkPayrollMutation = useMutation({
    mutationFn: async (bulkData: { month: number; year: number; staffIds: number[]; payrollData?: PayrollGeneration[] }) => {
      const response = await apiRequest("POST", "/api/payroll/bulk-generate", bulkData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      fetchPayrollOverview();
      setBulkPayrollOpen(false);
      // Clear localStorage after successful generation
      const key1 = 'editablePayrollData_' + selectedMonth + '_' + selectedYear;
      const key2 = 'manualPayrollInputs_' + selectedMonth + '_' + selectedYear;
      localStorage.removeItem(key1);
      localStorage.removeItem(key2);
      setEditablePayrollData({});
      setManualPayrollInputs({});
      toast({
        title: "Bulk Payroll Generated",
        description: "Payroll has been generated for all selected staff members",
      });
    },
  });

  // Delete payroll mutation
  const deletePayrollMutation = useMutation({
    mutationFn: async (payrollId: number) => {
      const response = await apiRequest("DELETE", `/api/payroll/${payrollId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      fetchPayrollOverview();
      toast({
        title: "Payroll Deleted",
        description: "The payroll record has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Payroll",
        description: error.message || "Failed to delete payroll record.",
        variant: "destructive"
      });
    }
  });

  // PDF generation mutation
  const generateSalarySlipMutation = useMutation({
    mutationFn: async (payrollData: PayrollGeneration & { employeeName: string }) => {
      try {
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        // Get auth headers manually since we're using fetch directly for blob/timeout support
        const userStr = localStorage.getItem('auth_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const authHeaders = user?.email ? { 'x-user-name': user.email } : {};

        const response = await fetch('/api/payroll/generate-slip/' + payrollData.staffId + '/' + payrollData.month + '/' + payrollData.year, {
          method: "GET",
          headers: {
            "Accept": "application/pdf",
            ...authHeaders
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('PDF generation failed:', response.status, errorText);
          throw new Error(errorText || 'Failed to generate salary slip (' + response.status + ')');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          console.error('Invalid content type received:', contentType);
          throw new Error('Received invalid content type from server');
        }

        const blob = await response.blob();

        // Verify blob size and type
        if (blob.size === 0) {
          throw new Error('Received empty PDF file');
        }

        if (blob.type !== 'application/pdf') {
          console.error('Blob type mismatch:', blob.type);
          throw new Error('Received invalid file format from server');
        }

        return blob;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('PDF generation timed out. Please try again.');
          }
          throw error;
        }
        throw new Error('An unexpected error occurred while generating PDF');
      }
    },
    onSuccess: (blob, variables) => {
      try {
        // Verify that we received a PDF blob
        if (blob.type !== 'application/pdf') {
          toast({
            title: "Error",
            description: "Received invalid file format from server",
            variant: "destructive"
          });
          return;
        }

        // Create download link for PDF with employee name
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.style.display = 'none';

        // Clean employee name for filename (remove special characters)
        const cleanName = variables.employeeName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        a.download = 'Salary_Slip_' + cleanName + '_' + variables.month + '_' + variables.year + '.pdf';

        // Append to body, click, and cleanup
        document.body.appendChild(a);
        a.click();

        // Cleanup with a small delay to ensure download starts
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        toast({
          title: "Salary Slip Generated",
          description: "PDF salary slip has been downloaded successfully.",
        });
      } catch (error) {
        console.error('Error handling PDF download:', error);
        toast({
          title: "Download Error",
          description: "Failed to download PDF. Please try again.",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      console.error('PDF generation error:', error);
      toast({
        title: "Error Generating Salary Slip",
        description: error.message || "Failed to generate salary slip. Please try again.",
        variant: "destructive"
      });
    }
  });



  // Only initialize editable data when staff changes and editablePayrollData is empty
  useEffect(() => {
    if (
      staff && Array.isArray(staff) && staff.length > 0 &&
      Object.keys(editablePayrollData).length === 0
    ) {
      // Check if there's existing payroll data for this month/year
      const hasExistingPayroll = payroll && Array.isArray(payroll) &&
        (payroll as Payroll[]).some(p => p.month === selectedMonth && p.year === selectedYear);

      // Only initialize if no existing payroll data
      if (!hasExistingPayroll) {
        console.log('Initializing editablePayrollData');
        const initialData: {
          [key: number]: {
            attendedDays: number | '';
            basicSalary: number | '';
            allowances: number | '';
            deductions: number | '';
            overtime: number | '';
            netSalary: number
          }
        } = {};
        (staff as Staff[]).forEach((member: Staff) => {
          const details = calculatePayrollDetails(member);
          initialData[member.id] = {
            attendedDays: typeof details.attendedDays === 'number' ? details.attendedDays : 30,
            basicSalary: typeof details.basicSalary === 'number' ? details.basicSalary : member.salary,
            allowances: 0,
            deductions: 0,
            overtime: 0,
            netSalary: typeof details.netSalary === 'number' ? details.netSalary : member.salary
          };
        });
        setEditablePayrollData(initialData);
      }
    }
  }, [staff, payroll, selectedMonth, selectedYear]);

  const getStaffAttendanceRate = (staffId: number) => {
    const staffAttendance = (attendance as Attendance[]).filter(a => a.staffId === staffId);
    const recentAttendance = staffAttendance.slice(-30);
    const presentDays = recentAttendance.filter(a => a.status === 'present').length;
    return recentAttendance.length > 0 ? (presentDays / recentAttendance.length) * 100 : 0;
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 75) return "bg-blue-100 text-blue-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return "bg-green-100 text-green-800";
    if (rate >= 85) return "bg-blue-100 text-blue-800";
    if (rate >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const calculatePayrollDetails = (staffMember: Staff): PayrollDetails => {
    const workingDays = 30;
    const manualInput = manualPayrollInputs[staffMember.id];
    let attendedDays: number;
    let presentDays: number;
    let absentDays: number;
    let basicSalary: number;

    if (manualInput && manualInput.isManual && manualInput.daysWorked !== '') {
      attendedDays = Number(manualInput.daysWorked);
      presentDays = attendedDays;
      absentDays = workingDays - attendedDays;
      basicSalary = staffMember.salary;
    } else {
      const staffAttendance = (attendance as Attendance[]).filter(
        a => a.staffId === staffMember.id &&
          a.date && !isNaN(new Date(a.date).getTime()) &&
          new Date(a.date).getMonth() + 1 === selectedMonth &&
          new Date(a.date).getFullYear() === selectedYear
      );
      presentDays = staffAttendance.filter(a => a.status === 'present').length;
      attendedDays = presentDays > 0 ? presentDays : workingDays;
      absentDays = workingDays - attendedDays;
      basicSalary = staffMember.salary;
    }

    // Net Salary = basic salary / 30 * attended days
    const netSalary = (basicSalary / 30) * attendedDays;
    // Deductions = Basic Salary - Net Salary
    const deductions = basicSalary - netSalary;

    return {
      workingDays,
      attendedDays,
      presentDays,
      absentDays,
      overtimeHours: 0,
      attendanceRate: (attendedDays / workingDays) * 100,
      basicSalary: Math.round(basicSalary * 100) / 100,
      allowances: 0,
      totalAllowances: 0,
      deductions: { absent: Math.round(deductions * 100) / 100 },
      totalDeductions: Math.round(deductions * 100) / 100,
      grossSalary: Math.round(basicSalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100
    };
  };

  // Add state to track locally generated payrolls for immediate download
  const [locallyGeneratedPayrolls, setLocallyGeneratedPayrolls] = useState<Set<number>>(new Set());

  const getPayrollStatus = (staffId: number) => {
    const staffPayroll = (payroll as Payroll[]).find(
      p => p.staffId === staffId && p.month === selectedMonth && p.year === selectedYear
    );
    // Check if payroll was locally generated (for immediate download access)
    if (locallyGeneratedPayrolls.has(staffId)) {
      return 'processed';
    }
    return staffPayroll?.status || 'pending';
  };

  // Add new function to calculate net salary
  const calculateNetSalary = (staffMember: Staff, attendedDays: number | '', basicSalary: number | '', allowances: number | '', deductions: number | '', overtime: number | '') => {
    const nAttendedDays = Number(attendedDays) || 30;
    const nBasicSalary = Number(basicSalary) || staffMember.salary;
    const nAllowances = Number(allowances) || 0;
    const nDeductions = Number(deductions) || 0;
    const nOvertime = Number(overtime) || 0;

    // Net Salary = ((Basic / 30) * Attended) + Allowances + Overtime - Deductions
    const dailyRate = nBasicSalary / 30;
    const basePay = dailyRate * nAttendedDays;
    const net = Math.max(0, basePay + nAllowances + nOvertime - nDeductions);
    return Math.round(net);
  };

  const handlePayrollDataChange = (staffId: number, field: 'attendedDays' | 'basicSalary' | 'allowances' | 'deductions' | 'overtime', value: string) => {
    const staffMember = (staff as Staff[]).find(s => s.id === staffId);
    if (!staffMember) return;

    const currentData = editablePayrollData[staffId] || {
      attendedDays: 30,
      basicSalary: staffMember.salary,
      allowances: 0,
      deductions: 0,
      overtime: 0,
      netSalary: staffMember.salary
    };

    // Convert string to number and handle empty input
    const numericValue = value === '' ? '' : Number(value);

    // Validate and constrain values
    let finalValue = numericValue;
    if (field === 'attendedDays') {
      finalValue = numericValue === '' ? '' : Math.max(0, Math.min(Number(numericValue), 30)); // Allow up to 30 days
    } else {
      // For salary, allowances, deductions, overtime - just ensure non-negative
      finalValue = numericValue === '' ? '' : Math.max(0, Number(numericValue));
    }

    const newData = {
      ...currentData,
      [field]: finalValue
    };

    // Calculate new net salary, always using numbers
    const netSalary = calculateNetSalary(
      staffMember,
      Number(newData.attendedDays) || 0, // treating empty/0 as 0 for calculation safety, though logic handles it
      Number(newData.basicSalary) || staffMember.salary,
      Number(newData.allowances) || 0,
      Number(newData.deductions) || 0,
      Number(newData.overtime) || 0
    );

    setEditablePayrollData(prev => ({
      ...prev,
      [staffId]: {
        ...newData,
        netSalary
      }
    }));
  };

  const handleManualPayrollInputChange = (staffId: number, field: 'daysWorked', value: string) => {
    const currentInput = manualPayrollInputs[staffId] || { daysWorked: '', basicSalary: '', isManual: false };
    const numericValue = value === '' ? '' : Number(value);

    // Validate and constrain values
    let finalValue: number | '';
    if (field === 'daysWorked') {
      finalValue = numericValue === '' ? '' : Math.max(0, Math.min(Number(numericValue), 30));
    } else {
      finalValue = numericValue;
    }

    setManualPayrollInputs(prev => ({
      ...prev,
      [staffId]: {
        ...currentInput,
        [field]: finalValue
      }
    }));
  };

  const toggleManualInput = (staffId: number) => {
    const currentInput = manualPayrollInputs[staffId] || { daysWorked: '', basicSalary: '', isManual: false };
    setManualPayrollInputs(prev => ({
      ...prev,
      [staffId]: {
        ...currentInput,
        isManual: !currentInput.isManual
      }
    }));
  };

  const handleGeneratePayroll = (staffMember: Staff) => {
    // Use editablePayrollData for attendedDays and basicSalary if available
    const payrollEdit = editablePayrollData[staffMember.id] || {};
    const attendedDays = payrollEdit.attendedDays !== undefined ? payrollEdit.attendedDays : 30;
    const basicSalary = payrollEdit.basicSalary !== undefined ? payrollEdit.basicSalary : staffMember.salary;
    const allowances = payrollEdit.allowances !== undefined && payrollEdit.allowances !== '' ? Number(payrollEdit.allowances) : 0;
    const deductions = payrollEdit.deductions !== undefined && payrollEdit.deductions !== '' ? Number(payrollEdit.deductions) : 0;
    const overtime = payrollEdit.overtime !== undefined && payrollEdit.overtime !== '' ? Number(payrollEdit.overtime) : 0;

    // Calculate locally for immediate visual feedback (server will re-calculate)
    const netSalary = calculateNetSalary(
      staffMember,
      attendedDays,
      basicSalary,
      allowances,
      deductions,
      overtime
    );

    // Ensure all required fields are present and correct
    const payrollData = {
      staffId: staffMember.id,
      month: selectedMonth,
      year: selectedYear,
      basicSalary: Number(basicSalary),
      allowances: allowances,
      deductions: deductions,
      overtime: overtime,
      netSalary: netSalary,
      attendedDays: Number(attendedDays),
      status: 'processed',
      workingDays: 30, // Default constant
      overtimeHours: 0, // Not explicitly tracked yet in UI input, distinct from amount
      employeeName: staffMember.name,
    };

    setLocallyGeneratedPayrolls(prev => {
      const newSet = new Set(prev);
      newSet.add(staffMember.id);
      return newSet;
    });

    generatePayrollMutation.mutate(payrollData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
        fetchPayrollOverview();
      }
    });
  };

  const handleBulkPayrollGeneration = () => {
    const payrollDataArray = filteredStaff.map(staffMember => {
      const manualInput = manualPayrollInputs[staffMember.id];
      let attendedDays: number;
      let basicSalary: number;
      let absentDays: number = 0;

      if (manualInput && manualInput.isManual && manualInput.daysWorked !== '') {
        attendedDays = Number(manualInput.daysWorked);
        absentDays = 30 - attendedDays;
        const dailyRate = Number(staffMember.salary) / 30;
        basicSalary = dailyRate * attendedDays;
      } else {
        const staffAttendance = (attendance as Attendance[]).filter(
          a => a.staffId === staffMember.id &&
            a.date && !isNaN(new Date(a.date).getTime()) &&
            new Date(a.date).getMonth() + 1 === selectedMonth &&
            new Date(a.date).getFullYear() === selectedYear
        );
        attendedDays = staffAttendance.filter(a => a.status === 'present').length;
        absentDays = 30 - attendedDays;
        const dailyRate = Number(staffMember.salary) / 30;
        basicSalary = dailyRate * attendedDays;
      }

      const totalAllowances = 0;
      const dailyRate = Number(staffMember.salary) / 30;
      const absentDeduction = absentDays * dailyRate;
      const totalDeductions = absentDeduction;
      const netSalary = basicSalary - totalDeductions;

      return {
        staffId: staffMember.id,
        month: selectedMonth,
        year: selectedYear,
        basicSalary: Number(basicSalary),
        allowances: Number(totalAllowances),
        deductions: Number(totalDeductions),
        overtime: 0,
        netSalary: Number(netSalary),
        attendedDays: Number(attendedDays),
        status: 'processed',
        workingDays: 30,
        overtimeHours: 0,
        employeeName: staffMember.name,
      };
    });

    setLocallyGeneratedPayrolls(prev => {
      const newSet = new Set(prev);
      filteredStaff.forEach(s => newSet.add(s.id));
      return newSet;
    });

    generateBulkPayrollMutation.mutate({
      month: selectedMonth,
      year: selectedYear,
      staffIds: filteredStaff.map(s => s.id),
      payrollData: payrollDataArray
    });
  };

  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      'IT': '#FF6B6B',
      'HR': '#4ECDC4',
      'Finance': '#45B7D1',
      'Operations': '#96CEB4',
      'Marketing': '#FFEEAD',
      'Sales': '#D4A5A5'
    };
    return colors[department] || '#8884d8';
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };

  const getDepartmentStats = (department: string) => {
    const deptStaff = displayStaff.filter((s: Staff) => s.department === department);
    const deptAttendance = (attendance as Attendance[]).filter((a: Attendance) =>
      deptStaff.some((s: Staff) => s.id === a.staffId)
    );

    return {
      totalStaff: deptStaff.length,
      averageSalary: deptStaff.reduce((sum: number, s: Staff) => sum + s.salary, 0) / deptStaff.length,
      averageAttendance: getDepartmentAttendanceRate(deptStaff, deptAttendance),
      topPerformers: getTopPerformers(deptStaff),
    };
  };

  const getDepartmentAttendanceRate = (deptStaff: Staff[], deptAttendance: Attendance[]) => {
    const recentAttendance = deptAttendance.slice(-30);
    const presentDays = recentAttendance.filter(a => a.status === 'present').length;
    return recentAttendance.length > 0 ? (presentDays / recentAttendance.length) * 100 : 0;
  };

  const getTopPerformers = (deptStaff: Staff[]) => {
    return deptStaff
      .map(staff => ({
        ...staff,
        performanceScore: calculatePerformanceScore(staff.id)
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 3);
  };

  const calculatePerformanceScore = (staffId: number) => {
    const staffAttendance = (attendance as Attendance[]).filter(a => a.staffId === staffId);
    const attendanceScore = getStaffAttendanceRate(staffId);
    const overtimeScore = staffAttendance.reduce((sum, a) => sum + (a.hoursWorked > 8 ? 1 : 0), 0) * 5;
    return (attendanceScore * 0.7) + (overtimeScore * 0.3);
  };

  // Add Staff Modal logic
  const addStaffForm = useForm<InsertStaff>({
    resolver: zodResolver(insertStaffSchema.extend({
      email: z.string()
        .email({ message: "Please enter a valid email address" })
        .optional()
        .or(z.literal("")),
    })),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      dateOfJoining: '',
      salary: '',
      address: '',
      emergencyContact: '',
      qualifications: '',
      bankAccountNumber: '',
      ifscCode: '',
      panNumber: '',
      isActive: true, // Add default value for isActive
    },
  });

  // Edit Staff Modal logic (separate form to avoid conflicts)
  const editStaffForm = useForm<InsertStaff>({
    resolver: zodResolver(insertStaffSchema.extend({
      email: z.string()
        .email({ message: "Please enter a valid email address" })
        .optional()
        .or(z.literal("")),
    })),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      dateOfJoining: '',
      salary: '',
      address: '',
      emergencyContact: '',
      qualifications: '',
      bankAccountNumber: '',
      ifscCode: '',
      panNumber: '',
      isActive: true,
    },
  });
  const addStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff) => {
      // Normalize fields to match server expectations
      const payload: any = {
        ...data,
        salary: data.salary !== undefined && data.salary !== null ? Number(data.salary as any) : undefined,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining as any).toISOString().split('T')[0] : undefined,
      };
      const response = await apiRequest("POST", "/staff", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      invalidateNotifications(queryClient);
      fetchPayrollOverview(); // Update payroll overview after adding staff
      toast({ title: "Staff added successfully" });
      addStaffForm.reset();
      setIsAddStaffOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error adding staff", description: error.message || "Something went wrong", variant: "destructive" });
    },
  });
  const onAddStaffSubmit = (data: InsertStaff) => {
    // Find the highest employeeId in displayStaff
    const maxId = displayStaff.reduce((max, s) => {
      const match = s.employeeId && s.employeeId.match(/^EMP(\d{3,})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const nextId = maxId + 1;
    const nextEmployeeId = `EMP${nextId.toString().padStart(3, '0')}`;
    const payload: any = {
      ...data,
      employeeId: nextEmployeeId,
      salary: data.salary !== undefined && data.salary !== null ? Number(data.salary as any) : undefined,
      dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining as any).toISOString().split('T')[0] : undefined,
    };
    addStaffMutation.mutate(payload);
  };

  // Add state for WhatsApp modal
  const [whatsappModal, setWhatsappModal] = useState<{
    open: boolean;
    staff: Staff | null;
    netSalary: number;
  }>({ open: false, staff: null, netSalary: 0 });

  // WhatsApp message generator
  const getSalaryCreditedMessage = (staff: any, netSalary: number) => {
    const instituteName = localStorage.getItem("customInstituteName") || "EduConnect";
    return `Dear ${staff.name},\n\nYour salary of ₹${netSalary} has been credited to your account.\n\nThank you for your dedication and hard work.\n\nBest regards,\n${instituteName} Team`;
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  // Function to manually clear payroll localStorage data
  const clearPayrollLocalStorage = async () => {
    const key1 = `editablePayrollData_${selectedMonth}_${selectedYear}`;
    const key2 = `manualPayrollInputs_${selectedMonth}_${selectedYear}`;
    localStorage.removeItem(key1);
    localStorage.removeItem(key2);
    setEditablePayrollData({});
    setManualPayrollInputs({});

    // If any selected employees have status 'processed', set them to 'pending' in the backend
    if (selectedPayrollStaff.length > 0) {
      await Promise.all(selectedPayrollStaff.map(async (staffId) => {
        // Find the payroll record for this staff for the current month/year
        const payrollRecord = (payroll as Payroll[]).find(
          p => p.staffId === staffId && p.month === selectedMonth && p.year === selectedYear && p.status === 'processed'
        );
        if (payrollRecord) {
          // Update the payroll status to 'pending' via API
          await fetch(`/api/payroll/${payrollRecord.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'pending' })
          });
        }
      }));
      await fetchPayrollOverview();
    }
    setSelectedPayrollStaff([]);
    toast({
      title: "Payroll Data Cleared",
      description: "Local payroll data and selected processed employees have been reset to pending.",
    });
  };

  // Function to manually save current state to localStorage
  const savePayrollLocalStorage = () => {
    const key1 = `editablePayrollData_${selectedMonth}_${selectedYear}`;
    const key2 = `manualPayrollInputs_${selectedMonth}_${selectedYear}`;
    localStorage.setItem(key1, JSON.stringify(editablePayrollData));
    localStorage.setItem(key2, JSON.stringify(manualPayrollInputs));
    toast({
      title: "Payroll Data Saved",
      description: "Current payroll data has been saved to localStorage.",
    });
  };

  // Debounced search and filter logic
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Show all staff in filteredStaff
  const filteredStaff = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return displayStaff.filter((member: Staff) => {
      if (search === "") return true;
      if (/^[a-z]$/i.test(search)) {
        // Single letter: match name startsWith only
        return member.name.toLowerCase().startsWith(search);
      } else if (/^\d+$/.test(search)) {
        // Only numbers: match phone
        return member.phone && member.phone.includes(search);
      } else if (search.includes("@")) {
        // Contains @: match email
        return member.email && member.email.toLowerCase().includes(search);
      } else {
        // Default: match name startsWith
        return member.name.toLowerCase().startsWith(search);
      }
    })
      .filter((member: Staff) => {
        const normalizedRole = member.role ? member.role.toLowerCase().trim() : '';
        const normalizedRoleFilter = roleFilter.toLowerCase().trim();
        const matchesRole = normalizedRoleFilter === 'all' || normalizedRole === normalizedRoleFilter;
        const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
        return matchesRole && matchesDepartment;
      });
  }, [displayStaff, searchQuery, roleFilter, departmentFilter]);

  // Pagination and sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [maxVisiblePage, setMaxVisiblePage] = useState(2); // Controls how many pages are visible
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'salary' | 'dateOfJoining'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Reset pagination when tab changes
  useEffect(() => {
    setPage(1);
    setMaxVisiblePage(2);
  }, [selectedTab]);

  // Sorting and pagination logic
  const sortedStaff = useMemo(() => {
    const sorted = [...filteredStaff].sort((a, b) => {
      // Always sort active staff above deactivated
      if ((a.isActive === false) && (b.isActive !== false)) return 1;
      if ((a.isActive !== false) && (b.isActive === false)) return -1;
      // Then apply the selected sort
      let aValue = a[sortKey];
      let bValue = b[sortKey];
      if (sortKey === 'salary') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      if (sortKey === 'dateOfJoining') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredStaff, sortKey, sortOrder]);

  // After sortedStaff is defined:
  const staffTabFiltered = useMemo(() => {
    if (selectedTab === 'All Employees') return sortedStaff;
    if (selectedTab === 'Active') return sortedStaff.filter(s => s.isActive !== false); // true or undefined
    if (selectedTab === 'Inactive') return sortedStaff.filter(s => s.isActive === false); // only explicit false
    return sortedStaff;
  }, [sortedStaff, selectedTab]);
  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return staffTabFiltered.slice(start, start + pageSize);
  }, [staffTabFiltered, page, pageSize]);
  const totalPages = Math.ceil(staffTabFiltered.length / pageSize);

  useEffect(() => {
    // Fallback to previous page if current page becomes empty after deletion
    if (page > 1 && paginatedStaff.length === 0 && staffTabFiltered.length > 0) {
      setPage(page - 1);
    }
  }, [paginatedStaff, page, staffTabFiltered.length]);

  const handleSort = (key: 'name' | 'role' | 'salary' | 'dateOfJoining') => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Employee ID', 'Role', 'Department', 'Salary', 'Joining Date', 'Email', 'Phone'];
    const csvContent = [
      headers.join(','),
      ...filteredStaff.map(staff => [
        staff.name,
        staff.employeeId,
        staff.role,
        staff.department,
        staff.salary,
        staff.dateOfJoining,
        staff.email || '',
        staff.phone || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleToggleStatus = async (staffId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: `Staff member ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff status',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateSalarySlip = (staffMember: Staff) => {
    const manualInput = manualPayrollInputs[staffMember.id];
    let attendedDays: number;
    let basicSalary: number;
    let absentDays: number = 0;

    if (manualInput && manualInput.isManual && manualInput.daysWorked !== '') {
      // Use manual days worked with the formula: (Original Salary / 30) × Days Worked
      attendedDays = Number(manualInput.daysWorked);
      absentDays = 30 - attendedDays;
      const dailyRate = staffMember.salary / 30;
      basicSalary = dailyRate * attendedDays;
    } else {
      // Use attendance-based calculation
      const staffAttendance = (attendance as Attendance[]).filter(
        a => a.staffId === staffMember.id &&
          a.date && !isNaN(new Date(a.date).getTime()) &&
          new Date(a.date).getMonth() + 1 === selectedMonth &&
          new Date(a.date).getFullYear() === selectedYear
      );

      attendedDays = staffAttendance.filter(a => a.status === 'present').length;
      absentDays = 30 - attendedDays;
      const dailyRate = staffMember.salary / 30;
      basicSalary = dailyRate * attendedDays;
    }

    // Calculate total allowances and deductions
    const totalAllowances = 0; // All allowances are 0
    const dailyRate = staffMember.salary / 30;
    const absentDeduction = absentDays * dailyRate;
    const totalDeductions = absentDeduction; // Deduction for absent days
    const netSalary = basicSalary - totalDeductions; // Net salary = basic salary - deductions

    const payrollData: PayrollGeneration = {
      staffId: staffMember.id,
      month: selectedMonth,
      year: selectedYear,
      workingDays: 30, // Total working days per month
      attendedDays,
      overtimeHours: 0,
      basicSalary: basicSalary,
      allowances: totalAllowances, // Send as numeric value, not object
      deductions: totalDeductions, // Send as numeric value, not object
      netSalary: netSalary, // Net salary equals basic salary minus deductions
      employeeName: staffMember.name, // Add employee name for PDF filename
      status: 'processed' // Set status to processed so download button becomes visible
    };

    // First save the payroll data to ensure it exists in the database
    generatePayrollMutation.mutate(payrollData, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
        fetchPayrollOverview();
      }
    });
  };

  // For dashboard counts, only count active staff
  const [payrollOverview, setPayrollOverview] = useState<any[]>([]);

  const activePendingCount = payrollOverview.filter(s => s.isActive !== false && s.payrollStatus === 'pending').length;
  const activeCompleteCount = payrollOverview.filter(s => s.isActive !== false && s.payrollStatus === 'processed').length;

  // 2. Fetch payroll overview data when month/year changes or on mount
  const fetchPayrollOverview = async () => {
    try {
      const response = await fetch(`/api/payroll/overview?month=${selectedMonth}&year=${selectedYear}`);
      const data = await response.json();
      setPayrollOverview(data);
    } catch (error) {
      setPayrollOverview([]);
    }
  };

  useEffect(() => {
    fetchPayrollOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // Add this useEffect to refetch staff when switching to payroll tab
  useEffect(() => {
    if (activeTab === "payroll") {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    }
  }, [activeTab, queryClient]);

  // 1. Add state for selected employees
  const [selectedPayrollStaff, setSelectedPayrollStaff] = useState<number[]>([]);

  // 2. Checkbox handler
  const handlePayrollCheckboxChange = (staffId: number, checked: boolean) => {
    setSelectedPayrollStaff(prev => checked ? [...prev, staffId] : prev.filter(id => id !== staffId));
  };

  // 3. Bulk generate handler
  const handleGenerateSelectedPayroll = () => {
    const selectedStaffMembers = filteredStaff.filter(s => selectedPayrollStaff.includes(s.id));
    selectedStaffMembers.forEach(staffMember => handleGeneratePayroll(staffMember));
  };

  // 1. Download button handler for a single employee
  const handleDownloadSalarySlip = (staffMember: Staff) => {
    // Find payroll for this staff for selected month/year
    const payrollRecord = (payroll as Payroll[]).find(
      p => p.staffId === staffMember.id && p.month === selectedMonth && p.year === selectedYear
    );
    if (!payrollRecord) {
      toast({ title: 'No payroll found', description: 'Payroll not found for this employee for the selected month.' });
      return;
    }
    generateSalarySlipMutation.mutate({
      staffId: staffMember.id,
      month: selectedMonth,
      year: selectedYear,
      workingDays: 30,
      attendedDays: payrollRecord.attendedDays ?? 30,
      overtimeHours: 0,
      basicSalary: payrollRecord.basicSalary,
      allowances: payrollRecord.allowances,
      deductions: payrollRecord.deductions,
      netSalary: payrollRecord.netSalary,
      employeeName: staffMember.name,
      status: payrollRecord.status
    });
  };

  // 2. Download selected payslips for all checked employees
  const handleDownloadSelectedSalarySlips = () => {
    const selectedStaffMembers = filteredStaff.filter(s => selectedPayrollStaff.includes(s.id));
    selectedStaffMembers.forEach(staffMember => handleDownloadSalarySlip(staffMember));
  };

  // Add state for paymentHistoryStatusFilter at the top of the component
  const [paymentHistoryStatusFilter, setPaymentHistoryStatusFilter] = useState('all');

  // 1. Compute summary card values from payrollOverview (all active staff for selected month/year)
  const summaryActiveStaff = payrollOverview.filter(s => s.isActive !== false);
  const summaryTotalNetPayroll = summaryActiveStaff.reduce((sum, member) => {
    const details = calculatePayrollDetails(member);
    return sum + details.netSalary;
  }, 0);
  const summaryActiveEmployees = summaryActiveStaff.length;
  const summaryProcessedPayrolls = payrollOverview.filter(s => s.isActive !== false && s.payrollStatus === 'processed').length;

  // Set default selectedMonth and selectedYear to previous month/year for Payment History
  const today = new Date();
  const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const defaultHistoryMonth = prevMonthDate.getMonth() + 1;
  const defaultHistoryYear = prevMonthDate.getFullYear();
  const [historyMonth, setHistoryMonth] = useState(defaultHistoryMonth);
  const [historyYear, setHistoryYear] = useState(defaultHistoryYear);
  // Helper to get all valid (year, month) pairs up to previous month
  const getValidHistoryMonths = () => {
    const months = [];
    const startYear = defaultHistoryYear - 4; // Show up to 5 years
    for (let y = defaultHistoryYear; y >= startYear; y--) {
      const maxMonth = (y === defaultHistoryYear) ? defaultHistoryMonth : 12;
      for (let m = maxMonth; m >= 1; m--) {
        months.push({ year: y, month: m });
      }
    }
    return months;
  };
  const validHistoryMonths = getValidHistoryMonths();
  const availableYears = Array.from(new Set(validHistoryMonths.map(x => x.year)));
  const availableMonths = (y: number) => validHistoryMonths.filter(x => x.year === y).map(x => x.month);

  // Add new state for contact details panel tabs
  const [contactTab, setContactTab] = useQueryState<string>('subview', 'Overview');

  // Prevent page scrolling when overview tab is active
  useEffect(() => {
    if (activeTab === "overview") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeTab]);

  // 1. Add state for edit modal
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);

  // When opening the edit modal, set form values to selectedStaff
  // Populate edit form when editing staff
  useEffect(() => {
    if (isEditStaffOpen && selectedStaff) {
      console.log("Populating edit form with selectedStaff:", selectedStaff);
      console.log("selectedStaff.isActive:", selectedStaff.isActive, "Type:", typeof selectedStaff.isActive);

      const isActiveValue = Boolean(selectedStaff.isActive);
      console.log("Converted isActive value:", isActiveValue);

      editStaffForm.reset({
        name: selectedStaff.name || '',
        phone: selectedStaff.phone || '',
        email: selectedStaff.email || '',
        address: selectedStaff.address || '',
        salary: selectedStaff.salary ? String(selectedStaff.salary) : '',
        dateOfJoining: selectedStaff.dateOfJoining ? selectedStaff.dateOfJoining.split('T')[0] : '',
        department: selectedStaff.department || '',
        qualifications: selectedStaff.qualifications || '',
        bankAccountNumber: selectedStaff.bankAccountNumber || '',
        ifscCode: selectedStaff.ifscCode || '',
        panNumber: selectedStaff.panNumber || '',
        role: selectedStaff.role || '',
        employeeId: selectedStaff.employeeId || '',
        emergencyContact: (selectedStaff as any).emergencyContact || '',
        isActive: isActiveValue, // Ensure proper boolean value
      });

      console.log("Form values after reset:", editStaffForm.getValues());
    }
  }, [isEditStaffOpen, selectedStaff, editStaffForm]);

  // Add mutation for editing staff
  const editStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff & { id: number }) => {
      const payload = {
        ...data,
        salary: Number(data.salary),
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining).toISOString().split('T')[0] : '',
        isActive: Boolean(data.isActive), // Ensure proper boolean conversion
      };
      console.log("Updating staff with payload:", payload);
      const response = await apiRequest("PUT", `/staff/${data.id}`, payload);
      const result = await response.json();
      console.log("Server response:", result);
      return result;
    },
    onSuccess: (updatedStaff) => {
      console.log("Staff updated successfully:", updatedStaff);

      // Force refetch staff data to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      invalidateNotifications(queryClient);

      // If staff was made inactive, clear the selection since they'll move to bottom
      if (updatedStaff.isActive === false && selectedStaff?.isActive !== false) {
        setSelectedStaff(null);
      } else {
        // Update the selected staff with the returned data
        setSelectedStaff(updatedStaff);
      }

      // Also refetch to be extra sure
      queryClient.refetchQueries({ queryKey: ["/api/staff"] });

      // Close modal automatically after successful save
      setIsEditStaffOpen(false);
      toast({
        title: "Employee updated successfully",
        description: `${updatedStaff.name} has been updated. Status: ${updatedStaff.isActive ? 'Active' : 'Inactive'}${updatedStaff.isActive === false ? ' (moved to inactive section)' : ''}`
      });
    },
    onError: (error: any) => {
      console.error("Error updating staff:", error);
      toast({ title: "Error updating employee", description: error.message || "Something went wrong", variant: "destructive" });
    },
  });

  // Add this state near the top of your component
  const [showStatus, setShowStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Fix tab switching to deselect employee when switching tabs
  useEffect(() => {
    setSelectedStaff(null);
  }, [showStatus, selectedTab]);

  // 1. Add state for delete dialog and staff to delete (near other state declarations)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Export functionality
  const exportStaff = () => {
    const staffToExport = displayStaff || [];
    if (!staffToExport || staffToExport.length === 0) {
      toast({ title: "No Data", description: "No staff data to export", variant: "destructive" });
      return;
    }

    const csvHeaders = [
      "Employee ID", "Name", "Email", "Phone", "Role", "Department",
      "Date of Joining", "Salary", "Active Status", "Address", "Emergency Contact",
      "Qualifications", "Bank Account", "IFSC Code", "PAN Number"
    ];

    const csvData = staffToExport.map((member: any) => [
      member.employeeId || "",
      member.name,
      member.email || "",
      member.phone,
      member.role,
      member.department || "",
      member.dateOfJoining ? new Date(member.dateOfJoining).toLocaleDateString() : "",
      member.salary ? `₹${Number(member.salary).toLocaleString()}` : "",
      member.isActive !== false ? "Active" : "Inactive",
      member.address || "",
      member.emergencyContact || "",
      member.qualifications || "",
      member.bankAccountNumber || "",
      member.ifscCode || "",
      member.panNumber || ""
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map((row: any) => row.map((field: any) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Export Successful", description: `Exported ${staffToExport.length} staff records` });
  };

  // Add after editStaffMutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/staff/${id}`);
      if (!response.ok) throw new Error("Failed to delete staff member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      invalidateNotifications(queryClient);
      toast({ title: "Staff member deleted." });
      setSelectedStaff(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete staff member.", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen app-bg-gradient">
      <Header title="Staff Management" subtitle="Manage your team members and their information" />
      <div className="max-w-[120rem] mx-auto">

        {activeTab === "overview" && (
          <div className="min-h-screen font-sans pb-8">
            <PageHeader
              searchPlaceholder="Search contacts..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filters={
                <div className="flex items-center gap-3">
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-44 bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <SelectValue placeholder="All Departments" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="all">All Departments</SelectItem>
                      {Array.from(new Set(displayStaff.map(s => s.department).filter(Boolean))).map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                      <div className="flex items-center gap-2 truncate">
                        <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                        <SelectValue placeholder="All Roles" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                      <SelectItem value="all">All Roles</SelectItem>
                      {Array.from(new Set(displayStaff.map(s => s.role).filter(Boolean))).map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
              primaryActions={
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setIsAddStaffOpen(true)}
                    className="bg-[#643ae5] hover:bg-[#552dbf] text-white shadow-sm h-10 px-4 rounded-lg flex items-center gap-2 transition-all active:scale-95"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Employee</span>
                  </Button>
                  <div className="h-6 w-px bg-gray-200 mx-1"></div>
                  <Button
                    variant="outline"
                    className="h-10 px-4 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-lg flex items-center gap-2"
                    onClick={() => setIsCSVImportOpen(true)}
                  >
                    <Download className="h-4 w-4" />
                    <span>Import</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 px-4 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-lg flex items-center gap-2"
                    onClick={exportStaff}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
                </div>
              }
            />
            {/* Toolbar: Tabs & Pagination */}
            <div className="w-full px-6 mb-4">
              <div className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 justify-between items-end sm:items-center pb-2">
                {/* Tabs */}
                <div className="flex gap-6 relative top-[1px]">
                  {['All Employees', 'Active', 'Inactive'].map(tab => {
                    let count = 0;
                    if (tab === 'All Employees') count = sortedStaff.length;
                    else if (tab === 'Active') count = sortedStaff.filter(s => s.isActive !== false).length;
                    else if (tab === 'Inactive') count = sortedStaff.filter(s => s.isActive === false).length;

                    const isActive = selectedTab === tab;

                    return (
                      <button
                        key={tab}
                        className={`pb-3 px-1 text-sm font-medium transition-all duration-200 relative ${isActive ? 'text-[#643ae5]' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setSelectedTab(tab)}
                      >
                        {tab} <span className={`ml-1 text-xs ${isActive ? "text-[#643ae5]/80" : "text-gray-400"}`}>({count})</span>
                        {isActive && (
                          <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#643ae5] rounded-full transition-all duration-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="flex items-center gap-2 py-1">
                  <span className="text-xs text-gray-500 mr-2 hidden md:inline-block">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      className={`h-8 w-8 flex items-center justify-center rounded-md border transition-all duration-200 ${page === 1
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:translate-y-0.5'
                        }`}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Compact Page Numbers */}
                    <div className="hidden sm:flex space-x-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Logic to show a window of pages can be complex, simplifying for now to show first few or surrounding
                        // For simplicity in this constrained view:
                        let pNum = i + 1;
                        if (totalPages > 5 && page > 3) {
                          pNum = page - 2 + i;
                          if (pNum > totalPages) pNum = i + (totalPages - 4); // Clamp to end
                        }
                        // Simplified range logic for safety in this snippet
                        if (totalPages <= 5) pNum = i + 1;

                        return (pNum <= totalPages) ? (
                          <button
                            key={pNum}
                            className={`h-8 w-8 flex items-center justify-center rounded-md text-xs font-medium transition-all duration-200 ${page === pNum
                              ? 'bg-[#643ae5] text-white border-transparent shadow-sm'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-[#643ae5] hover:text-[#643ae5]'
                              }`}
                            onClick={() => setPage(pNum)}
                          >
                            {pNum}
                          </button>
                        ) : null;
                      })}
                    </div>

                    <button
                      className={`h-8 w-8 flex items-center justify-center rounded-md border transition-all duration-200 ${page === totalPages
                        ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:translate-y-0.5'
                        }`}
                      onClick={() => {
                        const nextPage = Math.min(totalPages, page + 1);
                        setPage(nextPage);
                        if (nextPage > maxVisiblePage) {
                          setMaxVisiblePage(nextPage);
                        }
                      }}
                      disabled={page === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Main Content: Two Column Layout */}
            <div className="flex items-start gap-6 px-8 pb-8">
              {/* Sidebar: Contact List */}
              <aside className="w-[320px] glass-card rounded-lg border bg-card text-card-foreground shadow-lg flex flex-col max-h-[calc(100vh-250px)] sticky top-4">
                <div className="px-6 pt-6 pb-2 text-base font-semibold border-b shrink-0">{staffTabFiltered.length} contacts</div>
                <div className="flex-1 overflow-y-auto">
                  <ul className="divide-y divide-gray-200">
                    {paginatedStaff.map((member) => (
                      <li
                        key={member.id}
                        className={`flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-purple-50 transition rounded-xl ${selectedStaff?.id === member.id ? 'glass-card rounded-lg border bg-card text-card-foreground shadow-lg' : ''}`}
                        onClick={() => setSelectedStaff(member)}
                      >
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-gray-200" style={{ background: member.isActive !== false ? '#52C41A' : '#BFBFBF' }}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{member.name}</div>
                          <div className="text-xs truncate">{member.department || 'No Dept'}</div>
                          <div className="text-xs">{member.email || 'No email'}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
              {/* Details Panel */}
              <main className="flex-1">
                {selectedStaff ? (
                  <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6" style={{ minHeight: '600px' }}>
                    <div className="flex items-center gap-6 mb-6 relative">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                          {selectedStaff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute bottom-1 right-1 block w-4 h-4 rounded-full border-2 border-gray-200" style={{ background: selectedStaff.isActive !== false ? '#52C41A' : '#BFBFBF' }}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold">{selectedStaff.name}</span>
                          <span className="text-sm font-medium">{selectedStaff.role} • {selectedStaff.department}</span>
                        </div>
                      </div>
                      {/* Edit and Delete buttons */}
                      <div className="absolute top-0 right-0 flex gap-3">
                        <button
                          className="bg-[#643ae5] hover:bg-[#552dbf] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                          onClick={() => setIsEditStaffOpen(true)}
                          title="Edit Employee"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                          onClick={() => {
                            setStaffToDelete(selectedStaff);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 mt-2">
                      {['Overview', 'Activity', 'Leaves', 'Payroll'].map(tab => (
                        <button
                          key={tab}
                          className={`pb-3 px-3 py-1.5 text-sm font-medium transition-colors duration-200 relative rounded-md ${contactTab === tab ? 'text-white bg-[#643ae5]' : 'text-gray-600 bg-white hover:bg-gray-100'} mx-1`}
                          onClick={() => setContactTab(tab)}
                          style={{ minWidth: 90 }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {/* Tab Content */}
                    {contactTab === 'Overview' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Contact Info */}
                          <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6">
                            <div className="font-semibold mb-2">Contact Information</div>
                            <div className="mb-1"><span className="font-medium">Full Name:</span> {selectedStaff.name || 'N/A'}</div>
                            <div className="mb-1"><span className="font-medium">Phone:</span> {selectedStaff.phone || 'N/A'}</div>
                            <div className="mb-1"><span className="font-medium">Email:</span> {selectedStaff.email || 'N/A'}</div>
                            <div className="mb-1"><span className="font-medium">Qualifications:</span> {selectedStaff.qualifications || 'N/A'}</div>
                            <div className="mb-1"><span className="font-medium">Address:</span> {selectedStaff.address || 'N/A'}</div>
                            <div className="mt-4 flex items-center gap-3">
                              <span className="font-medium">Status:</span>
                              <Badge
                                variant={selectedStaff.isActive !== false ? "default" : "secondary"}
                                className={selectedStaff.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                              >
                                {selectedStaff.isActive !== false ? "Active" : "Inactive"}
                              </Badge>
                              <Switch
                                checked={selectedStaff.isActive !== false}
                                onCheckedChange={async (checked) => {
                                  try {
                                    const response = await fetch(`/api/staff/${selectedStaff.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isActive: checked }),
                                    });
                                    if (response.ok) {
                                      toast({
                                        title: 'Success',
                                        description: `Staff member ${checked ? 'activated' : 'deactivated'} successfully`,
                                      });
                                      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
                                    } else {
                                      throw new Error('Failed to update status');
                                    }
                                  } catch (error: any) {
                                    toast({
                                      title: 'Error',
                                      description: error.message || 'Failed to update status',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                              />
                            </div>
                          </div>
                          {/* Additional Info with Bank Details */}
                          <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6">
                            <div className="font-semibold mb-2">Additional Information</div>
                            <div className="mb-1"><span className="font-medium">Date of Joining:</span> {selectedStaff.dateOfJoining ? new Date(selectedStaff.dateOfJoining).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</div>
                            <div className="mb-1"><span className="font-medium">Salary:</span> ₹{selectedStaff.salary ? Number(selectedStaff.salary).toLocaleString() : 'N/A'}</div>
                            <div className="mt-4 font-semibold">Bank Details</div>
                            <div className="mb-1">Account Number: <span className="font-medium">{selectedStaff.bankAccountNumber || 'N/A'}</span></div>
                            <div className="mb-1">IFSC Code: <span className="font-medium">{selectedStaff.ifscCode || 'N/A'}</span></div>
                            <div className="mb-1">PAN Number: <span className="font-medium">{selectedStaff.panNumber || 'N/A'}</span></div>
                          </div>
                        </div>
                      </>
                    )}
                    {contactTab === 'Activity' && selectedStaff && <StaffActivityTab staffId={selectedStaff.id} />}
                    {contactTab === 'Leaves' && selectedStaff && <StaffLeavesTab staffId={selectedStaff.id} />}
                    {contactTab === 'Payroll' && selectedStaff && (
                      <div className="w-full glass-card rounded-lg border bg-card text-card-foreground shadow-lg p-6" style={{ minHeight: '200px' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-semibold">Current Month Payroll</div>
                          <div className="flex gap-2">
                            <Select
                              value={selectedMonth.toString()}
                              onValueChange={(val) => setSelectedMonth(parseInt(val))}
                            >
                              <SelectTrigger className="w-[120px] bg-white border-[#643ae5] text-gray-800">
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-[#643ae5] text-gray-800">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                  <SelectItem key={m} value={m.toString()}>
                                    {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={selectedYear.toString()}
                              onValueChange={(val) => setSelectedYear(parseInt(val))}
                            >
                              <SelectTrigger className="w-[100px] bg-white border-[#643ae5] text-gray-800">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-[#643ae5] text-gray-800">
                                {[2024, 2025, 2026].map((y) => (
                                  <SelectItem key={y} value={y.toString()}>
                                    {y}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <table className="w-full text-card-foreground shadow-lg">
                          <thead>
                            <tr>
                              <th className="table-header px-6 py-3 text-left">Days Worked</th>
                              <th className="table-header px-6 py-3 text-left">Basic Salary</th>
                              <th className="table-header px-6 py-3 text-left">Allowances</th>
                              <th className="table-header px-6 py-3 text-left">Deductions</th>
                              <th className="table-header px-6 py-3 text-left">Overtime</th>
                              <th className="table-header px-6 py-3 text-left">Net Salary</th>
                              <th className="table-header px-6 py-3 text-left">Status</th>
                              <th className="table-header px-8 py-3 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const member = selectedStaff;
                              const payrollData = payrollOverview.find(p => p.id === member.id);
                              const payrollStatus = payrollData ? payrollData.payrollStatus : 'pending';
                              const payroll = payrollData ? payrollData.payroll : null;
                              return (
                                <tr key={member.id}>
                                  <td className="px-6 py-4">
                                    {payrollStatus !== 'processed' || editingPayrollStaffId === member.id ? (
                                      <Input
                                        type="number"
                                        min={0}
                                        max={30}
                                        value={editablePayrollData[member.id]?.attendedDays ?? (payroll ? payroll.attendedDays : 30)}
                                        onChange={e => handlePayrollDataChange(member.id, 'attendedDays', e.target.value)}
                                        className="w-20 text-center"
                                      />
                                    ) : (
                                      payroll ? payroll.attendedDays : '-'
                                    )}
                                  </td>
                                  <td className="px-6 py-4">₹{payroll ? Number(payroll.basicSalary).toLocaleString() : Number(member.salary).toLocaleString()}</td>
                                  <td className="px-6 py-4">
                                    {payrollStatus !== 'processed' || editingPayrollStaffId === member.id ? (
                                      <Input
                                        type="number"
                                        min={0}
                                        value={editablePayrollData[member.id]?.allowances ?? (payroll ? payroll.allowances : 0)}
                                        onChange={e => handlePayrollDataChange(member.id, 'allowances', e.target.value)}
                                        className="w-24 text-center"
                                        placeholder="0"
                                      />
                                    ) : (
                                      `₹${payroll ? Number(payroll.allowances).toLocaleString() : '0'}`
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {payrollStatus !== 'processed' || editingPayrollStaffId === member.id ? (
                                      <Input
                                        type="number"
                                        min={0}
                                        value={editablePayrollData[member.id]?.deductions ?? (payroll ? payroll.deductions : 0)}
                                        onChange={e => handlePayrollDataChange(member.id, 'deductions', e.target.value)}
                                        className="w-24 text-center"
                                        placeholder="0"
                                      />
                                    ) : (
                                      `₹${payroll ? Number(payroll.deductions).toLocaleString() : '0'}`
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    {payrollStatus !== 'processed' || editingPayrollStaffId === member.id ? (
                                      <Input
                                        type="number"
                                        min={0}
                                        value={editablePayrollData[member.id]?.overtime ?? (payroll ? payroll.overtime : 0)}
                                        onChange={e => handlePayrollDataChange(member.id, 'overtime', e.target.value)}
                                        className="w-24 text-center"
                                        placeholder="0"
                                      />
                                    ) : (
                                      `₹${payroll ? Number(payroll.overtime || 0).toLocaleString() : '0'}`
                                    )}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-green-600">
                                    ₹
                                    {(() => {
                                      if (payrollStatus === 'processed' && payroll) {
                                        return Number(payroll.netSalary).toLocaleString();
                                      }
                                      // Live calculation
                                      const basic = Number(member.salary);
                                      const attended = Number(editablePayrollData[member.id]?.attendedDays ?? 30);
                                      const allowances = Number(editablePayrollData[member.id]?.allowances ?? 0);
                                      const deductions = Number(editablePayrollData[member.id]?.deductions ?? 0);
                                      const overtime = Number(editablePayrollData[member.id]?.overtime ?? 0);

                                      const dailyRate = basic / 30;
                                      const basePay = dailyRate * attended;
                                      const net = Math.max(0, basePay + allowances + overtime - deductions);
                                      return net.toLocaleString(undefined, { maximumFractionDigits: 0 });
                                    })()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={
                                      payrollStatus === 'processed' ? 'bg-green-100 text-green-800 px-2 py-1 rounded' :
                                        payrollStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' :
                                          'bg-red-100 text-red-800 px-2 py-1 rounded'
                                    }>
                                      {payrollStatus}
                                    </span>
                                  </td>
                                  <td className="px-8 py-4">
                                    {payrollStatus !== 'processed' || editingPayrollStaffId === member.id ? (
                                      <div className="flex gap-2">
                                        <Button size="sm" className="px-4 py-2 text-base rounded-md" onClick={() => {
                                          handleGeneratePayroll(member);
                                          setEditingPayrollStaffId(null);
                                        }}>
                                          {editingPayrollStaffId === member.id ? 'Save' : 'Generate'}
                                        </Button>
                                        {editingPayrollStaffId === member.id && (
                                          <Button size="sm" variant="outline" className="px-4 py-2 text-base rounded-md" onClick={() => setEditingPayrollStaffId(null)}>
                                            Cancel
                                          </Button>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <Button size="sm" className="px-4 py-2 text-base rounded-md" onClick={e => { e.stopPropagation(); handleDownloadSalarySlip(member); }} disabled={payrollStatus !== 'processed'}>
                                          Download
                                        </Button>
                                        <Button size="sm" className="px-4 py-2 text-base rounded-md" onClick={() => setWhatsappModal({ open: true, staff: member, netSalary: payroll ? payroll.netSalary : 0 })}>
                                          Notify
                                        </Button>
                                        <Button size="sm" variant="outline" className="px-2 py-2 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-600" title="Edit Payroll" onClick={() => {
                                          if (payroll) {
                                            // Populate editable data with existing values
                                            setEditablePayrollData(prev => ({
                                              ...prev,
                                              [member.id]: {
                                                attendedDays: payroll.attendedDays,
                                                basicSalary: payroll.basicSalary,
                                                allowances: payroll.allowances || 0,
                                                deductions: payroll.deductions || 0,
                                                overtime: payroll.overtime || 0,
                                                netSalary: payroll.netSalary
                                              }
                                            }));
                                            setEditingPayrollStaffId(member.id);
                                          }
                                        }}>
                                          <Pencil size={16} />
                                        </Button>
                                        <Button size="sm" variant="destructive" className="px-2 py-2 rounded-full text-white hover:bg-red-700 bg-red-600" title="Delete Payroll Record" onClick={() => {
                                          if (payroll && confirm('Are you sure you want to delete this payroll record?')) {
                                            deletePayrollMutation.mutate(payroll.id);
                                          }
                                        }}>
                                          <Trash2 size={16} />
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {/* Other tabs can be filled similarly */}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600 text-lg">Select a contact to view details</div>
                )}
              </main>
            </div>
          </div>
        )}
        {activeTab === "payroll" && (
          <div className="min-h-screen bg-gray-50">
            <PageHeader
              title="Payroll Management"
              subtitle="Manage employee salaries and payment records"
              showSearch={false}
              filters={
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Month:</span>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                      <SelectTrigger className="w-[140px] bg-white border-[#643ae5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                          <SelectItem key={m} value={m.toString()}>
                            {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Year:</span>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                      <SelectTrigger className="w-[100px] bg-white border-[#643ae5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }
              primaryActions={
                <Button
                  onClick={() => setBulkPayrollOpen(true)}
                  className="flex items-center gap-2 px-4 h-10 bg-[#643ae5] text-white hover:bg-[#552dbf]"
                >
                  <Calculator className="w-4 h-4" />
                  Generate Bulk Payroll
                </Button>
              }
            />
            <div className="px-8">
              <Card>
                <CardContent className="pt-6">
                  {/* Payroll Tabs */}
                  <Tabs defaultValue="current" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="current">Current Month</TabsTrigger>
                      <TabsTrigger value="history">Payment History</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="current" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-h3">Current Month Payroll</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {/* Payroll Controls */}
                          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                            <div className="flex gap-4 flex-1">
                              <SearchInput
                                placeholder="Search staff by name or ID..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                wrapperClassName="relative flex-1 max-w-xl"
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <Button
                                variant="outline"
                                onClick={clearPayrollLocalStorage}
                                className="flex items-center gap-2"
                              >
                                Clear Data
                                <Trash2 size={16} />
                              </Button>
                              <Button
                                onClick={handleGenerateSelectedPayroll}
                                disabled={selectedPayrollStaff.length === 0}
                                className="flex items-center gap-2"
                              >
                                <Calculator className="mr-2 h-4 w-4" />
                                Generate Selected
                              </Button>
                              <Button
                                onClick={handleDownloadSelectedSalarySlips}
                                disabled={selectedPayrollStaff.length === 0}
                                className="flex items-center gap-2"
                              >
                                Download Selected
                              </Button>
                            </div>
                          </div>

                          {/* Payroll Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                              <div className="text-center">
                                <p className="text-sm text-green-600 font-medium">Total Net Payroll</p>
                                <p className="text-2xl font-bold text-green-700">
                                  ₹{summaryTotalNetPayroll.toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                              <div className="text-center">
                                <p className="text-sm text-blue-600 font-medium">Active Employees</p>
                                <p className="text-2xl font-bold text-blue-700">
                                  {summaryActiveEmployees}
                                </p>
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                              <div className="text-center">
                                <p className="text-sm text-purple-600 font-medium">Processed Payrolls</p>
                                <p className="text-2xl font-bold text-purple-700">
                                  {summaryProcessedPayrolls}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Payroll Table */}
                          <Card className="border rounded-lg overflow-hidden">
                            <CardContent className="p-0">
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-4 py-3">
                                        <input
                                          type="checkbox"
                                          checked={selectedPayrollStaff.length === staffTabFiltered.length && staffTabFiltered.length > 0}
                                          onChange={e => setSelectedPayrollStaff(e.target.checked ? staffTabFiltered.map(s => s.id) : [])}
                                        />
                                      </th>
                                      <th className="table-header px-6 py-3 text-left">Employee</th>
                                      <th className="table-header px-6 py-3 text-left">Days Worked</th>
                                      <th className="table-header px-6 py-3 text-left">Basic Salary</th>
                                      <th className="table-header px-6 py-3 text-left">Allowances</th>
                                      <th className="table-header px-6 py-3 text-left">Deductions</th>
                                      <th className="table-header px-6 py-3 text-left">Overtime</th>
                                      <th className="table-header px-6 py-3 text-left">Net Salary</th>
                                      <th className="table-header px-6 py-3 text-left">Status</th>
                                      <th className="table-header px-8 py-3 text-left">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-100 text-sm font-normal">
                                    {staffTabFiltered.length === 0 ? (
                                      <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-gray-400">No staff found</td>
                                      </tr>
                                    ) : (
                                      staffTabFiltered.map((member) => {
                                        const payrollData = payrollOverview.find(p => p.id === member.id);
                                        const payrollStatus = payrollData ? payrollData.payrollStatus : 'pending';
                                        const payroll = payrollData ? payrollData.payroll : null;
                                        return (
                                          <tr key={member.id}>
                                            <td className="px-4 py-2"><input type="checkbox" checked={selectedPayrollStaff.includes(member.id)} onChange={e => handlePayrollCheckboxChange(member.id, e.target.checked)} /></td>
                                            <td className="px-6 py-4 font-medium">{member.name}<div className="text-xs text-gray-500">{member.employeeId}</div></td>
                                            <td className="px-6 py-4">
                                              {payrollStatus !== 'processed' ? (
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  max={30}
                                                  value={editablePayrollData[member.id]?.attendedDays ?? (payroll ? payroll.attendedDays : 30)}
                                                  onChange={e => handlePayrollDataChange(member.id, 'attendedDays', e.target.value)}
                                                  className="w-20 text-center"
                                                />
                                              ) : (
                                                payroll ? payroll.attendedDays : '-'
                                              )}
                                            </td>
                                            <td className="px-6 py-4">₹{payroll ? Number(payroll.basicSalary).toLocaleString() : Number(member.salary).toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                              {payrollStatus !== 'processed' ? (
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  value={editablePayrollData[member.id]?.allowances ?? (payroll ? payroll.allowances : 0)}
                                                  onChange={e => handlePayrollDataChange(member.id, 'allowances', e.target.value)}
                                                  className="w-24 text-center"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                `₹${payroll ? Number(payroll.allowances).toLocaleString() : '0'}`
                                              )}
                                            </td>
                                            <td className="px-6 py-4">
                                              {payrollStatus !== 'processed' ? (
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  value={editablePayrollData[member.id]?.deductions ?? (payroll ? payroll.deductions : 0)}
                                                  onChange={e => handlePayrollDataChange(member.id, 'deductions', e.target.value)}
                                                  className="w-24 text-center"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                `₹${payroll ? Number(payroll.deductions).toLocaleString() : '0'}`
                                              )}
                                            </td>
                                            <td className="px-6 py-4">
                                              {payrollStatus !== 'processed' ? (
                                                <Input
                                                  type="number"
                                                  min={0}
                                                  value={editablePayrollData[member.id]?.overtime ?? (payroll ? payroll.overtime : 0)}
                                                  onChange={e => handlePayrollDataChange(member.id, 'overtime', e.target.value)}
                                                  className="w-24 text-center"
                                                  placeholder="0"
                                                />
                                              ) : (
                                                `₹${payroll ? Number(payroll.overtime || 0).toLocaleString() : '0'}`
                                              )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-green-600">
                                              ₹
                                              {(() => {
                                                if (payrollStatus === 'processed' && payroll) {
                                                  return Number(payroll.netSalary).toLocaleString();
                                                }
                                                // Live calculation
                                                const basic = Number(member.salary);
                                                const attended = Number(editablePayrollData[member.id]?.attendedDays ?? 30);
                                                const allowances = Number(editablePayrollData[member.id]?.allowances ?? 0);
                                                const deductions = Number(editablePayrollData[member.id]?.deductions ?? 0);
                                                const overtime = Number(editablePayrollData[member.id]?.overtime ?? 0);

                                                const dailyRate = basic / 30;
                                                const basePay = dailyRate * attended;
                                                const net = Math.max(0, basePay + allowances + overtime - deductions);
                                                return net.toLocaleString(undefined, { maximumFractionDigits: 0 });
                                              })()}
                                            </td>
                                            <td className="px-6 py-4">
                                              <span className={
                                                payrollStatus === 'processed' ? 'bg-green-100 text-green-800 px-2 py-1 rounded' :
                                                  payrollStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' :
                                                    'bg-red-100 text-red-800 px-2 py-1 rounded'
                                              }>
                                                {payrollStatus}
                                              </span>
                                            </td>
                                            <td className="px-8 py-4">
                                              {payrollStatus !== 'processed' ? (
                                                <div className="flex gap-2">
                                                  <Button size="sm" className="px-4 py-2 text-base rounded-md" onClick={() => handleGeneratePayroll(member)}>
                                                    Generate
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex gap-2">
                                                  <Button size="sm" className="px-4 py-2 text-base rounded-md" onClick={e => { e.stopPropagation(); handleDownloadSalarySlip(member); }} disabled={payrollStatus !== 'processed'}>
                                                    Download
                                                  </Button>
                                                  <Button size="sm" className="px-4 py-2 text-base rounded-md" onClick={() => setWhatsappModal({ open: true, staff: member, netSalary: payroll ? payroll.netSalary : 0 })}>
                                                    Notify
                                                  </Button>
                                                  <Button size="sm" variant="destructive" className="px-2 py-2 rounded-full text-white hover:bg-red-700 bg-red-600" title="Delete Payroll Record" onClick={() => {
                                                    if (payroll && confirm('Are you sure you want to delete this payroll record?')) {
                                                      deletePayrollMutation.mutate(payroll.id);
                                                    }
                                                  }}>
                                                    <Trash2 size={16} />
                                                  </Button>
                                                </div>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-h3">Payment History</CardTitle>
                          <CardDescription>Complete payroll history for all staff members</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Filter Controls */}
                          <div className="mb-4 flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                              <Label>Month:</Label>
                              <select
                                value={historyMonth}
                                onChange={e => setHistoryMonth(Number(e.target.value))}
                                className="border rounded px-2 py-1"
                              >
                                {availableMonths(historyYear).map(m => (
                                  <option key={m} value={m}>{new Date(historyYear, m - 1).toLocaleDateString('en-IN', { month: 'long' })}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label>Year:</Label>
                              <select
                                value={historyYear}
                                onChange={e => {
                                  const newYear = Number(e.target.value);
                                  setHistoryYear(newYear);
                                  // If current month is not available in new year, set to max available
                                  const months = availableMonths(newYear);
                                  if (!months.includes(historyMonth)) setHistoryMonth(months[0]);
                                }}
                                className="border rounded px-2 py-1"
                              >
                                {availableYears.map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label>Status:</Label>
                              <select
                                value={paymentHistoryStatusFilter}
                                onChange={e => setPaymentHistoryStatusFilter(e.target.value)}
                                className="border rounded px-2 py-1"
                              >
                                <option value="all">All Status</option>
                                <option value="processed">Processed</option>
                                <option value="pending">Pending</option>
                              </select>
                            </div>
                          </div>

                          {/* Summary Statistics */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-600">Total Records</p>
                                  <p className="text-2xl font-bold text-blue-700">{(payroll as Payroll[]).length}</p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-600" />
                              </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-600">Processed</p>
                                  <p className="text-2xl font-bold text-green-700">
                                    {(payroll as Payroll[]).filter(p => p.status === 'processed').length}
                                  </p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                              </div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                                  <p className="text-2xl font-bold text-yellow-700">
                                    {(payroll as Payroll[]).filter(p => p.status === 'pending').length}
                                  </p>
                                </div>
                                <Clock className="h-8 w-8 text-yellow-600" />
                              </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-purple-600">Total Amount</p>
                                  <p className="text-2xl font-bold text-purple-700">
                                    ₹{(payroll as Payroll[]).reduce((sum, p) => sum + Number(p.netSalary), 0).toLocaleString()}
                                  </p>
                                </div>
                                <IndianRupee className="h-8 w-8 text-purple-600" />
                              </div>
                            </div>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="table-header">Employee</TableHead>
                                <TableHead className="table-header">Month</TableHead>
                                <TableHead className="table-header">Basic Salary</TableHead>
                                <TableHead className="table-header">Allowances</TableHead>
                                <TableHead className="table-header">Deductions</TableHead>
                                <TableHead className="table-header">Net Salary</TableHead>
                                <TableHead className="table-header">Status</TableHead>
                                <TableHead className="table-header">Payment Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {((payroll as Payroll[]).filter(p =>
                                (historyMonth ? p.month === historyMonth : true) &&
                                (historyYear ? p.year === historyYear : true) &&
                                (paymentHistoryStatusFilter === 'all' ? true : p.status === paymentHistoryStatusFilter)
                              )).map((payrollRecord) => {
                                const staffMember = (staff as Staff[]).find(s => s.id === payrollRecord.staffId);
                                if (!staffMember) return null;
                                return (
                                  <TableRow key={payrollRecord.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{staffMember.name}</div>
                                        <div className="text-sm text-gray-500">{staffMember.employeeId}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {new Date(payrollRecord.year, payrollRecord.month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell>₹{Number(payrollRecord.basicSalary).toLocaleString()}</TableCell>
                                    <TableCell>₹{Number(payrollRecord.allowances || 0).toLocaleString()}</TableCell>
                                    <TableCell>₹{Number(payrollRecord.deductions || 0).toLocaleString()}</TableCell>
                                    <TableCell className="font-semibold text-green-600">
                                      ₹{Number(payrollRecord.netSalary).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={
                                        payrollRecord.status === 'processed'
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : payrollRecord.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            : 'bg-red-100 text-red-800 border-red-200'
                                      }>
                                        {payrollRecord.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {payrollRecord.status === 'processed'
                                        ? new Date(payrollRecord.generatedAt || new Date()).toLocaleDateString('en-IN')
                                        : '-'
                                      }
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {((payroll as Payroll[]).filter(p =>
                                (historyMonth ? p.month === historyMonth : true) &&
                                (historyYear ? p.year === historyYear : true) &&
                                (paymentHistoryStatusFilter === 'all' ? true : p.status === paymentHistoryStatusFilter)
                              ).length === 0) && (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>No payroll records found</p>
                                      <p className="text-sm">Generate payroll for staff members to see payment history</p>
                                    </TableCell>
                                  </TableRow>
                                )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                      {/* Remove the grid with Payroll Settings and Allowance Settings cards here */}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Enter the details for the new Employee below</DialogDescription>
            </DialogHeader>
            <Form {...addStaffForm}>
              <form onSubmit={addStaffForm.handleSubmit(onAddStaffSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField control={addStaffForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} required placeholder="e.g. John Doe" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} required placeholder="1234567890" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="role" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STAFF_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            placeholder="Enter employee address"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="salary" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary (₹)</FormLabel>
                        <FormControl><Input {...field} type="number" value={field.value ?? ''} required min={0} placeholder="e.g. 50000" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="bankAccountNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter bank account number" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-4">
                    <FormField control={addStaffForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input {...field} type="email" value={field.value ?? ''} placeholder="john.doe@example.com" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="dateOfJoining" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Joining</FormLabel>
                        <FormControl><Input {...field} type="date" value={field.value ?? ''} required /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="department" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="HR">HR</SelectItem>
                            <SelectItem value="IT">IT</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="qualifications" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ''}
                            placeholder="Enter employee qualifications (e.g., B.Tech, MBA, etc.)"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="ifscCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter IFSC code" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={addStaffForm.control} name="panNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>PAN Number</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter PAN number" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsAddStaffOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addStaffForm.formState.isSubmitting}>
                    {addStaffForm.formState.isSubmitting ? "Adding..." : "Add Staff"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Modal */}
        <Dialog open={whatsappModal.open} onOpenChange={(open) => setWhatsappModal({ ...whatsappModal, open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send WhatsApp Notification</DialogTitle>
              <DialogDescription>
                Send salary credited notification to {whatsappModal.staff?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Message Preview</span>
                </div>
                <div className="text-sm text-green-700 whitespace-pre-line">
                  {whatsappModal.staff && getSalaryCreditedMessage(whatsappModal.staff, whatsappModal.netSalary)}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>Phone: {whatsappModal.staff?.phone || 'No phone number available'}</p>
                <p>Net Salary: ₹{whatsappModal.netSalary.toLocaleString()}</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setWhatsappModal({ open: false, staff: null, netSalary: 0 })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (whatsappModal.staff?.phone) {
                    const message = getSalaryCreditedMessage(whatsappModal.staff, whatsappModal.netSalary);
                    const whatsappUrl = `https://wa.me/${whatsappModal.staff.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    setWhatsappModal({ open: false, staff: null, netSalary: 0 });
                    toast({
                      title: "WhatsApp Opened",
                      description: "WhatsApp has been opened with the salary notification message.",
                    });
                  } else {
                    toast({
                      title: "No Phone Number",
                      description: "This employee doesn't have a phone number registered.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={!whatsappModal.staff?.phone}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Open WhatsApp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        {selectedStaff && (
          <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>Edit the details for this employee below</DialogDescription>
              </DialogHeader>
              <Form {...editStaffForm}>
                <form onSubmit={editStaffForm.handleSubmit((data) => {
                  if (!selectedStaff) return;
                  const payload = { ...data, id: selectedStaff.id };
                  editStaffMutation.mutate(payload);
                })} className="space-y-6">
                  <FormField control={editStaffForm.control} name="isActive" render={({ field }) => (
                    <div className="flex items-center gap-4 mb-2">
                      <Label htmlFor="isActive-toggle" className="text-base font-medium">
                        {field.value ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id="isActive-toggle"
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </div>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FormField control={editStaffForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ''} required placeholder="e.g. John Doe" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ''} required placeholder="1234567890" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="role" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STAFF_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Enter employee address"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="salary" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary (₹)</FormLabel>
                          <FormControl><Input {...field} type="number" value={field.value ?? ''} required min={0} placeholder="e.g. 50000" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="bankAccountNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account Number</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter bank account number" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div className="space-y-4">
                      <FormField control={editStaffForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input {...field} type="email" value={field.value ?? ''} required placeholder="e.g. john.doe@example.com" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="dateOfJoining" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Joining</FormLabel>
                          <FormControl><Input {...field} type="date" value={field.value ?? ''} required /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="department" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="HR">HR</SelectItem>
                              <SelectItem value="IT">IT</SelectItem>
                              <SelectItem value="Finance">Finance</SelectItem>
                              <SelectItem value="Operations">Operations</SelectItem>
                              <SelectItem value="Marketing">Marketing</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="qualifications" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualifications</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ''}
                              placeholder="Enter employee qualifications (e.g., B.Tech, MBA, etc.)"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="ifscCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter IFSC code" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={editStaffForm.control} name="panNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ''} placeholder="Enter PAN number" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsEditStaffOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={editStaffMutation.isPending}>
                      {editStaffMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {staffToDelete?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-[#643ae5] text-white hover:bg-[#7a7ca0]"
                onClick={async () => {
                  if (staffToDelete) {
                    await deleteStaffMutation.mutateAsync(staffToDelete.id);
                    setDeleteDialogOpen(false);
                    setStaffToDelete(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CSV Import Modal */}
        {isCSVImportOpen && (
          <Dialog open={isCSVImportOpen} onOpenChange={setIsCSVImportOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Import Staff Data</DialogTitle>
                <DialogDescription>
                  Import staff members from a CSV file
                </DialogDescription>
              </DialogHeader>
              <StaffCSVImport
                onSuccess={() => {
                  setIsCSVImportOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
                }}
                onClose={() => setIsCSVImportOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
