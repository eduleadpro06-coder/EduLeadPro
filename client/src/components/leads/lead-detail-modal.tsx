import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,

  Save,
  Edit,
  Plus,
  Clock,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { type LeadWithCounselor as BaseLeadWithCounselor, type Staff, type FollowUp, type GlobalClassFee, extendedLeadSchema, type InsertLead } from "@shared/schema";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useHashState } from "@/hooks/use-hash-state";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { z } from "zod";

// Extend LeadWithCounselor to include followUps for local use
type LeadWithCounselorAndFollowUps = BaseLeadWithCounselor & { followUps?: FollowUp[] };

interface LeadDetailModalProps {
  lead: LeadWithCounselorAndFollowUps | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadDeleted?: () => void;
  onLeadUpdated?: (updatedLead: LeadWithCounselorAndFollowUps) => void;
}

interface FollowUpForm {
  scheduledAt: string;
  remarks: string;
  outcome: string;
}

export default function LeadDetailModal({ lead, open, onOpenChange, onLeadDeleted, onLeadUpdated }: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useHashState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [activePopoverId, setActivePopoverId] = useState<number | null>(null);
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>({
    scheduledAt: "",
    remarks: "",
    outcome: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with react-hook-form
  // Note: We don't use extendedLeadSchema resolver for editing because it's too strict
  // for partial updates (e.g., Google Form leads with missing fields)
  const form = useForm<InsertLead>({
    mode: "onSubmit", // Changed from onChange to prevent validation errors during editing
    reValidateMode: "onSubmit",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      class: "",
      stream: "",
      status: "new",
      source: "",
      counselorId: undefined,
      notes: "",
      fatherFirstName: "",
      fatherLastName: "",
      fatherPhone: "",
      motherFirstName: "",
      motherLastName: "",
      motherPhone: "",
      address: "",
      lastContactedAt: undefined, // Add default value
    },
  });

  // Reset form when lead changes or modal opens
  useEffect(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        email: lead.email || "",
        phone: lead.phone,
        class: lead.class,
        stream: lead.stream || "",
        status: lead.status,
        source: lead.source,
        counselorId: lead.counselorId ?? undefined,
        notes: lead.notes || "",
        fatherFirstName: lead.fatherFirstName || "",
        fatherLastName: lead.fatherLastName || "",
        fatherPhone: lead.fatherPhone || "",
        motherFirstName: lead.motherFirstName || "",
        motherLastName: lead.motherLastName || "",
        motherPhone: lead.motherPhone || "",
        address: lead.address || "",
        lastContactedAt: lead.lastContactedAt ? new Date(lead.lastContactedAt) : undefined, // Map to Date object or keep undefined
      });
    }
  }, [lead, form]);

  // Watch class to toggle stream visibility
  const selectedClass = form.watch("class");
  const [showStream, setShowStream] = useState(false);

  useEffect(() => {
    if (selectedClass) {
      const match = selectedClass.match(/(\d+)/);
      if (match) {
        const classNum = parseInt(match[0], 10);
        const shouldShow = classNum > 10;
        setShowStream(shouldShow);
        // If not showing stream, clear it from form if currently editing?
        // Actually, for editing existing data, we might want to keep it if it exists, but validate if changed.
        // For now, let's just control visibility. Validation handles the requirement.
      } else {
        setShowStream(false);
      }
    } else {
      setShowStream(false);
    }
  }, [selectedClass]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Clear hash when modal is closed
  useEffect(() => {
    if (!open) {
      setActiveTab("");
      setIsEditing(false); // Reset editing state
    }
  }, [open, setActiveTab]);

  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open, setActiveTab]);

  const { data: counselors } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: globalFees } = useQuery<GlobalClassFee[]>({
    queryKey: ["/api/global-class-fees"],
  });

  const { data: followUps = [] } = useQuery<FollowUp[]>({
    queryKey: ["/api/follow-ups", { leadId: lead?.id }],
    queryFn: async () => {
      if (!lead?.id) return [];
      const res = await apiRequest("GET", `/follow-ups?leadId=${lead.id}`);
      return res.json();
    },
    enabled: !!lead?.id,
  });

  // Build class options: include active classes from globalFees, plus "Unknown" for Google Form leads
  const classOptions = globalFees
    ? (() => {
      const activeClasses = Array.from(new Set(globalFees.filter(f => f.isActive).map(f => f.className))).sort();
      // Always include "Unknown" for Google Form leads
      if (!activeClasses.includes("Unknown")) {
        activeClasses.unshift("Unknown");
      }
      // If the lead has a class value that's not in the list, add it to preserve existing data
      if (lead?.class && !activeClasses.includes(lead.class)) {
        activeClasses.push(lead.class);
        activeClasses.sort();
      }
      return activeClasses;
    })()
    : lead?.class ? [lead.class, "Unknown"] : ["Unknown"];

  const updateLeadMutation = useMutation({
    mutationFn: async (updates: any) => {
      try {
        const response = await apiRequest("PATCH", `/leads/${lead?.id}`, updates);

        // Check content type to ensure we're receiving JSON
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          throw new Error("Received non-JSON response from server");
        }
      } catch (error: any) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: (updatedLead) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/analytics"] }); // Refresh dashboard when enrollment changes
      setIsEditing(false);

      // Notify parent component to update the selected lead
      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
      }

      toast({
        title: "Lead Updated",
        description: "Lead information has been updated successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to update lead information";

      if (error.errorData?.message) {
        errorMessage = error.errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const createFollowUpMutation = useMutation({
    mutationFn: async (followUpData: any) => {
      try {
        // Get valid counselorId - use lead's counselor or first available counselor
        const validCounselorId = lead?.counselorId ||
          (counselors && counselors.length > 0 ? counselors[0].id : null);

        if (!validCounselorId) {
          throw new Error("No counselor available. Please assign a counselor to this lead first.");
        }

        const response = await apiRequest("POST", "/follow-ups", {
          ...followUpData,
          leadId: lead?.id,
          counselorId: validCounselorId
        });

        // Check content type to ensure we're receiving JSON
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          throw new Error("Received non-JSON response from server");
        }
      } catch (error: any) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      setFollowUpForm({ scheduledAt: "", remarks: "", outcome: "" });
      toast({
        title: "Follow-up Scheduled",
        description: "Follow-up has been scheduled successfully",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to schedule follow-up";

      if (error.errorData?.message) {
        errorMessage = error.errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Scheduling Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: async (data: { id: number; outcome: string }) => {
      try {
        const response = await apiRequest("PATCH", `/follow-ups/${data.id}`, {
          completedAt: new Date().toISOString(),
          outcome: data.outcome
        });

        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          throw new Error("Received non-JSON response from server");
        }
      } catch (error: any) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/follow-ups/overdue"] });
      setActivePopoverId(null);
      toast({
        title: "Follow-up Completed",
        description: "Follow-up has been marked as completed",
      });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to mark follow-up as completed";

      if (error.errorData?.message) {
        errorMessage = error.errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });


  const onSave = (data: InsertLead) => {
    console.log("[Lead Edit] onSave triggered with data:", data);
    console.log("[Lead Edit] Form errors:", form.formState.errors);

    // Sanitize data similar to create
    const sanitizedData: Partial<InsertLead> = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      // simplified check to allow falsy values like 0 or false if needed, but here mostly strings/dates
      if (value !== undefined && value !== null && value !== '') {
        (sanitizedData as any)[key] = value;
      }
    });

    console.log("[Lead Edit] Sanitized data:", sanitizedData);

    // Ensure lastContactedAt is treated correctly if cleared or set
    if (data.lastContactedAt) {
      sanitizedData.lastContactedAt = new Date(data.lastContactedAt);
    }

    console.log("[Lead Edit] Final data to send:", sanitizedData);
    updateLeadMutation.mutate(sanitizedData);
  };

  const scheduleFollowUp = () => {
    if (!followUpForm.scheduledAt) {
      toast({
        title: "Missing Information",
        description: "Please select a follow-up date and time",
        variant: "destructive"
      });
      return;
    }

    createFollowUpMutation.mutate({
      scheduledAt: new Date(followUpForm.scheduledAt),
      remarks: followUpForm.remarks,
      outcome: followUpForm.outcome
    });
  };

  if (!lead) return null;

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

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User size={24} />
                <div>
                  <h2 className="text-xl font-bold">{lead.name}</h2>
                  <p className="text-sm text-gray-600">{lead.class} {lead.stream}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>

              </div>
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about {lead.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col">
            <div className="px-6 pt-4 bg-gray-50 border-b">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-[#643ae5] data-[state=active]:text-white"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="followups"
                  className="data-[state=active]:bg-[#643ae5] data-[state=active]:text-white"
                >
                  Follow-ups
                </TabsTrigger>

              </TabsList>
            </div>

            <TabsContent value="details" className="flex-1 min-h-0 overflow-y-auto p-6 m-0 space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Lead Information</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isEditing) {
                          form.reset(); // Cancel editing resets form to initial values
                        } else {
                          // Clear any validation errors when entering edit mode
                          form.clearErrors();
                        }
                        setIsEditing(!isEditing);
                      }}
                      className="border-[#643ae5] text-[#643ae5] hover:bg-[#643ae5]/10"
                    >
                      <Edit size={16} className="mr-2" />
                      <span>{isEditing ? "Cancel" : "Edit"}</span>
                    </Button>
                    {lead.status !== "deleted" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the lead from the UI and move it to Recently Deleted in the database.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                console.log("Attempting to delete lead", lead?.id);
                                try {
                                  const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
                                  if (!res.ok) throw new Error('Failed to delete lead');

                                  // Invalidate queries to refresh data
                                  queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
                                  invalidateNotifications(queryClient);

                                  if (onLeadDeleted) onLeadDeleted();
                                  onOpenChange(false);
                                  toast({ title: 'Lead deleted', description: 'The lead was deleted.' });
                                } catch (err) {
                                  toast({ title: 'Error', description: 'Failed to delete lead.' });
                                }
                              }}
                            >
                              Yes, Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {lead.status === "deleted" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await fetch(`/api/leads/${lead.id}/restore`, { method: "PATCH" });
                          onOpenChange(false);
                        }}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                {
                  isEditing ? (
                    <Form {...form}>
                      <form
                        id="lead-edit-form"
                        onSubmit={form.handleSubmit(onSave, (errors) => {
                          console.error("[Lead Edit] Form validation failed:", errors);
                          toast({
                            title: "Validation Error",
                            description: "Please fill in all required fields correctly",
                            variant: "destructive"
                          });
                        })}
                        className="space-y-4 px-1"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Student Name */}
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Student Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Father Contact */}
                          <FormField
                            control={form.control}
                            name="fatherFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Father First and Last Name *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={`${form.getValues('fatherFirstName') || ''} ${form.getValues('fatherLastName') || ''}`.trim()}
                                    onChange={(e) => {
                                      const fullName = e.target.value;
                                      const parts = fullName.trim().split(/\s+/);
                                      if (parts.length >= 2) {
                                        form.setValue('fatherFirstName', parts[0]);
                                        form.setValue('fatherLastName', parts.slice(1).join(' '));
                                      } else {
                                        form.setValue('fatherFirstName', fullName);
                                        form.setValue('fatherLastName', '');
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="fatherPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Father Phone * (Primary Contact)</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Mother Contact */}
                          <FormField
                            control={form.control}
                            name="motherFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mother First and Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={`${form.getValues('motherFirstName') || ''} ${form.getValues('motherLastName') || ''}`.trim()}
                                    placeholder="(Optional)"
                                    onChange={(e) => {
                                      const fullName = e.target.value;
                                      const parts = fullName.trim().split(/\s+/);
                                      if (parts.length >= 2) {
                                        form.setValue('motherFirstName', parts[0]);
                                        form.setValue('motherLastName', parts.slice(1).join(' '));
                                      } else {
                                        form.setValue('motherFirstName', fullName);
                                        form.setValue('motherLastName', '');
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="motherPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mother Phone *</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Email */}
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Address */}
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value ?? ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Class and Stream */}
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={form.control}
                              name="class"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Class</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {classOptions.map((cls) => (
                                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="stream"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Stream</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Stream" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Science">Science</SelectItem>
                                      <SelectItem value="Commerce">Commerce</SelectItem>
                                      <SelectItem value="Arts">Arts</SelectItem>
                                      <SelectItem value="N/A">N/A</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Last Contacted */}
                          <FormField
                            control={form.control}
                            name="lastContactedAt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Contacted</FormLabel>
                                <FormControl>
                                  <Input
                                    type="datetime-local"
                                    {...field}
                                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                                    onChange={(e) => {
                                      const dateVal = e.target.value ? new Date(e.target.value) : undefined;
                                      field.onChange(dateVal);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />


                          {/* Status */}
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="interested">Interested</SelectItem>
                                    <SelectItem value="ready_for_admission">Ready for Admission</SelectItem>
                                    <SelectItem value="future_intake">Future Intake</SelectItem>
                                    <SelectItem value="enrolled">Enrolled</SelectItem>
                                    <SelectItem value="dropped">Dropped</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Source */}
                          <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Source</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Source" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                                    <SelectItem value="Walk-in (Google Form)">Walk-in (Google Form)</SelectItem>
                                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                                    <SelectItem value="Email">Email</SelectItem>
                                    <SelectItem value="Website">Website</SelectItem>
                                    <SelectItem value="Social Media">Social Media</SelectItem>
                                    <SelectItem value="Referral">Referral</SelectItem>
                                    <SelectItem value="Advertisement">Advertisement</SelectItem>
                                    <SelectItem value="Event">Event</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Assign Counselor */}
                          <FormField
                            control={form.control}
                            name="counselorId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned Counselor</FormLabel>
                                <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} value={field.value?.toString() || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Counselor" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {counselors?.filter(staff => staff.role === "Counselor").map((counselor) => (
                                      <SelectItem key={counselor.id} value={counselor.id.toString()}>
                                        {counselor.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Notes */}
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value ?? ""} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </form>
                    </Form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* View Only Mode Structure - largely same as before but cleaner */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <span>{lead.name}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Name</label>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <span>
                              {lead.fatherFirstName && lead.fatherLastName
                                ? `${lead.fatherFirstName} ${lead.fatherLastName}`
                                : lead.fatherFirstName || "Not provided"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Father Phone (Primary Contact)</label>
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-500" />
                            <span>{lead.fatherPhone || "Not provided"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Name</label>
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            <span>
                              {lead.motherFirstName && lead.motherLastName
                                ? `${lead.motherFirstName} ${lead.motherLastName}`
                                : lead.motherFirstName || "Not provided"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mother Phone</label>
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-500" />
                            <span>{lead.motherPhone || "Not provided"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-500" />
                            <span>{lead.email || "Not provided"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-500" />
                            <span>{lead.address || "Not provided"}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact</label>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            <span>{lead.lastContactedAt ? formatDate(lead.lastContactedAt) : 'Not set'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Class & Stream</label>
                          <span>{lead.class} {lead.stream}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Counselor</label>
                          <span>{lead.counselor?.name || "Unassigned"}</span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                          <span className="capitalize">{lead.source?.replace('_', ' ')}</span>
                        </div>
                        {lead.notes && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{lead.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </TabsContent>

            <TabsContent value="followups" className="flex-1 min-h-0 overflow-y-auto p-6 m-0 space-y-4">
              {/* Follow-up content remains mostly the same, ensuring buttons are wired up */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Schedule Follow-up</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Date & Time</label>
                        <Input
                          type="datetime-local"
                          value={followUpForm.scheduledAt}
                          onChange={(e) => setFollowUpForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Remarks</label>
                        <Textarea
                          placeholder="Enter remarks..."
                          value={followUpForm.remarks}
                          onChange={(e) => setFollowUpForm(prev => ({ ...prev, remarks: e.target.value }))}
                        />
                      </div>
                      <Button
                        className="w-full bg-[#643ae5] hover:bg-[#643ae5]/90"
                        onClick={scheduleFollowUp}
                        disabled={createFollowUpMutation.isPending}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="md:row-span-2 overflow-hidden flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">History</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      {followUps.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No follow-up history
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {followUps.map((fp) => (
                            <div key={fp.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-gray-500" />
                                  <span className="text-sm font-medium">{new Date(fp.scheduledAt).toLocaleDateString()}</span>
                                  <span className="text-xs text-gray-500">{new Date(fp.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {fp.completedAt ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Completed</Badge>
                                ) : (
                                  <Popover open={activePopoverId === fp.id} onOpenChange={(open) => setActivePopoverId(open ? fp.id : null)}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-blue-600 hover:text-blue-800"
                                      >
                                        <CheckCircle2 size={12} className="mr-1" />
                                        Mark Done
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" align="end">
                                      <div className="grid gap-4">
                                        <div className="space-y-2">
                                          <h4 className="font-medium leading-none">Complete Follow-up</h4>
                                          <p className="text-sm text-muted-foreground">
                                            Select an outcome for this follow-up.
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {['Interested', 'Not Interested', 'No Answer', 'Call Again', 'Enrolled'].map((outcome) => (
                                            <Button
                                              key={outcome}
                                              variant="outline"
                                              size="sm"
                                              onClick={() => completeFollowUpMutation.mutate({ id: fp.id, outcome })}
                                              disabled={completeFollowUpMutation.isPending}
                                            >
                                              {outcome}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{fp.remarks}</p>
                              <div className="mt-2 text-xs text-gray-400">
                                Outcome: {fp.outcome || 'Pending'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {isEditing && activeTab === "details" && (
          <div className="p-4 border-t bg-white flex justify-end gap-2 shrink-0">
            <Button type="button" variant="outline" onClick={() => { setIsEditing(false); form.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" form="lead-edit-form" disabled={updateLeadMutation.isPending}>
              {updateLeadMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )
        }
      </DialogContent>
    </Dialog >
  );
}