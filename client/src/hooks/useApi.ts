/**
 * React Query Hooks for Admin Panel
 * Standardized data fetching with caching, loading states, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboardAnalytics(organizationId?: number) {
    return useQuery({
        queryKey: ['dashboard', 'analytics', organizationId],
        queryFn: () => apiClient.getDashboardAnalytics(organizationId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    });
}

// ============================================
// Leads Hooks
// ============================================

export function useLeads(filters?: any) {
    return useQuery({
        queryKey: ['leads', filters],
        queryFn: () => apiClient.getLeads(filters),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

export function useLead(id: number) {
    return useQuery({
        queryKey: ['leads', id],
        queryFn: () => apiClient.getLead(id),
        enabled: !!id,
    });
}

export function useCreateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => apiClient.createLead(data),
        onSuccess: () => {
            // Invalidate leads list to refetch
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useUpdateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiClient.updateLead(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['leads', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useDeleteLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteLead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

// ============================================
// Students Hooks
// ============================================

export function useStudents(filters?: any) {
    return useQuery({
        queryKey: ['students', filters],
        queryFn: () => apiClient.getStudents(filters),
        staleTime: 1 * 60 * 1000,
    });
}

export function useStudent(id: number) {
    return useQuery({
        queryKey: ['students', id],
        queryFn: () => apiClient.getStudent(id),
        enabled: !!id,
    });
}

export function useCreateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => apiClient.createStudent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useUpdateStudent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiClient.updateStudent(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['students', variables.id] });
        },
    });
}

// ============================================
// Staff Hooks
// ============================================

export function useStaff(filters?: any) {
    return useQuery({
        queryKey: ['staff', filters],
        queryFn: () => apiClient.getStaff(filters),
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => apiClient.createStaff(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}

export function useUpdateStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiClient.updateStaff(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}

export function useDeleteStaff() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteStaff(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
}

// ============================================
// Expenses Hooks
// ============================================

export function useExpenses(filters?: any) {
    return useQuery({
        queryKey: ['expenses', filters],
        queryFn: () => apiClient.getExpenses(filters),
        staleTime: 1 * 60 * 1000,
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => apiClient.createExpense(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiClient.updateExpense(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => apiClient.deleteExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

// ============================================
// Settings Hooks
// ============================================

export function useOrganizationSettings() {
    return useQuery({
        queryKey: ['organization', 'settings'],
        queryFn: () => apiClient.getOrganizationSettings(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useUpdateOrganizationSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (settings: any) => apiClient.updateOrganizationSettings(settings),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization', 'settings'] });
        },
    });
}
