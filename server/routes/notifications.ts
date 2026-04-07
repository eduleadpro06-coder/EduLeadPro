import { Router } from "express";
import { storage } from "../storage.js";
import { getOrganizationId } from "../utils.js";
import { InsertNotification } from "@shared/schema";

const router = Router();

// GET /api/notifications?userId=1&limit=50
router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const notifications = await storage.getNotificationsByUser(userId, limit);
    res.json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread?userId=1
router.get("/unread", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    const notifications = await storage.getUnreadNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Failed to fetch unread notifications:", error);
    res.status(500).json({ message: "Failed to fetch unread notifications" });
  }
});

// GET /api/notifications/stats?userId=1
router.get("/stats", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId as string) || 1;
    const stats = await storage.getNotificationStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch notification stats:", error);
    res.status(500).json({ message: "Failed to fetch notification stats" });
  }
});

// POST /api/notifications
router.post("/", async (req, res) => {
  try {
    const notificationData: InsertNotification = req.body;
    const notification = await storage.createNotification(notificationData);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Failed to create notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await storage.markNotificationAsRead(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const count = await storage.markAllNotificationsAsRead(parseInt(userId));
    res.json({ message: `${count} notifications marked as read` });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

// DELETE /api/notifications/clear-all
router.delete("/clear-all", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const count = await storage.deleteAllNotifications(parseInt(userId));
    res.json({ message: `${count} notifications cleared` });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteNotification(id);
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

export default router;
