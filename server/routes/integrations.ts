
import type { Express, Request, Response } from "express";
import { db } from "../db.js";
import { leads } from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";

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
            // - 'name' (FB Profile Name) -> Father's Name (split into first/last)
            // - 'phone' -> Primary phone AND father's phone
            // - 'street_address' -> Address

            const studentName = child_name || name || "Unknown Lead";

            // Parse parent name (FB profile name) into first and last name for father fields
            const parentFullName = child_name ? name : null; // If child name exists, the FB name is likely the parent
            let fatherFirstName = null;
            let fatherLastName = null;

            if (parentFullName) {
                const nameParts = parentFullName.trim().split(/\s+/);
                fatherFirstName = nameParts[0] || null;
                fatherLastName = nameParts.slice(1).join(" ") || nameParts[0] || null; // Use first name as fallback
            } else if (!child_name && name) {
                // If no child_name, the 'name' field is the parent, use it for father
                const nameParts = name.trim().split(/\s+/);
                fatherFirstName = nameParts[0] || null;
                fatherLastName = nameParts.slice(1).join(" ") || nameParts[0] || null;
            }

            // Phone Cleaning Logic:
            // 1. Try to strip non-digits
            const cleanedPhone = phone.replace(/\D/g, '');
            // 2. If we have digits, take the last 10. 
            // 3. IF NO DIGITS (e.g. Meta Test Data text), use the original string so user can see it.
            const finalPhone = cleanedPhone.length > 0 ? cleanedPhone.slice(-10) : phone;

            // Insert into DB
            const newLead = await db.insert(leads).values({
                name: studentName,
                fatherFirstName: fatherFirstName,
                fatherLastName: fatherLastName,
                fatherPhone: finalPhone, // Map phone to father's phone
                email: email || null,
                phone: finalPhone, // Primary phone field
                class: "Unknown", // User removed 'program' field
                source: "Meta Marketing", // Changed from "facebook_make"
                status: "new",
                address: street_address || null, // Updated from city
                metaLeadId: meta_lead_id || null,
                notes: "Imported via Meta Marketing", // Changed from "Imported via Make.com"
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

    // Google Form Webhook for Walk-ins
    app.post("/api/webhooks/google-form", async (req: Request, res: Response) => {
        try {
            // Expanded destructuring to match Add Lead Modal fields
            const {
                name, // Student Name
                fatherName, fatherPhone,
                motherName, motherPhone,
                email,
                childClass,
                address,
                organization_id
            } = req.body;

            const secret = req.query.secret;

            // Simple security check
            const EXPECTED_SECRET = process.env.INTEGRATION_SECRET || "edulead_secure_api";

            if (secret !== EXPECTED_SECRET) {
                return res.status(401).json({ error: "Unauthorized: Invalid secret" });
            }

            // Validation: Require Name and at least one Phone
            if (!name || (!fatherPhone && !motherPhone)) {
                return res.status(400).json({ error: "Missing required fields: Student Name and at least one Parent Phone are required." });
            }

            // Default to Org ID 1 if not provided
            const orgId = organization_id ? parseInt(organization_id) : 1;
            if (isNaN(orgId)) {
                return res.status(400).json({ error: "Invalid organization_id" });
            }

            // Phone Cleaning Logic
            // Prioritize Father Phone as primary, fallback to Mother Phone
            const primaryPhoneRaw = fatherPhone || motherPhone;
            const cleanedPhone = primaryPhoneRaw.replace(/\D/g, '');
            const searchPhone = cleanedPhone.length > 10 ? cleanedPhone.slice(-10) : cleanedPhone;

            // Parse Names (Split First/Last)
            const parseName = (fullName: string) => {
                if (!fullName) return { first: null, last: null };
                const parts = fullName.trim().split(/\s+/);
                if (parts.length < 2) return { first: fullName, last: "" };
                return { first: parts[0], last: parts.slice(1).join(" ") };
            };

            const father = parseName(fatherName);
            const mother = parseName(motherName);

            // 1. Check for duplicate lead
            const existingLeads = await db.select().from(leads).where(sql`right(${leads.phone}, 10) = ${searchPhone}`);
            const existingLead = existingLeads[0];

            if (existingLead) {
                // --- MERGE STRATEGY ---
                console.log(`[Google Form] Duplicate found for phone ${searchPhone}. Merging with ID ${existingLead.id}`);

                // Construct merge notes
                const visitNote = `walk-in form submitted on ${new Date().toLocaleDateString()}. Original Source: ${existingLead.source}.`;
                const combinedNotes = existingLead.notes ? existingLead.notes + "\n" + visitNote : visitNote;

                // Update the lead
                await db.update(leads)
                    .set({
                        // Only update fields if they are missing or "Unknown" in the existing lead
                        email: existingLead.email || email || null,

                        // Father Details (Update if missing)
                        fatherFirstName: existingLead.fatherFirstName || father.first || null,
                        fatherLastName: existingLead.fatherLastName || father.last || null,
                        fatherPhone: existingLead.fatherPhone || fatherPhone || null,

                        // Mother Details (Update if missing)
                        motherFirstName: existingLead.motherFirstName || mother.first || null,
                        motherLastName: existingLead.motherLastName || mother.last || null,
                        motherPhone: existingLead.motherPhone || motherPhone || null,

                        // Address & Academics
                        address: existingLead.address || address || null,
                        class: existingLead.class === "Unknown" ? (childClass || "Unknown") : existingLead.class,

                        // Status Update: Mark as visited/contacted since they physically walked in
                        status: "visited",

                        // Always append notes
                        notes: combinedNotes,
                        updatedAt: new Date()
                    })
                    .where(eq(leads.id, existingLead.id));

                res.json({ success: true, action: "merged", leadId: existingLead.id });
            } else {
                // --- CREATE STRATEGY ---
                console.log(`[Google Form] New walk-in lead creating for phone ${searchPhone}`);

                const newLead = await db.insert(leads).values({
                    name: name, // Student Name

                    // Father
                    fatherFirstName: father.first,
                    fatherLastName: father.last,
                    fatherPhone: fatherPhone,

                    // Mother
                    motherFirstName: mother.first,
                    motherLastName: mother.last,
                    motherPhone: motherPhone,

                    // Logic: Lead phone is mandatory, so use primary detected
                    phone: searchPhone,

                    email: email || null,
                    address: address || null,
                    class: childClass || "Unknown",

                    source: "Walk-in (Google Form)",
                    status: "visited",
                    notes: "Walk-in inquiry via Google Form",
                    organizationId: orgId
                }).returning();

                // Notify Frontend via Socket.IO
                const io = req.app.get('io');
                if (io) {
                    io.emit('lead:new', {
                        type: 'walkin',
                        message: `New Walk-in: ${name}`,
                        leadId: newLead[0].id
                    });
                }

                res.json({ success: true, action: "created", leadId: newLead[0].id });
            }

        } catch (error) {
            console.error("Google Form Webhook Error:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
}
