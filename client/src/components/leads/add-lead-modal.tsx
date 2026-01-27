import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { extendedLeadSchema, type InsertLead, type Staff, type GlobalClassFee } from "@shared/schema";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface AddLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddLeadModal({ open, onOpenChange }: AddLeadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletedLeadData, setDeletedLeadData] = useState<any>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const { data: counselors } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const form = useForm<InsertLead>({
    resolver: zodResolver(extendedLeadSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      fatherFirstName: "",
      fatherLastName: "",
      fatherPhone: "",
      motherFirstName: "",
      motherLastName: "",
      motherPhone: "",
      phone: "", // Keep for backward compatibility
      address: "",
    },
  });

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

        // Clear stream if hidden
        if (!shouldShow) {
          form.setValue("stream", "");
        }
      } else {
        setShowStream(false);
        form.setValue("stream", "");
      }
    } else {
      setShowStream(false);
    }
  }, [selectedClass, form]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setDeletedLeadData(null);
      setShowRestoreDialog(false);
    }
  }, [open, form]);

  // Handle restoring deleted lead
  const restoreLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await apiRequest("PATCH", `/leads/${leadId}/restore`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/leads"] });
      toast({
        title: "Lead Restored",
        description: "The deleted lead has been successfully restored.",
      });
      form.reset();
      setShowRestoreDialog(false);
      setDeletedLeadData(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: "Failed to restore the deleted lead. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async ({ data, forceCreate = false }: { data: InsertLead; forceCreate?: boolean }) => {
      console.log("Attempting to create lead:", data, "Force create:", forceCreate);
      try {
        const url = forceCreate ? "/leads?force=true" : "/leads";
        const response = await apiRequest("POST", url, data);

        // Check content type to ensure we're receiving JSON
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          const responseText = await response.text();
          console.error("Non-JSON response received:", responseText);
          throw new Error("Received non-JSON response from server");
        }
      } catch (error: any) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/leads"] });
      invalidateNotifications(queryClient);
      toast({
        title: "Lead created successfully",
        description: "The new lead has been added to your database.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.log("Error in createLeadMutation:", error);
      const isDuplicateError = error.status === 409 ||
        (error.message && (
          error.message.includes("already exists") ||
          error.message.includes("409") ||
          error.message.includes("phone number or email") ||
          error.message.includes("duplicate")
        ));

      if (isDuplicateError) {
        // Check if this is a deleted lead
        if (error.errorData?.isDeletedLead) {
          setDeletedLeadData(error.errorData.deletedLead);
          setShowRestoreDialog(true);
        } else {
          // Handle normal duplicate (active lead)
          const formData = form.getValues();
          let errorDescription = "A lead with this contact information already exists.";

          if (formData.phone) {
            errorDescription = `A lead with phone number "${formData.phone}" already exists.`;
          }

          toast({
            title: "⚠️ Duplicate Lead Warning",
            description: errorDescription,
            variant: "destructive",
          });
        }
      } else {
        let errorMessage = "Something went wrong while creating the lead";
        if (error.errorData?.message) {
          errorMessage = error.errorData.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error creating lead",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: InsertLead) => {
    // Sanitize data: Only include fields with actual values
    const sanitizedData: Partial<InsertLead> = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        (sanitizedData as any)[key] = value;
      }
    });

    createLeadMutation.mutate({ data: sanitizedData as InsertLead });
  };

  const { data: globalFees } = useQuery<GlobalClassFee[]>({
    queryKey: ["/api/global-class-fees"],
  });

  const classOptions = globalFees
    ? Array.from(new Set(globalFees.filter(f => f.isActive).map(f => f.className))).sort()
    : [];

  const streamOptions = [
    "Science", "Commerce", "Arts", "N/A"
  ];

  const sourceOptions = [
    "google_ads", "facebook", "instagram", "website", "referral", "walk_in", "phone_inquiry"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-4">
        <div className="text-center text-lg font-bold mb-4">Add New Lead</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student First and Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter student first and last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fatherFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father First and Last Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter father's full name"
                        {...field}
                        value={field.value ?? ""}
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
                      <Input placeholder="10 digit number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="motherFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother First and Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter mother's full name (optional)"
                        {...field}
                        value={field.value ?? ""}
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
                      <Input placeholder="10 digit number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email address" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={`grid ${showStream ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showStream && (
                <FormField
                  control={form.control}
                  name="stream"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {streamOptions.map((stream) => (
                            <SelectItem key={stream} value={stream}>
                              {stream}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceOptions.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="counselorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Counselor</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? Number(value) : undefined)} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select counselor" />
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



            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter notes" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Restore Deleted Lead Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deleted Lead Found</AlertDialogTitle>
            <AlertDialogDescription>
              A deleted lead with the same contact information exists:
              <br />
              <strong>Name:</strong> {deletedLeadData?.name}
              <br />
              <strong>Phone:</strong> {deletedLeadData?.phone}
              <br />
              {deletedLeadData?.email && (
                <>
                  <strong>Email:</strong> {deletedLeadData.email}
                  <br />
                </>
              )}
              <br />
              Would you like to restore this deleted lead instead of creating a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRestoreDialog(false);
                // Force create new lead despite deleted one existing
                const formData = form.getValues();
                createLeadMutation.mutate({ data: formData, forceCreate: true });
              }}
              disabled={createLeadMutation.isPending}
            >
              {createLeadMutation.isPending ? "Creating..." : "Create New Lead"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletedLeadData) {
                  restoreLeadMutation.mutate(deletedLeadData.id);
                }
              }}
              disabled={restoreLeadMutation.isPending}
              className="bg-[#643ae5] hover:bg-[#643ae5]/90"
            >
              {restoreLeadMutation.isPending ? "Restoring..." : "Restore Lead"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
