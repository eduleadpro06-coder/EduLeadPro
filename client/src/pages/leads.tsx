import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/forms/lead-form";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter, Phone, Mail, Calendar, Brain } from "lucide-react";
import type { Lead, LeadWithCounselor } from "@shared/schema";

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  
  const { data: leads = [] } = useQuery<LeadWithCounselor[]>({
    queryKey: ['/api/leads'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/leads");
      return response.json();
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Lead> }) => {
      const response = await apiRequest("PATCH", `/api/leads/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ title: "Lead updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update lead", variant: "destructive" });
    },
  });

  const predictAdmissionMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await apiRequest("POST", `/api/leads/${leadId}/predict`, {});
      return response.json();
    },
    onSuccess: (data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      toast({ 
        title: "🎯 AI Prediction Complete", 
        description: `Likelihood: ${data.likelihood}% | Confidence: ${(data.confidence * 100).toFixed(0)}% | Key factors: ${data.factors.slice(0, 2).join(', ')}`,
        duration: 6000
      });
    },
    onError: () => {
      toast({ title: "Failed to predict admission likelihood", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (leads && Array.isArray(leads)) {
      leads.forEach(lead => {
        if (lead.status !== 'enrolled' && !lead.admissionLikelihood) {
          predictAdmissionMutation.mutate(lead.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads]);

  // Filter leads based on search and filters
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (lead.parentName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    
    return matchesSearch && matchesStatus && matchesSource;
  }).sort((a, b) => {
    // Sort by creation date (newest first)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  const uniqueStatuses = Array.from(new Set(leads.map(lead => lead.status)));
  const uniqueSources = Array.from(new Set(leads.map(lead => lead.source)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "default";
      case "contacted": return "secondary";
      case "interested": return "secondary";
      case "enrolled": return "default";
      case "dropped": return "destructive";
      default: return "outline";
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const isNewLead = (createdAt: Date | string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  return (
    <>
      <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-2">Track and manage your prospective students</p>
        </div>
        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6">
              <Plus className="w-4 h-4 mr-2" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-6">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
            </DialogHeader>
            <LeadForm onSuccess={() => setIsAddLeadOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by student name, parent name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-48 h-11">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {uniqueSources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-4">No leads found matching your criteria</p>
              <Button onClick={() => setIsAddLeadOpen(true)} className="h-11 px-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Student</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Parent</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Contact</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Source</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Counselor</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Follow-up</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6 align-top">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{lead.name}</p>
                            {isNewLead(lead.createdAt) && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{lead.class}</p>
                          {lead.status === 'enrolled' ? (
                            <span className="text-xs italic text-gray-400">N/A</span>
                          ) : (
                            <>
                              {lead.admissionLikelihood ? (
                                <div className="flex items-center mt-1">
                                  <Brain className="w-3 h-3 text-purple-500 mr-1" />
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    parseFloat(lead.admissionLikelihood) >= 70 ? 'bg-green-100 text-green-700' :
                                    parseFloat(lead.admissionLikelihood) >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {parseFloat(lead.admissionLikelihood).toFixed(0)}% likely
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Predicting...</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <p className="text-gray-900">{lead.parentName}</p>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-3 h-3 mr-1" />
                              {lead.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus) => 
                            updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } })
                          }
                        >
                          <SelectTrigger className="w-32 h-9">
                            <Badge variant="status" className={`${getStatusColor(lead.status)} cursor-pointer`}>
                              {lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="interested">Interested</SelectItem>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="dropped">Dropped</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{lead.source}</td>
                      <td className="py-4 px-4">
                        <p className="text-gray-900">{lead.counselor?.name || "Unassigned"}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(lead.lastContactedAt)}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-top">
                        {lead.status === 'enrolled' ? (
                          <span className="text-xs italic text-gray-400">N/A</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => predictAdmissionMutation.mutate(lead.id)}
                            disabled={predictAdmissionMutation.isPending}
                            className="h-9"
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            {predictAdmissionMutation.isPending ? "Predicting..." : "AI Predict"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
