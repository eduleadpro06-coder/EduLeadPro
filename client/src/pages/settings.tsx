import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Bell, User, Database, Calculator, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreditCard, Building, MessageSquare } from "lucide-react";
import React from "react"; // Added for useEffect
import MessageTemplatesManager from "@/components/settings/message-templates-manager";
import { useOrganization } from "@/hooks/use-organization";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    role: user?.role || "",
  });

  // Update profile when user changes
  React.useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
        role: user.role || prev.role,
      }));
    }
  }, [user]);



  // --- Global Fee Management State & Logic ---
  const queryClient = useQueryClient();
  const { settings: organizationSettings, updateSettings, isLoading: isUpdatingSettings } = useOrganization();
  const [globalFeeModalOpen, setGlobalFeeModalOpen] = useState(false);
  const [editingGlobalFee, setEditingGlobalFee] = useState<GlobalClassFee | null>(null);
  const [academicYear, setAcademicYear] = useState<string>("2026-27");
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

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement profile update API endpoint
      // For now, just show success toast
      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  // Query for notification preferences
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/user/notification-preferences"],
    enabled: !!user,
  });

  // Mutation for updating notification preferences
  const notificationMutation = useMutation({
    mutationFn: async (prefs: any) => {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": user?.email || "",
        },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!response.ok) throw new Error("Failed to update preferences");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notification-preferences"] });
      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    },
  });



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />

      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your system configuration and preferences</p>
        </div>

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-gray-200/50">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>


            <TabsTrigger value="global-fees" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300">
              <Calculator className="h-4 w-4" />
              Global Fees
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white transition-all duration-300">
              <MessageSquare className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="transition-all focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold">Role</Label>
                    <Input
                      id="role"
                      value={profile.role}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
                <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300">
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="notifications" className="animate-in fade-in-50 duration-300">
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationsLoading ? (
                  <div className="text-center py-4">Loading preferences...</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Overdue Follow-ups</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about overdue follow-up tasks
                        </p>
                      </div>
                      <Switch
                        checked={notifications?.overdueFollowups ?? true}
                        onCheckedChange={(checked) =>
                          notificationMutation.mutate({ ...(notifications || {}), overdueFollowups: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">New Lead Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Instant notifications for new leads
                        </p>
                      </div>
                      <Switch
                        checked={notifications?.newLeads ?? false}
                        onCheckedChange={(checked) =>
                          notificationMutation.mutate({ ...(notifications || {}), newLeads: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Daily Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive daily summary reports
                        </p>
                      </div>
                      <Switch
                        checked={notifications?.dailyReports ?? true}
                        onCheckedChange={(checked) =>
                          notificationMutation.mutate({ ...(notifications || {}), dailyReports: checked })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">System Configuration</CardTitle>
                <CardDescription>
                  Configure system-wide settings and automation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-assign New Leads</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign leads to available counselors
                    </p>
                  </div>
                  <Switch
                    checked={organizationSettings?.autoAssignment ?? true}
                    onCheckedChange={(checked) =>
                      updateSettings({ ...organizationSettings, autoAssignment: checked })
                    }
                    disabled={isUpdatingSettings}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followup-reminder">Follow-up Reminder (hours)</Label>
                  <Select
                    value={organizationSettings?.followupReminders || "24"}
                    onValueChange={(value) =>
                      updateSettings({ ...organizationSettings, followupReminders: value })
                    }
                    disabled={isUpdatingSettings}
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
                    value={organizationSettings?.leadTimeout || "30"}
                    onValueChange={(value) =>
                      updateSettings({ ...organizationSettings, leadTimeout: value })
                    }
                    disabled={isUpdatingSettings}
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
                    value={organizationSettings?.workingHours || "9:00 AM - 6:00 PM"}
                    onChange={(e) =>
                      updateSettings({ ...organizationSettings, workingHours: e.target.value })
                    }
                    disabled={isUpdatingSettings}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Academic Year Configuration */}
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Academic Year</CardTitle>
                <CardDescription>
                  Set the current academic year for the entire system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="academic-year">Current Academic Year</Label>
                    <Select
                      value={organizationSettings?.academicYear || "2024-25"}
                      onValueChange={(value) => updateSettings({ academicYear: value })}
                      disabled={isUpdatingSettings}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-25">2024-25</SelectItem>
                        <SelectItem value="2025-26">2025-26</SelectItem>
                        <SelectItem value="2026-27">2026-27</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => updateSettings({ academicYear: organizationSettings?.academicYear || "2024-25" })}
                    disabled={isUpdatingSettings}
                    className="mt-6"
                  >
                    {isUpdatingSettings ? "Saving..." : "Save Year"}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>



          <TabsContent value="global-fees" className="animate-in fade-in-50 duration-300">
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-2xl">Global Class Fee Management</CardTitle>
                    <CardDescription>
                      Set and manage fee structures for different classes that can be used for calculations and automatically assigned to students
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingGlobalFee(null);
                      setGlobalFeeModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Add Global Fee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold">Academic Year:</Label>
                      <Select value={academicYear} onValueChange={setAcademicYear}>
                        <SelectTrigger className="w-[140px] bg-white shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-25">2024-25</SelectItem>
                          <SelectItem value="2025-26">2025-26</SelectItem>
                          <SelectItem value="2026-27">2026-27</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAcademicYear("2024-25")}
                    >
                      Reset Filter
                    </Button>
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-semibold">Class</TableHead>
                          <TableHead className="font-semibold">Fee Type</TableHead>
                          <TableHead className="font-semibold">Amount</TableHead>
                          <TableHead className="font-semibold">Frequency</TableHead>
                          <TableHead className="font-semibold">Academic Year</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {globalClassFees
                          .filter(fee => fee.academicYear === academicYear)
                          .map((fee) => (
                            <TableRow key={fee.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                              <TableCell className="font-medium">{fee.className}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize font-medium">
                                  {fee.feeType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                              <TableCell className="capitalize text-sm">{fee.frequency}</TableCell>
                              <TableCell className="text-sm font-medium">{fee.academicYear}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={fee.isActive ? "default" : "secondary"}
                                  className={fee.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"}
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
                                    className="hover:bg-blue-50 hover:border-blue-300 transition-all"
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewTotalFees(fee.className)}
                                    className="hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                                  >
                                    <Calculator className="h-3.5 w-3.5 mr-1" />
                                    View Total
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  {globalClassFees.filter(fee => fee.academicYear === academicYear).length === 0 && (
                    <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                      <Calculator className="mx-auto h-16 w-16 text-blue-300 mb-4" />
                      <p className="text-lg font-semibold text-gray-700">No global fees configured for {academicYear}</p>
                      <p className="text-sm text-gray-500 mt-2">Click "Add Global Fee" to get started</p>
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
                          <SelectItem value="Playgroup">Playgroup</SelectItem>
                          <SelectItem value="Nursery">Nursery</SelectItem>
                          <SelectItem value="Junior KG">Junior KG</SelectItem>
                          <SelectItem value="Senior KG">Senior KG</SelectItem>
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

          <TabsContent value="templates">
            <MessageTemplatesManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}