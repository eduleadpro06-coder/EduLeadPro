import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Settings,
  IndianRupee,
  Wallet,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  Baby,
  Package,
  FileText,
  Facebook,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getActiveAIFeatures, getComingSoonFeatures, isAIFeaturePath } from "@/config/aiFeatures";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Lead Management", href: "/leads", icon: Users },
  { name: "Student, Fees & EMI", href: "/student-fees", icon: IndianRupee },
  { name: "Daycare Management", href: "/daycare", icon: Baby },
  { name: "Employee Management", href: "/staff-ai", icon: UserCheck },
  { name: "Stock Management", href: "/inventory", icon: Package },
  { name: "Expenses", href: "/expenses", icon: Wallet },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Meta Marketing", href: "/meta-marketing", icon: Facebook, separator: true },
];


export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [customInstituteName, setCustomInstituteName] = useState(() => {
    return localStorage.getItem("customInstituteName") || "";
  });
  const [isAIExpanded, setIsAIExpanded] = useState(() => {
    // Check if current location is an AI feature to auto-expand
    return isAIFeaturePath(location);
  });

  // Get AI features
  const activeAIFeatures = getActiveAIFeatures();
  const comingSoonFeatures = getComingSoonFeatures();

  // Listen for changes to customInstituteName in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setCustomInstituteName(localStorage.getItem("customInstituteName") || "");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Auto-expand AI section if user navigates to an AI feature
  useEffect(() => {
    if (isAIFeaturePath(location)) {
      setIsAIExpanded(true);
    }
  }, [location]);

  // Feature flag for AI features
  const [showAIFeatures, setShowAIFeatures] = useState(() => {
    return localStorage.getItem("showAIFeatures") === "true";
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl + Alt + M
      if (event.ctrlKey && event.altKey && (event.key === 'v' || event.key === 'V')) {
        event.preventDefault();
        setShowAIFeatures(prev => {
          const newValue = !prev;
          localStorage.setItem("showAIFeatures", String(newValue));
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/landing";
  };

  return (
    <div className="w-64 bg-white fixed h-full z-10 shadow-xl border-r border-gray-200 flex flex-col justify-between">
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
        {user?.organizationName && (
          <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
              <p className="text-base font-semibold text-purple-700">
                {user.organizationName}
              </p>
            </div>
          </div>
        )}
        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {navigation.map((item, idx) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              // Add divider after Daycare Management (index 3)
              const dividerAfter = idx === 3;
              // Add divider before item if separator flag is true
              const dividerBefore = (item as any).separator === true;
              return (
                <>
                  {dividerBefore && (
                    <div className="my-2 border-t border-gray-200 mx-2"></div>
                  )}
                  <Link
                    key={item.name}
                    href={item.href}
                  >
                    <div
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer relative group 
                        ${isActive ? 'bg-purple-50 border-l-4 border-[#a259ff]' : 'hover:bg-gray-100 hover:text-purple-600'}
                      `}
                    >
                      <span className={isActive ? 'text-[#a259ff]' : 'text-gray-500 group-hover:text-purple-600'}>
                        <Icon size={18} />
                      </span>
                      <span className={`font-medium text-sm ${isActive ? 'text-[#a259ff]' : 'text-gray-600 group-hover:text-purple-600'}`}>
                        {item.name}
                      </span>
                    </div>
                  </Link>
                  {dividerAfter && (
                    <div className="my-2 border-t border-gray-200 mx-2"></div>
                  )}
                </>
              );
            })}

            {/* AI Features Section */}
            {showAIFeatures && (
              <div className="mt-4">
                <div
                  onClick={() => setIsAIExpanded(!isAIExpanded)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group hover:bg-gray-100`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-500 group-hover:text-purple-600">
                      <Sparkles size={18} />
                    </span>
                    <span className="font-medium text-sm text-gray-600 group-hover:text-purple-600">
                      AI Features
                    </span>
                  </div>
                  <span className="text-gray-500 group-hover:text-purple-600">
                    {isAIExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </div>

                {/* AI Features Submenu */}
                <div className={`overflow-hidden transition-all duration-300 ${isAIExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-6 mt-2 space-y-1">
                    {/* Active AI Features */}
                    {activeAIFeatures.map((feature) => {
                      const isActive = location === feature.href;
                      const Icon = feature.icon;
                      return (
                        <Link key={feature.id} href={feature.href}>
                          <div
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer relative group
                              ${isActive ? 'bg-purple-50 border-l-4 border-[#a259ff]' : 'hover:bg-gray-100 hover:text-purple-600'}
                            `}
                          >
                            <span className={isActive ? 'text-[#a259ff]' : 'text-gray-500 group-hover:text-purple-600'}>
                              <Icon size={16} />
                            </span>
                            <div className="flex-1">
                              <span className={`font-medium text-sm ${isActive ? 'text-[#a259ff]' : 'text-gray-600 group-hover:text-purple-600'}`}>
                                {feature.name}
                              </span>
                              <div className={`text-xs ${isActive ? 'text-[#a259ff]/70' : 'text-gray-500 group-hover:text-purple-600/70'}`}>
                                {feature.description}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {/* Coming Soon Features */}
                    {comingSoonFeatures.length > 0 && (
                      <>
                        <div className="px-3 py-2 mt-3">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Coming Soon
                          </div>
                        </div>
                        {comingSoonFeatures.map((feature) => {
                          const Icon = feature.icon;
                          return (
                            <div
                              key={feature.id}
                              className="flex items-center space-x-3 px-3 py-2 rounded-lg opacity-60 cursor-not-allowed"
                            >
                              <span className="text-gray-400">
                                <Icon size={16} />
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-gray-400">
                                    {feature.name}
                                  </span>
                                  <Clock size={12} className="text-gray-400" />
                                </div>
                                <div className="text-xs text-gray-400">
                                  {feature.description}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Divider after AI Features */}
            <div className="my-2 border-t border-gray-200 mx-2"></div>
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
    </div >
  );
}
