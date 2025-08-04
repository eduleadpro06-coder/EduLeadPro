import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Bell, User, Shield, Database, Calculator, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreditCard, Building} from "lucide-react";
import React from "react"; // Added for useEffect

// Define GlobalClassFee interface if not already imported
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

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    overdueFollowups: true,
    newLeads: false,
    dailyReports: true,
  });

  const [profile, setProfile] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@school.edu",
    phone: "+1 (555) 123-4567",
    role: "Admissions Head",
  });

  const [systemSettings, setSystemSettings] = useState({
    autoAssignment: true,
    followupReminders: "24",
    leadTimeout: "30",
    workingHours: "9:00 AM - 6:00 PM",
    customInstituteName: "",
  });

  // --- Global Fee Management State & Logic ---
  const queryClient = useQueryClient();
  const [globalFeeModalOpen, setGlobalFeeModalOpen] = useState(false);
  const [editingGlobalFee, setEditingGlobalFee] = useState<GlobalClassFee | null>(null);
  const [academicYear, setAcademicYear] = useState<string>("2024-25");
  const [viewTotalFeesModalOpen, setViewTotalFeesModalOpen] = useState(false);
  const [selectedClassForTotal, setSelectedClassForTotal] = useState<string>("");
  const { toast } = useToast();

  // Controlled state for global fee form
  const [feeForm, setFeeForm] = useState({
    className: "",
    feeType: "",
    amount: "",
    frequency: "",
    academicYear: academicYear,
    isActive: "true",
    description: ""
  });

  // When modal opens for add/edit, initialize form state
  React.useEffect(() => {
    if (globalFeeModalOpen) {
      if (editingGlobalFee) {
        setFeeForm({
          className: editingGlobalFee.className || "",
          feeType: editingGlobalFee.feeType || "",
          amount: editingGlobalFee.amount || "",
          frequency: editingGlobalFee.frequency || "",
          academicYear: editingGlobalFee.academicYear || academicYear,
          isActive: editingGlobalFee.isActive ? "true" : "false",
          description: editingGlobalFee.description || ""
        });
      } else {
        setFeeForm({
          className: "",
          feeType: "",
          amount: "",
          frequency: "",
          academicYear: academicYear,
          isActive: "true",
          description: ""
        });
      }
    }
  }, [globalFeeModalOpen, editingGlobalFee, academicYear]);

  // Queries
  const { data: globalClassFees = [] } = useQuery<GlobalClassFee[]>({ queryKey: ["/api/global-class-fees"] });
  const { data: feePayments = [] } = useQuery<any[]>({ queryKey: ["/api/fee-payments"] });

  // Payment stats for analytics
  const [paymentStats, setPaymentStats] = useState({
    totalCollected: 0,
    totalPending: 0,
    totalFailed: 0,
    monthlyCollection: 0,
    collectionRate: 0
  });

  // Utility functions
  const calculateClassTotalFees = (className: string, academicYear: string) => {
    const classFees = globalClassFees.filter((fee: GlobalClassFee) => fee.className === className && fee.academicYear === academicYear && fee.isActive);
    return classFees.reduce((total: number, fee: GlobalClassFee) => total + parseFloat(fee.amount), 0);
  };
  const getClassFeeBreakdown = (className: string, academicYear: string) => {
    return globalClassFees.filter((fee: GlobalClassFee) => fee.className === className && fee.academicYear === academicYear && fee.isActive);
  };
  const handleViewTotalFees = (className: string) => {
    setSelectedClassForTotal(className);
    setViewTotalFeesModalOpen(true);
  };

  // Global class fee mutation
  const globalClassFeeMutation = useMutation({
    mutationFn: async (data: Partial<GlobalClassFee>) => {
      const url = editingGlobalFee ? `/api/global-class-fees/${editingGlobalFee.id}` : "/api/global-class-fees";
      const method = editingGlobalFee ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save global class fee: ${errorText}`);
      }
      return response.json();
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
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save global class fee: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleGlobalClassFee = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    globalClassFeeMutation.mutate({
      className: feeForm.className,
      feeType: feeForm.feeType,
      amount: feeForm.amount,
      frequency: feeForm.frequency,
      academicYear: feeForm.academicYear,
      description: feeForm.description,
      isActive: feeForm.isActive === "true"
    });
  };

  // Payment analytics calculation
  // (You may want to useEffect this if feePayments/globalClassFees/academicYear changes)

  // --- END Global Fee Management State & Logic ---

  const [selectedTab, setSelectedTab] = useState(() => {
    return window.location.hash.slice(1) || "profile";
  });

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    window.location.hash = value;
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile settings have been saved successfully.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notifications updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleSaveSystem = () => {
    // Save custom institute name to localStorage
    localStorage.setItem("customInstituteName", systemSettings.customInstituteName);
    
    toast({
      title: "System settings updated",
      description: "System configuration has been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="p-6">
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="payroll" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Payroll
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="global-fees" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Global Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={profile.role}
                      disabled
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile}>Save Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailAlerts: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Overdue Follow-ups</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about overdue follow-up tasks
                    </p>
                  </div>
                  <Switch
                    checked={notifications.overdueFollowups}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, overdueFollowups: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>New Lead Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Instant notifications for new leads
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newLeads}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, newLeads: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Daily Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily summary reports
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyReports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, dailyReports: checked })
                    }
                  />
                </div>
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure system-wide settings and automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-assign New Leads</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign leads to available counselors
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.autoAssignment}
                    onCheckedChange={(checked) =>
                      setSystemSettings({ ...systemSettings, autoAssignment: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup-reminder">Follow-up Reminder (hours)</Label>
                  <Select
                    value={systemSettings.followupReminders}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, followupReminders: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="48">48 hours</SelectItem>
                      <SelectItem value="72">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-timeout">Lead Timeout (days)</Label>
                  <Select
                    value={systemSettings.leadTimeout}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, leadTimeout: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working-hours">Working Hours</Label>
                  <Input
                    id="working-hours"
                    value={systemSettings.workingHours}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, workingHours: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-institute-name" className="text-base font-semibold">Institute Name</Label>
                  <Input
                    id="custom-institute-name"
                    placeholder="Enter your institute name"
                    value={systemSettings.customInstituteName}
                    onChange={(e) =>
                      setSystemSettings({ ...systemSettings, customInstituteName: e.target.value })
                    }
                    className="text-lg"
                  />
                </div>
                <Button onClick={handleSaveSystem}>Save Configuration</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payroll">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Settings</CardTitle>
                  <CardDescription>Configure payroll calculation parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Payment Method</Label>
                      <Select defaultValue="bank">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Day</Label>
                      <Select defaultValue="25">
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment day" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({length: 28}, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Working Days per Month</Label>
                      <Input 
                        type="number" 
                        defaultValue="30" 
                        placeholder="Enter working days"
                        min="1"
                        max="31"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Rate Calculation</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue placeholder="Select calculation method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">Salary ÷ 30 days</SelectItem>
                          <SelectItem value="26">Salary ÷ 26 days</SelectItem>
                          <SelectItem value="22">Salary ÷ 22 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Allowance Settings</CardTitle>
                  <CardDescription>Configure salary allowances and benefits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>HRA Percentage</Label>
                      <Input 
                        type="number" 
                        defaultValue="0" 
                        placeholder="Enter HRA percentage"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PF Percentage</Label>
                      <Input 
                        type="number" 
                        defaultValue="0" 
                        placeholder="Enter PF percentage"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transport Allowance</Label>
                      <Input 
                        type="number" 
                        defaultValue="0" 
                        placeholder="Enter transport allowance"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Medical Allowance</Label>
                      <Input 
                        type="number" 
                        defaultValue="0" 
                        placeholder="Enter medical allowance"
                        min="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Change Password</Button>
                
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Session Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage active sessions and login history
                  </p>
                  <Button variant="outline">View Active Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="global-fees">
            <Card className="hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-opacity-90">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle>Global Class Fee Management</CardTitle>
                    <CardDescription>
                      Set and manage fee structures for different classes that can be used for calculations and automatically assigned to students
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingGlobalFee(null);
                      setGlobalFeeModalOpen(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    + Add Global Fee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <select 
                      value={academicYear} 
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="border rounded px-3 py-2 text-sm"
                    >
                      <option value="2024-25">2024-25</option>
                      <option value="2025-26">2025-26</option>
                      <option value="2026-27">2026-27</option>
                    </select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAcademicYear("2024-25")}
                    >
                      Reset Filter
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {globalClassFees
                        .filter(fee => fee.academicYear === academicYear)
                        .map((fee) => (
                          <TableRow key={fee.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{fee.className}</TableCell>
                            <TableCell className="capitalize">{fee.feeType}</TableCell>
                            <TableCell>₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{fee.frequency}</TableCell>
                            <TableCell>{fee.academicYear}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={fee.isActive ? "default" : "secondary"}
                                className={fee.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                              >
                                {fee.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingGlobalFee(fee);
                                    setGlobalFeeModalOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewTotalFees(fee.className)}
                                >
                                  View Total
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  {globalClassFees.filter(fee => fee.academicYear === academicYear).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <span className="mx-auto h-12 w-12 mb-4 opacity-50">₹</span>
                      <p>No global fees configured for {academicYear}</p>
                      <p className="text-sm">Click "Add Global Fee" to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            {/* Global Class Fee Modal */}
            <Dialog open={globalFeeModalOpen} onOpenChange={setGlobalFeeModalOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingGlobalFee ? "Edit Global Class Fee" : "Add Global Class Fee"}</DialogTitle>
                  <DialogDescription>
                    {editingGlobalFee
                      ? "Update the global fee structure for this class"
                      : "Set a global fee structure that can be used for calculations and automatically assigned to students"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGlobalClassFee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="className">Class</Label>
                      <Select name="className" required value={feeForm.className} onValueChange={v => setFeeForm(f => ({ ...f, className: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Class 1">Class 1</SelectItem>
                          <SelectItem value="Class 2">Class 2</SelectItem>
                          <SelectItem value="Class 3">Class 3</SelectItem>
                          <SelectItem value="Class 4">Class 4</SelectItem>
                          <SelectItem value="Class 5">Class 5</SelectItem>
                          <SelectItem value="Class 6">Class 6</SelectItem>
                          <SelectItem value="Class 7">Class 7</SelectItem>
                          <SelectItem value="Class 8">Class 8</SelectItem>
                          <SelectItem value="Class 9">Class 9</SelectItem>
                          <SelectItem value="Class 10">Class 10</SelectItem>
                          <SelectItem value="Class 11">Class 11</SelectItem>
                          <SelectItem value="Class 12">Class 12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="feeType">Fee Type</Label>
                      <Select name="feeType" required value={feeForm.feeType} onValueChange={v => setFeeForm(f => ({ ...f, feeType: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuition">Tuition Fee</SelectItem>
                          <SelectItem value="admission">Admission Fee</SelectItem>
                          <SelectItem value="library">Library Fee</SelectItem>
                          <SelectItem value="laboratory">Laboratory Fee</SelectItem>
                          <SelectItem value="sports">Sports Fee</SelectItem>
                          <SelectItem value="transport">Transport Fee</SelectItem>
                          <SelectItem value="examination">Examination Fee</SelectItem>
                          <SelectItem value="development">Development Fee</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input 
                        id="amount" 
                        name="amount" 
                        type="number" 
                        required 
                        placeholder="Enter amount"
                        value={feeForm.amount}
                        onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select name="frequency" required value={feeForm.frequency} onValueChange={v => setFeeForm(f => ({ ...f, frequency: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                          <SelectItem value="one-time">One Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="academicYear">Academic Year</Label>
                      <Select name="academicYear" required value={feeForm.academicYear} onValueChange={v => setFeeForm(f => ({ ...f, academicYear: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-25">2024-25</SelectItem>
                          <SelectItem value="2025-26">2025-26</SelectItem>
                          <SelectItem value="2026-27">2026-27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="isActive">Status</Label>
                      <Select name="isActive" required value={feeForm.isActive} onValueChange={v => setFeeForm(f => ({ ...f, isActive: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input 
                      id="description" 
                      name="description" 
                      placeholder="Enter description"
                      value={feeForm.description}
                      onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setGlobalFeeModalOpen(false);
                      setEditingGlobalFee(null);
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={globalClassFeeMutation.isPending}>
                      {globalClassFeeMutation.isPending 
                        ? (editingGlobalFee ? "Updating..." : "Creating...") 
                        : (editingGlobalFee ? "Update Fee" : "Create Fee")
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            {/* View Total Amount Modal (if needed) */}
            <Dialog open={viewTotalFeesModalOpen} onOpenChange={setViewTotalFeesModalOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Total Amount for {selectedClassForTotal}</DialogTitle>
                  <DialogDescription>
                    Detailed breakdown of all active fees for {selectedClassForTotal} ({academicYear})
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getClassFeeBreakdown(selectedClassForTotal, academicYear).map(fee => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.feeType}</TableCell>
                          <TableCell>₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                          <TableCell className="capitalize">{fee.frequency}</TableCell>
                          <TableCell>{fee.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="text-right font-bold text-lg">
                    Total: ₹{calculateClassTotalFees(selectedClassForTotal, academicYear).toLocaleString()}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}