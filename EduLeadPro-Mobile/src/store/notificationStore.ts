import { create } from 'zustand';

interface NotificationState {
    hasUnread: boolean;
    setHasUnread: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    hasUnread: true, // Default to true so they see initial notices
    setHasUnread: (value) => set({ hasUnread: value }),
}));
