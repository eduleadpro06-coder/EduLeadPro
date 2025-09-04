import { useState, useEffect, useCallback } from "react";
import { NotificationService, type NotificationStats } from "@/lib/notificationService";
import type { Notification } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useNotifications(userId: number = 1) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unread: 0, byType: [] });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications(userId, undefined, 50);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const loadStats = useCallback(async () => {
    try {
      const data = await NotificationService.getNotificationStats(userId);
      setStats(data);
    } catch (error) {
      console.error("Failed to load notification stats:", error);
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      loadStats();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  }, [loadStats, toast]);

  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead(userId);
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      loadStats();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  }, [userId, loadStats, toast]);

  const clearAll = useCallback(async () => {
    try {
      await NotificationService.clearAllNotifications(userId);
      setNotifications([]);
      loadStats();
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear all notifications",
        variant: "destructive",
      });
    }
  }, [userId, loadStats, toast]);

  const createNotification = useCallback(async (notification: Omit<Notification, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newNotification = await NotificationService.createNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      loadStats();
      return newNotification;
    } catch (error) {
      console.error("Failed to create notification:", error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
      throw error;
    }
  }, [loadStats, toast]);

  // Function to refresh notifications on demand
  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(),
      loadStats()
    ]);
  }, [loadNotifications, loadStats]);

  useEffect(() => {
    loadNotifications();
    loadStats();

    // Listen for custom refresh events
    const handleRefresh = () => {
      loadNotifications();
      loadStats();
    };

    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, [loadNotifications, loadStats]);

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    createNotification,
    refresh,
    refreshStats: loadStats
  };
} 