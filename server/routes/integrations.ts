
import type { Express, Request, Response } from "express";
import { db } from "../db";
import { leads } from "../../shared/schema";
import { leads as leadsSchema } from "../../shared/schema";

export function registerIntegrationRoutes(app: Express) {

    // Generic JSON Lead Ingestion (for Make, Zapier, etc.)
    app.post("/api/webhooks/leads/ingest", async (req: Request, res: Response) => {
        try {
            const { name, email, phone, program, city, meta_lead_id } = req.body;
            const secret = req.query.secret;

            // Simple security check (User can set this in Make)
            // You can hardcode a secret here or use an env var
            const EXPECTED_SECRET = process.env.INTEGRATION_SECRET || "edulead_secure_api";

            if (secret !== EXPECTED_SECRET) {
                return res.status(401).json({ error: "Unauthorized: Invalid secret" });
            }

            if (!name || !phone) {
                return res.status(400).json({ error: "Missing required fields: name, phone" });
            }

            // Insert into DB
            const newLead = await db.insert(leads).values({
                name,
                email: email || null,
                phone: phone.replace(/\D/g, '').slice(-10), // Clean phone
                class: program || "Unknown", // Make "Program" map to Class
                source: "facebook_make",
                status: "new",
                address: city || null,
                metaLeadId: meta_lead_id || null,
                notes: "Imported via Make.com"
            }).returning();

            console.log("Creating new lead via Integration:", name);
            res.json({ success: true, leadId: newLead[0].id });

        } catch (error) {
            console.error("Integration Lead Error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
}
