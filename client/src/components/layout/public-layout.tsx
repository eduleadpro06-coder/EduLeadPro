import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import NavBar from '@/components/ui/navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Home, BarChart3, Brain, TrendingUp, Star, ChevronDown, GraduationCap } from 'lucide-react';

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "Features", url: "#features", icon: BarChart3 },
  { name: "AI Solutions", url: "#ai-future", icon: Brain },
  { name: "Dashboard", url: "#dashboard-highlights", icon: TrendingUp },
  { name: "Pricing", url: "/pricing", icon: Star },
  { name: "FAQ", url: "#faq-section", icon: ChevronDown },
  { name: "Contact", url: "#contact", icon: GraduationCap },
];

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState(navItems[0].name);

  useEffect(() => {
    const pageNavItem = navItems.find(item => item.url === location && !item.url.includes('#'));
    if (pageNavItem) {
      setActiveSection(pageNavItem.name);
    }

    const handleScroll = () => {
      if (location !== '/') return;

      const sectionIds = [
        { id: "home", name: "Home" },
        { id: "features", name: "Features" },
        { id: "ai-future", name: "AI Solutions" },
        { id: "dashboard-highlights", name: "Dashboard" },
        { id: "faq-section", name: "FAQ" },
        { id: "contact", name: "Contact" },
      ];
      
      let current = navItems[0].name;
      for (const section of sectionIds) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 80 && rect.bottom > 80) {
            current = section.name;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  function handleNavBarNavClick(item: { name: string; url: string; icon: React.ElementType }) {
    if (item.url.startsWith("#")) {
      if (location !== "/") {
        setLocation("/" + item.url);
      } else {
        const section = document.getElementById(item.url.replace("#", ""));
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      setLocation(item.url);
    }
  }

  return (
    <>
      <NavBar
        items={navItems}
        setLocation={setLocation}
        user={user}
        loading={loading}
        activeTab={activeSection}
        setActiveTab={setActiveSection}
        handleNavClick={handleNavBarNavClick}
      />
      {children}
    </>
  );
};

export default PublicLayout; 