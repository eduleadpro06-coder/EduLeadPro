import { useState, useEffect } from "react";
import { ClipboardList, Bell } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import type { Notification } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useLocation } from "wouter";

// Activity types — everything that's NOT a direct actionable alert
const ACTIVITY_TYPES = ["payment", "admission", "staff", "student", "expense", "event", "attendance", "exam"];

export default function ActivityLog() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { notifications, markAsRead, refresh } = useNotificationContext();

  // Filter to only activity-type notifications
  const activityItems = notifications.filter(n => ACTIVITY_TYPES.includes(n.type));

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  const handleClick = (item: Notification) => {
    markAsRead(item.id);
    setIsOpen(false);

    if (item.actionType && item.actionId) {
      switch (item.actionType) {
        case 'view_student_fees':
          setLocation(`/student-fees?id=${item.actionId}`);
          break;
        case 'view_staff':
          setLocation(`/staff-directory?id=${item.actionId}`);
          break;
        case 'view_admission':
          setLocation(`/students?id=${item.actionId}`);
          break;
        default:
          if (item.type === 'payment') setLocation(`/student-fees?id=${item.actionId}`);
          else if (item.type === 'expense') setLocation('/expenses');
          else if (item.type === 'staff') setLocation('/staff-directory');
      }
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ClipboardList className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[400px] md:w-[500px]" align="end">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Activity Log</h3>
            {activityItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activityItems.length}
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[500px]">
          <AnimatePresence>
            {activityItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DropdownMenuItem
                  className={cn(
                    "flex flex-col items-start p-4 cursor-pointer transition-colors bg-white",
                    "focus:bg-gray-50 focus:text-gray-900 data-[highlighted]:bg-gray-50 data-[highlighted]:text-gray-900",
                    !item.read && "border-l-4 border-l-blue-400",
                    item.read && "border-l-4 border-l-transparent opacity-70"
                  )}
                  onClick={() => handleClick(item)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getActivityIcon(item.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.createdAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            ))}
            {activityItems.length === 0 && (
              <div className="flex flex-col items-center justify-center p-8">
                <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-center text-muted-foreground">No recent activity</p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case "payment": return <div className="p-1.5 rounded-full bg-green-100 text-green-700"><Bell size={14} /></div>;
    case "admission": return <div className="p-1.5 rounded-full bg-blue-100 text-blue-700"><Bell size={14} /></div>;
    case "staff": return <div className="p-1.5 rounded-full bg-indigo-100 text-indigo-700"><Bell size={14} /></div>;
    case "student": return <div className="p-1.5 rounded-full bg-violet-100 text-violet-700"><Bell size={14} /></div>;
    case "expense": return <div className="p-1.5 rounded-full bg-orange-100 text-orange-700"><Bell size={14} /></div>;
    case "event": return <div className="p-1.5 rounded-full bg-pink-100 text-pink-700"><Bell size={14} /></div>;
    case "attendance": return <div className="p-1.5 rounded-full bg-amber-100 text-amber-700"><Bell size={14} /></div>;
    case "exam": return <div className="p-1.5 rounded-full bg-purple-100 text-purple-700"><Bell size={14} /></div>;
    default: return <div className="p-1.5 rounded-full bg-gray-100 text-gray-700"><Bell size={14} /></div>;
  }
}
