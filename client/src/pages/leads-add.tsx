import AddLeadModal from "@/components/leads/add-lead-modal";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AddLeadPage() {
  const [, setLocation] = useLocation();
  // Always open the modal as a page
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <AddLeadModal open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o) setLocation("/leads"); // Go back to leads after closing
      }} />
    </div>
  );
} 