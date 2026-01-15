import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, invalidateNotifications } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertLeadSchema } from "@shared/schema";
import type { InsertLead, User, GlobalClassFee, Lead } from "@shared/schema";

interface LeadFormProps {
  onSuccess?: () => void;
  initialData?: Lead;
}

export function LeadForm({ onSuccess, initialData }: LeadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: counselors = [] } = useQuery<User[]>({
    queryKey: ['/api/counselors'],
  });

  const { data: globalFees } = useQuery<GlobalClassFee[]>({
    queryKey: ["/api/global-class-fees"],
  });

  const classOptions = globalFees
    ? Array.from(new Set(globalFees.filter(f => f.isActive).map(f => f.className))).sort()
    : [];

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: initialData?.name || "",
      parentName: initialData?.parentName || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      class: initialData?.class || "",
      status: initialData?.status || "New",
      source: initialData?.source || "",
      counselorId: initialData?.counselorId || undefined,
      notes: initialData?.notes || "",
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      try {
        const response = await apiRequest("POST", "/api/leads", data);

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
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      invalidateNotifications(queryClient);
      toast({ title: "Lead created successfully!" });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      let errorMessage = "Failed to create lead";

      if (error.errorData?.message) {
        errorMessage = error.errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      if (!initialData) return;
      const response = await apiRequest("PATCH", `/api/leads/${initialData.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      invalidateNotifications(queryClient);
      toast({ title: "Lead updated successfully!" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Failed to update lead", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertLead) => {
    if (initialData) {
      updateLeadMutation.mutate(data);
    } else {
      createLeadMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter student name" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter parent name" value={field.value || ""} />
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
                  <Input {...field} placeholder="+91-9876543210" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="parent@example.com" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class/Grade *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
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
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Google Ads">Google Ads</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="pre_enrolled">Pre-Enrolled</SelectItem>
                    <SelectItem value="future_intake">Future Intake</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
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
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString() || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select counselor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {counselors.map((counselor) => (
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Remarks</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add any initial notes about this lead..."
                  rows={3}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createLeadMutation.isPending || updateLeadMutation.isPending}>
            {createLeadMutation.isPending || updateLeadMutation.isPending
              ? (initialData ? "Updating..." : "Creating...")
              : (initialData ? "Update Lead" : "Create Lead")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
