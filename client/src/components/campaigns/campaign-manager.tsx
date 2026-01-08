import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Mail,
  Send,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Filter
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type LeadWithCounselor } from "@shared/schema";

interface Campaign {
  id: string;
  name: string;
  type: "whatsapp" | "email" | "sms";
  status: "draft" | "scheduled" | "active" | "completed" | "paused";
  targetAudience: string[];
  content: {
    subject?: string;
    message: string;
    template?: string;
  };
  scheduledAt?: Date;
  createdAt: Date;
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    responded: number;
  };
}

export default function CampaignManager() {
  const [activeTab, setActiveTab] = useState("whatsapp");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "whatsapp" as "whatsapp" | "email" | "sms",
    targetAudience: [] as string[],
    content: {
      subject: "",
      message: "",
      template: ""
    },
    scheduledAt: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leads } = useQuery<LeadWithCounselor[]>({
    queryKey: ["/api/leads"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await apiRequest("POST", "/api/campaigns", campaignData);
      return response.json();
    },
    onSuccess: (data) => {
      setCampaigns(prev => [data, ...prev]);
      setNewCampaign({
        name: "",
        type: "whatsapp",
        targetAudience: [],
        content: { subject: "", message: "", template: "" },
        scheduledAt: ""
      });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully",
      });
    }
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, type }: { campaignId: string; type: string }) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/send`, { type });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campaign Sent",
        description: "Your campaign has been sent successfully",
      });
    }
  });

  const getTargetableLeads = () => {
    if (!leads) return [];

    return leads.filter(lead => {
      if (activeTab === "whatsapp") {
        return lead.phone && (lead.status === "new" || lead.status === "contacted" || lead.status === "interested");
      } else if (activeTab === "email") {
        return lead.email && (lead.status === "new" || lead.status === "contacted" || lead.status === "interested");
      }
      return lead.phone && (lead.status === "new" || lead.status === "contacted" || lead.status === "interested");
    });
  };

  const createCampaign = () => {
    // Get custom institute name from system settings
    const customInstituteName = localStorage.getItem("customInstituteName") || "EduConnect";

    // Replace institute name in message
    const message = newCampaign.content.message.replace(/{{instituteName}}/g, customInstituteName);

    createCampaignMutation.mutate({
      ...newCampaign,
      content: {
        ...newCampaign.content,
        message
      }
    });
  };

  const sendCampaign = (campaignId: string, type: string) => {
    sendCampaignMutation.mutate({ campaignId, type });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "paused": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp": return <MessageSquare size={16} className="text-green-600" />;
      case "email": return <Mail size={16} className="text-blue-600" />;
      case "sms": return <MessageSquare size={16} className="text-purple-600" />;
      default: return <MessageSquare size={16} />;
    }
  };

  const whatsappTemplates = [
    {
      name: "Welcome Message",
      content: "Welcome to {{instituteName}}! We're excited to have you join our community. Your admission process has been initiated. Our counselor will contact you shortly."
    },
    {
      name: "Follow-up Reminder",
      content: "Hi {{name}}! This is a friendly reminder from {{instituteName}} about your pending admission process. Please complete the required documentation at your earliest convenience."
    },
    {
      name: "Enrollment Reminder",
      content: "Hi {{name}}! This is {{instituteName}} reminding you that the enrollment deadline is approaching fast. Don't miss out on securing your seat for {{class}}. Contact us today to complete your admission process!"
    },
    {
      name: "Fee Payment Reminder",
      content: "Dear {{parentName}}, This is {{instituteName}} reminding you about the pending fee payment for {{name}}'s {{class}}. Please complete the payment at your earliest convenience to avoid any late fees."
    },
    {
      name: "Admission Confirmation",
      content: "Congratulations! {{instituteName}} is pleased to confirm {{name}}'s admission to {{class}}. Please complete the remaining formalities within 48 hours to secure the seat."
    },
    {
      name: "Document Verification",
      content: "Dear {{parentName}}, {{instituteName}} requires the following documents for {{name}}'s admission process: 1. Birth Certificate 2. Previous School Records 3. Address Proof. Please submit these at your earliest convenience."
    }
  ];

  const emailTemplates = [
    {
      subject: "Welcome to [School Name] - Next Steps",
      content: "Dear {{parentName}},\n\nThank you for considering our school for {{name}}'s education. We have received your inquiry for {{class}} admission.\n\nNext steps:\n1. Document verification\n2. Entrance test (if applicable)\n3. Interview with admissions team\n\nOur counselor {{counselor}} will contact you within 24 hours.\n\nBest regards,\nAdmissions Team"
    },
    {
      subject: "Admission Status Update - Action Required",
      content: "Dear {{parentName}},\n\nWe hope this email finds you well. This is a gentle reminder about {{name}}'s admission application for {{class}}.\n\nPending items:\n- Application form completion\n- Document submission\n- Fee payment\n\nPlease complete these at your earliest convenience to secure the admission.\n\nFor assistance, contact {{counselor}} at {{counselorPhone}}.\n\nThank you!"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full justify-center gap-2 bg-transparent">
              <TabsTrigger value="whatsapp" className="flex items-center gap-2 text-white data-[state=active]:bg-[#643ae5] data-[state=active]:text-white rounded-lg px-6 py-2 font-semibold transition-all">
                <MessageSquare size={16} />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2 text-white data-[state=active]:bg-[#643ae5] data-[state=active]:text-white rounded-lg px-6 py-2 font-semibold transition-all">
                <Mail size={16} />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2 text-white data-[state=active]:bg-[#643ae5] data-[state=active]:text-white rounded-lg px-6 py-2 font-semibold transition-all">
                <MessageSquare size={16} />
                SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Create WhatsApp Campaign</h3>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Campaign Name
                    </label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter campaign name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Template
                    </label>
                    <Select
                      value={newCampaign.content.template}
                      onValueChange={(value) => {
                        const template = whatsappTemplates.find(t => t.name === value);
                        setNewCampaign(prev => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            template: value,
                            message: template?.content || ""
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappTemplates.map((template) => (
                          <SelectItem key={template.name} value={template.name}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Message
                    </label>
                    <Textarea
                      value={newCampaign.content.message}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        content: { ...prev.content, message: e.target.value }
                      }))}
                      placeholder="Type your WhatsApp message..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-300 mt-1">
                      Use variables like name, class, counselor for personalization
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Target Audience ({getTargetableLeads().length} leads)
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newLeads = getTargetableLeads().filter(lead => lead.status === "new");
                            setNewCampaign(prev => ({
                              ...prev,
                              targetAudience: [...prev.targetAudience, ...newLeads.map(l => l.id.toString())].filter((value, index, self) => self.indexOf(value) === index)
                            }));
                          }}
                        >
                          New Leads ({getTargetableLeads().filter(l => l.status === "new").length})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const interestedLeads = getTargetableLeads().filter(lead => lead.status === "interested");
                            setNewCampaign(prev => ({
                              ...prev,
                              targetAudience: [...prev.targetAudience, ...interestedLeads.map(l => l.id.toString())].filter((value, index, self) => self.indexOf(value) === index)
                            }));
                          }}
                        >
                          Interested ({getTargetableLeads().filter(l => l.status === "interested").length})
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Selected: {newCampaign.targetAudience.length} leads
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createCampaign} disabled={createCampaignMutation.isPending}>
                      <Send size={16} className="mr-2" />
                      {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-4">Preview</h3>
                  <div className="bg-[#23243a] border border-green-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare size={16} className="text-green-400" />
                      <span className="text-sm font-semibold text-green-400">WhatsApp Message</span>
                    </div>
                    <div className="bg-black/60 rounded-lg p-3 text-sm text-white">
                      {newCampaign.content.message || "Your message will appear here..."}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Create Email Campaign</h3>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Campaign Name
                    </label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter campaign name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Template
                    </label>
                    <Select
                      value={newCampaign.content.template}
                      onValueChange={(value) => {
                        const template = emailTemplates.find(t => t.subject === value);
                        setNewCampaign(prev => ({
                          ...prev,
                          content: {
                            ...prev.content,
                            template: value,
                            subject: template?.subject || "",
                            message: template?.content || ""
                          }
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.map((template) => (
                          <SelectItem key={template.subject} value={template.subject}>
                            {template.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Subject Line
                    </label>
                    <Input
                      value={newCampaign.content.subject}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        content: { ...prev.content, subject: e.target.value }
                      }))}
                      placeholder="Email subject line"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Content
                    </label>
                    <Textarea
                      value={newCampaign.content.message}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        content: { ...prev.content, message: e.target.value }
                      }))}
                      placeholder="Type your email content..."
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={createCampaign} disabled={createCampaignMutation.isPending}>
                      <Send size={16} className="mr-2" />
                      Create Email Campaign
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-4">Preview</h3>
                  <div className="bg-[#23243a] border border-blue-500 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail size={16} className="text-blue-400" />
                      <span className="text-sm font-semibold text-blue-400">Email Preview</span>
                    </div>
                    <div className="bg-black/60 rounded-lg p-3">
                      <div className="text-sm font-medium mb-2 border-b pb-2 text-blue-300">
                        Subject: {newCampaign.content.subject || "Subject line will appear here..."}
                      </div>
                      <div className="text-sm whitespace-pre-wrap text-white">
                        {newCampaign.content.message || "Email content will appear here..."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Campaigns</h3>
                <p className="text-gray-600 mb-4">SMS campaign functionality coming soon</p>
                <Button variant="outline">
                  Request SMS Integration
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Campaign List */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(campaign.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">
                          Created {campaign.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="status" className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => sendCampaign(campaign.id, campaign.type)}
                          disabled={sendCampaignMutation.isPending}
                        >
                          <Send size={14} className="mr-1" />
                          Send Now
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{campaign.stats.sent}</div>
                      <div className="text-gray-600">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{campaign.stats.delivered}</div>
                      <div className="text-gray-600">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{campaign.stats.opened}</div>
                      <div className="text-gray-600">Opened</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{campaign.stats.clicked}</div>
                      <div className="text-gray-600">Clicked</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">{campaign.stats.responded}</div>
                      <div className="text-gray-600">Responded</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}