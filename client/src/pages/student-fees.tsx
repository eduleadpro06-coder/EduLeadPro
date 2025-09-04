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
  Settings,
  Search,
  Phone,
  Mail,
  Calculator,
  Clock,
  Percent,
  IndianRupee,
  CheckCircle,
  Info,
  Trash2,
  Edit 
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useHashState } from "@/hooks/use-hash-state";
import { type LeadWithCounselor } from "@shared/schema";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Student {
  id: number;
  name: string;
  studentId: string;
  class: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
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
  planType: string;
  totalAmount: string;
  emiPeriod: number;
  emiAmount: string;
  downPayment: string;
  discount: string;
  interestRate: string;
  startDate: string;
  frequency: string;
  processingFee: string;
  lateFee: string;
  receiptNumber?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [emiData, setEmiData] = useState<Record<number, {emiPeriod: string, paidAmount: string, emiDues: string}>>({});
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [mandateFrequency, setMandateFrequency] = useState("monthly");
  const [globalFeeModalOpen, setGlobalFeeModalOpen] = useState(false);
  const [editingGlobalFee, setEditingGlobalFee] = useState<GlobalClassFee | null>(null);
  const [academicYear, setAcademicYear] = useState("2024-25");
  const [viewTotalFeesModalOpen, setViewTotalFeesModalOpen] = useState(false);
  const [selectedClassForTotal, setSelectedClassForTotal] = useState<string>("");
  
  // Student edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
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
    const errors: {[key: string]: string} = {};
    
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
    status: "completed"
  });

  // EMI Modal state
  const [paymentType, setPaymentType] = useState<'emi' | 'full'>('emi');
  const [selectedStudentForEMI, setSelectedStudentForEMI] = useState<CombinedStudent | null>(null);
  const [emiFormData, setEmiFormData] = useState({
    totalAmount: '',
    emiPeriod: '12',
    emiAmount: '',
    downPayment: '0',
    interestRate: '0',
    startDate: new Date().toISOString().split('T')[0],
    frequency: 'monthly',
    processingFee: '0',
    lateFee: '0',
    receiptNumber: '',
    discount: ''
  });

  // Fetch data
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: feeStructures = [] } = useQuery<FeeStructure[]>({ queryKey: ["/api/fee-structures"] });
  const { data: feePayments = [] } = useQuery<FeePayment[]>({ queryKey: ["/api/fee-payments"] });
  const { data: eMandates = [], refetch: refetchEMandates } = useQuery<EMandate[]>({ queryKey: ["/api/e-mandates"] });
  const { data: feeStats } = useQuery<FeeStats>({ queryKey: ["/api/fee-stats"] });
  const { data: classFeeStructures = [] } = useQuery<ClassFeeStructure[]>({ queryKey: ["/api/class-fee-structures"] });
  const { data: globalClassFees = [], refetch: refetchGlobalFees } = useQuery<GlobalClassFee[]>({ queryKey: ["/api/global-class-fees"] });
  const { data: emiPlans = [], refetch: refetchEmiPlans } = useQuery<EmiPlan[]>({ queryKey: ["/api/emi-plans"] });
  
  // Fetch enrolled leads
  const { data: enrolledLeads = [], refetch: refetchLeads } = useQuery<LeadWithCounselor[]>({ 
    queryKey: ["/api/leads", "enrolled"],
    queryFn: async () => {
      const response = await fetch("/api/leads?status=enrolled");
      return response.json();
    },
  });

  // Add class fee structure mutation
  const addClassFeeMutation = useMutation({
    mutationFn: async (data: Partial<ClassFeeStructure> & { studentIds?: number[] }) => {
      const response = await fetch("/api/class-fee-structures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to add class fee structure");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-fee-structures"] });
      setAddClassFeeOpen(false);
      toast({
        title: "Success",
        description: "Class fee structure added successfully",
      });
    },
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
      setAddPaymentOpen(false);
      setEmiPaymentModalOpen(false);
      resetPaymentForm();
      resetEmiPaymentForm();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emi-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
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

  const calculateTotalFees = (fees: FeeStructure[]) => {
    return fees.reduce((sum: number, fee: FeeStructure) => sum + parseFloat(fee.amount), 0);
  };

  const calculatePaidAmount = (payments: FeePayment[]) => {
    return payments.reduce((sum: number, payment: FeePayment) => sum + parseFloat(payment.amount), 0);
  };

  const calculateOutstanding = (studentId: number) => {
    const fees = getStudentFees(studentId);
    const payments = getStudentPayments(studentId);
    
    const totalFees = calculateTotalFees(fees);
    const totalPaid = calculatePaidAmount(payments);
    
    return Math.max(0, totalFees - totalPaid);
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
    const formData = new FormData(event.currentTarget);
    const classFeeData: Partial<ClassFeeStructure> & { studentIds?: number[] } = {
      className: formData.get("className")?.toString() || "",
      feeType: formData.get("feeType")?.toString() || "",
      amount: formData.get("amount")?.toString() || "",
      frequency: formData.get("frequency")?.toString() || "",
      dueDate: formData.get("dueDate")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      studentIds: selectedStudentIds,
    };
    addClassFeeMutation.mutate(classFeeData);
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
      lastContactedAt: lead.lastContactedAt
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
      status: paymentFormData.status
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
      status: "completed"
    });
    setSelectedStudent(null);
  };

  const resetEmiForm = () => {
    setEmiFormData({
      totalAmount: '',
      emiPeriod: '12',
      emiAmount: '',
      downPayment: '0',
      interestRate: '0',
      startDate: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      processingFee: '0',
      lateFee: '0',
      receiptNumber: '',
      discount: ''
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
        amount: selectedEmiPlan.emiAmount,
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
        totalAmount: total ? total.toString() : '',
        emiAmount: prev.emiPeriod && total
          ? ((total - (parseFloat(prev.downPayment) || 0)) / parseInt(prev.emiPeriod)).toFixed(2)
          : ''
      }));
    } else {
      setEmiFormData(prev => ({ ...prev, totalAmount: '', emiAmount: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentForEMI, globalClassFees, academicYear]);

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
    const search = studentSearch.trim().toLowerCase();
    const matchesSearch =
      search === '' ||
      student.name.toLowerCase().includes(search) ||
      (student.studentId && student.studentId.toLowerCase().includes(search)) ||
      (student.parentPhone && student.parentPhone.includes(search)) ||
      ((student as any).email && (student as any).email.toLowerCase().includes(search));
    return matchesClass && matchesStatus && matchesSearch;
  });
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage);

  // Add this helper function after feeStructures/globalClassFees are defined:
  function getStudentFeesWithGlobal(student: Student) {
    const explicitFees = feeStructures.filter(f => f.studentId === student.id);
    const globalFees = globalClassFees.filter(
      fee => fee.className === student.class && fee.academicYear === academicYear && fee.isActive
    );
    const explicitFeeTypes = new Set(explicitFees.map(f => f.feeType));
    const virtualGlobalFees = globalFees
      .filter(fee => !explicitFeeTypes.has(fee.feeType))
      .map(fee => ({
        ...fee,
        studentId: student.id,
        status: "pending",
        isGlobal: true,
        dueDate: '',
        installmentNumber: 1,
        totalInstallments: 1,
      }));
    return [...explicitFees, ...virtualGlobalFees] as FeeStructure[];
  }

  const [editedStudent, setEditedStudent] = useState<Partial<Student> | null>(null);

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
      console.log("Deleting student with id:", selectedStudent.id);
      const res = await apiRequest("DELETE", `/api/students/${selectedStudent.id}`);
      if (!res.ok) {
        throw new Error(`Failed to delete student: ${res.statusText}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Success", description: "Student deleted successfully." });
      setSelectedStudent(null);
      setEditedStudent(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete student.", variant: "destructive" });
    }
  });
  
  return (
    <>
      <Header className="py-4 bg-black" />
      {/* Custom header row with search, filters, and pagination */}
      <div className="flex items-center justify-between px-6 pt-2 pb-4 bg-black gap-4">
        {/* Search bar */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center bg-[#232328] rounded-lg px-4 py-2">
            <svg className="w-5 h-5 text-[#b0b3b8] mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
            <input
              type="text"
              placeholder="Search contacts by name, email, or company..."
              className="bg-transparent outline-none text-white w-full placeholder-[#b0b3b8]"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
            />
          </div>
        </div>
        {/* All Classes dropdown */}
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="border border-[#23272f] bg-[#23242a] text-white rounded px-2 py-1 ml-4">
          <option value="all">All Classes</option>
          {Array.from(new Set(displayStudents.map(s => s.class))).map(cls => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
        {/* All Statuses dropdown */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-[#23272f] bg-[#23242a] text-white rounded px-2 py-1 ml-2">
          <option value="all">All Statuses</option>
          <option value="E-Mandate Active">E-Mandate Active</option>
          <option value="No E-Mandate">No E-Mandate</option>
          <option value="enrolled">Enrolled</option>
          <option value="interested">Interested</option>
          <option value="contacted">Contacted</option>
          <option value="new">New</option>
        </select>
        {/* Action buttons */}
        <div className="flex items-center gap-3 ml-6">
          <div>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
              id="csv-import"
            />
            <label htmlFor="csv-import">
              <button 
                type="button"
                className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#643ae5] text-white font-semibold hover:bg-[#643ae5]/10 transition"
                onClick={() => document.getElementById('csv-import')?.click()}
              >
                <Download className="w-5 h-5" />
                Import
              </button>
            </label>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2 rounded-lg border border-[#643ae5] text-white font-semibold hover:bg-[#643ae5]/10 transition"
          >
            <Upload className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>
      <div className="flex min-h-screen bg-black p-6">
        {/* Sidebar: Student List */}
        <aside className="w-[320px] bg-[#23242a] rounded-2xl border border-[#23272f] shadow h-fit mr-6 flex flex-col">
          <div className="px-6 pt-6 pb-2 text-base font-semibold text-white">
            {allStudents.length} contacts
          </div>
          {/* Remove old search, class, status, and pagination controls from sidebar */}
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-[#23272f]">
              {paginatedStudents.map((student) => (
                <li
                  key={`${student.type}-${student.id}`}
                  className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition rounded-xl ${selectedStudent?.id === student.id ? 'bg-[#23272f] border border-[#643ae5]' : 'hover:bg-[#23242a]'} text-white`}
                  onClick={() => setSelectedStudent(student as Student)}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#62656e] text-white font-bold text-sm border-2 border-[#23272f]">
                      {student.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#23272f] ${((student as any).status === 'active' || (student as any).status === 'enrolled') ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{student.name}</div>
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
              className="px-2 py-1 rounded border border-[#23272f] text-sm text-white bg-[#23242a] disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt; Prev
            </button>
            {[...Array(totalStudentPages)].map((_, i) => (
              <button
                key={i}
                className={`px-2 py-1 rounded border border-[#23272f] text-sm ${currentPage === i + 1 ? 'bg-[#643ae5] text-white' : 'bg-[#23242a] text-[#b0b3b8]'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-2 py-1 rounded border border-[#23272f] text-sm text-white bg-[#23242a] disabled:opacity-50"
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
            <div className="bg-[#23242a] rounded-2xl shadow border border-[#23272f] p-8 min-h-[600px] text-white">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-[#62656e] text-white font-bold text-2xl border-2 border-[#23272f]">
                    {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-white">{selectedStudent.name}</span>
                    <span className="text-sm text-[#b0b3b8] font-medium">{selectedStudent.class}</span>
                  </div>
                </div>
                {/* Edit and Delete buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-[#643ae5] text-white hover:bg-[#643ae5]/10"
                    onClick={() => {
                      console.log("Edit button clicked, selectedStudent:", selectedStudent);
                      setEditedStudent({ ...selectedStudent });
                      setFormErrors({});
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the student from the system. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteStudentMutation.mutate()}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {/* Tabs for student details */}
              <div className="border-b border-[#23272f] mb-4">
                <div className="flex gap-4">
                  {['Overview', 'Payments', 'Mandates', 'EMI'].map(tab => (
                    <button
                      key={tab}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${studentDetailsTab === tab ? 'bg-[#643ae5] text-white' : 'bg-[#23242a] text-[#b0b3b8] hover:bg-[#181A20]'}`}
                      onClick={() => setStudentDetailsTab(tab as 'Overview' | 'Payments' | 'Mandates' | 'EMI')}
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
                    <Card className="bg-[#23242a] text-white border border-[#23272f] rounded-2xl">
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><span className="font-semibold">Full Name:</span> {selectedStudent.name}</div>
                          <div><span className="font-semibold">Phone:</span> {selectedStudent.parentPhone || '-'}</div>
                          <div><span className="font-semibold">Email:</span> {(selectedStudent as any).email || '-'}</div>
                          <div><span className="font-semibold">Class:</span> {selectedStudent.class}</div>
                          <div><span className="font-semibold">Parent:</span> {selectedStudent.parentName || '-'}</div>
                          <div><span className="font-semibold">Address:</span> {(selectedStudent as any).address || '-'}</div>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Fee Information Card */}
                    <Card className="bg-[#23242a] text-white border border-[#23272f] rounded-2xl">
                      <CardHeader>
                        <CardTitle>Fee Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div><span className="font-semibold">Total Fees:</span> ₹{calculateTotalFees(getStudentFeesWithGlobal(selectedStudent)).toLocaleString()}</div>
                          <div><span className="font-semibold">Paid Amount:</span> ₹{calculatePaidAmount(getStudentPayments(selectedStudent.id)).toLocaleString()}</div>
                          <div><span className="font-semibold">Outstanding:</span> ₹{calculateOutstanding(selectedStudent.id).toLocaleString()}</div>
                          <div><span className="font-semibold">Mandates:</span> {(() => {
                            const mandates = getStudentMandate(selectedStudent.id);
                            if (!mandates) return 'None';
                            if (Array.isArray(mandates)) return mandates.length;
                            return 1;
                          })()}</div>
                          <div><span className="font-semibold">EMI Plans:</span> {emiPlans.filter(p => p.studentId === selectedStudent.id).length}</div>
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
                      <Button className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none" onClick={() => setAddPaymentOpen(true)}>Add Payment</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getStudentPayments(selectedStudent.id).map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>₹{payment.amount}</TableCell>
                            <TableCell>{payment.paymentMode}</TableCell>
                            <TableCell>{payment.status}</TableCell>
                            <TableCell>
                              <Button variant="destructive" size="sm" className="bg-red-600 text-white rounded-lg" onClick={() => deletePaymentMutation.mutate(payment.id)}>Delete</Button>
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
                              <Input
                                id="paymentMode"
                                name="paymentMode"
                                required
                                value={paymentFormData.paymentMode}
                                onChange={e => setPaymentFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                              />
                            </div>
                            {/* Add more fields as needed */}
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" className="border-[#643ae5] text-white" onClick={() => setAddPaymentOpen(false)}>
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
                          <TableHead>Mandate ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Max Amount</TableHead>
                          <TableHead>Actions</TableHead>
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
                        className="px-6 py-2 rounded-lg bg-[#643ae5] text-white font-semibold shadow hover:bg-[#7c4dff] transition"
                        onClick={() => {
                          setEmiModalOpen(true);
                          setSelectedStudentForEMI(selectedStudent as CombinedStudent);
                        }}
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
                              <TableHead>Plan Type</TableHead>
                              <TableHead>Total Amount</TableHead>
                              <TableHead>EMI Details</TableHead>
                              <TableHead>Start Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {emiPlans.filter(plan => plan.studentId === selectedStudent.id).map((plan) => (
                              <TableRow key={plan.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      plan.planType === 'emi' 
                                        ? "bg-blue-100 text-blue-800 border-blue-200"
                                        : "bg-green-100 text-green-800 border-green-200"
                                    }
                                  >
                                    {plan.planType === 'emi' ? 'EMI Plan' : 'Full Payment'}
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
                                  {plan.planType === 'emi' ? (
                                    <div className="space-y-1">
                                      <div className="text-sm">
                                        <span className="text-gray-500">EMI Amount:</span> ₹{parseFloat(plan.emiAmount).toLocaleString()}
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-gray-500">Period:</span> {plan.emiPeriod} months
                                      </div>
                                      {parseFloat(plan.downPayment) > 0 && (
                                        <div className="text-sm">
                                          <span className="text-gray-500">Down Payment:</span> ₹{parseFloat(plan.downPayment).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-[#643ae5] text-white"
                                      onClick={() => {
                                        setSelectedEmiPlan(plan);
                                        setEmiPaymentModalOpen(true);
                                      }}
                                    >
                                      <CreditCard className="mr-1 h-3 w-3" />
                                      Record Payment
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="bg-red-600 text-white rounded-lg"
                                      onClick={async () => {
                                        if (confirm(`Are you sure you want to delete the EMI plan? This action cannot be undone.`))
                                          try {
                                            const response = await fetch(`/api/emi-plans/${plan.id}`, {
                                              method: "DELETE",
                                              headers: {
                                                "Content-Type": "application/json",
                                              },
                                            });
                                            if (!response.ok) throw new Error("Failed to delete EMI plan");
                                            await refetchEmiPlans();
                                            await queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
                                            await queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
                                            toast({
                                              title: "Success",
                                              description: "EMI plan deleted successfully",
                                            });
                                          } catch (error: any) {
                                            toast({
                                              title: "Error",
                                              description: `Failed to delete EMI plan: ${error.message}`,
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
                            });
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
                                        ? ((parseFloat(prev.totalAmount) - (parseFloat(prev.downPayment) || 0) - (parseFloat(discount) || 0)) / parseInt(prev.emiPeriod)).toFixed(2)
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
                                    <Label htmlFor="downPayment">Down Payment (₹)</Label>
                                    <Input 
                                      id="downPayment" 
                                      name="downPayment" 
                                      type="number" 
                                      placeholder="0"
                                      min="0"
                                      step="0.01"
                                      value={emiFormData.downPayment}
                                      onChange={(e) => {
                                        const downPayment = e.target.value;
                                        setEmiFormData(prev => ({
                                          ...prev,
                                          downPayment,
                                          emiAmount: prev.totalAmount && prev.emiPeriod
                                            ? ((parseFloat(prev.totalAmount) - (parseFloat(downPayment) || 0) - (parseFloat(prev.discount) || 0)) / parseInt(prev.emiPeriod)).toFixed(2)
                                            : ''
                                        }));
                                      }}
                                    />
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
                                            ? ((parseFloat(emiFormData.totalAmount) - (parseFloat(emiFormData.downPayment) || 0) - (parseFloat(emiFormData.discount) || 0)) / parseInt(value)).toFixed(2)
                                            : ''
                                        }));
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="3">3</SelectItem>
                                        <SelectItem value="6">6</SelectItem>
                                        <SelectItem value="9">9</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
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
                                </div>
                              </>
                            )}
                            {/* Receipt/Transaction Field */}
                            <div className="grid gap-2 mt-4">
                              <Label htmlFor="receiptNumber">Receipt/Transaction ID (Optional)</Label>
                              <Input
                                id="receiptNumber"
                                name="receiptNumber"
                                type="text"
                                placeholder="Enter receipt or transaction number"
                                value={emiFormData.receiptNumber || ''}
                                onChange={e => setEmiFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                              />
                            </div>
                            {/* Payment Summary */}
                            <Card className="bg-gray-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
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
                                        <span className="text-muted-foreground">Down Payment:</span>
                                        <span className="font-medium">₹{emiFormData.downPayment || '0'}</span>
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
                                            const down = parseFloat(emiFormData.downPayment) || 0;
                                            const discount = parseFloat(emiFormData.discount) || 0;
                                            const months = parseInt(emiFormData.emiPeriod) || 0;
                                            if (months > 0 && total - down - discount > 0) {
                                              return ((total - down - discount) / months).toFixed(2);
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
                                            const down = parseFloat(emiFormData.downPayment) || 0;
                                            const discount = parseFloat(emiFormData.discount) || 0;
                                            const months = parseInt(emiFormData.emiPeriod) || 0;
                                            if (months > 0 && total - down - discount > 0) {
                                              return (total - down - discount).toFixed(2);
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
                                className="border-[#643ae5] text-white"
                                onClick={() => {
                                  setEmiModalOpen(false);
                                  setSelectedStudentForEMI(null);
                                  setPaymentType('emi');
                                  setEmiFormData({
                                    totalAmount: '',
                                    emiPeriod: '12',
                                    emiAmount: '',
                                    downPayment: '0',
                                    interestRate: '0',
                                    startDate: new Date().toISOString().split('T')[0],
                                    frequency: 'monthly',
                                    processingFee: '0',
                                    lateFee: '0',
                                    receiptNumber: '',
                                    discount: ''
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" className="bg-[#643ae5] text-white rounded-lg font-semibold hover:bg-[#7c4dff] border-none">Add EMI Plan</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#b0b3b8]">Select a student to view details</div>
          )}
        </main>
      </div>

      {/* Student Edit Modal */}
      {selectedStudent && (
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
      )}
    </>
  );
}