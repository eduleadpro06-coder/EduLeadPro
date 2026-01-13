import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "@/components/forms/lead-form";
import { Plus } from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Decorative gradient line - Only visible on desktop or when sidebar is open */}
      <div className={`hidden lg:block absolute left-64 top-0 h-full w-1 bg-gradient-to-b from-transparent via-[#62656e] to-transparent opacity-40 pointer-events-none z-20`}></div>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0 lg:ml-64'}`}>
        <Header
          title="Dashboard"
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-6 max-w-7xl mx-auto w-full space-y-6 md:space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
