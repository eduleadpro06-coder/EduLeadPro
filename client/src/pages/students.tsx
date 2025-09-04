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
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Student, FeeStructure, FeePayment, InsertStudent } from '../../../shared/schema';

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
      await apiRequest(`/api/students/${studentId}`, { method: "DELETE" });
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
      toast({ 
        title: "Error deleting student", 
        description: error.message || "Failed to delete student", 
        variant: "destructive" 
      });
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
    <div className="min-h-screen bg-black">
      <Header />

      {/* Fee Statistics Cards */}
      {feeStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-black text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-black text-white">
              <CardTitle className="text-sm font-medium text-white">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-black text-white">
              <div className="text-2xl font-bold text-white">₹{feeStats.totalPending?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-black text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-black text-white">
              <CardTitle className="text-sm font-medium text-white">Total Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-black text-white">
              <div className="text-2xl font-bold text-white">₹{feeStats.totalPaid?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-black text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-black text-white">
              <CardTitle className="text-sm font-medium text-white">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-black text-white">
              <div className="text-2xl font-bold text-white">₹{feeStats.totalOverdue?.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-black text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-black text-white">
              <CardTitle className="text-sm font-medium text-white">Collection Rate</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="bg-black text-white">
              <div className="text-2xl font-bold text-white">{feeStats.collectionRate?.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-48 bg-black text-white border-white">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent className="bg-black text-white">
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="Class 9">Class 9</SelectItem>
              <SelectItem value="Class 10">Class 10</SelectItem>
              <SelectItem value="Class 11">Class 11</SelectItem>
              <SelectItem value="Class 12">Class 12</SelectItem>
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
          <DialogContent className="max-w-2xl bg-black text-white">
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
                  <Input id="studentId" name="studentId" required className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="parentName">Parent Name</Label>
                  <Input id="parentName" name="parentName" className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="parentPhone">Parent Phone</Label>
                  <Input id="parentPhone" name="parentPhone" className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select name="class" required className="bg-black text-white border-white">
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white">
                      <SelectItem value="Class 9">Class 9</SelectItem>
                      <SelectItem value="Class 10">Class 10</SelectItem>
                      <SelectItem value="Class 11">Class 11</SelectItem>
                      <SelectItem value="Class 12">Class 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stream">Stream</Label>
                  <Select name="stream" className="bg-black text-white border-white">
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white">
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Commerce">Commerce</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="admissionDate">Admission Date</Label>
                  <Input id="admissionDate" name="admissionDate" type="date" required className="bg-black text-white border-white" />
                </div>
                <div>
                  <Label htmlFor="totalFees">Total Annual Fees</Label>
                  <Input id="totalFees" name="totalFees" type="number" required className="bg-black text-white border-white" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" className="bg-black text-white border-white" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="bg-black text-white border-white" onClick={() => setAddStudentOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addStudentMutation.isPending} className="bg-black text-white border-white">
                  {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="bg-black text-white">
          <TabsTrigger value="students" className="bg-black text-white">Students</TabsTrigger>
          <TabsTrigger value="fee-tracking" className="bg-black text-white">Fee Tracking</TabsTrigger>
          <TabsTrigger value="payments" className="bg-black text-white">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student: Student) => {
              const outstanding = calculateOutstanding(student);
              const overdueFees = getOverdueFees(student.id);
              const hasOverdue = overdueFees.length > 0;
              
              return (
                <Card key={student.id} className={`bg-black text-white ${hasOverdue ? "border-red-200" : ""}`}>
                  <CardHeader className="pb-2 bg-black text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-white">{student.name}</CardTitle>
                        <CardDescription className="text-sm text-white">
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
                  <CardContent className="bg-black text-white">
                    <div className="space-y-2 text-sm text-white">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-white" />
                        {student.phone}
                      </div>
                      {student.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-white" />
                          {student.email}
                        </div>
                      )}
                      {student.parentName && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-white" />
                          {student.parentName} • {student.parentPhone}
                        </div>
                      )}
                      <div className="pt-2 border-t border-gray-700">
                        <div className="text-muted-foreground text-white">Outstanding: </div>
                        <div className={`font-semibold ${outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{outstanding.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-black text-white border-white"
                        onClick={() => {
                          setSelectedStudent(student);
                          setEditStudentOpen(true);
                        }}
                      >
                        <Edit className="mr-1 h-3 w-3 text-white" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-black text-white border-white hover:bg-red-600 hover:border-red-600"
                        onClick={() => {
                          setSelectedStudent(student);
                          setDeleteStudentOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3 text-white" />
                        Delete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-black text-white border-white"
                        onClick={() => {
                          setSelectedStudent(student);
                          setAddFeePaymentOpen(true);
                        }}
                      >
                        <CreditCard className="mr-1 h-3 w-3 text-white" />
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
          <Card className="bg-black text-white">
            <Table className="bg-black text-white">
              <TableHeader className="bg-black text-white">
                <TableRow className="bg-black text-white">
                  <TableHead className="text-white">Student</TableHead>
                  <TableHead className="text-white">Fee Type</TableHead>
                  <TableHead className="text-white">Amount</TableHead>
                  <TableHead className="text-white">Due Date</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Installment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-black text-white">
                {feeStructures.map((fee: FeeStructure) => {
                  const student = students.find((s: Student) => s.id === fee.studentId);
                  const isOverdue = fee.status === "pending" && new Date(fee.dueDate) < new Date();
                  
                  return (
                    <TableRow key={fee.id} className={isOverdue ? "bg-red-50" : ""}>
                      <TableCell>{student?.name}</TableCell>
                      <TableCell>{fee.feeType}</TableCell>
                      <TableCell className="text-white">₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
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
            <h3 className="text-lg font-medium text-white">Recent Payments</h3>
            <Button variant="outline" className="bg-black text-white border-white">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          
          <Card className="bg-black text-white">
            <Table className="bg-black text-white">
              <TableHeader className="bg-black text-white">
                <TableRow className="bg-black text-white">
                  <TableHead className="text-white">Student</TableHead>
                  <TableHead className="text-white">Amount</TableHead>
                  <TableHead className="text-white">Discount</TableHead>
                  <TableHead className="text-white">Payment Date</TableHead>
                  <TableHead className="text-white">Method</TableHead>
                  <TableHead className="text-white">Receipt</TableHead>
                  <TableHead className="text-white">Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-black text-white">
                {feePayments.map((payment: FeePayment) => {
                  const student = students.find((s: Student) => s.id === payment.studentId);
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{student?.name}</TableCell>
                      <TableCell className="font-semibold text-white">₹{parseFloat(payment.amount).toLocaleString()}</TableCell>
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
        <DialogContent className="bg-black text-white">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
            <DialogDescription>
              Record a new fee payment for {selectedStudent?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFeePayment} className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required className="bg-black text-white border-white" />
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input id="paymentDate" name="paymentDate" type="date" required className="bg-black text-white border-white" />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select name="paymentMethod" required className="bg-black text-white border-white">
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="bg-black text-white">
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
              <Input id="receiptNumber" name="receiptNumber" required className="bg-black text-white border-white" />
            </div>
            <div>
              <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
              <Input id="transactionId" name="transactionId" className="bg-black text-white border-white" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" name="notes" className="bg-black text-white border-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="bg-black text-white border-white"
                onClick={() => {
                  setAddFeePaymentOpen(false);
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addFeePaymentMutation.isPending} className="bg-black text-white border-white">
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
                        <FormControl><Input {...field} required placeholder="e.g. 10" /></FormControl>
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
    </div>
  );
}