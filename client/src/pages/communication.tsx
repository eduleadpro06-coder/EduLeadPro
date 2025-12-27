import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Send, MessageSquare, Phone, Mail, Calendar, Users, Filter, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import { format } from "date-fns";

interface CommunicationLog {
  id: number;
  recipientType: "student" | "parent" | "staff" | "group";
  recipientId?: number;
  groupName?: string;
  type: "sms" | "email" | "whatsapp" | "call";
  subject?: string;
  message: string;
  status: "sent" | "delivered" | "read" | "failed";
  sentAt: string;
  createdBy: number;
}

interface CommunicationTemplate {
  id: number;
  name: string;
  type: "sms" | "email" | "whatsapp";
  subject?: string;
  content: string;
  category: "fee_reminder" | "attendance" | "announcement" | "admission" | "general";
  isActive: boolean;
}

export default function Communication() {
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<string>("sms");
  const [prefilledData, setPrefilledData] = useState<{ message: string, subject?: string }>({ message: "" });
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState(() => {
    return window.location.hash.slice(1) || "logs";
  });

  // Fetch communication logs
  const { data: communicationLogs = [] } = useQuery<CommunicationLog[]>({
    queryKey: ["/api/communications"],
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<CommunicationTemplate[]>({
    queryKey: ["/api/message-templates"],
  });

  // Fetch students and parents for recipient selection
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/students"],
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/communications/send", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      setSendMessageOpen(false);
      setSelectedRecipients([]);
      toast({
        title: "Success",
        description: "Message sent successfully",
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/message-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      setCreateTemplateOpen(false);
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
  });

  const getRecipientLabel = (value: string) => {
    const bulkAction = bulkActions.find(a => a.value === value);
    if (bulkAction) return bulkAction.label;

    // Check if it's a student ID (prefixed or just ID - assuming format "student-ID")
    if (value.startsWith("student-")) {
      const id = parseInt(value.replace("student-", ""));
      const student = students.find((s: any) => s.id === id);
      return student ? `${student.name} (Student)` : value;
    }

    return value;
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Resolve recipients
    let finalRecipients: any[] = [];

    if (selectedRecipients.includes("all_students")) {
      // Add all students
      finalRecipients = [
        ...finalRecipients,
        ...students.map((s: any) => ({
          role: "student",
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.contactNo || s.mobileNumber, // Adjust based on student schema
          data: { class: s.class }
        }))
      ];
    } else {
      // Handle individual selections
      selectedRecipients.forEach(value => {
        if (value.startsWith("student-")) {
          const id = parseInt(value.replace("student-", ""));
          const student = students.find((s: any) => s.id === id);
          if (student) {
            finalRecipients.push({
              role: "student",
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.contactNo || student.mobileNumber,
              data: { class: student.class }
            });
          }
        }
      });
    }

    // Remove duplicates by ID
    finalRecipients = Array.from(new Map(finalRecipients.map(item => [item.id, item])).values());

    const data = {
      recipients: finalRecipients,
      type: messageType,
      subject: formData.get("subject"),
      message: formData.get("message"),
      scheduleAt: formData.get("scheduleAt"),
    };
    sendMessageMutation.mutate(data);
  };

  const handleCreateTemplate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name"),
      type: formData.get("type"),
      subject: formData.get("subject"),
      content: formData.get("content"),
      category: formData.get("category"),
    };
    createTemplateMutation.mutate(data);
  };

  const handleUseTemplate = (template: CommunicationTemplate) => {
    setMessageType(template.type);
    setPrefilledData({
      message: template.content,
      subject: template.subject || ""
    });
    setSendMessageOpen(true);
    // Switch to logs tab (which contains the open dialog) or ensure dialog is visible
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "sent": "bg-blue-100 text-blue-800",
      "delivered": "bg-green-100 text-green-800",
      "read": "bg-purple-100 text-purple-800",
      "failed": "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sms": return <MessageSquare className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "call": return <Phone className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const bulkActions = [
    { label: "All Students", value: "all_students" },
    // { label: "All Parents", value: "all_parents" },
    // { label: "All Staff", value: "all_staff" },
  ];

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    window.location.hash = value;
  };

  return (
    <div className="space-y-6">
      <Header className="py-4" />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {communicationLogs.filter((log: CommunicationLog) =>
                format(new Date(log.sentAt), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {communicationLogs.filter((log: CommunicationLog) => log.status === "failed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="call">Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Message Template</DialogTitle>
                <DialogDescription>
                  Create a reusable template for common communications
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fee_reminder">Fee Reminder</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="admission">Admission</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject (Email only)</Label>
                  <Input id="subject" name="subject" />
                </div>
                <div>
                  <Label htmlFor="content">Message Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={4}
                    placeholder="Use {{name}}, {{amount}}, {{date}} for dynamic content"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateTemplateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTemplateMutation.isPending}>
                    Create Template
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Message</DialogTitle>
                <DialogDescription>
                  Send SMS, WhatsApp, or email to students, parents, or staff
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <Label htmlFor="messageType">Message Type</Label>
                  <Select value={messageType} onValueChange={setMessageType} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Recipients</Label>
                  <div className="space-y-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !selectedRecipients.includes(value)) {
                          setSelectedRecipients([...selectedRecipients, value]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add bulk recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        {bulkActions.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                        <div className="p-2 text-xs text-muted-foreground font-semibold">Individual Students</div>
                        {students.map((student: any) => (
                          <SelectItem key={`student-${student.id}`} value={`student-${student.id}`}>
                            {student.name} (Class {student.class})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedRecipients.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipients.map((recipient, index) => (
                          <Badge key={index} variant="secondary">
                            {getRecipientLabel(recipient)}
                            <button
                              type="button"
                              className="ml-1 text-xs"
                              onClick={() => setSelectedRecipients(
                                selectedRecipients.filter((_, i) => i !== index)
                              )}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {messageType === "email" && (
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" defaultValue={prefilledData.subject} />
                  </div>
                )}

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    defaultValue={prefilledData.message}
                    key={prefilledData.message} // Force re-render when template changes
                  />
                </div>

                <div>
                  <Label htmlFor="scheduleAt">Schedule for later (Optional)</Label>
                  <Input id="scheduleAt" name="scheduleAt" type="datetime-local" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setSendMessageOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendMessageMutation.isPending}>
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Communication Logs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
              <CardDescription>
                Track all sent messages and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject/Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communicationLogs.map((log: CommunicationLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(log.type)}
                          {log.type.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.recipientType === "group" ? log.groupName : `${log.recipientType} #${log.recipientId}`}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.subject || log.message}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.sentAt), "MMM dd, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template: CommunicationTemplate) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.category.replace("_", " ")}</CardDescription>
                    </div>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <span className="text-sm font-medium">{template.type.toUpperCase()}</span>
                    </div>
                    {template.subject && (
                      <div className="text-sm">
                        <strong>Subject:</strong> {template.subject}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {template.content.substring(0, 100)}...
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    <Button size="sm" onClick={() => handleUseTemplate(template)}>
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Message Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["sms", "email", "whatsapp"].map((type) => {
                    const count = communicationLogs.filter((log: CommunicationLog) => log.type === type).length;
                    const percentage = communicationLogs.length > 0 ? (count / communicationLogs.length) * 100 : 0;

                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["delivered", "sent", "read", "failed"].map((status) => {
                    const count = communicationLogs.filter((log: CommunicationLog) => log.status === status).length;
                    const percentage = communicationLogs.length > 0 ? (count / communicationLogs.length) * 100 : 0;

                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="capitalize">{status}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}