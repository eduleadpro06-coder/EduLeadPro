
import { db } from "../server/db";
import { leads, followUps, staff } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seedLeads() {
    console.log("Seeding sample leads...");

    try {
        // Get a counselor to assign leads to
        const counselors = await db.select().from(staff).limit(1);
        const counselorId = counselors.length > 0 ? counselors[0].id : null;

        if (!counselorId) {
            console.log("No staff found to assign leads to. Please ensure staff table has data.");
            // Try to create a dummy staff member if none exists
            const newStaff = await db.insert(staff).values({
                name: "Demo Counselor",
                role: "Counselor",
                email: "counselor@demo.com",
                phone: "9876543210",
                dateOfJoining: "2024-01-01",
                isActive: true
            }).returning();
            console.log("Created demo counselor:", newStaff[0].name);
        }

        const effectiveCounselorId = counselorId || (await db.select().from(staff).limit(1))[0].id;

        const sampleLeads = [
            {
                name: "Aravind Kumar",
                phone: "9876543210",
                email: "aravind@example.com",
                class: "Class 10",
                stream: "Science",
                status: "new",
                source: "website",
                counselorId: effectiveCounselorId,
                notes: "Interested in Science stream"
            },
            {
                name: "Priya Sharma",
                phone: "8765432109",
                email: "priya@example.com",
                class: "Class 12",
                stream: "Commerce",
                status: "contacted",
                source: "facebook",
                counselorId: effectiveCounselorId,
                notes: "Called regarding fee structure"
            },
            {
                name: "Rahul Singh",
                phone: "7654321098",
                email: "rahul@example.com",
                class: "Class 9",
                status: "interested",
                source: "referral",
                counselorId: effectiveCounselorId,
                interestedProgram: "Foundation",
                admissionLikelihood: "High"
            },
            {
                name: "Sneha Gupta",
                phone: "6543210987",
                email: "sneha@example.com",
                class: "Class 11",
                stream: "Arts",
                status: "enrolled",
                source: "google_ads",
                counselorId: effectiveCounselorId
            },
            {
                name: "Vikram Malhotra",
                phone: "5432109876",
                email: "vikram@example.com",
                class: "Class 8",
                status: "dropped",
                source: "website",
                counselorId: effectiveCounselorId,
                notes: "Distance issue"
            }
        ];

        console.log(`Inserting ${sampleLeads.length} leads...`);
        const insertedLeads = await db.insert(leads).values(sampleLeads).returning();

        // Add some follow-ups
        if (insertedLeads.length > 0) {
            console.log("Adding follow-ups...");
            const followUpData = [
                {
                    leadId: insertedLeads[1].id, // Priya
                    counselorId: effectiveCounselorId,
                    scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
                    remarks: "Follow up for admission form",
                    outcome: "interested"
                },
                {
                    leadId: insertedLeads[2].id, // Rahul
                    counselorId: effectiveCounselorId,
                    scheduledAt: new Date(Date.now() - 86400000), // Yesterday (Overdue)
                    remarks: "Check if documents are ready",
                    outcome: "needs_more_info"
                }
            ];

            await db.insert(followUps).values(followUpData);
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding leads:", err);
        process.exit(1);
    }
}

seedLeads();
