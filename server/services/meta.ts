import { db } from "../db";
import { leads } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from 'crypto';

const API_VERSION = "v19.0"; // Or v24.0 as per user link, keeping recent
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

interface MetaLeadDetails {
    id: string;
    created_time: string;
    field_data: Array<{ name: string; values: string[] }>;
}

export class MetaService {
    private accessToken: string;
    private pixelId: string;

    constructor() {
        this.accessToken = process.env.META_ACCESS_TOKEN || "";
        this.pixelId = process.env.META_PIXEL_ID || "";
    }

    // Helper to hash user data for CAPI (SHA256)
    private hashData(data: string): string {
        return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
    }

    async fetchLeadDetails(leadgenId: string): Promise<MetaLeadDetails | null> {
        if (!this.accessToken) {
            console.warn("Meta Access Token is missing.");
            return null;
        }

        try {
            const url = `${BASE_URL}/${leadgenId}?access_token=${this.accessToken}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Graph API Error: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching Meta lead details:", error);
            return null;
        }
    }

    async sendConversionEvent(lead: typeof leads.$inferSelect, eventNames: string[]) {
        if (!this.accessToken || !this.pixelId) {
            console.warn("Meta CAPI: Missing Access Token or Pixel ID. Skipping event.");
            return;
        }

        // We strictly need a meta_lead_id OR user data (hashed)
        // CAPI for Leads works best with 'lead_id' (if it originated from FB).

        const userData: any = {};
        if (lead.email) userData.em = [this.hashData(lead.email)];
        if (lead.phone) userData.ph = [this.hashData(lead.phone)];
        if (lead.metaLeadId) userData.lead_id = lead.metaLeadId;

        // If we have no identifiers, we can't send
        if (Object.keys(userData).length === 0) return;

        const events = eventNames.map(eventName => ({
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "system_generated",
            user_data: userData,
        }));

        try {
            const url = `${BASE_URL}/${this.pixelId}/events?access_token=${this.accessToken}`;

            console.log(`Sending CAPI Events: ${eventNames.join(", ")} for Lead ${lead.id}`);

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: events,
                    // test_event_code: "TEST12345" // Use this for testing in Graph Explorer if needed
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Meta CAPI Error:", errText);
            } else {
                const resJson = await response.json();
                console.log("Meta CAPI Success:", resJson);
            }

        } catch (error) {
            console.error("Error sending CAPI event:", error);
        }
    }
}

export const metaService = new MetaService();
