import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { FollowUp } from "@shared/schema";
import { apiRequest } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Simple beep sound
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...";
// I will use a reliable public URL for a "ding" sound to avoid massive base64 string if possible, 
// or I can generate a short beep using AudioContext. Generated is better.

const playBeep = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Failed to play notification sound", e);
    }
};

export default function FollowUpMonitor() {
    const { notifications, createNotification } = useNotificationContext();
    const { toast } = useToast();

    // Use a ref to track IDs we've already processed in this session 
    // to avoid spamming if the API returns the same item repeatedly before we refresh data
    const processedRef = useRef<Set<number>>(new Set());

    // Poll for overdue follow-ups every 30 seconds
    const { data: overdueFollowUps = [] } = useQuery<FollowUp[]>({
        queryKey: ["/api/follow-ups/overdue"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/follow-ups/overdue");
            return res.json();
        },
        refetchInterval: 30000,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (!overdueFollowUps.length) return;

        overdueFollowUps.forEach(async (followUp) => {
            // Check if we already processed this ID in this session
            if (processedRef.current.has(followUp.id)) return;

            // Check if a persistent notification already exists for this follow-up
            // We look for type 'followup' and actionId matching the followUp.id
            const alreadyNotified = notifications.some(
                (n) => n.type === "followup" && n.actionId === String(followUp.id)
            );

            if (alreadyNotified) {
                processedRef.current.add(followUp.id);
                return;
            }

            // If new, create notification
            try {
                await createNotification({
                    userId: 1, // Default to admin/current user for now. Ideally from auth context.
                    type: "followup",
                    title: "Follow-up Due",
                    message: `Follow-up for lead #${followUp.leadId} is due.`,
                    priority: "high",
                    read: false,
                    actionType: "view_lead",
                    actionId: String(followUp.id), // Store follow-up ID
                    metadata: JSON.stringify({ leadId: followUp.leadId, scheduledAt: followUp.scheduledAt })
                });

                // Mark as processed
                processedRef.current.add(followUp.id);

                // Play sound
                playBeep();

                // Show toast
                toast({
                    title: "Follow-up Reminder",
                    description: `You have a pending follow-up scheduled for now.`,
                });

            } catch (err) {
                console.error("Failed to create follow-up notification", err);
            }
        });

    }, [overdueFollowUps, notifications, createNotification, toast]);

    return null;
}
