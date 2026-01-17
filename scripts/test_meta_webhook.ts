
// Mock environment variables
process.env.META_VERIFY_TOKEN = "test_verify_token";
// We won't set ACCESS_TOKEN to avoid actual fetch calls, we will mock the fetch or just ensure it handles missing token gracefully for now,
// OR we can mock the fetch function globally if we really want to test the full flow.
// For this test, we'll focus on the route handler logic.

import express from "express";
import { registerMetaWebhookRoutes } from "../server/routes/meta.js"; // Note: this might fail if it tries to import db immediately?
// Actually if we import route handler, it imports db.
// We are running this as a standalone script with ts-node probably.

// We need to mock the DB insertion part ideally, or just let it try to insert (integration test).
// Given we have a `db` connection in the project, we can try a real insertion test if DB is accessible.

const app = express();
app.use(express.json());

registerMetaWebhookRoutes(app);

// Save original fetch
const originalFetch = global.fetch;

// Mock fetch for the lead details
global.fetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = url.toString();
    console.log(`[MOCK FETCH] Request to: ${urlString}`);

    if (urlString.includes("graph.facebook.com")) {
        return {
            ok: true,
            json: async () => ({
                id: "1234567890",
                created_time: "2024-01-15T10:00:00+0000",
                field_data: [
                    { name: "full_name", values: ["Test Meta Lead"] },
                    { name: "email", values: ["test.meta@example.com"] },
                    { name: "phone_number", values: ["+919876543210"] },
                    { name: "city", values: ["New York"] },
                    { name: "class", values: ["Class 10"] }
                ]
            }),
            text: async () => ""
        } as Response;
    }

    // Pass through for localhost
    return originalFetch(url, init);
};

// Test Verification
async function testVerification() {
    console.log("\n--- Testing Webhook Verification ---");
    // Simulate GET request
    // Since we are not actually listening on a port, we can't easily fetch our own app unless we perform a supertest-style call
    // or just run the app on a port.

    const PORT = 3004;
    const server = app.listen(PORT, async () => {
        console.log(`Test server running on port ${PORT}`);

        try {
            // 1. Test Verify
            const verifyUrl = `http://localhost:${PORT}/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=CHALLENGE_ACCEPTED`;
            const res1 = await fetch(verifyUrl);
            const text1 = await res1.text();

            if (res1.status === 200 && text1 === "CHALLENGE_ACCEPTED") {
                console.log("✅ Verification endpoint works!");
            } else {
                console.error("❌ Verification endpoint failed:", res1.status, text1);
            }

            // 2. Test Lead Payload
            console.log("\n--- Testing Lead Webhook ---");
            // Set access token just for this scope if possible, or assume our mock fetch handles it
            process.env.META_ACCESS_TOKEN = "mock_access_token";

            const payload = {
                object: "page",
                entry: [
                    {
                        id: "page_id_123",
                        time: 123456789,
                        changes: [
                            {
                                field: "leadgen",
                                value: {
                                    leadgen_id: "lead_123_456",
                                    page_id: "page_id_123",
                                    form_id: "form_123",
                                    created_time: 12345678
                                }
                            }
                        ]
                    }
                ]
            };

            const res2 = await fetch(`http://localhost:${PORT}/api/webhooks/meta`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res2.status === 200) {
                console.log("✅ Webhook POST accepted event");
                console.log("(Check console logs above for 'Successfully inserted Meta lead')");
            } else {
                console.error("❌ Webhook POST failed:", res2.status);
            }

        } catch (e) {
            console.error(e);
        } finally {
            server.close();
            console.log("\nTest complete.");
            process.exit(0);
        }
    });
}

testVerification();
