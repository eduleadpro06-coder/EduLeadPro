import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, User, LogOut, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import NotificationCenter from "@/components/notifications/notification-center";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Header({ title, subtitle, className }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={`bg-black shadow-sm px-6 py-4 ${className || ''}`}>
      <div className="flex items-center justify-between pl-2">
        <div />
        <div className="flex items-center space-x-4">
          <NotificationCenter />
          {/* Profile Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-3 p-2 hover:bg-border"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">Admissions Head</p>
              </div>
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-600">SJ</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
            
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-black border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/20 text-primary">SJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">Sarah Johnson</p>
                      <p className="text-xs text-muted-foreground">sarah.johnson@school.edu</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setLocation("/settings");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <User size={14} className="mr-2" />
                    Profile Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      setLocation("/settings");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <Settings size={14} className="mr-2" />
                    Account Settings
                  </Button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      localStorage.removeItem("user");
                      setLocation("/login");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <LogOut size={14} className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
