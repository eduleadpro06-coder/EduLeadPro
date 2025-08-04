import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeadStatusBadge from "@/components/leads/lead-status-badge";
import { type LeadWithCounselor } from "@shared/schema";

export default function RecentLeadsTable() {
  const [, setLocation] = useLocation();
  const { data: leads, isLoading } = useQuery<LeadWithCounselor[]>({
    queryKey: ["/api/dashboard/leads"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/leads");
      if (!response.ok) {
        throw new Error("Failed to fetch recent leads");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-pink-100 text-pink-600', 
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600'
    ];
    return colors[name.length % colors.length];
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not scheduled";
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const isNewLead = (createdAt: Date | string) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  // Sort leads by creation date (newest first)
  const sortedLeads = leads?.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  }) || [];

  return (
    <Card className="h-full min-h-[500px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-600 hover:text-primary-700"
            onClick={() => setLocation("/leads")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counselor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Follow-up
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getInitialsColor(lead.name)}`}>
                        <span className="font-medium text-sm">{getInitials(lead.name)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                          {isNewLead(lead.createdAt) && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{lead.class} {lead.stream}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <LeadStatusBadge status={lead.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                    {lead.source.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {lead.counselor?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {lead.lastContactedAt ? (
                      <span className="font-medium text-gray-600">
                        {formatDate(lead.lastContactedAt)}
                      </span>
                    ) : (
                      <span className="text-gray-500">No contact</span>
                    )}
                  </td>
                </tr>
              )) || []}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

