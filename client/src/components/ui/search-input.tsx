import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    /**
     * Custom placeholder text for the search input
     * @default "Search..."
     */
    placeholder?: string;
    /**
     * Additional CSS classes to apply to the wrapper div
     */
    wrapperClassName?: string;
}

/**
 * A reusable search input component with a search icon
 * Extracted from common search patterns across the application
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className, wrapperClassName, placeholder = "Search...", ...props }, ref) => {
        return (
            <div className={cn("relative group", wrapperClassName)}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-primary/70 group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none" />
                <Input
                    ref={ref}
                    type="text"
                    placeholder={placeholder}
                    className={cn(
                        "pl-10 h-10 w-full",
                        "bg-white/80 backdrop-blur-sm",
                        "border-gray-200 group-hover:border-primary/50 focus:border-primary",
                        "shadow-sm group-hover:shadow-md transition-all duration-300 ease-in-out",
                        "placeholder:text-gray-400 focus:bg-white",
                        "rounded-xl", // More modern rounded corners
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = "SearchInput";
