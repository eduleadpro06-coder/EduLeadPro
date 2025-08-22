import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline" | "secondary";
}

export function ThemeToggle({ className, size = "icon", variant = "ghost" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "relative transition-all duration-300 border-0 border-none outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:outline-none",
        className
      )}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Sun 
        className={cn(
          "h-[1.8rem] w-[1.8rem] transition-all duration-300",
          theme === "light" 
            ? "rotate-0 scale-100 text-yellow-600" 
            : "rotate-90 scale-0"
        )}
      />
      <Moon 
        className={cn(
          "absolute h-[1.8rem] w-[1.8rem] transition-all duration-300",
          theme === "light" 
            ? "-rotate-90 scale-0" 
            : "rotate-0 scale-100 text-blue-500"
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeToggle;
