import fetch from "node-fetch";

async function testApi() {
    try {
        const res = await fetch("http://localhost:5000/api/counselors");
        const counselors = await res.json();
        console.log("=== COUNSELORS API RESPONSE ===");
        console.log(JSON.stringify(counselors, null, 2));

        const resLeads = await fetch("http://localhost:5000/api/leads");
        const leads = await resLeads.json();
        console.log("=== LEADS API RESPONSE (FIRST 1) ===");
        if (leads.length > 0) {
            console.log(JSON.stringify(leads[0], null, 2));
        } else {
            console.log("No leads found.");
        }
    } catch (err) {
        console.error("Fetch failed (is the server running?):", err.message);
    }
}

testApi();
