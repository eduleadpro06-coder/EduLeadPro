import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  Trash2
} from "lucide-react";
import { type LeadWithCounselor as BaseLeadWithCounselor, type User as UserType, type FollowUp } from "@shared/schema";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useHashState } from "@/hooks/use-hash-state";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

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
  const [editForm, setEditForm] = useState<any>(lead || {});
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>({
    scheduledAt: "",
    remarks: "",
    outcome: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validation functions
  const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required";
    }
    
    // Check if contains only allowed characters
    if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return "Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses";
    }
    
    // Count only digits
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return "Phone number must contain exactly 10 digits";
    }
    
    return null;
  };

  const validateEmail = (email: string): string | null => {
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return "Please enter a valid email address";
      }
    }
    return null;
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    // Validate phone
    const phoneError = validatePhone(editForm.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }
    
    // Validate email
    const emailError = validateEmail(editForm.email);
    if (emailError) {
      errors.email = emailError;
    }
    
    // Validate required fields
    if (!editForm.name || editForm.name.trim() === "") {
      errors.name = "Student name is required";
    }
    
    if (!editForm.class || editForm.class.trim() === "") {
      errors.class = "Class is required";
    }

    if (!editForm.source || editForm.source.trim() === "") {
      errors.source = "Lead source is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Clear hash when modal is closed
  useEffect(() => {
    if (!open) {
      setActiveTab("");
      setValidationErrors({}); // Clear validation errors when modal closes
      setIsEditing(false); // Reset editing state
    }
  }, [open, setActiveTab]);

  useEffect(() => {
    if (open && lead) {
      setEditForm(lead);
    }
  }, [open, lead]);

  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open, setActiveTab]);

  const { data: counselors } = useQuery<UserType[]>({
    queryKey: ["/api/counselors"],
  });

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
      setIsEditing(false);
      setValidationErrors({}); // Clear validation errors on successful save
      
      // Update the edit form with the latest data
      setEditForm(updatedLead);
      
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
        const response = await apiRequest("POST", "/follow-ups", {
          ...followUpData,
          leadId: lead?.id,
          counselorId: lead?.counselorId || 1
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



  const saveChanges = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving.",
        variant: "destructive"
      });
      return;
    }
    
    updateLeadMutation.mutate(editForm);
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
      <DialogContent className="max-w-2xl h-[75vh] overflow-y-auto border-4">
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
              <Badge variant="status" className={getStatusColor(lead.status)}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>

            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive information about {lead.name}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>

          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="h-[520px] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Lead Information</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isEditing) {
                        // Clear validation errors when cancelling
                        setValidationErrors({});
                        // Reset form to original lead data
                        setEditForm(lead);
                      }
                      setIsEditing(!isEditing);
                    }}
                    className="text-white"
                  >
                    <Edit size={16} className="mr-2" />
                    <span className="text-white">{isEditing ? "Cancel" : "Edit"}</span>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Name
                    </label>
                    {isEditing ? (
                      <div>
                        <Input
                          value={editForm.name}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditForm((prev: typeof editForm) => ({ ...prev, name: newValue }));
                            
                            // Real-time validation
                            const errors = { ...validationErrors };
                            if (!newValue || newValue.trim() === "") {
                              errors.name = "Student name is required";
                            } else {
                              delete errors.name;
                            }
                            setValidationErrors(errors);
                          }}
                          onBlur={() => {
                            // Validate on blur as well
                            const errors = { ...validationErrors };
                            if (!editForm.name || editForm.name.trim() === "") {
                              errors.name = "Student name is required";
                            } else {
                              delete errors.name;
                            }
                            setValidationErrors(errors);
                          }}
                          className={validationErrors.name ? "border-red-500" : ""}
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        <span>{lead.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div>
                        <Input
                          value={editForm.phone}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditForm((prev: typeof editForm) => ({ ...prev, phone: newValue }));
                            
                            // Real-time validation
                            const errors = { ...validationErrors };
                            const phoneError = validatePhone(newValue);
                            if (phoneError) {
                              errors.phone = phoneError;
                            } else {
                              delete errors.phone;
                            }
                            setValidationErrors(errors);
                          }}
                          onBlur={() => {
                            // Validate on blur as well
                            const errors = { ...validationErrors };
                            const phoneError = validatePhone(editForm.phone);
                            if (phoneError) {
                              errors.phone = phoneError;
                            } else {
                              delete errors.phone;
                            }
                            setValidationErrors(errors);
                          }}
                          className={validationErrors.phone ? "border-red-500" : ""}
                        />
                        {validationErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-500" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <div>
                        <Input
                          value={editForm.email || ""}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditForm((prev: typeof editForm) => ({ ...prev, email: newValue }));
                            
                            // Real-time validation
                            const errors = { ...validationErrors };
                            const emailError = validateEmail(newValue);
                            if (emailError) {
                              errors.email = emailError;
                            } else {
                              delete errors.email;
                            }
                            setValidationErrors(errors);
                          }}
                          onBlur={() => {
                            // Validate on blur as well
                            const errors = { ...validationErrors };
                            const emailError = validateEmail(editForm.email || "");
                            if (emailError) {
                              errors.email = emailError;
                            } else {
                              delete errors.email;
                            }
                            setValidationErrors(errors);
                          }}
                          className={validationErrors.email ? "border-red-500" : ""}
                        />
                        {validationErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500" />
                        <span>{lead.email || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    {isEditing ? (
                      <Input
                        value={editForm.address || ""}
                        onChange={(e) => setEditForm((prev: typeof editForm) => ({ ...prev, address: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span>{lead.address || "Not provided"}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Contact
                    </label>
                    {isEditing ? (
                      <Input
                        type="date"
                        placeholder="Select date"
                        value={editForm.lastContactedAt ? editForm.lastContactedAt.split('T')[0] : ''}
                        onChange={(e) => setEditForm((prev: typeof editForm) => ({ ...prev, lastContactedAt: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-500" />
                        <span>{lead.lastContactedAt ? formatDate(lead.lastContactedAt) : 'Select date'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class & Stream
                    </label>
                    {isEditing ? (
                      <div>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={editForm.class}
                            onValueChange={(value) => {
                              setEditForm((prev: typeof editForm) => ({ ...prev, class: value }));
                              // Real-time validation for class
                              const errors = { ...validationErrors };
                              if (!value || value.trim() === "") {
                                errors.class = "Class is required";
                              } else {
                                delete errors.class;
                              }
                              setValidationErrors(errors);
                            }}
                          >
                            <SelectTrigger className={validationErrors.class ? "border-red-500" : ""}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Class 9">Class 9</SelectItem>
                              <SelectItem value="Class 10">Class 10</SelectItem>
                              <SelectItem value="Class 11">Class 11</SelectItem>
                              <SelectItem value="Class 12">Class 12</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={editForm.stream || ""}
                            onValueChange={(value) => setEditForm((prev: typeof editForm) => ({ ...prev, stream: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Science">Science</SelectItem>
                              <SelectItem value="Commerce">Commerce</SelectItem>
                              <SelectItem value="Arts">Arts</SelectItem>
                              <SelectItem value="N/A">N/A</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {validationErrors.class && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.class}</p>
                        )}
                      </div>
                    ) : (
                      <span>{lead.class} {lead.stream}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    {isEditing ? (
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm((prev: typeof editForm) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="interested">Interested</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="dropped">Dropped</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="status" className={getStatusColor(lead.status)}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Counselor
                    </label>
                    {isEditing ? (
                      <Select
                        value={editForm.counselorId?.toString() || ""}
                        onValueChange={(value) => setEditForm((prev: typeof editForm) => ({ ...prev, counselorId: Number(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {counselors?.map((counselor) => (
                            <SelectItem key={counselor.id} value={counselor.id.toString()}>
                              {counselor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span>{lead.counselor?.name || "Unassigned"}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Source
                    </label>
                    <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {lead.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.notes || ""}
                      onChange={(e) => setEditForm((prev: typeof editForm) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{lead.notes}</p>
                  )}
                </div>
              )}

              {isEditing && (
                <div className="flex gap-2">
                  <Button onClick={saveChanges} disabled={updateLeadMutation.isPending}>
                    <Save size={16} className="mr-2" />
                    {updateLeadMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="followups" className="space-y-4">
            <div className="h-[520px] flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Follow-up History</h3>

              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule New Follow-up</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date & Time
                      </label>
                      <Input
                        type="datetime-local"
                        value={followUpForm.scheduledAt}
                        onChange={(e) => setFollowUpForm((prev: FollowUpForm) => ({ ...prev, scheduledAt: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Outcome
                      </label>
                      <Select
                        value={followUpForm.outcome}
                        onValueChange={(value) => setFollowUpForm((prev: FollowUpForm) => ({ ...prev, outcome: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Phone Call</SelectItem>
                          <SelectItem value="visit">Campus Visit</SelectItem>
                          <SelectItem value="document">Document Collection</SelectItem>
                          <SelectItem value="meeting">In-person Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks
                    </label>
                    <Textarea
                      value={followUpForm.remarks}
                      onChange={(e) => setFollowUpForm((prev: FollowUpForm) => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Add any notes for this follow-up..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={scheduleFollowUp} disabled={createFollowUpMutation.isPending}>
                    <Plus size={16} className="mr-2" />
                    {createFollowUpMutation.isPending ? "Scheduling..." : "Schedule Follow-up"}
                  </Button>
                </CardContent>
              </Card>

              {lead.followUps && lead.followUps.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Previous Follow-ups</h4>
                  {lead.followUps?.map((followUp: FollowUp) => (
                    <div key={followUp.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          <span className="font-medium">
                            {formatDate(followUp.scheduledAt)}
                          </span>
                        </div>
                        <Badge variant={followUp.completedAt ? "default" : "outline"}>
                          {followUp.completedAt ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      {followUp.remarks && (
                        <p className="text-sm text-gray-600 mt-2">{followUp.remarks}</p>
                      )}
                      {followUp.outcome && (
                        <p className="text-sm text-blue-600 mt-1">
                          <span className="font-medium">Outcome:</span> {followUp.outcome}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>


        </Tabs>
      </DialogContent>
    </Dialog>
  );
}