import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

interface PageHeaderProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    primaryActions?: React.ReactNode;
    filters?: React.ReactNode;
    showSearch?: boolean;
}

export default function PageHeader({
    searchPlaceholder = "Search...",
    searchValue = "",
    onSearchChange,
    primaryActions,
    filters,
    showSearch = true,
}: PageHeaderProps) {
    return (
        <div className="w-full px-6 pt-4 pb-4 flex flex-col gap-2">
            {/* Search and Actions Row */}
            <div className="flex flex-wrap items-center gap-4 w-full justify-between">
                {/* Search Bar and Filters */}
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    {/* Search Bar */}
                    {showSearch && (
                        <div className="relative flex-grow max-w-md">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-800 pointer-events-none" />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                className="pl-10 pr-4 py-2 w-full rounded-lg bg-white text-gray-800 placeholder:text-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[#643ae5] border-none shadow"
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
        </div>
    );
}
