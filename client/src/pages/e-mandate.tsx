import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CreditCard, Calendar, AlertTriangle, CheckCircle, Clock, Building, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { format } from "date-fns";

interface EMandate {
  id: number;
  studentId: number;
  mandateId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  frequency: string;
  status: string;
  createdAt: string;
}

interface EmiSchedule {
  id: number;
  eMandateId: number;
  studentId: number;
  emiAmount: string;
  scheduledDate: string;
  actualDate?: string;
  status: string;
  transactionId?: string;
  failureReason?: string;
  retryCount: number;
}

interface Student {
  id: number;
  name: string;
  studentId: string;
  class: string;
  parentName?: string;
  parentPhone?: string;
}

export default function EMandate() {
  const [addEMandateOpen, setAddEMandateOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(() => {
    return window.location.hash.slice(1) || "mandates";
  });

  // Fetch students data
  const { data: students = [] } = useQuery({
    queryKey: ["/api/students"],
  });

  // Fetch e-mandates
  const { data: eMandates = [], isLoading: eMandatesLoading } = useQuery({
    queryKey: ["/api/e-mandates"],
  });

  // Fetch EMI schedules
  const { data: emiSchedules = [] } = useQuery({
    queryKey: ["/api/emi-schedules"],
  });

  // Fetch upcoming EMIs
  const { data: upcomingEmis = [] } = useQuery({
    queryKey: ["/api/upcoming-emis"],
  });

  // Add e-mandate mutation
  const addEMandateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/e-mandates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/e-mandates"] });
      setAddEMandateOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Success",
        description: "E-Mandate created successfully",
      });
    },
  });

  // Update EMI status mutation
  const updateEmiStatusMutation = useMutation({
    mutationFn: async ({ emiId, status, transactionId, failureReason }: any) => {
      return await apiRequest(`/api/emi-schedules/${emiId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, transactionId, failureReason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emi-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/upcoming-emis"] });
      toast({
        title: "Success",
        description: "EMI status updated successfully",
      });
    },
  });

  const handleAddEMandate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      studentId: selectedStudent?.id,
      mandateId: formData.get("mandateId"),
      bankName: formData.get("bankName"),
      accountNumber: formData.get("accountNumber"),
      ifscCode: formData.get("ifscCode"),
      accountHolderName: formData.get("accountHolderName"),
      maxAmount: formData.get("maxAmount"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      frequency: formData.get("frequency"),
    };
    addEMandateMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "active": "bg-green-100 text-green-800",
      "inactive": "bg-gray-100 text-gray-800",
      "expired": "bg-red-100 text-red-800",
      "cancelled": "bg-orange-100 text-orange-800",
      "scheduled": "bg-blue-100 text-blue-800",
      "success": "bg-green-100 text-green-800",
      "failed": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getFrequencyDisplay = (frequency: string) => {
    const display: Record<string, string> = {
      "monthly": "Monthly",
      "quarterly": "Quarterly",
      "yearly": "Yearly",
    };
    return display[frequency] || frequency;
  };

  const filteredEMandates = eMandates.filter((mandate: EMandate) => 
    filterStatus === "all" || mandate.status === filterStatus
  );

  const getStudentById = (studentId: number) => {
    return students.find((student: Student) => student.id === studentId);
  };

  const getEMandateById = (eMandateId: number) => {
    return eMandates.find((mandate: EMandate) => mandate.id === eMandateId);
  };

  const getFailedEmis = () => {
    return emiSchedules.filter((emi: EmiSchedule) => emi.status === "failed");
  };

  const getExpiringMandates = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return eMandates.filter((mandate: EMandate) => 
      mandate.status === "active" && new Date(mandate.endDate) <= nextMonth
    );
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    window.location.hash = value;
  };

  return (
    <div className="space-y-6">
      <Header className="py-4" />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mandates</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eMandates.filter((m: EMandate) => m.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming EMIs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEmis.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFailedEmis().length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getExpiringMandates().length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={addEMandateOpen} onOpenChange={setAddEMandateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Setup E-Mandate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Setup New E-Mandate</DialogTitle>
              <DialogDescription>
                Configure auto-debit mandate for fee payments
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddEMandate} className="space-y-4">
              <div>
                <Label htmlFor="studentSelect">Select Student</Label>
                <Select
                  value={selectedStudent?.id.toString() || ""}
                  onValueChange={(value) => {
                    const student = students.find((s: Student) => s.id === parseInt(value));
                    setSelectedStudent(student);
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name} - {student.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mandateId">Mandate ID</Label>
                  <Input id="mandateId" name="mandateId" required />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input id="bankName" name="bankName" required />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input id="accountNumber" name="accountNumber" required />
                </div>
                <div>
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input id="ifscCode" name="ifscCode" required />
                </div>
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input id="accountHolderName" name="accountHolderName" required />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Maximum Amount</Label>
                  <Input id="maxAmount" name="maxAmount" type="number" required />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" required />
                </div>
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select name="frequency" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddEMandateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addEMandateMutation.isPending}>
                  {addEMandateMutation.isPending ? "Setting up..." : "Setup E-Mandate"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="mandates">E-Mandates</TabsTrigger>
          <TabsTrigger value="schedule">EMI Schedule</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="mandates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEMandates.map((mandate: EMandate) => {
              const student = getStudentById(mandate.studentId);
              const isExpiringSoon = new Date(mandate.endDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              
              return (
                <Card key={mandate.id} className={isExpiringSoon ? "border-orange-200" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{student?.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {mandate.mandateId}
                        </CardDescription>
                      </div>
                      <Badge variant="status" className={getStatusColor(mandate.status)}>
                        {mandate.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        {mandate.bankName}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {mandate.accountHolderName}
                      </div>
                      <div className="text-muted-foreground">
                        Account: ***{mandate.accountNumber.slice(-4)}
                      </div>
                      <div className="text-muted-foreground">
                        IFSC: {mandate.ifscCode}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span>Max Amount:</span>
                          <span className="font-semibold">₹{parseFloat(mandate.maxAmount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frequency:</span>
                          <span>{getFrequencyDisplay(mandate.frequency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valid until:</span>
                          <span className={isExpiringSoon ? "text-orange-600 font-semibold" : ""}>
                            {format(new Date(mandate.endDate), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </div>
                      {isExpiringSoon && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>EMI Schedule</CardTitle>
              <CardDescription>
                Track scheduled and completed EMI payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emiSchedules.map((emi: EmiSchedule) => {
                    const student = getStudentById(emi.studentId);
                    const mandate = getEMandateById(emi.eMandateId);
                    
                    return (
                      <TableRow key={emi.id}>
                        <TableCell>{student?.name}</TableCell>
                        <TableCell className="font-semibold">₹{parseFloat(emi.emiAmount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(emi.scheduledDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="status" className={getStatusColor(emi.status)}>
                            {emi.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {emi.transactionId || "-"}
                        </TableCell>
                        <TableCell>
                          {emi.status === "failed" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateEmiStatusMutation.mutate({
                                emiId: emi.id,
                                status: "scheduled"
                              })}
                            >
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Failed Payments
                </CardTitle>
                <CardDescription>
                  EMI payments that require attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getFailedEmis().map((emi: EmiSchedule) => {
                    const student = getStudentById(emi.studentId);
                    return (
                      <div key={emi.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium">{student?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ₹{parseFloat(emi.emiAmount).toLocaleString()} • {format(new Date(emi.scheduledDate), "MMM dd")}
                          </div>
                          {emi.failureReason && (
                            <div className="text-xs text-red-600 mt-1">
                              {emi.failureReason}
                            </div>
                          )}
                        </div>
                        <Badge variant="destructive">
                          Failed
                        </Badge>
                      </div>
                    );
                  })}
                  {getFailedEmis().length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No failed payments
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Expiring Mandates
                </CardTitle>
                <CardDescription>
                  Mandates expiring within 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getExpiringMandates().map((mandate: EMandate) => {
                    const student = getStudentById(mandate.studentId);
                    return (
                      <div key={mandate.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div>
                          <div className="font-medium">{student?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Expires: {format(new Date(mandate.endDate), "MMM dd, yyyy")}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-orange-100 text-orange-700">
                          Expiring
                        </Badge>
                      </div>
                    );
                  })}
                  {getExpiringMandates().length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      No expiring mandates
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming EMIs (Next 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingEmis.map((emi: EmiSchedule) => {
                    const student = getStudentById(emi.studentId);
                    const mandate = getEMandateById(emi.eMandateId);
                    
                    return (
                      <TableRow key={emi.id}>
                        <TableCell>{student?.name}</TableCell>
                        <TableCell className="font-semibold">₹{parseFloat(emi.emiAmount).toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(emi.scheduledDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{mandate?.bankName}</TableCell>
                        <TableCell>
                          <Badge variant="status" className={getStatusColor(emi.status)}>
                            {emi.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}