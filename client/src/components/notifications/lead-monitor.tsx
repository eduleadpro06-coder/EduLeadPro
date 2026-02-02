import { useEffect, useRef, useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/utils";

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

interface LatestLead {
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

    // Poll for the latest lead every 10 seconds
    const { data: latestLead } = useQuery<LatestLead>({
        queryKey: ["/api/leads/latest"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/leads/latest");
            return res.json();
        },
        refetchInterval: 10000, // Poll every 10 seconds
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (!latestLead) return;

        // On first load, just set the baseline ID, don't notify
        if (!isInitialized) {
            lastProcessedId.current = latestLead.id;
            setIsInitialized(true);
            return;
        }

        // Check if we have a NEW lead (ID is higher than what we last saw)
        if (latestLead.id > (lastProcessedId.current || 0)) {
            console.log("New Lead Detected:", latestLead);

            // 1. Play Sound
            playBeep();

            // 2. Determine Message based on source
            const sourceDisplay = latestLead.source === 'facebook_ads' ? 'Facebook Ads' :
                latestLead.source.includes('google') ? 'Google Form' :
                    latestLead.source;

            // 3. Show Toast
            toast({
                title: "New Lead Received! 🎉",
                description: `New query from ${latestLead.name} via ${sourceDisplay}`,
                variant: "default",
                duration: 5000,
            });

            // 4. Refresh Data
            queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
            queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });

            // Update tracker
            lastProcessedId.current = latestLead.id;
        }
    }, [latestLead, isInitialized, queryClient, toast]);

    return null;
}
