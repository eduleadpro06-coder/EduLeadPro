import type { Notification } from "@shared/schema";

const API_BASE = "/api";

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Array<{ type: string; count: number }>;
}

export class NotificationService {
  static async getNotifications(userId?: number, type?: string, limit?: number): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());
    if (type) params.append("type", type);
    if (limit) params.append("limit", limit.toString());

    const response = await fetch(`${API_BASE}/notifications?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return response.json();
  }

  static async getUnreadNotifications(userId?: number): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());

    const response = await fetch(`${API_BASE}/notifications/unread?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch unread notifications");
    }
    return response.json();
  }

  static async getNotificationStats(userId?: number): Promise<NotificationStats> {
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId.toString());

    const response = await fetch(`${API_BASE}/notifications/stats?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch notification stats");
    }
    return response.json();
  }

  static async createNotification(notification: Omit<Notification, "id" | "createdAt" | "updatedAt">): Promise<Notification> {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });
    if (!response.ok) {
      throw new Error("Failed to create notification");
    }
    return response.json();
  }

  static async markAsRead(id: number): Promise<Notification> {
    const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }
    return response.json();
  }

  static async markAllAsRead(userId?: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to mark all notifications as read");
    }
    return response.json();
  }

  static async deleteNotification(id: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete notification");
    }
    return response.json();
  }

  static async clearAllNotifications(userId?: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/notifications/clear-all`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error("Failed to clear all notifications");
    }
    return response.json();
  }
} 