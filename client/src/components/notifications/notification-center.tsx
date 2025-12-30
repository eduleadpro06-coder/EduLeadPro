import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationService, type NotificationStats } from "@/lib/notificationService";
import type { Notification } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface NotificationCategory {
  type: string;
  label: string;
  count: number;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh
  } = useNotificationContext();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[400px] md:w-[500px]" align="end">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {notifications.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => markAllAsRead()}
                  className="h-8 px-3 text-sm hover:bg-purple-50 hover:text-[#643ae5]"
                >
                  <Check size={12} className="mr-1.5" />
                  Mark all read
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => clearAll()}
                  className="h-8 px-3 text-sm hover:bg-red-50 hover:text-red-600"
                >
                  <X size={12} className="mr-1.5" />
                  Clear all
                </Button>
              </>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Loading notifications...</div>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownMenuItem
                    className={cn(
                      "flex flex-col items-start p-4 cursor-pointer transition-colors bg-white",
                      "focus:bg-gray-50 focus:text-gray-900 data-[highlighted]:bg-gray-50 data-[highlighted]:text-gray-900",
                      !notification.read && "border-l-4 border-l-purple-500",
                      notification.read && "border-l-4 border-l-transparent"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-1", getPriorityColor(notification.priority))}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100">
                          New
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
              {notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8">
                  <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-center text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper functions
function getPriorityColor(priority: string | null) {
  switch (priority) {
    case "high": return "text-red-500";
    case "medium": return "text-amber-500";
    case "low": return "text-blue-500";
    default: return "text-gray-500";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "admission": return <div className="p-1 rounded-full bg-blue-100 text-blue-700"><Bell size={16} /></div>;
    case "payment": return <div className="p-1 rounded-full bg-green-100 text-green-700"><Bell size={16} /></div>;
    case "attendance": return <div className="p-1 rounded-full bg-amber-100 text-amber-700"><Bell size={16} /></div>;
    case "exam": return <div className="p-1 rounded-full bg-purple-100 text-purple-700"><Bell size={16} /></div>;
    case "staff": return <div className="p-1 rounded-full bg-indigo-100 text-indigo-700"><Bell size={16} /></div>;
    case "event": return <div className="p-1 rounded-full bg-pink-100 text-pink-700"><Bell size={16} /></div>;
    case "lead": return <div className="p-1 rounded-full bg-cyan-100 text-cyan-700"><Bell size={16} /></div>;
    case "followup": return <div className="p-1 rounded-full bg-teal-100 text-teal-700"><Bell size={16} /></div>;
    case "expense": return <div className="p-1 rounded-full bg-orange-100 text-orange-700"><Bell size={16} /></div>;
    case "student": return <div className="p-1 rounded-full bg-violet-100 text-violet-700"><Bell size={16} /></div>;
    default: return <div className="p-1 rounded-full bg-gray-100 text-gray-700"><Bell size={16} /></div>;
  }
}