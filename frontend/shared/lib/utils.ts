import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { QueryClient } from '@tanstack/react-query';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export apiRequest from queryClient
export { apiRequest } from './queryClient';

// Utility function to invalidate notification-related queries
export function invalidateNotifications(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
  queryClient.invalidateQueries({ queryKey: ['/api/notifications/stats'] });
}
