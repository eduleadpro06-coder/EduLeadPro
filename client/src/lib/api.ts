/**
 * Unified API Client
 * Centralized API calls with automatic authentication using React Query
 */

import { authService } from './auth';

class APIClient {
    private baseURL = '/api';

    /**
     * Generic fetch with automatic JWT authentication
     */
    private async fetch<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const response = await authService.fetchWithAuth(url, options);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Request failed' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const queryString = params ? `?${new URLSearchParams(params)}` : '';
        return this.fetch<T>(`${endpoint}${queryString}`, {
            method: 'GET',
        });
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.fetch<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.fetch<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.fetch<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        return this.fetch<T>(endpoint, {
            method: 'DELETE',
        });
    }

    // ============================================
    // Specific API Methods
    // ============================================

    // Dashboard
    getDashboardAnalytics(organizationId?: number) {
        return this.get<any>('/dashboard/analytics', organizationId ? { organizationId } : undefined);
    }

    // Leads
    getLeads(filters?: any) {
        return this.get<any[]>('/leads', filters);
    }

    getLead(id: number) {
        return this.get<any>(`/leads/${id}`);
    }

    createLead(data: any) {
        return this.post<any>('/leads', data);
    }

    updateLead(id: number, data: any) {
        return this.put<any>(`/leads/${id}`, data);
    }

    deleteLead(id: number) {
        return this.delete<any>(`/leads/${id}`);
    }

    // Students
    getStudents(filters?: any) {
        return this.get<any[]>('/students', filters);
    }

    getStudent(id: number) {
        return this.get<any>(`/students/${id}`);
    }

    createStudent(data: any) {
        return this.post<any>('/students', data);
    }

    updateStudent(id: number, data: any) {
        return this.put<any>(`/students/${id}`, data);
    }

    // Staff
    getStaff(filters?: any) {
        return this.get<any[]>('/staff', filters);
    }

    createStaff(data: any) {
        return this.post<any>('/staff', data);
    }

    updateStaff(id: number, data: any) {
        return this.put<any>(`/staff/${id}`, data);
    }

    deleteStaff(id: number) {
        return this.delete<any>(`/staff/${id}`);
    }

    // Expenses
    getExpenses(filters?: any) {
        return this.get<any[]>('/expenses', filters);
    }

    createExpense(data: any) {
        return this.post<any>('/expenses', data);
    }

    updateExpense(id: number, data: any) {
        return this.put<any>(`/expenses/${id}`, data);
    }

    deleteExpense(id: number) {
        return this.delete<any>(`/expenses/${id}`);
    }

    // Fee Payments
    getFeePayments(studentId?: number) {
        return this.get<any[]>('/fee-payments', studentId ? { studentId } : undefined);
    }

    createFeePayment(data: any) {
        return this.post<any>('/fee-payments', data);
    }

    // Reports
    getPaymentReport(filters?: any) {
        return this.get<any>('/reports/payments', filters);
    }

    getCounselorPerformance() {
        return this.get<any>('/reports/counselor-performance');
    }

    getEnrollmentTrends() {
        return this.get<any>('/reports/enrollment-trends');
    }

    // Settings
    getOrganizationSettings() {
        return this.get<any>('/organization/settings');
    }

    updateOrganizationSettings(settings: any) {
        return this.patch<any>('/organization/settings', { settings });
    }

    // Cache invalidation
    invalidateDashboardCache() {
        return this.post<any>('/cache/invalidate/dashboard');
    }
}

export const apiClient = new APIClient();
