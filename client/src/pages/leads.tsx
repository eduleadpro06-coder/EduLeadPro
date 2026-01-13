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
import { Plus, Filter, Phone, Mail, Calendar, Edit } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import Header from "@/components/layout/header";
import type { Lead, LeadWithCounselor } from "@shared/schema";

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
      <Header title="Lead Management" subtitle="Track and manage your prospective students" />
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-end mb-2">
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
              <SearchInput
                placeholder="Search by student name, parent name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                wrapperClassName="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-10">
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
              <div className="overflow-x-auto w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Counselor</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow-up</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 align-top">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">{lead.name}</p>
                              {isNewLead(lead.createdAt) && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{lead.class}</p>

                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <p className="text-sm text-gray-900">{lead.parentName}</p>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {lead.phone}
                            </div>
                            {lead.email && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Mail className="w-3 h-3 mr-1" />
                                <div className="truncate max-w-[120px]" title={lead.email}>
                                  {lead.email}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <Select
                            value={lead.status}
                            onValueChange={(newStatus) =>
                              updateLeadMutation.mutate({ id: lead.id, data: { status: newStatus } })
                            }
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <Badge variant="status" className={`${getStatusColor(lead.status)} cursor-pointer text-[10px] px-2 py-0.5`}>
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
                        <td className="py-3 px-4 text-sm text-gray-600">{lead.source}</td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{lead.counselor?.name || "Unassigned"}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(lead.lastContactedAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLead(lead)}
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Button>
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
