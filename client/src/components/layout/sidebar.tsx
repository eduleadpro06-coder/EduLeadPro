import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  Brain, 
  Megaphone, 
  FileText, 
  Settings,
  GraduationCap,
  Home,
  LogOut,
  IndianRupee,
  Wallet,
  UserCheck,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Bot,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Lead Management", href: "/leads", icon: Users },
  { name: "Employee Management", href: "/staff-ai", icon: UserCheck },
  { name: "Student, Fees & EMI", href: "/student-fees", icon: IndianRupee },
  { name: "AI Forecasting", href: "/ai-forecasting", icon: Brain },
  { name: "AI Marketing", href: "/ai-marketing", icon: Megaphone },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  // Removed Analytics tab
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [customInstituteName, setCustomInstituteName] = useState(() => {
    return localStorage.getItem("customInstituteName") || "";
  });

  // Listen for changes to customInstituteName in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setCustomInstituteName(localStorage.getItem("customInstituteName") || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/landing";
  };

  return (
    <div className="w-64 bg-black fixed h-full z-10 sidebar-black-shadow flex flex-col justify-between">
      <div>
        <div className="p-6 pb-2">
          <Link href="/landing">
            <div className="flex flex-col items-start justify-center select-none" style={{ textShadow: '0 2px 8px #0008' }}>
              <span className="text-2xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">EduLead</span>
                <span className="text-white"> Pro</span>
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1 ml-0">AI-Powered CRM</span>
            </div>
          </Link>
        </div>
        {customInstituteName && (
          <div className="px-6 py-4 bg-black border-b border-[#232a3a]">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <p className="text-base font-medium text-foreground">{customInstituteName}</p>
            </div>
          </div>
        )}
        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {navigation.map((item, idx) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              // Add divider after certain items for grouping
              const dividerAfter = [3, 6].includes(idx);
              return (
                <>
                  <Link
                    key={item.name}
                    href={item.href}
                  >
                    <div
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer relative group 
                        ${isActive ? 'bg-[#181f36] border-l-4 border-[#a259ff]' : 'hover:bg-[#131b2d] hover:text-[#a084fa]'}
                      `}
                    >
                      <span className={isActive ? 'text-[#a259ff]' : 'text-[#8b9cc9] group-hover:text-[#a084fa]'}>
                        <Icon size={18} />
                      </span>
                      <span className={`font-medium text-sm ${isActive ? 'text-[#a259ff]' : 'text-[#8b9cc9] group-hover:text-[#a084fa]'}`}>
                        {item.name}
                      </span>
                    </div>
                  </Link>
                  {dividerAfter && (
                    <div className="my-2 border-t border-[#232a3a] mx-2"></div>
                  )}
                </>
              );
            })}
          </div>
        </nav>
      </div>
      {/* Bottom section for settings or template pages if needed */}
      {/* <div className="px-3 pb-6">
        <div className="my-2 border-t border-[#232a3a] mx-2"></div>
        <Link href="/settings">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group hover:bg-[#131b2d]">
            <Settings className="text-[#bfc8e6] group-hover:text-[#a084fa]" size={18} />
            <span className="font-medium text-sm text-[#bfc8e6] group-hover:text-[#a084fa]">Settings</span>
          </div>
        </Link>
      </div> */}
    </div>
  );
}
