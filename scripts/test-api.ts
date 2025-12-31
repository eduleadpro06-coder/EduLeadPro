
async function testApi() {
    try {
        const url = "http://localhost:5000/api/leads?status=enrolled";
        console.log(`Fetching from: ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "x-user-name": "melonspreschool@gmail.com",
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response:", text);
            return;
        }

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Count: ${Array.isArray(data) ? data.length : 0}`);

        if (Array.isArray(data)) {
            const found = data.find((l: any) => l.name.includes("Aarya"));
            if (found) {
                console.log("Found Aarya:", {
                    id: found.id,
                    name: found.name,
                    status: found.status,
                    organizationId: found.organizationId
                });
            } else {
                console.log("Aarya NOT found in response.");
                console.log("First 3 leads:", data.slice(0, 3).map((l: any) => ({ name: l.name, status: l.status })));
            }
        } else {
            console.log("Data is not an array:", data);
        }

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testApi();
