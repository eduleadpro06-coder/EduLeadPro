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
  const url = path.startsWith("/api") ? path : `${baseURL}${path}`;

  // Get auth headers from localStorage
  const getAuthHeaders = (): Record<string, string> => {
    try {
      const userStr = localStorage.getItem('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.email) {
          return { 'x-user-name': user.email };
        }
      }
    } catch (e) {
      console.error("Error parsing auth user for headers:", e);
    }
    return {};
  };

  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(), // Add auth headers
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

/**
 * Timezone Utilities for IST (Indian Standard Time, UTC+5:30)
 */

/**
 * Converts a date to IST timezone
 * @param date - Date string, Date object, or timestamp
 * @returns Date object adjusted to IST
 */
export function toIST(date: string | Date | number): Date {
  const d = new Date(date);
  // IST is UTC+5:30 (330 minutes)
  const istOffset = 330; // minutes
  const utcTime = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utcTime + (istOffset * 60000));
}

/**
 * Formats a date in IST timezone
 * @param date - Date string, Date object, or timestamp
 * @param formatStr - Format string (uses Intl.DateTimeFormat options)
 * @returns Formatted date string in IST
 */
export function formatDateIST(date: string | Date | number, formatStr?: string): string {
  const d = new Date(date);

  // Default format options for IST
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Formats a date for display with full details in IST
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string like "Jan 21, 2026, 7:14:05 PM"
 */
export function formatDateTimeIST(date: string | Date | number): string {
  const d = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Get current date/time in IST
 * @returns Current Date in IST
 */
export function nowIST(): Date {
  return toIST(new Date());
}

