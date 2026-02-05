import React from "react";
import Sidebar from "./sidebar";

interface ShellProps {
    children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
            <Sidebar />
            {/* 
        Responsive Margin:
        - ml-0 on mobile (content takes full width, sidebar overrides or is hidden)
        - lg:ml-64 on large screens (content respects fixed sidebar)
      */}
            <div className="flex-1 transition-all duration-300 ml-0 lg:ml-64 w-full">
                {children}
            </div>
        </div>
    );
}
