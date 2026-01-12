import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import SidebarPageHeader from "@/components/layout/sidebar-page-header";
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  Bot,
  Calendar,
  Building,
  User,
  Plus,
  Download,
  Upload,
  Eye,
  Search,
  Settings,
  Phone,
  Mail,
  Calculator,
  Clock,
  Percent,
  IndianRupee,
  CheckCircle,
  Info,
  Trash2,
  Edit,
  Printer,
  GraduationCap,
  ListFilter
} from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { generateMelonsFeeReceipt, type FeeReceiptData } from "@/lib/receipt-generator";
import { generateInvoicePDF } from "@/lib/invoice-generator";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useHashState } from "@/hooks/use-hash-state";
import { type LeadWithCounselor } from "@shared/schema";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useOrganization } from "@/hooks/use-organization";

interface Student {
  id: number;
  name: string;
  studentId: string;
  class: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  type?: string;
}

interface FeeStructure {
  id: number;
  studentId: number;
  feeType: string;
  amount: string;
  dueDate: string;
  status: string;
  installmentNumber: number;
  totalInstallments: number;
}

interface FeePayment {
  id: number;
  leadId: number;
  amount: string;
  discount: string;
  paymentDate: string;
  paymentMode: string;
  receiptNumber?: string;
  installmentNumber?: number;
  transactionId?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  paymentCategory?: 'fee_payment' | 'additional_charge';
  chargeType?: string;
}

interface EMandate {
  id: number;
  leadId: number;
  mandateId: string;
  status: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  frequency?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FeeStats {
  totalPending: number;
  collectionRate: number;
  totalOverdue: number;
}

interface ClassFeeStructure {
  id: number;
  className: string;
  feeType: string;
  amount: string;
  frequency: string;
  dueDate: string;
  description?: string;
}

interface MasterFee {
  id: number;
  className: string;
  feeType: string;
  amount: string;
  frequency: string;
  dueDate: string;
  description?: string;
  isActive: boolean;
}

interface CombinedStudent {
  id: number;
  name: string;
  studentId: string;
  class: string;
  parentName?: string | null;
  parentPhone?: string | null;
  type: 'student' | 'enrolled_lead';
  source: string;
  email?: string | null;
  phone?: string | null;
  stream?: string | null;
  status?: string;
  counselor?: any;
  createdAt?: Date;
  lastContactedAt?: Date | null;
}

interface GlobalClassFee {
  id: number;
  className: string;
  feeType: string;
  amount: string;
  frequency: string;
  academicYear: string;
  description?: string;
  isActive: boolean;
}

interface EmiPlan {
  id: number;
  studentId: number;
  totalAmount: string;
  numberOfInstallments: number;
  installmentAmount: string;
  startDate: string;
  endDate: string;
  status: string;
  discount?: string;
  createdAt?: string;
  updatedAt?: string;
}

// EMI Payment Progress Component
// EMI Payment Progress Component
function EMIPaymentProgress({ planId, totalInstallments, installmentAmount, status, totalAmount }: { planId: number; totalInstallments: number; installmentAmount: string; status?: string, totalAmount?: string }) {
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useQuery({
    queryKey: [`/api/emi-plans/${planId}/payments`],
    queryFn: async () => {
      const res = await fetch(`/api/emi-plans/${planId}/payments`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/emi-plans/${planId}`, { status: 'completed' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emi-plans"] });
    }
  });

  // Dynamic calculation based on amount with tolerance
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;
  const instAmount = parseFloat(installmentAmount);
  const totalCost = parseFloat(totalAmount || "0");
  const TOLERANCE = 10;

  // Calculate down payment (difference between total cost and sum of installments)
  const totalInstallmentCost = instAmount * totalInstallments;
  // Use a small epsilon for float comparison if needed, but Math.max(0) handles negatives
  const downPayment = Math.max(0, totalCost - totalInstallmentCost);

  // Effective paid amount towards installments (after covering down payment)
  const effectivePaid = Math.max(0, totalPaid - downPayment);

  let paidCount = 0;
  if (instAmount > 0) {
    paidCount = Math.floor((effectivePaid + TOLERANCE) / instAmount);
  }
  // Cap at totalInstallments
  paidCount = Math.min(paidCount, totalInstallments);

  const progress = (paidCount / totalInstallments) * 100;

  useEffect(() => {
    // Check if covered total cost
    const isFullyPaid = totalPaid >= (totalCost - TOLERANCE);
    if (!isLoading && (progress === 100 || isFullyPaid) && status !== 'completed') {
      updateStatusMutation.mutate();
    }
  }, [isLoading, progress, status, updateStatusMutation, totalPaid, totalCost]);

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-1">
      <div className="text-sm">
        <span className="text-gray-500">EMI Amount:</span> ₹{Math.round(instAmount).toLocaleString()}
      </div>
      <div className="text-sm">
        <span className="text-gray-500">Progress:</span> {paidCount}/{totalInstallments} installments
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Record Payment Button Component - checks if all payments are complete
function RecordPaymentButton({ plan, onClick }: { plan: any; onClick: () => void }) {
  const { data: payments, isLoading } = useQuery({
    queryKey: [`/api/emi-plans/${plan.id}/payments`],
    queryFn: async () => {
      const res = await fetch(`/api/emi-plans/${plan.id}/payments`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Check if fully paid efficiently using amounts with tolerance
  const totalPaid = payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;
  const totalPlanAmount = parseFloat(plan.totalAmount || 0);
  const TOLERANCE = 10;

  // Also check explicit "all installments paid" logic if needed, but amount is safer for rounding
  const allPaid = totalPaid >= (totalPlanAmount - TOLERANCE);

  return (
    <Button
      variant="outline"
      size="sm"
      className={allPaid ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-[#643ae5] text-[#643ae5] hover:bg-slate-50"}
      onClick={onClick}
      disabled={allPaid || isLoading}
    >
      <CreditCard className="mr-1 h-3 w-3" />
      Record Payment
    </Button>
  );
}

export default function StudentFees() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [addMandateOpen, setAddMandateOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useHashState("overview");
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null);
  const [addClassFeeOpen, setAddClassFeeOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [setClassFeeOpen, setSetClassFeeOpen] = useState(false);
  const [editingClassFee, setEditingClassFee] = useState<ClassFeeStructure | null>(null);
  const [emiModalOpen, setEmiModalOpen] = useState(false);
  const [emiEditingFee, setEmiEditingFee] = useState<FeeStructure | null>(null);
  const [emiData, setEmiData] = useState<Record<number, { emiPeriod: string, paidAmount: string, emiDues: string }>>({});
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [studentPaymentStatusFilter, setStudentPaymentStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [mandateFrequency, setMandateFrequency] = useState("monthly");
  const [globalFeeModalOpen, setGlobalFeeModalOpen] = useState(false);
  const [editingGlobalFee, setEditingGlobalFee] = useState<GlobalClassFee | null>(null);
  // Global Organization Settings
  // Global Organization Settings
  const { academicYear: globalAcademicYear, settings } = useOrganization();
  const [academicYear, setAcademicYear] = useState(globalAcademicYear || "2026-27");

  // Sync with global academic year when it changes
  useEffect(() => {
    if (globalAcademicYear) {
      setAcademicYear(globalAcademicYear);
    }
  }, [globalAcademicYear]);
  const [viewTotalFeesModalOpen, setViewTotalFeesModalOpen] = useState(false);
  const [selectedClassForTotal, setSelectedClassForTotal] = useState<string>("");

  // Student edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const validateForm = (student: Partial<Student>) => {
    const errors: { [key: string]: string } = {};

    if (!student.name?.trim()) {
      errors.name = "Name is required";
    }

    if (student.parentPhone && !validatePhone(student.parentPhone)) {
      errors.parentPhone = "Please enter a valid phone number";
    }

    if ((student as any).email && !validateEmail((student as any).email)) {
      errors.email = "Please enter a valid email address";
    }

    return errors;
  };

  // Save handler - exactly like staff management
  const handleSave = () => {
    console.log("HandleSave called, editedStudent:", editedStudent);
    if (!editedStudent) return;
    updateStudentMutation.mutate(editedStudent);
  };

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Class', 'Parent Name', 'Parent Phone', 'Email', 'Address'];
    const csvContent = [
      headers.join(','),
      ...allStudents.map(student => [
        student.studentId || '',
        student.name || '',
        student.class || '',
        student.parentName || '',
        student.parentPhone || '',
        (student as any).email || '',
        (student as any).address || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${allStudents.length} students exported to CSV`,
    });
  };

  // Import CSV function
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      // For now, just show a success message
      toast({
        title: "Import Started",
        description: `Processing ${lines.length - 1} rows from CSV file`,
      });

      // Reset the input
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  // Payment management state
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [paymentViewDetailsOpen, setPaymentViewDetailsOpen] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentDateFilter, setPaymentDateFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(10);
  const [paymentStats, setPaymentStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalFailed: 0,
    monthlyCollection: 0,
    collectionRate: 0
  });

  // EMI Payment Modal state
  const [emiPaymentModalOpen, setEmiPaymentModalOpen] = useState(false);
  const [selectedEmiPlan, setSelectedEmiPlan] = useState<EmiPlan | null>(null);
  const [emiPaymentFormData, setEmiPaymentFormData] = useState({
    installmentNumber: 1,
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: '',
    receiptNumber: '',
    transactionId: '',
    status: 'completed'
  });

  // EMI Payment Progress state
  const [emiPaymentProgress, setEmiPaymentProgress] = useState<any>(null);
  const [pendingEmis, setPendingEmis] = useState<any[]>([]);

  // Payment Details Modal state
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [selectedPaymentForDetails, setSelectedPaymentForDetails] = useState<FeePayment | null>(null);

  // Query for EMI payment progress
  const { data: emiProgressData, refetch: refetchEmiProgress } = useQuery({
    queryKey: ["/api/emi-plans", selectedEmiPlan?.id, "payment-progress"],
    queryFn: async () => {
      if (!selectedEmiPlan) return null;
      const response = await fetch(`/api/emi-plans/${selectedEmiPlan.id}/payment-progress`);
      if (!response.ok) throw new Error('Failed to fetch EMI progress');
      return response.json();
    },
    enabled: !!selectedEmiPlan,
  });

  // Query for EMI payments to calculate next installment number
  const { data: emiPaymentsForModal } = useQuery({
    queryKey: ["/api/emi-plans", selectedEmiPlan?.id, "payments"],
    queryFn: async () => {
      if (!selectedEmiPlan) return [];
      const res = await fetch(`/api/emi-plans/${selectedEmiPlan.id}/payments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedEmiPlan,
  });

  const nextInstallmentNumber = emiPaymentsForModal?.length && emiPaymentsForModal.length > 0
    ? Math.max(...emiPaymentsForModal.map((p: any) => p.installmentNumber || 0)) + 1
    : 1;

  // Query for pending EMIs
  const { data: pendingEmisData, refetch: refetchPendingEmis } = useQuery({
    queryKey: ["/api/emi-plans", selectedEmiPlan?.id, "pending-emis"],
    queryFn: async () => {
      if (!selectedEmiPlan) return [];
      const response = await fetch(`/api/emi-plans/${selectedEmiPlan.id}/pending-emis`);
      if (!response.ok) throw new Error('Failed to fetch pending EMIs');
      return response.json();
    },
    enabled: !!selectedEmiPlan,
  });

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    studentSelect: "",
    amount: "",
    discount: "",
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: "",
    receiptNumber: "",
    installmentNumber: "",
    transactionId: "",
    status: "completed",
    paymentCategory: "additional_charge", // Default for direct payments
    chargeType: "annual_function", // Default charge type
  });

  // EMI Modal state
  const [paymentType, setPaymentType] = useState<'emi' | 'full'>('emi');
  const [selectedStudentForEMI, setSelectedStudentForEMI] = useState<CombinedStudent | null>(null);
  const [emiFormData, setEmiFormData] = useState({
    totalAmount: '',
    emiPeriod: '2',
    emiAmount: '',
    registrationFee: '0',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
    frequency: 'monthly',
    processingFee: '0',
    lateFee: '0',
    receiptNumber: '',
    discount: '',
    paymentMode: '',
    transactionId: '',
    installments: [] as { amount: string, dueDate: string }[]
  });

  // Fetch data
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: feeStructures = [] } = useQuery<FeeStructure[]>({ queryKey: ["/api/fee-structures"] });
  const { data: feePayments = [] } = useQuery<FeePayment[]>({ queryKey: ["/api/fee-payments"] });
  const { data: eMandates = [], refetch: refetchEMandates } = useQuery<EMandate[]>({ queryKey: ["/api/e-mandates"] });
  const { data: feeStats } = useQuery<FeeStats>({ queryKey: ["/api/fee-stats"] });
  // Note: class-fee-structures removed - endpoint not in use
  const { data: globalClassFees = [], refetch: refetchGlobalFees } = useQuery<GlobalClassFee[]>({ queryKey: ["/api/global-class-fees"] });
  const { data: emiPlans = [], refetch: refetchEmiPlans } = useQuery<EmiPlan[]>({ queryKey: ["/api/emi-plans"] });


  // Fetch enrolled leads
  const { data: enrolledLeads = [], refetch: refetchLeads } = useQuery<LeadWithCounselor[]>({
    queryKey: ["/api/leads", "enrolled"],
    queryFn: async () => {
      // Import getAuthHeaders from queryClient or implement logic inline if import fails (safe bet: inline logic or use apiRequest but apiRequest throws)
      // Since I just exported it, I should import it. But for safety/speed and to avoid top-level import conflicts in this snippet, I can just get it from localStorage directly here or assume import works.
      // Let's rely on importing it at top of file, but I need to do that with a separate edit or use inline logic.
      // Inline logic is safer for a single replace block without context of imports.

      const userStr = localStorage.getItem('auth_user');
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.email) headers['x-user-name'] = user.email;
        } catch (e) { console.error("Error parsing auth", e); }
      }

      const response = await fetch("/api/leads?status=enrolled", { headers });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Note: addClassFeeMutation removed - endpoint /api/class-fee-structures not in use

  // Global class fee mutation
  const globalClassFeeMutation = useMutation({
    mutationFn: async (data: Partial<GlobalClassFee>) => {
      const url = editingGlobalFee ? `/api/global-class-fees/${editingGlobalFee.id}` : "/api/global-class-fees";
      const method = editingGlobalFee ? "PUT" : "POST";

      console.log("Sending global class fee data:", data);
      console.log("URL:", url);
      console.log("Method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to save global class fee: ${errorText}`);
      }

      const result = await response.json();
      console.log("API success response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/global-class-fees"] });
      setGlobalFeeModalOpen(false);
      setEditingGlobalFee(null);
      toast({
        title: "Success",
        description: `Global class fee ${editingGlobalFee ? "updated" : "created"} successfully`,
      });
    },
    onError: (error) => {
      console.error("Global class fee mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to save global class fee: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add E-Mandate mutation
  const addEMandateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending E-Mandate data to API:", data);
      const response = await fetch("/api/e-mandates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": JSON.parse(localStorage.getItem('auth_user') || '{}').email
        },
        body: JSON.stringify(data),
      });
      console.log("API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to create E-Mandate: ${errorText}`);
      }
      const result = await response.json();
      console.log("API success response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/e-mandates"] });
      setAddMandateOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Success",
        description: "E-Mandate created successfully",
      });
    },
    onError: (error) => {
      console.error("E-Mandate creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create E-Mandate: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending payment data to API:", data);
      const response = await fetch("/api/fee-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": JSON.parse(localStorage.getItem('auth_user') || '{}').email
        },
        body: JSON.stringify(data),
      });
      console.log("API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to record payment: ${errorText}`);
      }
      const result = await response.json();
      console.log("API success response:", result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
      setAddPaymentOpen(false);
      setEmiPaymentModalOpen(false);
      setEmiModalOpen(false); // Also close EMI modal if payment came from there
      resetPaymentForm();
      resetEmiPaymentForm();

      // Payment is recorded with receipt number
      // Users can print receipt later from Payments tab

      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error) => {
      console.error("Payment recording error:", error);
      toast({
        title: "Error",
        description: `Failed to record payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add EMI plan mutation
  const addEmiPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending EMI plan data to API:", data);
      const response = await fetch("/api/emi-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": JSON.parse(localStorage.getItem('auth_user') || '{}').email
        },
        body: JSON.stringify(data),
      });
      console.log("API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        throw new Error(`Failed to create EMI plan: ${errorText}`);
      }
      const result = await response.json();
      console.log("API success response:", result);
      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/emi-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });

      // Down payment is recorded automatically by backend
      // Users can print receipt later from Payments tab


      setEmiModalOpen(false);
      resetEmiForm();
      toast({
        title: "Success",
        description: "EMI plan created successfully",
      });
    },
    onError: (error) => {
      console.error("EMI plan creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create EMI plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getStudentFees = (studentId: number) => {
    return feeStructures.filter((f: FeeStructure) => f.studentId === studentId);
  };

  const getStudentPayments = (studentId: number) => {
    return feePayments.filter((p: FeePayment) => p.leadId === studentId);
  };

  const getStudentMandate = (studentId: number) => {
    return eMandates.find((m: EMandate) => m.leadId === studentId);
  };

  // Helper to include global fees
  const getStudentFeesWithGlobal = (student: Student | CombinedStudent) => {
    const explicitFees = feeStructures.filter((f: FeeStructure) => f.studentId === student.id);
    const globalFees = globalClassFees.filter(
      (fee: GlobalClassFee) => fee.className === student.class && fee.academicYear === academicYear && fee.isActive
    );
    const explicitFeeTypes = new Set(explicitFees.map((f: FeeStructure) => f.feeType));
    const virtualGlobalFees = globalFees
      .filter((fee: GlobalClassFee) => !explicitFeeTypes.has(fee.feeType))
      .map((fee: GlobalClassFee) => ({
        ...fee,
        studentId: student.id,
        status: "pending",
        isGlobal: true,
        dueDate: '',
        installmentNumber: 1,
        totalInstallments: 1,
      }));
    return [...explicitFees, ...virtualGlobalFees] as FeeStructure[];
  };

  const calculateTotalFees = (fees: FeeStructure[]) => {
    return fees.reduce((sum: number, fee: FeeStructure) => sum + parseFloat(fee.amount), 0);
  };

  const calculatePaidAmount = (payments: FeePayment[]) => {
    return Math.round(payments.reduce((sum, p) => sum + parseFloat(p.amount), 0));
  };

  const calculateTuitionPaidAmount = (payments: FeePayment[]) => {
    return Math.round(payments
      .filter(p => p.paymentCategory === 'fee_payment' || !p.paymentCategory)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0));
  };

  const calculateAdditionalPaidAmount = (payments: FeePayment[]) => {
    return Math.round(payments
      .filter(p => p.paymentCategory === 'additional_charge')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0));
  };

  const calculateOutstanding = (student: Student | CombinedStudent) => {
    const fees = getStudentFeesWithGlobal(student);
    const payments = getStudentPayments(student.id);

    const totalFees = Math.round(fees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0));
    // Only count tuition payments towards outstanding
    const totalPaid = calculateTuitionPaidAmount(payments);

    // Calculate total discounts from payments
    const paymentDiscounts = payments.reduce((sum, p) => sum + (parseFloat(p.discount || "0") || 0), 0);

    // Calculate discounts from active/completed EMI plans
    const studentEmiPlans = emiPlans.filter(p => p.studentId === student.id && p.status !== 'cancelled');
    const emiPlanDiscounts = studentEmiPlans.reduce((sum, p) => sum + (parseFloat(p.discount || "0") || 0), 0);

    const totalDiscounts = paymentDiscounts + emiPlanDiscounts;

    return Math.max(0, totalFees - totalPaid - totalDiscounts);
  };

  const getFeeStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddClassFee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Note: This feature is currently disabled - API endpoint not implemented
    toast({
      title: "Feature Unavailable",
      description: "Class fee structure endpoint is not currently available",
      variant: "destructive"
    });
    setAddClassFeeOpen(false);
  };

  const handleGlobalClassFee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const globalFeeData: Partial<GlobalClassFee> = {
      className: formData.get("className")?.toString() || "",
      feeType: formData.get("feeType")?.toString() || "",
      amount: formData.get("amount")?.toString() || "",
      frequency: formData.get("frequency")?.toString() || "",
      academicYear: formData.get("academicYear")?.toString() || academicYear,
      description: formData.get("description")?.toString() || "",
      isActive: formData.get("isActive") === "true",
    };
    globalClassFeeMutation.mutate(globalFeeData);
  };

  const handleAddEMandate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      leadId: selectedStudent?.id,
      mandateId: `MAND${Date.now()}`,
      bankName: formData.get("bankName"),
      accountNumber: formData.get("accountNumber"),
      ifscCode: formData.get("ifscCode"),
      accountHolderName: formData.get("accountHolderName"),
      maxAmount: formData.get("maxAmount"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      frequency: mandateFrequency,
      status: "active",
    };

    console.log("Creating E-Mandate with data:", data);
    console.log("Selected student:", selectedStudent);

    addEMandateMutation.mutate(data);
  };

  // Use API data directly
  const displayStudents = students;
  const displayFeeStructures = feeStructures;
  const displayFeePayments = feePayments;
  const displayEMandates = eMandates;

  // Combine students and enrolled leads for display
  const allStudents: CombinedStudent[] = [
    ...displayStudents.map(student => ({
      ...student,
      class: student.class,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      address: student.address,
      type: 'student' as const,
      source: 'student_record',
      email: (student as any).email,
      phone: (student as any).phone,
      stream: (student as any).stream,
      status: (student as any).status,
      counselor: (student as any).counselor,
      createdAt: (student as any).createdAt,
      lastContactedAt: (student as any).lastContactedAt
    })),
    ...enrolledLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      studentId: `L${lead.id}`,
      class: lead.class,
      parentName: lead.parentName,
      parentPhone: lead.parentPhone,
      type: 'enrolled_lead' as const,
      source: lead.source,
      counselor: lead.counselor,
      email: lead.email,
      phone: lead.phone,
      stream: lead.stream,
      status: lead.status,
      createdAt: lead.createdAt,
      lastContactedAt: lead.lastContactedAt,
      address: lead.address,
    }))
  ];

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled": return "bg-green-100 text-green-800";
      case "interested": return "bg-yellow-100 text-yellow-800";
      case "contacted": return "bg-purple-100 text-purple-800";
      case "new": return "bg-blue-100 text-blue-800";
      case "dropped": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Reset currentPage when filters/search/page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [classFilter, statusFilter, studentSearch, studentsPerPage]);

  const handleDeleteMandate = async (mandateId: number) => {
    try {
      const response = await fetch(`/api/e-mandates/${mandateId}`, { method: 'DELETE' });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/e-mandates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        toast({
          title: "Success",
          description: "E-Mandate deleted successfully",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete E-Mandate",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting mandate:", error);
      toast({
        title: "Error",
        description: "Failed to delete E-Mandate",
        variant: "destructive",
      });
    }
  };

  // Utility functions for global class fees
  const calculateClassTotalFees = (className: string, academicYear: string) => {
    const classFees = globalClassFees.filter(fee =>
      fee.className === className &&
      fee.academicYear === academicYear &&
      fee.isActive
    );
    return classFees.reduce((total, fee) => total + parseFloat(fee.amount), 0);
  };

  const getClassFeeBreakdown = (className: string, academicYear: string) => {
    return globalClassFees.filter(fee =>
      fee.className === className &&
      fee.academicYear === academicYear &&
      fee.isActive
    );
  };

  const handleViewTotalFees = (className: string) => {
    setSelectedClassForTotal(className);
    setViewTotalFeesModalOpen(true);
  };

  const applyGlobalFeesToStudent = (studentId: number, className: string, academicYear: string) => {
    const classFees = getClassFeeBreakdown(className, academicYear);
    // This would typically create individual fee structures for the student
    // based on the global class fees
    return classFees.map(fee => ({
      studentId,
      feeType: fee.feeType,
      amount: fee.amount,
      frequency: fee.frequency,
      academicYear: fee.academicYear,
      status: "pending"
    }));
  };

  // Calculate payment statistics
  useEffect(() => {
    const calculatePaymentStats = () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const totalCollected = displayFeePayments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalPending = displayFeePayments
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalFailed = displayFeePayments
        .filter(p => p.status === "failed")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const monthlyCollection = displayFeePayments
        .filter(p => {
          const paymentDate = new Date(p.paymentDate);
          return p.status === "completed" &&
            paymentDate.getMonth() === currentMonth &&
            paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalExpected = allStudents.reduce((sum, student) => {
        const classFees = globalClassFees.filter(fee =>
          fee.className === student.class &&
          fee.academicYear === academicYear &&
          fee.isActive
        );
        return sum + classFees.reduce((classSum, fee) => classSum + parseFloat(fee.amount), 0);
      }, 0);

      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      setPaymentStats({
        totalCollected,
        totalPending,
        totalFailed,
        monthlyCollection,
        collectionRate
      });
    };

    calculatePaymentStats();
  }, [displayFeePayments, allStudents, globalClassFees, academicYear]);

  // Filter payments
  const filteredPayments = displayFeePayments.filter((payment) => {
    const student = allStudents.find(s => s.id === payment.leadId);
    if (!student) return false;

    const matchesSearch = student.name.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      student.studentId.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      payment.receiptNumber?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(paymentSearch.toLowerCase());

    const matchesDate = paymentDateFilter === "all" || (() => {
      const paymentDate = new Date(payment.paymentDate);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      switch (paymentDateFilter) {
        case "today": return paymentDate >= today;
        case "yesterday": return paymentDate >= yesterday && paymentDate < today;
        case "this-week": return paymentDate >= thisWeek;
        case "this-month": return paymentDate >= thisMonth;
        default: return true;
      }
    })();

    const matchesMode = paymentModeFilter === "all" || payment.paymentMode === paymentModeFilter;
    const matchesStatus = paymentStatusFilter === "all" || payment.status === paymentStatusFilter;

    return matchesSearch && matchesDate && matchesMode && matchesStatus;
  });

  const totalPaymentPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (paymentCurrentPage - 1) * paymentsPerPage,
    paymentCurrentPage * paymentsPerPage
  );

  // Reset payment page when filters change
  useEffect(() => {
    setPaymentCurrentPage(1);
  }, [paymentSearch, paymentDateFilter, paymentModeFilter, paymentStatusFilter, paymentsPerPage]);

  const handleAddPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate required fields
    if (!paymentFormData.studentSelect || !paymentFormData.amount || !paymentFormData.paymentDate || !paymentFormData.paymentMode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const data = {
      leadId: parseInt(paymentFormData.studentSelect),
      amount: paymentFormData.amount,
      discount: paymentFormData.discount || "0",
      paymentDate: paymentFormData.paymentDate,
      paymentMode: paymentFormData.paymentMode,
      receiptNumber: paymentFormData.receiptNumber || undefined,
      installmentNumber: paymentFormData.installmentNumber ? parseInt(paymentFormData.installmentNumber) : undefined,
      transactionId: paymentFormData.transactionId || undefined,
      status: paymentFormData.status,
      paymentCategory: paymentFormData.paymentCategory || 'additional_charge', // Always additional_charge for direct payments
      chargeType: paymentFormData.chargeType || undefined, // Specific charge type
    };

    console.log("Recording payment with data:", data);
    console.log("Selected student:", selectedStudent);

    addPaymentMutation.mutate(data);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      studentSelect: "",
      amount: "",
      discount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: "",
      receiptNumber: "",
      installmentNumber: "",
      transactionId: "",
      status: "completed",
      paymentCategory: "additional_charge", // Default for direct payments
      chargeType: "annual_function", // Default charge type
    });
    setSelectedStudent(null);
  };

  const resetEmiForm = () => {
    setEmiFormData({
      totalAmount: '',
      emiPeriod: '12',
      emiAmount: '',
      registrationFee: '0',
      interestRate: '0',
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      processingFee: '0',
      lateFee: '0',
      receiptNumber: '',
      discount: '',
      paymentMode: '',
      transactionId: '',
      installments: []
    });
    setPaymentType('emi');
    setSelectedStudentForEMI(null);
  };

  const handleEmiPayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedEmiPlan) {
      toast({
        title: "Error",
        description: "No EMI plan selected",
        variant: "destructive",
      });
      return;
    }

    const data = {
      leadId: selectedEmiPlan.studentId,
      amount: emiPaymentFormData.amount,
      discount: "0",
      paymentDate: emiPaymentFormData.paymentDate,
      paymentMode: emiPaymentFormData.paymentMode,
      receiptNumber: emiPaymentFormData.receiptNumber || undefined,
      installmentNumber: parseInt(emiPaymentFormData.installmentNumber.toString()),
      transactionId: emiPaymentFormData.transactionId || undefined,
      status: emiPaymentFormData.status
    };

    console.log("Recording EMI payment with data:", data);

    addPaymentMutation.mutate(data, {
      onSuccess: () => {
        refetchEmiProgress();
        refetchPendingEmis();
        refetchEmiPlans();
        toast({
          title: "Success",
          description: "EMI payment recorded and UI updated.",
        });
        // Auto-advance or close modal as before
        if (pendingEmis.length > 1) {
          setEmiPaymentFormData(prev => ({
            ...prev,
            installmentNumber: pendingEmis[1].installmentNumber,
            amount: pendingEmis[1].amount
          }));
        } else {
          setEmiPaymentModalOpen(false);
          resetEmiPaymentForm();
        }
      }
    });
  };

  const resetEmiPaymentForm = () => {
    setEmiPaymentFormData({
      installmentNumber: 1,
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: '',
      receiptNumber: '',
      transactionId: '',
      status: 'completed'
    });
    setSelectedEmiPlan(null);
  };

  // Update EMI payment form when EMI plan is selected
  useEffect(() => {
    if (selectedEmiPlan) {
      // Set default values
      setEmiPaymentFormData(prev => ({
        ...prev,
        amount: selectedEmiPlan.installmentAmount,
        installmentNumber: 1
      }));

      // If we have pending EMIs data, set the next installment
      if (pendingEmis.length > 0) {
        setEmiPaymentFormData(prev => ({
          ...prev,
          installmentNumber: pendingEmis[0].installmentNumber,
          amount: pendingEmis[0].amount
        }));
      }
    }
  }, [selectedEmiPlan, pendingEmis]);

  // Add this useEffect after emiFormData and selectedStudentForEMI are defined
  useEffect(() => {
    if (selectedStudentForEMI) {
      // Calculate total amount for the selected student
      const className = selectedStudentForEMI.class;
      const total = globalClassFees
        .filter(fee => fee.className === className && fee.academicYear === academicYear && fee.isActive)
        .reduce((sum, fee) => sum + parseFloat(fee.amount), 0);
      setEmiFormData(prev => ({
        ...prev,
        totalAmount: total ? Math.round(total).toString() : '',
        emiAmount: prev.emiPeriod && total
          ? Math.round((parseFloat(total.toString()) - (parseFloat(prev.registrationFee) || 0)) / parseInt(prev.emiPeriod)).toString()
          : ''
      }));
    } else {
      setEmiFormData(prev => ({ ...prev, totalAmount: '', emiAmount: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentForEMI, globalClassFees, academicYear]);

  // Calculate installments when form data changes
  useEffect(() => {
    if (paymentType === 'emi' && emiFormData.totalAmount && emiFormData.emiPeriod && emiFormData.startDate) {
      const count = parseInt(emiFormData.emiPeriod);
      const total = parseFloat(emiFormData.totalAmount);
      const regFee = parseFloat(emiFormData.registrationFee) || 0;
      const disc = parseFloat(emiFormData.discount) || 0;

      const payableAmount = Math.max(0, total - regFee - disc);

      if (count > 0 && payableAmount > 0) {
        // Calculate base EMI amount
        const baseAmount = Math.floor(payableAmount / count);
        const remainder = payableAmount - (baseAmount * count);

        const newInstallments: { installmentNumber: number, amount: string, dueDate: string }[] = [];
        const start = new Date(emiFormData.startDate);

        for (let i = 0; i < count; i++) {
          // Add remainder to first installment or distribute? Usually added to first.
          const amount = i === 0 ? baseAmount + remainder : baseAmount;

          const dueDate = new Date(start);
          // Standard monthly calculation
          dueDate.setMonth(dueDate.getMonth() + i);

          newInstallments.push({
            installmentNumber: i + 1,
            amount: Math.round(amount).toString(),
            dueDate: dueDate.toISOString().split('T')[0]
          });
        }

        // Only update if critical params changed to avoid infinite loop or losing edits
        // But for simplicity/reactivity, we'll update if the generated count/amounts differ significantly
        // or if successful generation is needed and current installments structure doesn't match

        setEmiFormData(prev => {
          // Simple check: if length differs or total differs, replace. 
          // Ideally we want to preserve custom dates if only amount changed, but amount change invalidates everything usually.
          // We'll just overwrite for now as "Reset" behavior.
          // To prevent infinite loop, check if values already match 'default' calculation? No, just check if we are already in sync.

          // Check if current installments match the parameters (count)
          if (prev.installments.length === count) {
            // Determine if we should overwrite. 
            // If the calculated total matches the sum of current installments, don't overwrite (assume user edits valid).
            const currentSum = prev.installments.reduce((sum, inst) => sum + parseFloat(inst.amount), 0);
            if (Math.abs(currentSum - payableAmount) < 1) {
              return prev; // Don't overwrite if totals match (preserves edits)
            }
          }

          return { ...prev, installments: newInstallments };
        });
      }
    }
  }, [emiFormData.totalAmount, emiFormData.emiPeriod, emiFormData.startDate, emiFormData.registrationFee, emiFormData.discount, paymentType]);

  // Update state when data changes
  useEffect(() => {
    if (emiProgressData) {
      setEmiPaymentProgress(emiProgressData);
    }
  }, [emiProgressData]);

  useEffect(() => {
    if (pendingEmisData) {
      setPendingEmis(pendingEmisData);
    }
  }, [pendingEmisData]);

  // When the modal opens, always refetch EMI progress and pending EMIs
  useEffect(() => {
    if (emiPaymentModalOpen && selectedEmiPlan) {
      refetchEmiProgress();
      refetchPendingEmis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emiPaymentModalOpen, selectedEmiPlan]);

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const response = await fetch(`/api/fee-payments/${paymentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete payment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Add state for student details tab
  const [studentDetailsTab, setStudentDetailsTab] = useState<'Overview' | 'Payments' | 'Mandates' | 'EMI'>('Overview');

  // Calculate filtered and paginated students for sidebar using allStudents
  const filteredStudents = allStudents.filter(student => {
    const matchesClass = classFilter === 'all' || student.class === classFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'E-Mandate Active'
      ? displayEMandates.some(m => m.leadId === student.id)
      : statusFilter === 'No E-Mandate'
        ? !displayEMandates.some(m => m.leadId === student.id)
        : (student as any).status === statusFilter);

    // Payment Status Logic
    const matchesPaymentStatus = studentPaymentStatusFilter === 'all' || (() => {
      const outstanding = calculateOutstanding(student);
      if (studentPaymentStatusFilter === 'pending') return outstanding > 0;
      if (studentPaymentStatusFilter === 'completed') return outstanding <= 0;
      return true;
    })();

    const search = studentSearch.trim().toLowerCase();
    const matchesSearch =
      search === '' ||
      student.name.toLowerCase().includes(search) ||
      (student.studentId && student.studentId.toLowerCase().includes(search)) ||
      (student.parentPhone && student.parentPhone.includes(search)) ||
      ((student as any).email && (student as any).email.toLowerCase().includes(search));
    return matchesClass && matchesStatus && matchesPaymentStatus && matchesSearch;
  });
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);



  const [editedStudent, setEditedStudent] = useState<Partial<Student> | null>(null);
  const [financialBlockingOpen, setFinancialBlockingOpen] = useState(false);
  const [financialBlockingDetails, setFinancialBlockingDetails] = useState<any>(null);

  // Debug effect to monitor editedStudent changes
  useEffect(() => {
    console.log("editedStudent state changed:", editedStudent);
  }, [editedStudent]);

  // Initialize editedStudent when selectedStudent changes
  useEffect(() => {
    if (selectedStudent && isEditModalOpen) {
      console.log("Initializing editedStudent from selectedStudent:", selectedStudent);
      setEditedStudent({ ...selectedStudent });
    }
  }, [selectedStudent, isEditModalOpen]);

  // Student update mutation - with debugging
  const updateStudentMutation = useMutation({
    mutationFn: async (updates: Partial<Student>) => {
      if (!selectedStudent) throw new Error("No student selected");
      console.log("Making API call PUT /api/students/" + selectedStudent.id, updates);
      const response = await apiRequest("PUT", `/api/students/${selectedStudent.id}`, updates);
      console.log("Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      console.log("API response:", result);
      return result;
    },
    onSuccess: (updatedStudent) => {
      console.log("Mutation onSuccess called with:", updatedStudent);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setIsEditModalOpen(false);
      setEditedStudent(null);
      setSelectedStudent(prev => prev ? { ...prev, ...updatedStudent } : prev);
      toast({ title: "Success", description: "Student details updated successfully." });
      console.log("Success callback completed");
    },
    onError: (error: any) => {
      console.error("Mutation onError called with:", error);
      toast({ title: "Error", description: error.message || "Failed to update student.", variant: "destructive" });
    }
  });
  // Student delete mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedStudent) throw new Error("No student selected");
      console.log(`🔥 Student-fees: Deleting student with id: ${selectedStudent.id}`);
      const res = await apiRequest("DELETE", `/api/students/${selectedStudent.id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student deleted successfully." });
      setSelectedStudent(null);
      setEditedStudent(null);
    },
    onError: (error: any) => {
      console.log("=== DELETE STUDENT ERROR DEBUG (Student-Fees) ===");
      console.log("Full error object:", error);
      console.log("Error message:", error.message);
      console.log("Error errorData:", error.errorData);
      console.log("All error keys:", Object.keys(error));
      if (error.errorData) {
        console.log("ErrorData keys:", Object.keys(error.errorData));
        console.log("ErrorData code:", error.errorData.code);
        console.log("ErrorData details:", error.errorData.details);
      }
      console.log("=== END DEBUG ===");

      // Check if this is a financial obligations error (check both direct properties and errorData)
      const errorData = error.errorData || {};
      const code = error.code || errorData.code;
      const details = error.details || errorData.details;

      console.log("Student-fees: Checking error condition - Code:", code, "Has details:", !!details);

      if (code === 'ACTIVE_FINANCIAL_OBLIGATIONS' && details) {
        console.log("🎯 SHOWING FINANCIAL BLOCKING DIALOG (Student-Fees)");
        setFinancialBlockingDetails({
          student: selectedStudent,
          ...details
        });
        setFinancialBlockingOpen(true);
      } else {
        console.log("❌ SHOWING REGULAR ERROR TOAST (Student-Fees)");
        toast({ title: "Error", description: error.message || "Failed to delete student.", variant: "destructive" });
      }
    }
  });

  const handleDownloadInvoice = async () => {
    if (!selectedStudent) return;

    try {
      toast({
        title: "Generating Invoice...",
        description: "Please wait while we fetch the latest data.",
      });

      const res = await fetch(`/api/students/${selectedStudent.id}/invoice-data`);
      if (!res.ok) throw new Error("Failed to fetch invoice data");

      const data = await res.json();

      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');

      // Fetch organization data if organizationId exists
      let orgData = null;
      if (user?.organizationId) {
        try {
          const orgRes = await fetch(`/api/organizations/${user.organizationId}/needs-onboarding`);
          if (orgRes.ok) {
            const orgResponse = await orgRes.json();
            orgData = orgResponse.organization;
          }
        } catch (error) {
          console.error("Failed to fetch organization data:", error);
        }
      }

      // Use fetched organization data or fallback to settings/defaults
      const orgName = orgData?.name || settings?.organizationName || settings?.name || user?.organizationName || "EduConnect Institute";
      const orgPhone = orgData?.phone || settings?.phone || settings?.contactPhone || "(555) 123-4567";
      const orgEmail = user?.email || settings?.email || settings?.contactEmail || "accounts@edulead.pro";

      // Build formatted address from organization data
      let orgAddress = "";
      if (orgData?.address) {
        const addressParts = [orgData.address];
        if (orgData.city && orgData.state) {
          addressParts.push(`${orgData.city}, ${orgData.state}`);
        } else if (orgData.city) {
          addressParts.push(orgData.city);
        } else if (orgData.state) {
          addressParts.push(orgData.state);
        }
        if (orgData.pincode) {
          addressParts.push(orgData.pincode);
        }
        orgAddress = addressParts.join(", ");
      } else {
        orgAddress = settings?.address || "123 Education Lane, Knowledge City, 500081";
      }

      generateInvoicePDF({
        ...data,
        organization: {
          name: orgName,
          address: orgAddress,
          email: orgEmail,
          phone: orgPhone
        }
      });

      toast({
        title: "Success",
        description: "Invoice downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Invoice generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header title="Student Fees" subtitle="Manage student fees, payments, and financial records" />
      {/* Custom header row with search, filters, and pagination */}
      {/* Custom header row with search, filters, and pagination */}
      <SidebarPageHeader
        searchPlaceholder="Search students..."
        searchValue={studentSearch}
        onSearchChange={setStudentSearch}
        filters={
          <div className="flex items-center gap-3">
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[140px] bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                <div className="flex items-center gap-2 truncate">
                  <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="All Classes" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all">All Classes</SelectItem>
                {Array.from(new Set([
                  ...allStudents.map(s => s.class),
                  ...globalClassFees.map(f => f.className)
                ])).filter(Boolean).sort().map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                <div className="flex items-center gap-2 truncate">
                  <ListFilter className="h-4 w-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="E-Mandate Active">E-Mandate Active</SelectItem>
                <SelectItem value="No E-Mandate">No E-Mandate</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>

            <Select value={studentPaymentStatusFilter} onValueChange={setStudentPaymentStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                <div className="flex items-center gap-2 truncate">
                  <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="Payment Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all">All Payment Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        primaryActions={
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
              id="csv-import"
            />
            <label htmlFor="csv-import">
              <Button
                variant="outline"
                type="button"
                className="h-10 px-4 border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 rounded-lg flex items-center gap-2 cursor-pointer"
                onClick={() => document.getElementById('csv-import')?.click()}
              >
                <Download className="h-4 w-4" />
                <span>Import</span>
              </Button>
            </label>

            <Button
              onClick={exportToCSV}
              className="bg-[#643ae5] hover:bg-[#552dbf] text-white shadow-sm h-10 px-4 rounded-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Upload className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        }
      />
      <div className="flex min-h-screen bg-gray-50 p-6">
        {/* Sidebar: Student List */}
        <aside className="w-[320px] bg-white rounded-2xl border border-gray-200 shadow h-fit mr-6 flex flex-col">
          <div className="px-6 pt-6 pb-2 text-base font-semibold text-gray-800">
            {allStudents.length} contacts
          </div>
          {/* Remove old search, class, status, and pagination controls from sidebar */}
          <div className="flex-1 overflow-y-auto border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <li
                  key={`${student.type}-${student.id}`}
                  className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition rounded-xl ${selectedStudent?.id === student.id && selectedStudent?.type === student.type ? 'bg-purple-50 border border-[#643ae5]' : 'hover:bg-white'} text-gray-800`}
                  onClick={() => setSelectedStudent(student as Student)}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-100 text-gray-800 font-bold text-sm border-2 border-gray-200">
                      {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-200 ${((student as any).status === 'active' || (student as any).status === 'enrolled') ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{student.name}</div>
                    <div className="text-xs text-[#b0b3b8] truncate">{student.class || 'No Class'}</div>
                    <div className="text-xs text-[#62656e]">{student.email || 'No email'}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center gap-2 px-6 py-2">
            <button
              className="px-2 py-1 rounded border border-gray-200 text-sm text-gray-800 bg-white disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt; Prev
            </button>
            {[...Array(totalStudentPages)].map((_, i) => (
              <button
                key={i}
                className={`px-2 py-1 rounded border border-gray-200 text-sm ${currentPage === i + 1 ? 'bg-[#643ae5] text-gray-800' : 'bg-white text-[#b0b3b8]'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1 rounded border border-gray-200 text-sm text-gray-800 bg-white disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalStudentPages, p + 1))}
              disabled={currentPage === totalStudentPages}
            >
              Next &gt;
            </button>
          </div>
        </aside>
        {/* Details Panel */}
        <main className="flex-1">
          {selectedStudent ? (
            <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 min-h-[600px] text-gray-800">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-purple-100 text-gray-800 font-bold text-2xl border-2 border-gray-200">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-800">{selectedStudent.name}</span>
                    <span className="text-sm text-gray-500 font-medium">{selectedStudent.class}</span>
                  </div>
                </div>
              </div>
              {/* Tabs for student details */}
              <div className="border-b border-gray-200 mb-4">
                <div className="flex gap-4">
                  {['Overview', 'Payments', 'EMI', 'Mandates'].map(tab => (
                    <button
                      key={tab}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${studentDetailsTab === tab ? 'bg-[#643ae5] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                      onClick={() => setStudentDetailsTab(tab as 'Overview' | 'Payments' | 'EMI' | 'Mandates')}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {/* Tab Content */}
              <div>
                {studentDetailsTab === 'Overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Information Card */}
                    <Card className="bg-white text-gray-800 border border-gray-200 rounded-2xl">
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><span className="font-semibold">Full Name:</span> {selectedStudent.name}</div>
                          <div><span className="font-semibold">Phone:</span> {selectedStudent.parentPhone || (selectedStudent as any).phone || '-'}</div>
                          <div><span className="font-semibold">Email:</span> {(selectedStudent as any).email || '-'}</div>
                          <div><span className="font-semibold">Class:</span> {selectedStudent.class}</div>
                          <div><span className="font-semibold">Parent:</span> {selectedStudent.parentName || '-'}</div>
                          <div><span className="font-semibold">Address:</span> {(selectedStudent as any).address || '-'}</div>
                        </div>

                      </CardContent>
                    </Card>
                    {/* Fee Information Card */}
                    <Card className="bg-white text-gray-800 border border-gray-200 rounded-2xl">
                      <CardHeader>
                        <CardTitle>Fee Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><span className="font-semibold text-gray-700">Tuition Fees:</span> ₹{calculateTotalFees(getStudentFeesWithGlobal(selectedStudent)).toLocaleString()}</div>
                          <div><span className="font-semibold text-gray-700">Tuition Paid:</span> <span className="text-green-600">₹{calculateTuitionPaidAmount(getStudentPayments(selectedStudent.id)).toLocaleString()}</span></div>
                          <div><span className="font-semibold text-gray-700">Outstanding:</span> <span className="text-red-500">₹{calculateOutstanding(selectedStudent).toLocaleString()}</span></div>

                          <div className="my-2 border-t border-gray-100"></div>

                          <div><span className="font-semibold text-gray-700">Additional Paid:</span> <span className="text-amber-600">₹{calculateAdditionalPaidAmount(getStudentPayments(selectedStudent.id)).toLocaleString()}</span></div>

                          <div className="my-2 border-t border-gray-100"></div>

                          <div><span className="font-semibold text-gray-700">Mandates:</span> {(() => {
                            const mandates = getStudentMandate(selectedStudent.id);
                            if (!mandates) return 'None';
                            if (Array.isArray(mandates)) return mandates.length;
                            return 1;
                          })()}</div>
                          <div><span className="font-semibold text-gray-700">EMI Plans:</span> {emiPlans.filter(p => p.studentId === selectedStudent.id).length}</div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-[#643ae5] text-[#643ae5] hover:bg-purple-50"
                            onClick={handleDownloadInvoice}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {studentDetailsTab === 'Payments' && (
                  <div>
                    {/* Payments content: list, add, delete payments for selectedStudent */}
                    <div className="mb-4 flex justify-between items-center">
                      <div className="font-semibold">Payments</div>
                      <Button
                        className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none"
                        onClick={() => {
                          setPaymentFormData(prev => ({ ...prev, studentSelect: selectedStudent.id.toString() }));
                          setAddPaymentOpen(true);
                        }}
                      >
                        Add Payment
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="table-header">Date</TableHead>
                          <TableHead className="table-header">Amount</TableHead>
                          <TableHead className="table-header">Mode</TableHead>
                          <TableHead className="table-header">Status</TableHead>
                          <TableHead className="table-header">Payment Type</TableHead>
                          <TableHead className="table-header w-auto">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getStudentPayments(selectedStudent.id).map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>₹{payment.amount}</TableCell>
                            <TableCell>{payment.paymentMode.charAt(0).toUpperCase() + payment.paymentMode.slice(1)}</TableCell>
                            <TableCell>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</TableCell>
                            <TableCell>
                              {(() => {
                                // EMI Installments
                                if (payment.installmentNumber && payment.installmentNumber > 0) {
                                  return (
                                    <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-100 font-normal">
                                      EMI Installment #{payment.installmentNumber}
                                    </Badge>
                                  );
                                }
                                // Registration Fee (Installment 0)
                                if (payment.installmentNumber === 0) {
                                  return (
                                    <Badge className="bg-green-100 text-green-800 border-none hover:bg-green-100 font-normal">
                                      Registration Fee
                                    </Badge>
                                  );
                                }
                                // Additional Charges
                                if (payment.paymentCategory === 'additional_charge') {
                                  return (
                                    <Badge className="bg-amber-100 text-amber-800 border-none hover:bg-amber-100 font-normal">
                                      {payment.chargeType?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Additional Charge'}
                                    </Badge>
                                  );
                                }
                                // Standard Tuition Fee
                                return <span className="text-gray-600">Tuition Fee</span>;
                              })()}
                            </TableCell>
                            <TableCell className="w-auto">
                              <div className="flex gap-2 items-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPaymentForDetails(payment);
                                    setPaymentDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    // Fetch organization data
                                    let orgData: any = null;
                                    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
                                    if (user?.organizationId) {
                                      try {
                                        const orgRes = await fetch(`/api/organizations/${user.organizationId}/needs-onboarding`);
                                        if (orgRes.ok) {
                                          const orgResponse = await orgRes.json();
                                          orgData = orgResponse.organization;
                                        }
                                      } catch (error) {
                                        console.error("Failed to fetch organization data for receipt:", error);
                                      }
                                    }

                                    const receiptData: FeeReceiptData = {
                                      studentName: selectedStudent.name,
                                      className: selectedStudent.class,
                                      paymentMode: payment.paymentMode,
                                      amount: payment.amount,
                                      date: format(new Date(payment.paymentDate), "dd-MM-yyyy"),
                                      organizationName: orgData?.name,
                                      organizationPhone: orgData?.phone,
                                      organizationAddress: orgData?.address
                                        ? `${orgData.address}${orgData.city ? ', ' + orgData.city : ''}${orgData.state ? ', ' + orgData.state : ''}${orgData.pincode ? ', ' + orgData.pincode : ''}`
                                        : undefined,
                                    };
                                    generateMelonsFeeReceipt(receiptData, payment.receiptNumber);
                                  }}
                                >
                                  <Printer className="mr-1 h-3 w-3" />
                                  Print
                                </Button>
                                <Button variant="destructive" size="sm" className="bg-red-600 text-white rounded-lg" onClick={() => deletePaymentMutation.mutate(payment.id)}>Delete</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {addPaymentOpen && (
                      <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
                        <DialogContent>
                          <DialogHeader>Add Payment</DialogHeader>
                          <form onSubmit={handleAddPayment} className="space-y-4">
                            <div className="grid gap-2">
                              <Label htmlFor="amount">Amount</Label>
                              <Input
                                id="amount"
                                name="amount"
                                type="number"
                                required
                                value={paymentFormData.amount}
                                onChange={e => setPaymentFormData(prev => ({ ...prev, amount: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="paymentDate">Payment Date</Label>
                              <Input
                                id="paymentDate"
                                name="paymentDate"
                                type="date"
                                required
                                value={paymentFormData.paymentDate}
                                onChange={e => setPaymentFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="paymentMode">Payment Mode</Label>
                              <Select
                                value={paymentFormData.paymentMode}
                                onValueChange={(value) => setPaymentFormData(prev => ({ ...prev, paymentMode: value }))}
                              >
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
                            <div className="grid gap-2">
                              <Label htmlFor="chargeType">Charge Type</Label>
                              <Select value={paymentFormData.chargeType || 'annual_function'} onValueChange={value => setPaymentFormData(prev => ({ ...prev, chargeType: value, paymentCategory: 'additional_charge' }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select charge type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="annual_function">Annual Function Fee</SelectItem>
                                  <SelectItem value="sports_day">Sports Day Fee</SelectItem>
                                  <SelectItem value="picnic">Picnic/Field Trip Fee</SelectItem>
                                  <SelectItem value="uniform">Uniform Fee</SelectItem>
                                  <SelectItem value="books">Books/Study Materials</SelectItem>
                                  <SelectItem value="exam_fee">Examination Fee</SelectItem>
                                  <SelectItem value="transport">Transportation Fee</SelectItem>
                                  <SelectItem value="late_fee">Late Payment Fee</SelectItem>
                                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                                  <SelectItem value="admission_form_fee">Admission Form Fee</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-sm text-gray-500">
                                Additional charges are tracked separately and don't count toward regular tuition fees.
                              </p>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="transactionId">Transaction ID</Label>
                              <Input
                                id="transactionId"
                                value={paymentFormData.transactionId || ''}
                                onChange={e => setPaymentFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                                placeholder="Optional"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="discount">Discount (₹)</Label>
                              <Input
                                id="discount"
                                type="number"
                                value={paymentFormData.discount || ''}
                                onChange={e => setPaymentFormData(prev => ({ ...prev, discount: e.target.value }))}
                                placeholder="0"
                              />
                            </div>
                            {/* Add more fields as needed */}
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" className="border-[#643ae5] text-[#643ae5] hover:bg-slate-50" onClick={() => setAddPaymentOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none">Add Payment</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
                {studentDetailsTab === 'Mandates' && (
                  <div>
                    {/* Mandates content: list, add, delete mandates for selectedStudent */}
                    <div className="mb-4 flex justify-between items-center">
                      <div className="font-semibold">E-Mandates</div>
                      <Button className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none" onClick={() => setAddMandateOpen(true)}>Add Mandate</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="table-header">Mandate ID</TableHead>
                          <TableHead className="table-header">Status</TableHead>
                          <TableHead className="table-header">Bank</TableHead>
                          <TableHead className="table-header">Max Amount</TableHead>
                          <TableHead className="table-header">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const mandates = getStudentMandate(selectedStudent.id);
                          if (!mandates) return [];
                          if (Array.isArray(mandates)) return mandates;
                          return [mandates];
                        })().map((mandate: EMandate) => (
                          <TableRow key={mandate.id}>
                            <TableCell>{mandate.mandateId}</TableCell>
                            <TableCell>{mandate.status}</TableCell>
                            <TableCell>{mandate.bankName}</TableCell>
                            <TableCell>₹{mandate.maxAmount}</TableCell>
                            <TableCell>
                              <Button variant="destructive" size="sm" className="bg-red-600 text-white rounded-lg" onClick={() => handleDeleteMandate(mandate.id)}>Delete</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {addMandateOpen && (
                      <Dialog open={addMandateOpen} onOpenChange={setAddMandateOpen}>
                        <DialogContent>
                          <DialogHeader>Setup E-Mandate for {selectedStudent?.name}</DialogHeader>
                          <form onSubmit={handleAddEMandate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="bankName">Bank Name</Label>
                                <Input name="bankName" required />
                              </div>
                              <div>
                                <Label htmlFor="ifscCode">IFSC Code</Label>
                                <Input name="ifscCode" required maxLength={11} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="accountNumber">Account Number</Label>
                                <Input name="accountNumber" required />
                              </div>
                              <div>
                                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                                <Input name="accountHolderName" required />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="maxAmount">Max Amount</Label>
                                <Input name="maxAmount" type="number" required />
                              </div>
                              <div>
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input name="startDate" type="date" required />
                              </div>
                              <div>
                                <Label htmlFor="endDate">End Date</Label>
                                <Input name="endDate" type="date" required />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="frequency">Frequency</Label>
                              <Select name="frequency" required value={mandateFrequency} onValueChange={setMandateFrequency}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="quarterly">Quarterly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" className="border-[#643ae5] text-white" onClick={() => setAddMandateOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none">Add Mandate</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
                {studentDetailsTab === 'EMI' && selectedStudent && (
                  <div>
                    {/* EMI content: list, add, edit EMI plans for selectedStudent */}
                    <div className="mb-4 flex justify-between items-center">
                      <div className="font-semibold">EMI Plans</div>
                      <button
                        className={`px-6 py-2 rounded-lg font-semibold shadow transition ${emiPlans.filter(plan => plan.studentId === selectedStudent.id && plan.status === 'active').length > 0 ||
                          feePayments.filter(payment => payment.leadId === selectedStudent.id && payment.installmentNumber === null).length > 0
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-[#643ae5] text-white hover:bg-[#7c4dff]'
                          }`}
                        onClick={() => {
                          setEmiModalOpen(true);
                          setSelectedStudentForEMI(selectedStudent as CombinedStudent);
                        }}
                        disabled={
                          emiPlans.filter(plan => plan.studentId === selectedStudent.id && plan.status === 'active').length > 0 ||
                          feePayments.filter(payment => payment.leadId === selectedStudent.id && payment.installmentNumber === null).length > 0
                        }
                      >
                        Add EMI Plan
                      </button>
                    </div>
                    {/* EMI Plans Management Table for selected student */}
                    <Card className="bg-[#23242a] text-white border border-[#23272f] rounded-2xl">
                      <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <CardTitle>EMI Plans Management</CardTitle>
                            <CardDescription>
                              Track and manage EMI plans for this student
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="table-header">Plan Type</TableHead>
                              <TableHead className="table-header">Total Amount</TableHead>
                              <TableHead className="table-header">EMI Details</TableHead>
                              <TableHead className="table-header">Start Date</TableHead>
                              <TableHead className="table-header">Status</TableHead>
                              <TableHead className="table-header">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {emiPlans.filter(plan => plan.studentId === selectedStudent.id).map((plan) => (
                              <TableRow key={plan.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      plan.numberOfInstallments > 1
                                        ? "bg-blue-100 text-blue-800 border-blue-200 whitespace-nowrap px-2"
                                        : "bg-green-100 text-green-800 border-green-200 whitespace-nowrap px-2"
                                    }
                                  >
                                    {plan.numberOfInstallments > 1 ? 'EMI Payment' : 'Full Payment'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-gray-900">
                                    ₹{parseFloat(plan.totalAmount).toLocaleString()}
                                  </div>
                                  {parseFloat(plan.discount) > 0 && (
                                    <div className="text-sm text-green-600">
                                      -₹{parseFloat(plan.discount).toLocaleString()} discount
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {plan.numberOfInstallments > 1 ? (
                                    <EMIPaymentProgress planId={plan.id} totalInstallments={plan.numberOfInstallments} installmentAmount={plan.installmentAmount} status={plan.status} totalAmount={plan.totalAmount} />
                                  ) : (
                                    <div className="text-sm text-gray-500">Full payment</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-gray-900">
                                    {format(new Date(plan.startDate), "MMM dd, yyyy")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      plan.status === "active"
                                        ? "bg-green-500 text-white rounded-full px-3 py-1"
                                        : plan.status === "completed"
                                          ? "bg-blue-500 text-white rounded-full px-3 py-1"
                                          : "bg-gray-500 text-white rounded-full px-3 py-1"
                                    }
                                  >
                                    {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {plan.status !== 'cancelled' && (
                                      <RecordPaymentButton
                                        plan={plan}
                                        onClick={() => {
                                          setSelectedEmiPlan(plan);
                                          setEmiPaymentModalOpen(true);
                                        }}
                                      />
                                    )}
                                    {plan.status === 'active' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                        onClick={async () => {
                                          if (confirm('Cancel this EMI plan? This will mark it as cancelled.')) {
                                            try {
                                              const response = await fetch(`/api/emi-plans/${plan.id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'cancelled' })
                                              });
                                              if (!response.ok) throw new Error('Failed to cancel EMI plan');
                                              await refetchEmiPlans();
                                              toast({ title: "EMI plan cancelled" });
                                            } catch (error: any) {
                                              toast({
                                                title: "Error",
                                                description: error.message,
                                                variant: "destructive"
                                              });
                                            }
                                          }
                                        }}
                                      >
                                        Cancel Plan
                                      </Button>
                                    )}
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="bg-red-600 text-white rounded-lg"
                                      onClick={async () => {
                                        if (!confirm(`Are you sure you want to delete the EMI plan? This action cannot be undone.`)) return;

                                        try {
                                          const response = await fetch(`/api/emi-plans/${plan.id}`, {
                                            method: "DELETE",
                                            headers: { "Content-Type": "application/json" },
                                          });

                                          if (!response.ok) {
                                            const error = await response.json();
                                            throw new Error(error.message || "Failed to delete EMI plan");
                                          }

                                          await refetchEmiPlans();
                                          await queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
                                          await queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
                                          toast({
                                            title: "Success",
                                            description: "EMI plan deleted successfully",
                                          });
                                        } catch (error: any) {
                                          toast({
                                            title: "Cannot Delete",
                                            description: error.message,
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      <Settings className="mr-1 h-3 w-3" />
                                      Delete Plan
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {emiPlans.filter(plan => plan.studentId === selectedStudent.id).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                  <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                  <p>No EMI plans configured for this student</p>
                                  <p className="text-sm">Configure EMI plans for this student to see them here</p>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    {/* Full EMI Plan Modal restored */}
                    {emiModalOpen && (
                      <Dialog open={emiModalOpen} onOpenChange={open => {
                        setEmiModalOpen(open);
                        if (!open) setSelectedStudentForEMI(null);
                      }}>
                        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              Payment Configuration for {selectedStudentForEMI?.name}
                            </DialogTitle>
                            <DialogDescription>
                              Configure payment plan and EMI details for {selectedStudentForEMI?.studentId} ({selectedStudentForEMI?.class})
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={e => {
                            e.preventDefault();
                            if (!selectedStudentForEMI) return;

                            // Check payment type and handle accordingly
                            if (paymentType === 'full') {
                              // For full payment, record as a single payment
                              const totalAmount = parseFloat(emiFormData.totalAmount);
                              const discount = parseFloat(emiFormData.discount || '0');
                              const finalAmount = totalAmount - discount;

                              addPaymentMutation.mutate({
                                leadId: selectedStudentForEMI.id,
                                amount: finalAmount.toString(),
                                paymentDate: emiFormData.startDate,
                                paymentMode: 'cash', // Default, can be modified if needed
                                receiptNumber: null, // System-generated
                                transactionId: emiFormData.transactionId || null,
                                status: 'completed',
                                installmentNumber: null,
                              });
                            } else {
                              // For EMI payment, create EMI plan
                              const numberOfInstallments = parseInt(emiFormData.emiPeriod);
                              const installmentAmount = emiFormData.emiAmount;
                              const startDate = emiFormData.startDate;
                              const endDateObj = new Date(startDate);
                              endDateObj.setMonth(endDateObj.getMonth() + numberOfInstallments);
                              const endDate = endDateObj.toISOString().split('T')[0];
                              addEmiPlanMutation.mutate({
                                studentId: selectedStudentForEMI.id,
                                totalAmount: emiFormData.totalAmount,
                                numberOfInstallments,
                                installmentAmount,
                                startDate,
                                endDate,
                                status: 'active',
                                registrationFee: emiFormData.registrationFee,
                                paymentMode: emiFormData.paymentMode,
                                transactionId: emiFormData.transactionId,
                                discount: emiFormData.discount,
                                installments: emiFormData.installments
                              });
                            }
                          }} className="space-y-6">
                            {/* Payment Type Selection */}
                            <div className="space-y-4">
                              <Label className="text-base font-medium">Payment Type</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentType === 'emi' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setPaymentType('emi')}>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="paymentType"
                                      value="emi"
                                      checked={paymentType === 'emi'}
                                      onChange={() => setPaymentType('emi')}
                                      className="text-primary"
                                    />
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        EMI Payment
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Pay in installments over time
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentType === 'full' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setPaymentType('full')}>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="paymentType"
                                      value="full"
                                      checked={paymentType === 'full'}
                                      onChange={() => setPaymentType('full')}
                                      className="text-primary"
                                    />
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        Full Payment
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        Pay the entire amount at once
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Basic Payment Information */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="totalAmount">Total Amount (₹)</Label>
                                <Input
                                  id="totalAmount"
                                  name="totalAmount"
                                  type="number"
                                  required
                                  placeholder="Enter total fee amount"
                                  min="0"
                                  step="0.01"
                                  value={emiFormData.totalAmount}
                                  readOnly
                                  className="bg-gray-100 cursor-not-allowed"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="discount">Discount (₹)</Label>
                                <Input
                                  id="discount"
                                  name="discount"
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  step="0.01"
                                  value={emiFormData.discount || ''}
                                  onChange={(e) => {
                                    const discount = e.target.value;
                                    setEmiFormData(prev => ({
                                      ...prev,
                                      discount,
                                      emiAmount: prev.totalAmount && prev.emiPeriod
                                        ? Math.round((parseFloat(prev.totalAmount) - (parseFloat(prev.registrationFee) || 0) - (parseFloat(discount) || 0)) / parseInt(prev.emiPeriod)).toString()
                                        : ''
                                    }));
                                  }}
                                />
                              </div>
                            </div>
                            {/* EMI Specific Options */}
                            {paymentType === 'emi' && (
                              <>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="registrationFee">Registration Fee (₹)</Label>
                                    <Input
                                      id="registrationFee"
                                      name="registrationFee"
                                      type="number"
                                      placeholder="0"
                                      min="0"
                                      step="0.01"
                                      value={emiFormData.registrationFee}
                                      onChange={(e) => {
                                        const registrationFee = e.target.value;
                                        setEmiFormData(prev => ({
                                          ...prev,
                                          registrationFee,
                                          emiAmount: prev.totalAmount && prev.emiPeriod
                                            ? Math.round((parseFloat(prev.totalAmount) - (parseFloat(registrationFee) || 0) - (parseFloat(prev.discount) || 0)) / parseInt(prev.emiPeriod)).toString()
                                            : ''
                                        }));
                                      }}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="paymentMode">Payment Mode</Label>
                                    <Select
                                      value={emiFormData.paymentMode}
                                      onValueChange={(value) => setEmiFormData(prev => ({ ...prev, paymentMode: value }))}
                                      disabled={!parseFloat(emiFormData.registrationFee || "0")}
                                    >
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
                                  <div className="grid gap-2">
                                    <Label htmlFor="emiPeriod">Number of EMIs</Label>
                                    <Select
                                      value={emiFormData.emiPeriod}
                                      onValueChange={(value) => {
                                        setEmiFormData(prev => ({
                                          ...prev,
                                          emiPeriod: value,
                                          emiAmount: emiFormData.totalAmount && value
                                            ? Math.round((parseFloat(emiFormData.totalAmount) - (parseFloat(emiFormData.registrationFee) || 0) - (parseFloat(emiFormData.discount) || 0)) / parseInt(value)).toString()
                                            : ''
                                        }));
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="2">2</SelectItem>
                                        <SelectItem value="3">3</SelectItem>
                                        <SelectItem value="4">4</SelectItem>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="6">6</SelectItem>
                                        <SelectItem value="9">9</SelectItem>
                                        <SelectItem value="12">12</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                </div>
                              </>
                            )}
                            {/* Transaction ID Field */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="grid gap-2">
                                <Label htmlFor="startDate">Transaction Date</Label>
                                <Input
                                  id="startDate"
                                  name="startDate"
                                  type="date"
                                  required
                                  min={new Date().toISOString().split('T')[0]}
                                  value={emiFormData.startDate}
                                  onChange={(e) => setEmiFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                                <Input
                                  id="transactionId"
                                  name="transactionId"
                                  type="text"
                                  placeholder="Enter transaction ID"
                                  value={emiFormData.transactionId || ''}
                                  onChange={e => setEmiFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                                />
                              </div>
                            </div>

                            {/* Installment Schedule (Editable) */}
                            {paymentType === 'emi' && emiFormData.installments.length > 0 && (
                              <div className="mt-4">
                                <Label className="block mb-2 text-base font-medium">Installment Schedule</Label>
                                <div className="border rounded-md overflow-hidden bg-white">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-gray-50">
                                        <TableHead className="w-[80px]">#</TableHead>
                                        <TableHead>Expected Date</TableHead>
                                        <TableHead className="text-right">Amount (₹)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {emiFormData.installments.map((inst, idx) => (
                                        <TableRow key={idx}>
                                          <TableCell>{idx + 1}</TableCell>
                                          <TableCell>
                                            <Input
                                              type="date"
                                              value={inst.dueDate}
                                              onChange={(e) => {
                                                const newDate = e.target.value;
                                                setEmiFormData(prev => {
                                                  const newInstallments = [...prev.installments];
                                                  newInstallments[idx] = { ...newInstallments[idx], dueDate: newDate };
                                                  return { ...prev, installments: newInstallments };
                                                });
                                              }}
                                              className="h-8 w-full"
                                            />
                                          </TableCell>
                                          <TableCell className="text-right font-medium">
                                            ₹{parseFloat(inst.amount).toLocaleString()}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            )}
                            {/* Payment Summary */}
                            <Card className="bg-gray-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-h3 flex items-center gap-2">
                                  Payment Summary
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Amount:</span>
                                    <span className="font-medium">₹{emiFormData.totalAmount || '0'}</span>
                                  </div>
                                  {paymentType === 'emi' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Registration Fee:</span>
                                        <span className="font-medium">₹{emiFormData.registrationFee || '0'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Discount:</span>
                                        <span className="font-medium">₹{emiFormData.discount || '0'}</span>
                                      </div>
                                      <div className="flex justify-between items-center py-2 px-2 rounded bg-primary/10 border border-primary/20 my-2">
                                        <span className="text-muted-foreground text-base font-medium">EMI Amount:</span>
                                        <span className="font-bold text-2xl text-primary">
                                          ₹{(() => {
                                            const total = parseFloat(emiFormData.totalAmount) || 0;
                                            const fee = parseFloat(emiFormData.registrationFee) || 0;
                                            const discount = parseFloat(emiFormData.discount) || 0;
                                            const months = parseInt(emiFormData.emiPeriod) || 0;
                                            if (months > 0 && total - fee - discount > 0) {
                                              return Math.round((total - fee - discount) / months).toString();
                                            }
                                            return '0';
                                          })()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Number of EMIs:</span>
                                        <span className="font-medium">{emiFormData.emiPeriod || '0'}</span>
                                      </div>
                                      <div className="border-t pt-3 flex justify-between font-semibold">
                                        <span>Total Payable EMI:</span>
                                        <span className="text-primary">
                                          ₹{(() => {
                                            const total = parseFloat(emiFormData.totalAmount) || 0;
                                            const fee = parseFloat(emiFormData.registrationFee) || 0;
                                            const discount = parseFloat(emiFormData.discount) || 0;
                                            const months = parseInt(emiFormData.emiPeriod) || 0;
                                            if (months > 0 && total - fee - discount > 0) {
                                              return Math.round(total - fee - discount).toString();
                                            }
                                            return '0.00';
                                          })()}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                            <div className="flex justify-end gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="border-[#643ae5] text-[#643ae5] hover:bg-slate-50"
                                onClick={() => {
                                  setEmiModalOpen(false);
                                  setSelectedStudentForEMI(null);
                                  setPaymentType('emi');
                                  setEmiFormData({
                                    totalAmount: '',
                                    emiPeriod: '2',
                                    emiAmount: '',
                                    registrationFee: '0',
                                    interestRate: '0',
                                    startDate: format(new Date(), 'yyyy-MM-dd'),
                                    frequency: 'monthly',
                                    processingFee: '0',
                                    lateFee: '0',
                                    receiptNumber: '',
                                    discount: '',
                                    paymentMode: '',
                                    transactionId: '',
                                    installments: []
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none">
                                {paymentType === 'full' ? 'Record Payment' : 'Add EMI Plan'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>
            </div >
          ) : (
            <div className="flex items-center justify-center h-full text-[#b0b3b8]">Select a student to view details</div>
          )
          }
        </main >
      </div >

      {/* Student Edit Modal */}
      {
        selectedStudent && (
          <Dialog
            open={isEditModalOpen}
            onOpenChange={(open) => {
              console.log("Dialog onOpenChange:", { open, selectedStudent });
              setIsEditModalOpen(open);
              if (open && selectedStudent) {
                console.log("Setting editedStudent to:", selectedStudent);
                setEditedStudent({ ...selectedStudent });
                setFormErrors({});
              } else {
                setEditedStudent(null);
                setFormErrors({});
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[75vh] overflow-y-auto border-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <User size={24} />
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-600">{selectedStudent.class}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={editedStudent?.name || ''}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev!, name: e.target.value }))}
                      className={formErrors.name ? "border-red-500" : ""}
                    />
                    {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-class">Class</Label>
                    <Select
                      value={editedStudent?.class || ''}
                      onValueChange={(value) => setEditedStudent(prev => ({ ...prev!, class: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(allStudents.map(s => s.class).filter(Boolean))).map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-parent-name">Parent Name</Label>
                    <Input
                      id="edit-parent-name"
                      value={editedStudent?.parentName || ''}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev!, parentName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-parent-phone">Parent Phone</Label>
                    <Input
                      id="edit-parent-phone"
                      type="tel"
                      value={editedStudent?.parentPhone || ''}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev!, parentPhone: e.target.value }))}
                      className={formErrors.parentPhone ? "border-red-500" : ""}
                    />
                    {formErrors.parentPhone && <p className="text-red-500 text-sm mt-1">{formErrors.parentPhone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={(editedStudent as any)?.email || ''}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev!, email: e.target.value }))}
                      className={formErrors.email ? "border-red-500" : ""}
                    />
                    {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="edit-student-id">Student ID</Label>
                    <Input
                      id="edit-student-id"
                      value={editedStudent?.studentId || ''}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev!, studentId: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={(editedStudent as any)?.address || ''}
                    onChange={(e) => setEditedStudent(prev => ({ ...prev!, address: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateStudentMutation.isPending}>
                  {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Financial Blocking Dialog */}
      <AlertDialog open={financialBlockingOpen} onOpenChange={setFinancialBlockingOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Cannot Delete Student
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {financialBlockingDetails && (
                  <>
                    <p className="text-sm text-gray-600">
                      <strong>{financialBlockingDetails.student?.name}</strong> cannot be deleted because they have active financial obligations that must be resolved first.
                    </p>

                    {/* Outstanding EMI Payments */}
                    {financialBlockingDetails.activePayments?.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-3">
                          📋 Pending EMI Payments ({financialBlockingDetails.activePayments.length})
                        </h4>
                        <div className="space-y-2">
                          {financialBlockingDetails.activePayments.map((payment: any, index: number) => (
                            <div key={payment.id} className="flex justify-between items-center bg-white p-3 rounded border-l-4 border-red-400">
                              <div>
                                <p className="font-medium">Installment #{payment.installmentNumber}</p>
                                <p className="text-sm text-gray-600">Due: {new Date(payment.dueDate).toLocaleDateString()}</p>
                                <p className="text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {payment.status}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">₹{payment.amount.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active EMI Plans */}
                    {financialBlockingDetails.activePlans?.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3">
                          📅 Active EMI Plans ({financialBlockingDetails.activePlans.length})
                        </h4>
                        <div className="space-y-2">
                          {financialBlockingDetails.activePlans.map((plan: any) => (
                            <div key={plan.id} className="bg-white p-3 rounded border-l-4 border-blue-400">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">EMI Plan #{plan.id}</p>
                                  <p className="text-sm text-gray-600">
                                    {plan.numberOfInstallments} installments of ₹{plan.installmentAmount.toLocaleString()} each
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Period: {new Date(plan.startDate).toLocaleDateString()} to {new Date(plan.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₹{plan.totalAmount.toLocaleString()}</p>
                                  <p className="text-sm text-gray-600">Total Amount</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Fee Payments */}
                    {financialBlockingDetails.pendingFeePayments?.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-3">
                          💳 Pending Fee Payments ({financialBlockingDetails.pendingFeePayments.length})
                        </h4>
                        <div className="space-y-2">
                          {financialBlockingDetails.pendingFeePayments.map((payment: any) => (
                            <div key={payment.id} className="bg-white p-3 rounded border-l-4 border-yellow-400">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">Payment #{payment.id}</p>
                                  <p className="text-sm text-gray-600">Mode: {payment.paymentMode}</p>
                                  {payment.receiptNumber && (
                                    <p className="text-sm text-gray-600">Receipt: {payment.receiptNumber}</p>
                                  )}
                                  {payment.installmentNumber && (
                                    <p className="text-sm text-gray-600">Installment: #{payment.installmentNumber}</p>
                                  )}
                                  <p className="text-sm text-gray-600">Due: {new Date(payment.paymentDate).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-lg">₹{payment.amount.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Mandates */}
                    {financialBlockingDetails.activeMandates?.length > 0 && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-3">
                          🏦 Active Mandates ({financialBlockingDetails.activeMandates.length})
                        </h4>
                        <div className="space-y-2">
                          {financialBlockingDetails.activeMandates.map((mandate: any) => (
                            <div key={mandate.id} className="bg-white p-3 rounded border-l-4 border-green-400">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">Mandate: {mandate.mandateId}</p>
                                  <p className="text-sm text-gray-600">{mandate.bankName}</p>
                                  <p className="text-sm text-gray-600">Account: {mandate.bankAccount}</p>
                                  <p className="text-sm text-gray-600">
                                    Valid: {new Date(mandate.startDate).toLocaleDateString()} to {mandate.endDate ? new Date(mandate.endDate).toLocaleDateString() : 'Ongoing'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">₹{mandate.maxAmount.toLocaleString()}</p>
                                  <p className="text-sm text-gray-600">Max Amount</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Outstanding */}
                    {financialBlockingDetails.totalOutstanding > 0 && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-orange-900">Total Outstanding Amount:</span>
                          <span className="text-xl font-bold text-orange-900">₹{financialBlockingDetails.totalOutstanding.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">💡 What you can do:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Clear all pending fee payments before attempting to delete</li>
                        <li>• Complete or cancel active EMI plans</li>
                        <li>• Mark outstanding EMI installments as paid</li>
                        <li>• Deactivate or cancel active bank mandates</li>
                        <li>• Process all pending transactions</li>
                        <li>• Contact the finance team for assistance</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setFinancialBlockingOpen(false);
              setFinancialBlockingDetails(null);
            }}>
              Got it
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* EMI Payment Recording Modal */}
      {
        selectedEmiPlan && (
          <Dialog open={emiPaymentModalOpen} onOpenChange={setEmiPaymentModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record EMI Payment</DialogTitle>
                <DialogDescription>
                  Record a payment for this EMI plan
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const installmentNumber = parseInt(formData.get('installmentNumber') as string);

                // Check for duplicate payment
                try {
                  const paymentsRes = await fetch(`/api/emi-plans/${selectedEmiPlan.id}/payments`);
                  if (paymentsRes.ok) {
                    const existingPayments = await paymentsRes.json();
                    const alreadyPaid = existingPayments.some((p: any) => p.installmentNumber === installmentNumber);

                    if (alreadyPaid) {
                      toast({
                        title: "Duplicate Payment",
                        description: `Installment #${installmentNumber} has already been paid`,
                        variant: "destructive"
                      });
                      return;
                    }
                  }
                } catch (error) {
                  console.error("Error checking payments:", error);
                }

                // Proceed with payment
                addPaymentMutation.mutate({
                  leadId: selectedEmiPlan.studentId,
                  amount: formData.get('amount'),
                  discount: '0',
                  paymentDate: formData.get('paymentDate'),
                  paymentMode: formData.get('paymentMode'),
                  receiptNumber: formData.get('receiptNumber'),
                  transactionId: formData.get('transactionId'),
                  installmentNumber: installmentNumber,
                  status: 'completed'
                });

                // Invalidate EMI plan payments query to refresh progress
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: [`/api/emi-plans/${selectedEmiPlan.id}/payments`] });
                  queryClient.invalidateQueries({ queryKey: ["/api/emi-plans"] });
                }, 500);

                setEmiPaymentModalOpen(false);
              }}>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">EMI Plan Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-600">Total Amount:</span> ₹{parseFloat(selectedEmiPlan.totalAmount).toLocaleString()}</div>
                      <div><span className="text-gray-600">Installment Amount:</span> ₹{parseFloat(selectedEmiPlan.installmentAmount).toLocaleString()}</div>
                      <div><span className="text-gray-600">Number of Installments:</span> {selectedEmiPlan.numberOfInstallments}</div>
                      <div><span className="text-gray-600">Status:</span> {selectedEmiPlan.status}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installmentNumber">Installment Number *</Label>
                      <Input
                        id="installmentNumber"
                        name="installmentNumber"
                        type="number"
                        min="1"
                        max={selectedEmiPlan.numberOfInstallments}
                        defaultValue={nextInstallmentNumber}
                        key={`installment-${nextInstallmentNumber}`}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        defaultValue={selectedEmiPlan.installmentAmount}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentDate">Payment Date *</Label>
                      <Input
                        id="paymentDate"
                        name="paymentDate"
                        type="date"
                        defaultValue={format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentMode">Payment Mode *</Label>
                      <Select name="paymentMode" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="net_banking">Net Banking</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="transactionId">Transaction ID</Label>
                      <Input
                        id="transactionId"
                        name="transactionId"
                        type="text"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEmiPaymentModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#643ae5] hover:bg-[#552dbf]">
                    Record Payment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )
      }

      {/* Payment Details Modal */}
      {
        selectedPaymentForDetails && (
          <Dialog open={paymentDetailsOpen} onOpenChange={setPaymentDetailsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>
                  View complete payment information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Amount</Label>
                    <div className="font-semibold text-lg">₹{parseFloat(selectedPaymentForDetails.amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Payment Date</Label>
                    <div className="font-medium">{format(new Date(selectedPaymentForDetails.paymentDate), "MMM dd, yyyy")}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Payment Mode</Label>
                    <div className="font-medium capitalize">{selectedPaymentForDetails.paymentMode}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500">Status</Label>
                    <Badge className={selectedPaymentForDetails.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}>
                      {selectedPaymentForDetails.status}
                    </Badge>
                  </div>
                </div>

                {selectedPaymentForDetails.installmentNumber && (
                  <div>
                    <Label className="text-gray-500">Installment Number</Label>
                    <div className="font-medium">#{selectedPaymentForDetails.installmentNumber}</div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-500">Payment Type</Label>
                  <div className="font-medium">
                    {selectedPaymentForDetails.paymentCategory === 'additional_charge' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                        {selectedPaymentForDetails.chargeType ?
                          selectedPaymentForDetails.chargeType.split('_').map((word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')
                          : 'Additional Charge'}
                      </span>
                    ) : selectedPaymentForDetails.installmentNumber === 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Registration Fee
                      </span>
                    ) : selectedPaymentForDetails.installmentNumber > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        EMI Installment #{selectedPaymentForDetails.installmentNumber}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        Fee Payment
                      </span>
                    )}
                  </div>
                </div>

                {selectedPaymentForDetails.receiptNumber && (
                  <div>
                    <Label className="text-gray-500">Receipt Number</Label>
                    <div className="font-medium">{selectedPaymentForDetails.receiptNumber}</div>
                  </div>
                )}

                {selectedPaymentForDetails.transactionId && (
                  <div>
                    <Label className="text-gray-500">Transaction ID</Label>
                    <div className="font-mono text-sm bg-slate-100 p-2 rounded">{selectedPaymentForDetails.transactionId}</div>
                  </div>
                )}

                {selectedPaymentForDetails.discount && parseFloat(selectedPaymentForDetails.discount) > 0 && (
                  <div>
                    <Label className="text-gray-500">Discount Applied</Label>
                    <div className="font-medium text-green-600">₹{parseFloat(selectedPaymentForDetails.discount).toLocaleString()}</div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-gray-500">Recorded On</Label>
                  <div className="text-sm text-gray-600">{selectedPaymentForDetails.createdAt ? format(new Date(selectedPaymentForDetails.createdAt), "PPpp") : 'N/A'}</div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentDetailsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    </>
  );
}