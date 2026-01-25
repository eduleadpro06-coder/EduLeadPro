
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/queryClient";

export function useOrganization() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery({
        queryKey: ["/api/organization/settings"],
        queryFn: async () => {
            const response = await fetch("/api/organization/settings", {
                headers: {
                    ...getAuthHeaders(), // Add auth headers
                },
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error("Failed to fetch organization settings");
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: any) => {
            const response = await fetch("/api/organization/settings", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(), // Add auth headers
                },
                credentials: "include",
                body: JSON.stringify({ settings: newSettings }),
            });

            if (!response.ok) {
                throw new Error("Failed to update organization settings");
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/organization/settings"] });
            toast({
                title: "Settings Updated",
                description: "Organization settings have been saved successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        settings: settings?.settings,
        orgData: settings,
        name: settings?.name || "Organization Name",
        address: settings?.address || "",
        phone: settings?.phone || "",
        email: settings?.email || "",
        city: settings?.city || "",
        state: settings?.state || "",
        pincode: settings?.pincode || "",
        isLoading,
        updateSettings: updateSettingsMutation.mutate,
        academicYear: settings?.settings?.academicYear || "2026-27", // academicYear is in the nested settings
    };
}
