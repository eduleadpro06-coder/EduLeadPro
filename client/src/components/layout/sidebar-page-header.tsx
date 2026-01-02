import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

interface SidebarPageHeaderProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    primaryActions?: React.ReactNode;
    filters?: React.ReactNode;
    showSearch?: boolean;
}

/**
 * PageHeader variant optimized for sidebar-style layouts
 * (e.g., Student Fees, Lead Management with sidebar + detail panel)
 */
export default function SidebarPageHeader({
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    primaryActions,
    filters,
    showSearch = true,
}: SidebarPageHeaderProps) {
    return (
        <div className="w-full bg-gray-50 border-b border-gray-200">
            <div className="px-6 py-4">
                {/* Search and Filters Row */}
                {(showSearch || filters || primaryActions) && (
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                        {/* Search Bar and Filters */}
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            {/* Search Bar */}
                            {showSearch && (
                                <div className="relative flex-grow max-w-md">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        className="pl-10 pr-4 py-2 w-full rounded-lg bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#643ae5] border border-gray-300 shadow-sm"
                                        value={searchValue}
                                        onChange={(e) => onSearchChange?.(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Filters */}
                            {filters}
                        </div>

                        {/* Actions - Right Aligned */}
                        <div className="flex gap-2 items-center">
                            {primaryActions}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
