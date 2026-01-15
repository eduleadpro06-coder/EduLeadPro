import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings as SettingsIcon, Bell, Database, Calculator, Edit } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";

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

  // Organization profile state
  const [orgProfile, setOrgProfile] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    email: "",
    latitude: "",
    longitude: "",
  });

  // Fetch organization data
  const { data: organizationData, isLoading: isLoadingOrg } = useQuery<{ needsOnboarding: boolean, organization: any }>({
    queryKey: [`/api/organizations/${user?.organizationId}/needs-onboarding`],
    enabled: !!user?.organizationId,
  });

  // Update orgProfile when organization data is fetched
  React.useEffect(() => {
    if (organizationData?.organization) {
      const org = organizationData.organization;
      setOrgProfile({
        name: org.name || "",
        phone: org.phone || "",
        address: org.address || "",
        city: org.city || "",
        state: org.state || "",
        pincode: org.pincode || "",
        email: org.email || "",
        latitude: org.settings?.location?.latitude || "",
        longitude: org.settings?.location?.longitude || "",
      });
    }
  }, [organizationData]);



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
      const response = await apiRequest(method, url, data);
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
    return window.location.hash.slice(1) || "organization"; // Default to organization
  });

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    window.location.hash = value;
  };

  // Organization profile mutation
  const orgProfileMutation = useMutation({
    mutationFn: async (data: typeof orgProfile) => {
      if (!user?.organizationId) throw new Error("No organization ID");
      const response = await apiRequest("PATCH", `/api/organizations/${user.organizationId}/contact-info`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${user?.organizationId}/needs-onboarding`] });
      toast({
        title: "Organization updated",
        description: "Organization profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveOrgProfile = async () => {
    orgProfileMutation.mutate(orgProfile);
  };



  interface NotificationPreferences {
    overdueFollowups: boolean;
    newLeads: boolean;
    dailyReports: boolean;
  }

  // Query for notification preferences
  const { data: notifications, isLoading: notificationsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/user/notification-preferences"],
    enabled: !!user,
  });

  // Mutation for updating notification preferences
  const notificationMutation = useMutation({
    mutationFn: async (prefs: any) => {
      const response = await apiRequest("PATCH", "/api/user/notification-preferences", { preferences: prefs });
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
      <Header title="Settings" subtitle="Manage your system configuration and preferences" />

      <main className="w-full px-6 py-6 space-y-6">

        <div className="flex gap-2 -mb-px w-full border-b">
          <Button
            variant={selectedTab === "organization" ? "default" : "ghost"}
            onClick={() => handleTabChange("organization")}
            className="rounded-b-none flex-1"
          >
            <Building className="mr-2 h-4 w-4" />
            Organization
          </Button>
          <Button
            variant={selectedTab === "notifications" ? "default" : "ghost"}
            onClick={() => handleTabChange("notifications")}
            className="rounded-b-none flex-1"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button
            variant={selectedTab === "system" ? "default" : "ghost"}
            onClick={() => handleTabChange("system")}
            className="rounded-b-none flex-1"
          >
            <Database className="mr-2 h-4 w-4" />
            System
          </Button>
          <Button
            variant={selectedTab === "global-fees" ? "default" : "ghost"}
            onClick={() => handleTabChange("global-fees")}
            className="rounded-b-none flex-1"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Global Fees
          </Button>
          {/* <Button
            variant={selectedTab === "templates" ? "default" : "ghost"}
            onClick={() => handleTabChange("templates")}
            className="rounded-b-none flex-1"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Templates
          </Button> */}
        </div>



        {selectedTab === "organization" && (
          <div className="animate-in fade-in-50 duration-300">
            <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-h3">Organization Profile</CardTitle>
                <CardDescription>
                  Manage your organization's contact information used in invoices and official documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingOrg ? (
                  <div className="text-center py-4">Loading organization data...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="org-name" className="text-sm font-semibold">Organization Name</Label>
                        <Input
                          id="org-name"
                          value={orgProfile.name}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-muted-foreground">Contact support to change your organization name</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-phone" className="text-sm font-semibold">Phone Number *</Label>
                        <Input
                          id="org-phone"
                          value={orgProfile.phone}
                          onChange={(e) => setOrgProfile({ ...orgProfile, phone: e.target.value })}
                          placeholder="Enter 10-digit phone number"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-email" className="text-sm font-semibold">Support Email</Label>
                        <Input
                          id="org-email"
                          type="email"
                          value={orgProfile.email}
                          onChange={(e) => setOrgProfile({ ...orgProfile, email: e.target.value })}
                          placeholder="Enter support email address"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-muted-foreground">This email will be visible to parents on the support screen</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="org-address" className="text-sm font-semibold">Address *</Label>
                        <Textarea
                          id="org-address"
                          value={orgProfile.address}
                          onChange={(e) => setOrgProfile({ ...orgProfile, address: e.target.value })}
                          placeholder="Enter street address"
                          rows={2}
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="org-latitude" className="text-sm font-semibold">Latitude</Label>
                        <Input
                          id="org-latitude"
                          value={orgProfile.latitude}
                          onChange={(e) => setOrgProfile({ ...orgProfile, latitude: e.target.value })}
                          placeholder="e.g. 18.5204"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-longitude" className="text-sm font-semibold">Longitude</Label>
                        <Input
                          id="org-longitude"
                          value={orgProfile.longitude}
                          onChange={(e) => setOrgProfile({ ...orgProfile, longitude: e.target.value })}
                          placeholder="e.g. 73.8567"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="org-city" className="text-sm font-semibold">City</Label>
                        <Input
                          id="org-city"
                          value={orgProfile.city}
                          onChange={(e) => setOrgProfile({ ...orgProfile, city: e.target.value })}
                          placeholder="Enter city"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-state" className="text-sm font-semibold">State</Label>
                        <Input
                          id="org-state"
                          value={orgProfile.state}
                          onChange={(e) => setOrgProfile({ ...orgProfile, state: e.target.value })}
                          placeholder="Enter state"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="org-pincode" className="text-sm font-semibold">PIN Code</Label>
                        <Input
                          id="org-pincode"
                          value={orgProfile.pincode}
                          onChange={(e) => setOrgProfile({ ...orgProfile, pincode: e.target.value })}
                          placeholder="Enter PIN code"
                          className="transition-all focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This information will be displayed on invoices, receipts, and other official documents.
                      </p>
                    </div>
                    <Button
                      onClick={handleSaveOrgProfile}
                      disabled={orgProfileMutation.isPending}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                    >
                      {orgProfileMutation.isPending ? "Saving..." : "Save Organization Profile"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )
        }

        {
          selectedTab === "notifications" && (
            <div className="animate-in fade-in-50 duration-300">
              <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-h3">Notification Preferences</CardTitle>
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
            </div>
          )
        }

        {
          selectedTab === "system" && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-h3">System Configuration</CardTitle>
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
                  <CardTitle className="text-h3">Academic Year</CardTitle>
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
            </div>
          )
        }

        {
          selectedTab === "global-fees" && (
            <div className="animate-in fade-in-50 duration-300">
              <Card className="bg-white/70 backdrop-blur-md shadow-xl border-gray-200/50 hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-h3">Global Class Fee Management</CardTitle>
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
                            <TableHead className="table-header font-semibold">Class</TableHead>
                            <TableHead className="table-header font-semibold">Fee Type</TableHead>
                            <TableHead className="table-header font-semibold">Amount</TableHead>
                            <TableHead className="table-header font-semibold">Frequency</TableHead>
                            <TableHead className="table-header font-semibold">Academic Year</TableHead>
                            <TableHead className="table-header font-semibold">Status</TableHead>
                            <TableHead className="table-header font-semibold">Actions</TableHead>
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
                            <TableCell className="capitalize">{fee.feeType}</TableCell>
                            <TableCell>₹{parseFloat(fee.amount).toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{fee.frequency}</TableCell>
                            <TableCell>{fee.description || "-"}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted font-semibold">
                          <TableCell>Total</TableCell>
                          <TableCell>₹{calculateClassTotalFees(selectedClassForTotal, academicYear).toLocaleString()}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )
        }

        {/* {selectedTab === "templates" && (
          <div className="animate-in fade-in-50 duration-300">
            <MessageTemplatesManager />
          </div>
        )} */}

      </main >
    </div >
  );
}