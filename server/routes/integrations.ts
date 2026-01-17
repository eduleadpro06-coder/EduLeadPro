
import type { Express, Request, Response } from "express";
import { db } from "../db.js";
import { leads } from "../../shared/schema.js";

export function registerIntegrationRoutes(app: Express) {

    // Generic JSON Lead Ingestion (for Make, Zapier, etc.)
    app.post("/api/webhooks/leads/ingest", async (req: Request, res: Response) => {
        try {
            // Updated destructuring based on user request
            const { name, email, phone, child_name, street_address, meta_lead_id, organization_id } = req.body;
            const secret = req.query.secret;

            // Simple security check
            const EXPECTED_SECRET = process.env.INTEGRATION_SECRET || "edulead_secure_api";

            if (secret !== EXPECTED_SECRET) {
                return res.status(401).json({ error: "Unauthorized: Invalid secret" });
            }

            if (!phone) {
                return res.status(400).json({ error: "Missing required fields: phone" });
            }

            // Default to Org ID 1 if not provided
            const orgId = organization_id ? parseInt(organization_id) : 1;
            if (isNaN(orgId)) {
                return res.status(400).json({ error: "Invalid organization_id" });
            }

            // Logic: 
            // - 'child_name' (Custom Form Field) -> Lead Name (Student)
            // - 'name' (FB Profile Name) -> Parent Name
            // - 'street_address' -> Address

            const studentName = child_name || name || "Unknown Lead";
            const parentName = child_name ? name : null; // If child name exists, the FB name is likely the parent

            // Phone Cleaning Logic:
            // 1. Try to strip non-digits
            const cleanedPhone = phone.replace(/\D/g, '');
            // 2. If we have digits, take the last 10. 
            // 3. IF NO DIGITS (e.g. Meta Test Data text), use the original string so user can see it.
            const finalPhone = cleanedPhone.length > 0 ? cleanedPhone.slice(-10) : phone;

            // Insert into DB
            const newLead = await db.insert(leads).values({
                name: studentName,
                parentName: parentName,
                email: email || null,
                phone: finalPhone, // Use the smarter logic
                class: "Unknown", // User removed 'program' field
                source: "facebook_make",
                status: "new",
                address: street_address || null, // Updated from city
                metaLeadId: meta_lead_id || null,
                notes: "Imported via Make.com",
                organizationId: orgId
            }).returning();

            console.log(`Creating new lead via Integration for Org ${orgId}: ${studentName}`);
            res.json({ success: true, leadId: newLead[0].id });

        } catch (error) {
            console.error("Integration Lead Error (Full Details):", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: error instanceof Error ? error.message : "Unknown error",
                details: String(error)
            });
        }
    });
}
