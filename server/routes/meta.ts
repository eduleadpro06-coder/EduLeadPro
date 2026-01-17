import type { Express, Request, Response } from "express";
import { db } from "../db.js";
import { leads } from "../../shared/schema.js";
import { metaService } from "../services/meta.js";

function mapLeadData(leadData: any) {
    const fields: Record<string, string> = {};

    if (leadData.field_data && Array.isArray(leadData.field_data)) {
        leadData.field_data.forEach((field: any) => {
            if (field.values && field.values.length > 0) {
                fields[field.name] = field.values[0];
            }
        });
    }

    const name = fields["full_name"] || fields["name"] || leadData.full_name || "Meta Lead";
    const email = fields["email"] || fields["email_address"] || leadData.email || null;
    const phone = fields["phone_number"] || fields["phone"] || leadData.phone_number || "0000000000";
    const city = fields["city"] || fields["location"] || ""; // Map city to address

    let className = "Unknown";
    Object.keys(fields).forEach(key => {
        if (key.includes("class") || key.includes("grade")) {
            className = fields[key];
        }
    });

    return {
        name,
        email,
        phone: phone.replace(/\D/g, '').slice(-10),
        class: className,
        source: "facebook_ads",
        status: "new",
        address: city,
        notes: `Meta Lead ID: ${leadData.id}. Form ID: ${leadData.form_id}.`,
        metaLeadId: leadData.id // Save the ID for CAPI
    };
}

export function registerMetaWebhookRoutes(app: Express) {

    // Verification Endpoint
    app.get("/api/webhooks/meta", (req: Request, res: Response) => {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "my_secure_token_123";

        if (mode && token) {
            if (mode === "subscribe" && token === VERIFY_TOKEN) {
                console.log("Meta Webhook Verified!");
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(400);
        }
    });

    // Event Receiver Endpoint
    app.post("/api/webhooks/meta", async (req: Request, res: Response) => {
        try {
            const body = req.body;

            if (body.object === "page") {
                for (const entry of body.entry) {
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === "leadgen") {
                                const value = change.value;
                                const leadgenId = value.leadgen_id;

                                console.log(`Received LeadGen ID: ${leadgenId}`);

                                // Use MetaService to fetch details
                                const leadDetails = await metaService.fetchLeadDetails(leadgenId);

                                if (leadDetails) {
                                    const mappedLead = mapLeadData(leadDetails);
                                    await db.insert(leads).values(mappedLead);
                                    console.log("Successfully inserted Meta lead:", mappedLead.name);
                                }
                            }
                        }
                    }
                }
                res.status(200).send("EVENT_RECEIVED");
            } else {
                res.sendStatus(404);
            }
        } catch (err) {
            console.error("Error processing Meta webhook:", err);
            res.sendStatus(500);
        }
    });
}

