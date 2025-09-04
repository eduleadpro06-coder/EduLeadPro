import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { QueryClient } from "@tanstack/react-query";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, maxLength: number) {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + "...";
  }
  return str;
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function apiRequest(
  method: string,
  path: string,
  body?: any
): Promise<Response> {
  const baseURL = "/api";
  const url = `${baseURL}${path}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`API Request: ${method} ${url}`);
  
  try {
    const response = await fetch(url, options);
    
    console.log(`API Response: Status ${response.status}`);
    
    const contentType = response.headers.get("Content-Type");
    console.log(`API Response Content-Type: ${contentType}`);
    
    // Clone response for logging if needed (since response body can only be read once)
    const responseClone = response.clone();
    
    // Check if response is successful (status code 2xx)
    if (!response.ok) {
      // Create a custom error object with additional properties
      const error: any = new Error(`HTTP error! Status: ${response.status}`);
      
      // Try to parse response as JSON first
      if (contentType && contentType.includes("application/json")) {
        try {
          error.errorData = await response.json();
          console.log("JSON Error Response:", error.errorData);
        } catch (e) {
          console.error("Failed to parse JSON error response:", e);
          const responseText = await responseClone.text();
          console.log("Raw Error Response:", responseText);
          error.errorData = { message: "Could not parse JSON error response" };
        }
      } else {
        // If not JSON, get the response text
        const responseText = await response.text();
        console.log("Non-JSON Error Response:", responseText);
        error.errorData = { message: responseText };
      }
      
      error.status = response.status;
      throw error;
    }
    
    return response;
  } catch (error) {
    console.error("API Request Failed:", error);
    throw error;
  }
}

export function invalidateNotifications(queryClient: QueryClient): void {
  // Invalidate all notification-related queries
  queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  
  // Also trigger a custom event to refresh notifications
  window.dispatchEvent(new CustomEvent('refreshNotifications'));
}
