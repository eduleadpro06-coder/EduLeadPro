import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { insertLeadSchema, type InsertLead, type User } from "@shared/schema";
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

  const { data: counselors } = useQuery<User[]>({
    queryKey: ["/api/counselors"],
  });

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    mode: "onChange", // Enable real-time validation
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
      parentName: "",
      parentPhone: "",
      address: "",
    },
  });

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
        console.log("Response status:", response.status);
        
        // Check content type to ensure we're receiving JSON
        const contentType = response.headers.get("Content-Type");
        console.log("Response Content-Type:", contentType);
        
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        } else {
          // Get the actual response text for debugging
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
      console.log("Lead created successfully");
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
      console.log("Error message:", error.message);
      console.log("Error status:", error.status);
      console.log("Error data:", error.errorData);
      console.log("Full error object:", error);
      
      // Handle duplicate lead error specifically
      // Check for 409 status or error message containing duplicate indicators
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
          
          // Create a more detailed error message
          let errorDescription = "A lead with this contact information already exists in the system.";
          
          if (formData.phone && formData.email) {
            errorDescription = `A lead with phone number "${formData.phone}" and email "${formData.email}" already exists in the system.`;
          } else if (formData.phone) {
            errorDescription = `A lead with phone number "${formData.phone}" already exists in the system.`;
          } else if (formData.email) {
            errorDescription = `A lead with email "${formData.email}" already exists in the system.`;
          }
          
          // Show the server's error message to the user
          toast({
            title: "⚠️ Duplicate Lead Warning",
            description: errorDescription,
            variant: "destructive",
          });
        }
        
        // DO NOT close the modal - let user modify the form and try again
        // DO NOT reset the form - let user see what they entered
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
        
        // For other errors, also keep the modal open
      }
    },
  });

  const onSubmit = (data: InsertLead) => {
    createLeadMutation.mutate({ data });
  };

  const classOptions = [
    "Class 9", "Class 10", "Class 11", "Class 12", "Class 8", "Class 7"
  ];

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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="stream"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stream</FormLabel>
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
                        {counselors?.map((counselor) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter parent name" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter parent phone" {...field} value={field.value ?? ""} />
                    </FormControl>
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
                  <FormLabel>Address</FormLabel>
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
