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

    // Get the full name for father's name mapping
    const fullName = fields["full_name"] || fields["name"] || leadData.full_name || "Meta Lead";

    // Split full name into first and last name for father's name
    const nameParts = fullName.trim().split(/\s+/);
    const fatherFirstName = nameParts[0] || fullName;
    const fatherLastName = nameParts.slice(1).join(" ") || nameParts[0]; // Use first name as fallback for last name

    // Get child's name (if provided separately)
    const childName = fields["child_name"] || fields["child's_name"] || fullName;

    const email = fields["email"] || fields["email_address"] || leadData.email || null;

    // Map WhatsApp number to PRIMARY phone field
    const whatsappNumber = fields["phone_number"] || fields["phone"] || fields["whatsapp_number"] || leadData.phone_number || "0000000000";

    const city = fields["city"] || fields["location"] || fields["street_address"] || ""; // Map city/address

    let className = "Unknown";
    Object.keys(fields).forEach(key => {
        if (key.includes("class") || key.includes("grade")) {
            className = fields[key];
        }
    });

    return {
        name: childName,
        email,
        phone: whatsappNumber.replace(/\D/g, '').slice(-10), // PRIMARY phone - WhatsApp number
        fatherFirstName,
        fatherLastName,
        fatherPhone: whatsappNumber.replace(/\D/g, '').slice(-10), // Also save to father's phone
        class: className,
        source: "Meta Marketing", // Changed from "facebook_ads" to "Meta Marketing"
        status: "new",
        address: city,
        notes: `Imported via Meta Marketing. Lead ID: ${leadData.id}`, // Updated notes format
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
                                    const newLead = await db.insert(leads).values(mappedLead).returning();
                                    console.log("Successfully inserted Meta lead:", mappedLead.name);

                                    // Notify Frontend via Socket.IO
                                    const io = req.app.get('io');
                                    if (io) {
                                        io.emit('lead:new', {
                                            type: 'meta',
                                            message: `New Facebook Lead: ${mappedLead.name}`,
                                            leadId: newLead[0]?.id
                                        });
                                    }
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

