import { useEffect, useRef, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Simple beep sound
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
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("Failed to play notification sound", e);
    }
};

interface Lead {
    id: number;
    name: string;
    source: string;
    createdAt: string;
}

export default function LeadMonitor() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const lastProcessedId = useRef<number | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Reuse the existing /api/leads endpoint (just take the first result)
    const { data: leads } = useQuery<Lead[]>({
        queryKey: ["/api/leads"],
        refetchInterval: 15000, // Poll every 15 seconds
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (!leads || leads.length === 0) return;

        // Get the most recent lead (first in array if sorted by newest)
        const latestLead = leads[0];

        // On first load, just set the baseline ID, don't notify
        if (!isInitialized) {
            lastProcessedId.current = latestLead.id;
            setIsInitialized(true);
            return;
        }

        // Check if we have a NEW lead (ID is higher than what we last saw)
        if (latestLead.id > (lastProcessedId.current || 0)) {
            console.log("🔔 New Lead Detected:", latestLead);

            // 1. Play Sound
            playBeep();

            // 2. Determine Message based on source
            const sourceDisplay = latestLead.source === 'facebook_ads' ? 'Facebook Ads' :
                latestLead.source.includes('google') || latestLead.source.includes('Walk-in') ? 'Google Form Walk-in' :
                    latestLead.source;

            // 3. Show Toast
            toast({
                title: "New Lead Received! 🎉",
                description: `${latestLead.name} via ${sourceDisplay}`,
                variant: "default",
                duration: 5000,
            });

            // 4. Refresh Dashboard (leads list is already auto-updated by React Query)
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });

            // Update tracker
            lastProcessedId.current = latestLead.id;
        }
    }, [leads, isInitialized, queryClient, toast]);

    return null;
}
