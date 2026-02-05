import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  Plus,
  UserPlus,
  Search,
  Filter,
  MessageSquare,
  //Calendar,
  Settings,
  BarChart3,
  Database,
  Upload,
  Download,
  //BookOpen, // for Class/Stream
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ListFilter,
  Globe
} from "lucide-react";
import AddLeadModal from "@/components/leads/add-lead-modal";
import LeadDetailModal from "@/components/leads/lead-detail-modal";
import LeadStatusBadge from "@/components/leads/lead-status-badge";
import CSVImport from "@/components/leads/csv-import";
import CampaignManager from "@/components/campaigns/campaign-manager";
import ERPConnector from "@/components/erp-integration/erp-connector";
import { type LeadWithCounselor } from "@shared/schema";
import Header from "@/components/layout/header";
import { Textarea } from "@/components/ui/textarea";
import { useQueryState } from "@/hooks/use-query-state";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SidebarPageHeader from "@/components/layout/sidebar-page-header";

// WhatsApp SVG Icon (Font Awesome style)
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
    <path fill="#47d777" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

export default function LeadManagement() {
  const [activeTab, setActiveTab] = useQueryState("tab", "leads");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const [selectedLead, setSelectedLead] = useState<LeadWithCounselor | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [sortKey, setSortKey] = useState<string>("default");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { toast } = useToast();
  const queryClient = useQueryClient();



  const { data, isLoading } = useQuery<LeadWithCounselor[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      // Get user from localStorage
      const userStr = localStorage.getItem('auth_user');
      if (!userStr) {
        console.error('No authenticated user found');
        toast({
          title: "Authentication Error",
          description: "No authenticated user found. Please log in.",
          variant: "destructive",
        });
        throw new Error("No authenticated user found");
      }

      const user = JSON.parse(userStr);

      const response = await fetch("/api/leads", {
        headers: {
          'x-user-name': user.email // Send username for auth
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch leads:", errorData.message || response.statusText);
        toast({
          title: "Error",
          description: errorData.message || "Failed to load leads",
          variant: "destructive",
        });
        throw new Error(errorData.message || "Failed to fetch leads");
      }
      return response.json();
    },
  });
  const [leadsState, setLeadsState] = useState<LeadWithCounselor[]>([]);



  useEffect(() => {
    if (Array.isArray(data)) {
      setLeadsState(data);
    }
  }, [data]);

  // Filter out deleted leads for main view
  const activeLeads = leadsState.filter(lead => lead.status !== "deleted");

  const filteredLeads = activeLeads.filter(lead => {
    // Search filter
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = search === "" ||
      (/^[a-z]$/i.test(search) ? lead.name.toLowerCase().startsWith(search) :
        /^\d+$/.test(search) ? lead.phone.includes(search) :
          search.includes("@") ? (lead.email && lead.email.toLowerCase().includes(search)) :
            lead.name.toLowerCase().startsWith(search));

    // Status filter
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    // Source filter
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  let sortedLeads = [...filteredLeads];
  sortedLeads.sort((a, b) => {
    let aValue, bValue;
    if (sortKey === "default") {
      const aEnrolled = a.status === 'enrolled';
      const bEnrolled = b.status === 'enrolled';

      if (aEnrolled && !bEnrolled) return 1;
      if (!aEnrolled && bEnrolled) return -1;

      // Secondary sort by ID descending (newest first)
      return b.id - a.id;
    } else if (sortKey === "student") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortKey === "lastContact") {
      aValue = a.lastContactedAt || "";
      bValue = b.lastContactedAt || "";
    } else if (sortKey === "class") {
      aValue = a.class || "";
      bValue = b.class || "";
    } else if (sortKey === "status") {
      aValue = a.status || "";
      bValue = b.status || "";
    } else if (sortKey === "source") {
      aValue = a.source || "";
      bValue = b.source || "";
    } else {
      return 0;
    }
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Add state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 9;
  const totalPages = Math.ceil(sortedLeads.length / leadsPerPage);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  // Add useEffect to reset currentPage when searchTerm, statusFilter, or sourceFilter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter]);

  // Track if a lead was deleted
  const [leadDeleted, setLeadDeleted] = useState(false);

  const openLeadDetail = (lead: LeadWithCounselor) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleLeadUpdated = (updatedLead: LeadWithCounselor) => {
    setSelectedLead(updatedLead);
    // Update the lead in the local state as well
    setLeadsState(prev => prev.map(lead =>
      lead.id === updatedLead.id ? updatedLead : lead
    ));
  };

  const handleDetailModalClose = (open: boolean) => {
    setIsDetailModalOpen(open);
    if (!open) {
      setSelectedLead(null);
      if (leadDeleted) {
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
        setLeadDeleted(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-purple-100 text-purple-800";
      case "interested": return "bg-yellow-100 text-yellow-800";
      case "ready_for_admission": return "bg-teal-100 text-teal-800";
      case "future_intake": return "bg-sky-100 text-sky-800";
      case "enrolled": return "bg-green-100 text-green-800";
      case "dropped": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Not contacted";
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const exportLeads = () => {
    if (!leadsState || leadsState.length === 0) return;

    const csvHeaders = [
      "Name", "Email", "Phone", "Class", "Stream", "Status", "Source",
      "Counselor", "Parent Name", "Parent Phone", "Address", "Last Contacted", "Notes"
    ];

    const csvData = leadsState.map(lead => [
      lead.name,
      lead.email || "",
      lead.phone,
      lead.class,
      lead.stream || "",
      lead.status,
      lead.source,
      lead.counselor?.name || "",
      lead.parentName || "",
      lead.parentPhone || "",
      lead.address || "",
      lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : "",
      lead.notes || ""
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappLead, setWhatsappLead] = useState<LeadWithCounselor | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Fetch message templates from database
  const { data: messageTemplates = [] } = useQuery<any[]>({
    queryKey: ["/api/message-templates", { category: "whatsapp" }],
    queryFn: async () => {
      const response = await fetch("/api/message-templates?category=whatsapp");
      return response.json();
    },
  });

  // Financial Data State
  const [financialData, setFinancialData] = useState({
    amount: "0", // This will now be the NEXT EMI amount
    totalPending: "0",
    dueDate: "",
    breakdown: ""
  });

  // Fetch financial data when lead is selected for WhatsApp
  useEffect(() => {
    if (whatsappLead && whatsappLead.status === 'enrolled') {
      const fetchFinancials = async () => {
        try {
          // 1. Get EMI plans for the student
          const plansRes = await fetch(`/api/emi-plans?studentId=${whatsappLead.id}`);
          const plans = await plansRes.json();

          if (plans && plans.length > 0) {
            // 2. Get pending EMIs for the first active plan
            const activePlan = plans.find((p: any) => p.status === 'active') || plans[0];
            const pendingRes = await fetch(`/api/emi-plans/${activePlan.id}/pending-emis`);
            const pendingEmis = await pendingRes.json();

            if (pendingEmis && pendingEmis.length > 0) {
              // Sort by due date
              const sortedEmis = pendingEmis.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

              // Next EMI is the earliest one
              const nextEmi = sortedEmis[0];
              const totalPending = sortedEmis.reduce((sum: number, emi: any) => sum + Number(emi.amount), 0);

              // Generate Breakdown String
              // Example: "EMI 1 (Due: 12/01/25): ₹5000\nEMI 2 (Due: 12/02/25): ₹5000"
              const breakdown = sortedEmis.map((emi: any) =>
                `Inst ${emi.installmentNumber} (Due: ${new Date(emi.dueDate).toLocaleDateString('en-IN')}): ₹${emi.amount}`
              ).join('\n');

              setFinancialData({
                amount: nextEmi.amount, // ONLY the next installment amount
                totalPending: totalPending.toString(),
                dueDate: new Date(nextEmi.dueDate).toLocaleDateString('en-IN'),
                breakdown: breakdown
              });
            } else {
              setFinancialData({ amount: "0", totalPending: "0", dueDate: new Date().toLocaleDateString('en-IN'), breakdown: "No pending dues" });
            }
          } else {
            setFinancialData({ amount: "0", totalPending: "0", dueDate: new Date().toLocaleDateString('en-IN'), breakdown: "No active plan" });
          }
        } catch (err) {
          console.error("Error fetching financial data:", err);
          setFinancialData({ amount: "0", totalPending: "0", dueDate: new Date().toLocaleDateString('en-IN'), breakdown: "Error fetching data" });
        }
      };
      fetchFinancials();
    } else {
      // Reset for non-enrolled leads
      setFinancialData({ amount: "0", totalPending: "0", dueDate: new Date().toLocaleDateString('en-IN'), breakdown: "" });
    }
  }, [whatsappLead]);

  // Update message when financial data changes (if template is selected)
  useEffect(() => {
    if (selectedTemplate && whatsappLead) {
      const selectedTpl = messageTemplates.find(t => t.name === selectedTemplate);
      if (selectedTpl) {
        setWhatsappMessage(replaceTemplateVariables(selectedTpl.content, whatsappLead));
      }
    }
  }, [financialData]);

  // Function to replace template variables with actual lead data
  const replaceTemplateVariables = (template: string, lead: LeadWithCounselor) => {
    const instituteName = localStorage.getItem("customInstituteName") || "EduConnect";
    const today = new Date().toLocaleDateString('en-IN');

    let text = template;

    // Replace standard double brace variables {{variable}}
    text = text.replace(/\{\{name\}\}/g, lead.name || "")
      .replace(/\{\{studentName\}\}/g, lead.name || "")
      .replace(/\{\{class\}\}/g, lead.class || "")
      .replace(/\{\{instituteName\}\}/g, instituteName)
      .replace(/\{\{phone\}\}/g, lead.phone || "")
      .replace(/\{\{email\}\}/g, lead.email || "")
      .replace(/\{\{parentName\}\}/g, lead.parentName || "Parent")
      .replace(/\{\{date\}\}/g, today)
      .replace(/\{\{dueDate\}\}/g, financialData.dueDate || today)
      .replace(/\{\{amount\}\}/g, financialData.amount) // Shows Next EMI Amount
      .replace(/\{\{total_pending\}\}/g, financialData.totalPending) // New: Shows Total
      .replace(/\{\{fee_breakdown\}\}/g, financialData.breakdown) // New: Shows List
      .replace(/\{\{startDate\}\}/g, today);

    return text;
  };

  const handleLeadDeleted = (deletedId: number) => {
    setLeadsState(prev => {
      const updated = prev.filter(lead => lead.id !== deletedId);
      // If the current page is now empty and not the first page, fallback to page 1
      const totalAfterDelete = updated.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm) ||
          (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
        return matchesSearch && matchesStatus && matchesSource;
      }).length;
      const totalPagesAfterDelete = Math.ceil(totalAfterDelete / leadsPerPage);
      if (currentPage > totalPagesAfterDelete && currentPage > 1) {
        setCurrentPage(1);
      }
      return updated;
    });
    setIsDetailModalOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="min-h-screen app-bg-gradient">
      <Header
        title="Lead Management"
        subtitle="Manage and track your leads"
      />
      <SidebarPageHeader
        searchPlaceholder="Search leads by name, phone, or email..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                <div className="flex items-center gap-2 truncate">
                  <ListFilter className="h-4 w-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="ready_for_admission">Ready for Admission</SelectItem>
                <SelectItem value="future_intake">Future Intake</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40 bg-white border-gray-200 text-gray-700 shadow-sm hover:border-[#643ae5] transition-colors focus:ring-[#643ae5]/20 h-10">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                  <SelectValue placeholder="All Sources" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="google_ads">Google Ads</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="walk_in">Walk-in</SelectItem>
                <SelectItem value="csv_import">CSV Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        primaryActions={
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#643ae5] hover:bg-[#552dbf] text-white shadow-sm h-10 px-4 rounded-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Lead</span>
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
              onClick={exportLeads}
            >
              <Upload className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        }
      />
      <div className="px-2 sm:px-4 lg:px-6 pb-6">
        <div className="border rounded-xl overflow-hidden shadow-lg mt-4">
          <div className="overflow-x-auto">
            <table className="w-full glass-card rounded-lg border bg-card text-gray-800 shadow-lg">
              <thead className="bg-background">
                <tr>
                  <th
                    onClick={() => {
                      setSortKey("student");
                      setSortOrder(sortKey === "student" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-4 py-3 text-left table-header tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      Student Details
                      {sortKey === "student" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left table-header tracking-wider">
                    Contact Info
                  </th>
                  <th
                    onClick={() => {
                      setSortKey("class");
                      setSortOrder(sortKey === "class" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-6 py-3 text-left table-header tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      Class/Stream
                      {sortKey === "class" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : null}
                    </span>
                  </th>
                  <th
                    onClick={() => {
                      setSortKey("status");
                      setSortOrder(sortKey === "status" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      Status
                      {sortKey === "status" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : null}
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left table-header tracking-wider cursor-pointer">
                    <span className="flex items-center gap-1">
                      Source
                      {sortKey === "source" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : null}
                    </span>
                  </th>
                  <th
                    onClick={() => {
                      setSortKey("lastContact");
                      setSortOrder(sortKey === "lastContact" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="px-6 py-3 text-left table-header tracking-wider cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      Last Contacted
                      {sortKey === "lastContact" ? (
                        sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : null}
                    </span>
                  </th>

                  <th className="px-6 py-3 text-left table-header tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-800">
                      Loading leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-800">
                      No leads found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-primary/10 cursor-pointer transition-colors text-gray-800">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-800">
                                {lead.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-800">{lead.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-800">{lead.phone}</div>
                        <div className="text-sm text-gray-800/70">{lead.email || "No email"}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {lead.class} {lead.stream}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {lead.source.charAt(0).toUpperCase() + lead.source.slice(1).replace('_', ' ')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800/70">
                        {formatDate(lead.lastContactedAt)}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openLeadDetail(lead)}
                            className="text-gray-800"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-800"
                            onClick={e => {
                              e.stopPropagation();
                              setWhatsappLead(lead);
                              // Set first template as default if templates are loaded
                              if (messageTemplates.length > 0) {
                                setSelectedTemplate(messageTemplates[0].name);
                                setWhatsappMessage(replaceTemplateVariables(messageTemplates[0].content, lead));
                              } else {
                                setSelectedTemplate("");
                                setWhatsappMessage("");
                              }
                              setWhatsappDialogOpen(true);
                            }}
                          >
                            <WhatsAppIcon className="w-8 h-8" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div> {/* <-- This closes the .overflow-x-auto div */}

          {/* Compact Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-white">
              <div className="text-sm text-gray-600">
                {((currentPage - 1) * leadsPerPage) + 1}-{Math.min(currentPage * leadsPerPage, sortedLeads.length)} of {sortedLeads.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3"
                >
                  Previous
                </Button>
                <Select value={currentPage.toString()} onValueChange={(value) => setCurrentPage(Number(value))}>
                  <SelectTrigger className="h-8 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <SelectItem key={page} value={page.toString()}>
                        {page}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div> {/* <-- This closes the .border rounded-xl ... div */}
      </div>

      {/* Modals */}
      <AddLeadModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      <LeadDetailModal
        lead={selectedLead}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        onLeadDeleted={() => selectedLead && handleLeadDeleted(selectedLead.id)}
        onLeadUpdated={handleLeadUpdated}
      />

      <Dialog open={isCSVImportOpen} onOpenChange={setIsCSVImportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <CSVImport
            onSuccess={() => setIsCSVImportOpen(false)}
            onClose={() => setIsCSVImportOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
          </DialogHeader>
          {whatsappLead && (
            <div className="space-y-4">
              <div>
                <span className="font-semibold">To:</span> {whatsappLead.name} ({whatsappLead.phone})
              </div>

              {/* Template Selector */}
              <div>
                <span className="font-semibold block mb-2">Select Template:</span>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    setSelectedTemplate(value);
                    const selectedTpl = messageTemplates.find(t => t.name === value);
                    if (selectedTpl) {
                      setWhatsappMessage(replaceTemplateVariables(selectedTpl.content, whatsappLead));
                    } else {
                      setWhatsappMessage("");
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a message template" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.name}>
                        {template.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="font-semibold">Message:</span>
                <Textarea
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                  rows={5}
                  className="mt-2"
                  placeholder="Type your custom message or select a template above..."
                />
              </div>
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                onClick={() => {
                  window.open(`https://wa.me/${whatsappLead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                  setWhatsappDialogOpen(false);
                }}
              >
                Open in WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
}