import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { io } from "socket.io-client";

// Simple beep sound (reuse from FollowUpMonitor or import)
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

export default function LeadMonitor() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        // Connect to Socket.IO
        // Note: In development, Vite proxy handles /socket.io. In PROD, it connects to domain.
        const socket = io({
            path: "/socket.io",
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            console.log("LeadMonitor connected to WebSocket");
        });

        // Listen for new leads
        socket.on("lead:new", (data: { type: string, message: string, leadId: number }) => {
            console.log("New Lead Received:", data);

            // 1. Play Sound
            playBeep();

            // 2. Show Toast
            toast({
                title: "New Lead Received! 🎉",
                description: data.message,
                variant: "default", // or custom style
                duration: 5000,
            });

            // 3. Refresh Data
            // Invalidating "leads" queries matches /api/leads, /api/dashboard/leads, etc.
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient, toast]);

    return null;
}
