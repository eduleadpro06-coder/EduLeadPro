import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CreditCard, Receipt, AlertCircle, CheckCircle, Clock, Filter, Download, User, Phone, Mail, Trash2, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { invalidateNotifications } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student, FeeStructure, FeePayment, InsertStudent, GlobalClassFee } from '../../../shared/schema';

// Student form schema
const studentSchema = z.object({
  rollNumber: z.string().min(1, "Roll number is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  class: z.string().min(1, "Class is required"),
  stream: z.string().min(1, "Stream is required"),
  parentName: z.string().min(1, "Parent name is required"),
  parentPhone: z.string().min(10, "Parent phone must be at least 10 digits"),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  status: z.string().default("active"),
});

export default function Students() {
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addFeePaymentOpen, setAddFeePaymentOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editStudentOpen, setEditStudentOpen] = useState(false);
  const [deleteStudentOpen, setDeleteStudentOpen] = useState(false);
  const [financialBlockingOpen, setFinancialBlockingOpen] = useState(false);
  const [financialBlockingDetails, setFinancialBlockingDetails] = useState<any>(null);
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterFeeStatus, setFilterFeeStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students data
  const { data: students = [] as Student[], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch fee structures
  const { data: feeStructures = [] as FeeStructure[], isLoading: feeStructuresLoading } = useQuery<FeeStructure[]>({
    queryKey: ["/api/fee-structures"],
  });

  // Fetch fee payments
  const { data: feePayments = [] as FeePayment[], isLoading: feePaymentsLoading } = useQuery<FeePayment[]>({
    queryKey: ["/api/fee-payments"],
  });

  // Fetch fee statistics
  const { data: feeStats } = useQuery({
    queryKey: ["/api/fee-stats"],
  });

  const { data: globalFees } = useQuery<GlobalClassFee[]>({
    queryKey: ["/api/global-class-fees"],
  });

  const classOptions = globalFees
    ? Array.from(new Set(globalFees.filter(f => f.isActive).map(f => f.className))).sort()
    : [];

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/students", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      invalidateNotifications(queryClient);
      setAddStudentOpen(false);
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
  });

  // Add fee payment mutation
  const addFeePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/fee-payments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-structures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fee-stats"] });
      invalidateNotifications(queryClient);
      setAddFeePaymentOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Success",
        description: "Fee payment recorded successfully",
      });
    },
  });

  // Edit Student Form
  const editStudentForm = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      rollNumber: '',
      name: '',
      email: '',
      phone: '',
      class: '',
      stream: '',
      parentName: '',
      parentPhone: '',
      address: '',
      dateOfBirth: '',
      admissionDate: '',
      status: 'active',
    },
  });

  // Populate edit form when editing student
  useEffect(() => {
    if (editStudentOpen && selectedStudent) {
      console.log("Populating edit form with selectedStudent:", selectedStudent);
      editStudentForm.reset({
        rollNumber: selectedStudent.rollNumber || '',
        name: selectedStudent.name || '',
        email: selectedStudent.email || '',
        phone: selectedStudent.phone || '',
        class: selectedStudent.class || '',
        stream: selectedStudent.stream || '',
        parentName: selectedStudent.parentName || '',
        parentPhone: selectedStudent.parentPhone || '',
        address: selectedStudent.address || '',
        dateOfBirth: selectedStudent.dateOfBirth ? selectedStudent.dateOfBirth.split('T')[0] : '',
        admissionDate: selectedStudent.admissionDate ? selectedStudent.admissionDate.split('T')[0] : '',
        status: selectedStudent.status || 'active',
      });
    }
  }, [editStudentOpen, selectedStudent, editStudentForm]);

  // Edit student mutation
  const editStudentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studentSchema> & { id: number }) => {
      const payload = {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : null,
        admissionDate: data.admissionDate ? new Date(data.admissionDate).toISOString().split('T')[0] : null,
      };
      console.log("Updating student with payload:", payload);
      const response = await apiRequest(`/api/students/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return response;
    },
    onSuccess: (updatedStudent) => {
      console.log("Student updated successfully:", updatedStudent);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      invalidateNotifications(queryClient);
      setSelectedStudent(updatedStudent);
      setEditStudentOpen(false);
      toast({
        title: "Student updated successfully",
        description: `${updatedStudent.name} has been updated.`
      });
    },
    onError: (error: any) => {
      console.error("Error updating student:", error);
      toast({
        title: "Error updating student",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      console.log(`🔥 Deleting student with ID: ${studentId}`);
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setSelectedStudent(null);
      setDeleteStudentOpen(false);
      toast({
        title: "Student deleted successfully",
        description: "The student has been removed from the system."
      });
    },
    onError: (error: any) => {
      console.log("=== DELETE STUDENT ERROR DEBUG ===");
      console.log("Full error object:", error);
      console.log("Error message:", error.message);
      console.log("Error errorData:", error.errorData);
      console.log("All error keys:", Object.keys(error));
      if (error.errorData) {
        console.log("ErrorData keys:", Object.keys(error.errorData));
        console.log("ErrorData code:", error.errorData.code);
        console.log("ErrorData details:", error.errorData.details);
        console.log("ErrorData message:", error.errorData.message);
        console.log("ErrorData cannotDelete:", error.errorData.cannotDelete);
      }
      console.log("=== END DEBUG ===");

      // Check if this is a financial obligations error (check both direct properties and errorData)
      const errorData = error.errorData || {};
      const code = error.code || errorData.code;
      const details = error.details || errorData.details;

      console.log("🎯 UI: Checking error condition - Code:", code, "Has details:", !!details);
      console.log("🎯 UI: Code comparison:", code, "===", "'ACTIVE_FINANCIAL_OBLIGATIONS'", "->", code === 'ACTIVE_FINANCIAL_OBLIGATIONS');

      if (code === 'ACTIVE_FINANCIAL_OBLIGATIONS' && details) {
        console.log("🎯 UI: ✅ FINANCIAL OBLIGATIONS ERROR DETECTED - Setting modal state");
        console.log("🎯 UI: Details object:", JSON.stringify(details, null, 2));
        console.log("🎯 SHOWING FINANCIAL BLOCKING DIALOG");
        console.log("Details structure:", details);
        setFinancialBlockingDetails({
          student: selectedStudent,
          ...details
        });
        setFinancialBlockingOpen(true);
        setDeleteStudentOpen(false);
      } else {
        console.log("❌ SHOWING REGULAR ERROR TOAST");
        console.log("Code:", code, "Details:", details);
        toast({
          title: "Error deleting student",
          description: error.message || "Failed to delete student",
          variant: "destructive"
        });
      }
    },
  });

  const handleAddStudent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      rollNumber: formData.get("rollNumber") || formData.get("studentId"), // Support both field names
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      parentName: formData.get("parentName"),
      parentPhone: formData.get("parentPhone"),
      class: formData.get("class"),
      stream: formData.get("stream"),
      admissionDate: formData.get("admissionDate"),
      totalFees: formData.get("totalFees"),
      address: formData.get("address"),
    };
    addStudentMutation.mutate(data);
  };

  const handleAddFeePayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      studentId: selectedStudent?.id,
      amount: formData.get("amount"),
      paymentDate: formData.get("paymentDate"),
      paymentMethod: formData.get("paymentMethod"),
      transactionId: formData.get("transactionId"),
      receiptNumber: formData.get("receiptNumber"),
      notes: formData.get("notes"),
    };
    addFeePaymentMutation.mutate(data);
  };

  const getFeeStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "paid": "bg-green-100 text-green-800",
      "pending": "bg-yellow-100 text-yellow-800",
      "overdue": "bg-red-100 text-red-800",
      "waived": "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      "cash": "bg-green-100 text-green-800",
      "card": "bg-blue-100 text-blue-800",
      "bank_transfer": "bg-purple-100 text-purple-800",
      "upi": "bg-orange-100 text-orange-800",
      "cheque": "bg-gray-100 text-gray-800",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  const filteredStudents = students.filter((student: Student) =>
    (filterClass === "all" || student.class === filterClass)
  );

  // Debug logging - remove in production
  console.log("Students count:", students.length);

  const getStudentFeeStructure = (studentId: number) => {
    return feeStructures.filter((fee: FeeStructure) => fee.studentId === studentId);
  };

  const getStudentFeePayments = (studentId: number) => {
    return feePayments.filter((payment: FeePayment) => payment.studentId === studentId);
  };

  const calculateOutstanding = (student: Student) => {
    const fees = getStudentFeeStructure(student.id);
    const payments = getStudentFeePayments(student.id);

    const totalFees = fees.reduce((sum: number, fee: FeeStructure) => sum + parseFloat(fee.amount), 0);
    const totalPaid = payments.reduce((sum: number, payment: FeePayment) => sum + parseFloat(payment.amount), 0);

    return Math.max(0, totalFees - totalPaid);
  };

  const getOverdueFees = (studentId: number) => {
    const fees = getStudentFeeStructure(studentId);
    const today = new Date();

    return fees.filter(fee =>
      fee.status === "pending" && new Date(fee.dueDate) < today
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Fee Statistics Cards */}
      {feeStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white text-gray-900">
              <CardTitle className="text-sm font-medium text-gray-800">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-white text-gray-900">
              <div className="text-2xl font-bold text-gray-800">₹{feeStats.totalPending?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white text-gray-900">
              <CardTitle className="text-sm font-medium text-gray-800">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-white text-gray-900">
              <div className="text-2xl font-bold text-gray-800">₹{feeStats.totalPaid?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white text-gray-900">
              <CardTitle className="text-sm font-medium text-gray-800">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-white text-gray-900">
              <div className="text-2xl font-bold text-gray-800">₹{feeStats.totalOverdue?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white text-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white text-gray-900">
              <CardTitle className="text-sm font-medium text-gray-800">Collection Rate</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-white text-gray-900">
              <div className="text-2xl font-bold text-gray-800">{feeStats.collectionRate?.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-48 bg-white text-gray-900 border-white">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent className="bg-white text-gray-900">
              <SelectItem value="all">All Classes</SelectItem>
              {classOptions.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
          <DialogTrigger asChild>
            <Button variant="purple">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white text-gray-900">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the details of the new student
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input id="studentId" name="studentId" required className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input id="parentName" name="parentName" className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="parentPhone">Parent Phone</Label>
                  <Input id="parentPhone" name="parentPhone" className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select name="class" required className="bg-white text-gray-900 border-white">
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      {classOptions.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stream">Stream</Label>
                  <Select name="stream" className="bg-white text-gray-900 border-white">
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input id="admissionDate" name="admissionDate" type="date" required className="bg-white text-gray-900 border-white" />
                </div>
                <div>
                  <Label htmlFor="totalFees">Total Annual Fees</Label>
                  <Input id="totalFees" name="totalFees" type="number" required className="bg-white text-gray-900 border-white" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" className="bg-white text-gray-900 border-white" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="bg-white text-gray-900 border-white" onClick={() => setAddStudentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addStudentMutation.isPending} className="bg-white text-gray-900 border-white">
                  {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="bg-white text-gray-900">
          <TabsTrigger value="students" className="bg-white text-gray-900">Students</TabsTrigger>
          <TabsTrigger value="fee-tracking" className="bg-white text-gray-900">Fee Tracking</TabsTrigger>
          <TabsTrigger value="payments" className="bg-white text-gray-900">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student: Student) => {
              const outstanding = calculateOutstanding(student);
              const overdueFees = getOverdueFees(student.id);
              const hasOverdue = overdueFees.length > 0;

              return (
                <Card key={student.id} className={`bg-white text-gray-900 ${hasOverdue ? "border-red-200" : ""}`}>
                  <CardHeader className="pb-2 bg-white text-gray-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-gray-800">{student.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-800">
                          {student.rollNumber} • {student.class} {student.stream}
                        </CardDescription>
                      </div>
                      {hasOverdue && (
                        <Badge variant="destructive">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="bg-white text-gray-900">
                    <div className="space-y-2 text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-800" />
                        {student.phone}
                      </div>
                      {student.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-800" />
                          {student.email}
                        </div>
                      )}
                      {student.parentName && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-800" />
                          {student.parentName} • {student.parentPhone}
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-700">
                        <div className="text-muted-foreground text-gray-800">Outstanding: </div>
                        <div className={`font-semibold ${outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{outstanding.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-gray-900 border-white"
                        onClick={() => {
                          setSelectedStudent(student);
                          setEditStudentOpen(true);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3 text-gray-800" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-gray-900 border-white hover:bg-red-600 hover:border-red-600"
                        onClick={() => {
                          setSelectedStudent(student);
                          setDeleteStudentOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3 text-gray-800" />
                        Delete
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white text-gray-900 border-white"
                        onClick={() => {
                          setSelectedStudent(student);
                          setAddFeePaymentOpen(true);
                        }}
                      >
                        <CreditCard className="mr-1 h-3 w-3 text-gray-800" />
                        Record Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="fee-tracking" className="space-y-4">
          <Card className="bg-white text-gray-900">
            <Table className="bg-white text-gray-900">
              <TableHeader className="bg-white text-gray-900">
                <TableRow className="bg-white text-gray-900">
                  <TableHead className="text-gray-800">Student</TableHead>
                  <TableHead className="text-gray-800">Fee Type</TableHead>
                  <TableHead className="text-gray-800">Amount</TableHead>
                  <TableHead className="text-gray-800">Due Date</TableHead>
                  <TableHead className="text-gray-800">Status</TableHead>
                  <TableHead className="text-gray-800">Installment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-gray-900">
                {feeStructures.map((fee: FeeStructure) => {
                  const student = students.find((s: Student) => s.id === fee.studentId);
                  const isOverdue = fee.status === "pending" && new Date(fee.dueDate) < new Date();

                  return (
                    <TableRow key={fee.id} className={isOverdue ? "bg-red-50" : ""}>
                      <TableCell>{student?.name}</TableCell>
                      <TableCell>{fee.feeType}</TableCell>
                      <TableCell className="text-gray-800">₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(fee.dueDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={getFeeStatusColor(isOverdue ? "overdue" : fee.status)}>
                          {isOverdue ? "Overdue" : fee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {fee.installmentNumber}/{fee.totalInstallments}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Recent Payments</h3>
            <Button variant="outline" className="bg-white text-gray-900 border-white">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <Card className="bg-white text-gray-900">
            <Table className="bg-white text-gray-900">
              <TableHeader className="bg-white text-gray-900">
                <TableRow className="bg-white text-gray-900">
                  <TableHead className="text-gray-800">Student</TableHead>
                  <TableHead className="text-gray-800">Amount</TableHead>
                  <TableHead className="text-gray-800">Discount</TableHead>
                  <TableHead className="text-gray-800">Payment Date</TableHead>
                  <TableHead className="text-gray-800">Method</TableHead>
                  <TableHead className="text-gray-800">Receipt</TableHead>
                  <TableHead className="text-gray-800">Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white text-gray-900">
                {feePayments.map((payment: FeePayment) => {
                  const student = students.find((s: Student) => s.id === payment.studentId);

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{student?.name}</TableCell>
                      <TableCell className="font-semibold text-gray-800">₹{parseFloat(payment.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">
                        {parseFloat(payment.discount) > 0 ? `-₹${parseFloat(payment.discount).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                          {payment.paymentMethod.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.receiptNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.transactionId || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fee Payment Dialog */}
      <Dialog open={addFeePaymentOpen} onOpenChange={setAddFeePaymentOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
            <DialogDescription>
              Record a new fee payment for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFeePayment} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required className="bg-white text-gray-900 border-white" />
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input id="paymentDate" name="paymentDate" type="date" required className="bg-black text-gray-800 border-white" />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select name="paymentMethod" required className="bg-black text-gray-800 border-white">
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-black text-gray-800">
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input id="receiptNumber" name="receiptNumber" required className="bg-black text-gray-800 border-white" />
            </div>
            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input id="transactionId" name="transactionId" className="bg-black text-gray-800 border-white" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" name="notes" className="bg-black text-gray-800 border-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-black text-gray-800 border-white"
                onClick={() => {
                  setAddFeePaymentOpen(false);
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addFeePaymentMutation.isPending} className="bg-black text-gray-800 border-white">
                {addFeePaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <Dialog open={editStudentOpen} onOpenChange={setEditStudentOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Edit the details for this student below</DialogDescription>
            </DialogHeader>
            <Form {...editStudentForm}>
              <form onSubmit={editStudentForm.handleSubmit((data) => {
                if (!selectedStudent) return;
                const payload = { ...data, id: selectedStudent.id };
                editStudentMutation.mutate(payload);
              })} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField control={editStudentForm.control} name="rollNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl><Input {...field} required placeholder="e.g. 2024001" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} required placeholder="e.g. John Doe" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input {...field} type="email" placeholder="e.g. john.doe@example.com" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input {...field} required placeholder="1234567890" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="class" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classOptions.map((cls) => (
                              <SelectItem key={cls} value={cls}>
                                {cls}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="stream" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stream</FormLabel>
                        <FormControl><Input {...field} required placeholder="e.g. Science" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <FormField control={editStudentForm.control} name="parentName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Name</FormLabel>
                        <FormControl><Input {...field} required placeholder="e.g. Jane Doe" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="parentPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Phone</FormLabel>
                        <FormControl><Input {...field} required placeholder="1234567890" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter student address"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="dateOfBirth" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl><Input {...field} type="date" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="admissionDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Date</FormLabel>
                        <FormControl><Input {...field} type="date" required /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={editStudentForm.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="graduated">Graduated</SelectItem>
                            <SelectItem value="dropped_out">Dropped Out</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditStudentOpen(false);
                      setSelectedStudent(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editStudentMutation.isPending}
                    className="bg-[#643ae5] hover:bg-[#5832c4] text-white"
                  >
                    {editStudentMutation.isPending ? "Updating..." : "Update Student"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Student AlertDialog */}
      {selectedStudent && (
        <AlertDialog open={deleteStudentOpen} onOpenChange={setDeleteStudentOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedStudent.name}</strong>? This action cannot be undone and will permanently remove the student from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteStudentOpen(false);
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedStudent && deleteStudentMutation.mutate(selectedStudent.id)}
                disabled={deleteStudentMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteStudentMutation.isPending ? "Deleting..." : "Delete Student"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

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
    </div>
  );
}