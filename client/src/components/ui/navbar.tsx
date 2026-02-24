import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

interface NavBarProps {
  items: Array<{ name: string; url: string; icon: React.ElementType }>;
  className?: string;
  setLocation?: (path: string) => void;
  user?: any;
  loading?: boolean;
  activeTab: string;
  setActiveTab: (name: string) => void;
  handleNavClick?: (item: any) => void;
}

const NavBar = ({ items, className, setLocation, user, loading, activeTab, setActiveTab, handleNavClick }: NavBarProps) => {
  const [location] = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  // Prefetch dashboard data on hover so it loads instantly on click
  const handleDashboardHover = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['/api/dashboard/analytics'],
      queryFn: async () => {
        const res = await fetch('/api/dashboard/analytics');
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      },
      staleTime: 30000, // Consider fresh for 30s
    });
  }, [queryClient]);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const defaultHandleNavClick = (item: any) => {
    setActiveTab(item.name);
    if (item.url.startsWith("/")) {
      if (setLocation) {
        setLocation(item.url);
      } else {
        window.location.href = item.url;
      }
    } else if (item.url.startsWith("#")) {
      const section = document.getElementById(item.url.replace("#", ""));
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className={cn("fixed top-0 left-1/2 -translate-x-1/2 z-50 pt-4", className)}>
      <div className="flex items-center gap-4 bg-white/20 backdrop-blur-lg border border-white/30 rounded-full shadow-lg py-0.5 pl-3 pr-1">
        {/* Logo at the start of the NavBar */}
        <a
          href="/"
          className="flex items-center gap-2 text-white font-extrabold text-2xl md:text-3xl tracking-tight hover:opacity-90 transition-opacity pl-2 pr-4 select-none"
        >
          {/* Yonerra brand logo */}
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">YONERRA</span>
        </a>
        {items.filter(item => item.name !== "Home").map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <a
              key={item.name}
              href={item.url}
              onClick={e => {
                e.preventDefault();
                (handleNavClick || defaultHandleNavClick)(item);
              }}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-4 py-1 rounded-full transition-colors",
                "text-white hover:text-white",
                isActive && "bg-[#643ae5]"
              )}
            >
              <span className="hidden md:inline whitespace-nowrap">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div layoutId="lamp" className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10" initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
            </a>
          );
        })}
        {/* Auth CTA: skeleton while loading, then button based on auth state */}
        {loading ? (
          <div className="rounded-full px-6 py-2 w-[180px] h-[36px] bg-white/10 animate-pulse" />
        ) : user ? (
          <Button
            onClick={() => (setLocation ? setLocation('/dashboard') : window.location.href = '/dashboard')}
            onMouseEnter={handleDashboardHover}
            className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow hover:scale-105 hover:brightness-110 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Return to Dashboard
          </Button>
        ) : location === '/login' ? null : (
          <Button
            onClick={() => (setLocation ? setLocation('/login') : window.location.href = '/login')}
            className="rounded-full px-6 py-2 font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow hover:scale-105 hover:brightness-110 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Login
          </Button>
        )}

      </div>
    </div>
  );
};

export default NavBar; 