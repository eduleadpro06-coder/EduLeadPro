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
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="absolute left-64 top-0 h-full w-1 bg-gradient-to-b from-transparent via-[#62656e] to-transparent opacity-40 pointer-events-none z-20"></div>
      <div className="flex-1 ml-64 transition-all duration-300">
        <Header title="Dashboard" />
        <main className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
