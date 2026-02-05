import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, User, LogOut, Settings, ChevronDown, Sun, Moon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationCenter from "@/components/notifications/notification-center";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

import { useSidebar } from "@/contexts/SidebarContext";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  onMenuClick?: () => void;
}

export default function Header({ title, subtitle, className, onMenuClick }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  // Try to use sidebar context, fail gracefully if not available (e.g. tests)
  let sidebarToggle = () => { };
  try {
    const { toggle } = useSidebar();
    sidebarToggle = toggle;
  } catch (e) {
    // Ignore
  }

  const handleMenuClick = onMenuClick || sidebarToggle;

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 ${className || ''}`}>
      <div className="flex items-center justify-between lg:pl-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden -ml-2 text-gray-500 hover:text-gray-700"
            onClick={handleMenuClick}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
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
                <p className="text-sm font-medium text-foreground">{user?.displayName || user?.email || 'User'}</p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
              <Avatar className="w-8 h-8">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName || user.email || 'User avatar'} />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {(user?.displayName || user?.email || 'U')
                    .split(/\s+/)
                    .map(p => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      {user?.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.displayName || user.email || 'User avatar'} />
                      ) : null}
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(user?.displayName || user?.email || 'U')
                          .split(/\s+/)
                          .map(p => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user?.displayName || user?.email || 'User'}</p>
                      {user?.organizationName && (
                        <p className="text-xs text-purple-600 font-medium">{user.organizationName}</p>
                      )}
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
                  <div className="border-t border-gray-200 my-1"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      await signOut();
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
