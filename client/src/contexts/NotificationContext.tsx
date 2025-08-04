import React, { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import type { Notification } from "@shared/schema";

interface NotificationContextType {
  notifications: Notification[];
  stats: {
    total: number;
    unread: number;
    byType: Array<{ type: string; count: number }>;
  };
  loading: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  createNotification: (notification: Omit<Notification, "id" | "createdAt" | "updatedAt">) => Promise<Notification>;
  refresh: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  userId?: number;
}

export function NotificationProvider({ children, userId = 1 }: NotificationProviderProps) {
  const notificationData = useNotifications(userId);

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
} 