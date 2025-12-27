import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================
// STATS & ANALYTICS
// ============================================

export function useDaycareStats() {
    return useQuery({
        queryKey: ["/api/daycare/stats"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/stats");
            if (!response.ok) throw new Error("Failed to fetch daycare stats");
            return response.json();
        },
    });
}

// ============================================
// CHILDREN MANAGEMENT
// ============================================

export function useDaycareChildren(includeDeleted = false) {
    return useQuery({
        queryKey: ["/api/daycare/children", includeDeleted],
        queryFn: async () => {
            const url = `/api/daycare/children${includeDeleted ? '?includeDeleted=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch children");
            return response.json();
        },
    });
}

export function useActiveDaycareChildren() {
    return useQuery({
        queryKey: ["/api/daycare/children/active"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/children/active");
            if (!response.ok) throw new Error("Failed to fetch active children");
            return response.json();
        },
    });
}

export function useCreateDaycareChild() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (childData: any) => {
            const response = await fetch("/api/daycare/children", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(childData),
            });
            if (!response.ok) throw new Error("Failed to create child");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/children"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
        },
    });
}

export function useUpdateDaycareChild() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
            const response = await fetch(`/api/daycare/children/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error("Failed to update child");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/children"] });
        },
    });
}

// ============================================
// INQUIRIES MANAGEMENT
// ============================================

export function useDaycareInquiries(status?: string) {
    return useQuery({
        queryKey: ["/api/daycare/inquiries", status],
        queryFn: async () => {
            const url = status ? `/api/daycare/inquiries?status=${status}` : "/api/daycare/inquiries";
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch inquiries");
            return response.json();
        },
    });
}

export function useCreateDaycareInquiry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (inquiryData: any) => {
            const response = await fetch("/api/daycare/inquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inquiryData),
            });
            if (!response.ok) throw new Error("Failed to create inquiry");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/inquiries"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
        },
    });
}

// ============================================
// ATTENDANCE MANAGEMENT
// ============================================

export function useTodayAttendance() {
    return useQuery({
        queryKey: ["/api/daycare/attendance/today"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/attendance/today");
            if (!response.ok) throw new Error("Failed to fetch today's attendance");
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useCurrentlyCheckedIn() {
    return useQuery({
        queryKey: ["/api/daycare/attendance/checked-in"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/attendance/checked-in");
            if (!response.ok) throw new Error("Failed to fetch checked-in children");
            return response.json();
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

export function useCheckInChild() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (checkInData: any) => {
            const response = await fetch("/api/daycare/attendance/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkInData),
            });
            if (!response.ok) throw new Error("Failed to check in child");
            return response.json();
        },
        onSuccess: () => {
            // Invalidate all attendance-related queries for instant update
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/attendance/checked-in"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/attendance/today"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
        },
    });
}

export function useCheckOutChild() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, checkOutTime, userId }: { id: number; checkOutTime: string; userId: number }) => {
            const response = await fetch(`/api/daycare/attendance/${id}/check-out`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ checkOutTime, userId }),
            });
            if (!response.ok) throw new Error("Failed to check out child");
            return response.json();
        },
        onSuccess: () => {
            // Invalidate all attendance-related queries for instant update
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/attendance/checked-in"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/attendance/today"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
        },
    });
}

// ============================================
// ENROLLMENT MANAGEMENT
// ============================================

export function useDaycareEnrollments(includeInactive = false) {
    return useQuery({
        queryKey: ["/api/daycare/enrollments", includeInactive],
        queryFn: async () => {
            const url = `/api/daycare/enrollments${includeInactive ? '?includeInactive=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch enrollments");
            return response.json();
        },
    });
}

export function useCreateEnrollment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (enrollmentData: any) => {
            const response = await fetch("/api/daycare/enrollments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(enrollmentData),
            });
            if (!response.ok) throw new Error("Failed to create enrollment");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/enrollments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
        },
    });
}

// ============================================
// PAYMENT MANAGEMENT
// ============================================

export function useDaycarePayments() {
    return useQuery({
        queryKey: ["/api/daycare/payments"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/payments");
            if (!response.ok) throw new Error("Failed to fetch payments");
            return response.json();
        },
    });
}

export function useRecordPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (paymentData: any) => {
            const response = await fetch("/api/daycare/payments/record", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
            });
            if (!response.ok) throw new Error("Failed to record payment");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/payments"] });
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/stats"] });
        },
    });
}

// ============================================
// BILLING CONFIGURATION
// ============================================

export function useActiveBillingConfig() {
    return useQuery({
        queryKey: ["/api/daycare/billing-config/active"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/billing-config/active");
            if (!response.ok) throw new Error("Failed to fetch active billing config");
            return response.json();
        },
    });
}

export function useBillingConfigs() {
    return useQuery({
        queryKey: ["/api/daycare/billing-config"],
        queryFn: async () => {
            const response = await fetch("/api/daycare/billing-config");
            if (!response.ok) throw new Error("Failed to fetch billing configs");
            return response.json();
        },
    });
}

export function useCreateBillingConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (configData: any) => {
            const response = await fetch("/api/daycare/billing-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(configData),
            });
            if (!response.ok) throw new Error("Failed to create billing config");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/billing-config"] });
        },
    });
}

export function useUpdateBillingConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
            const response = await fetch(`/api/daycare/billing-config/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error("Failed to update billing config");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/daycare/billing-config"] });
        },
    });
}
