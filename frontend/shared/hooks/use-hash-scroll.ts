import { useEffect } from "react";
import { useLocation } from "wouter";

export function useHashScroll() {
  const [location] = useLocation();

  useEffect(() => {
    if (location.includes("#")) {
      const id = location.split("#")[1];
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // Delay to ensure DOM is ready
    }
  }, [location]);
} 