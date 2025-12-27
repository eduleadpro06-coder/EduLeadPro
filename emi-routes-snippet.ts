
// Add this to server/routes.ts before line 2681 (before "const httpServer = createServer(app);")

// EMI Plans
app.post("/api/emi-plans", async (req, res) => {
    try {
        console.log("Received EMI plan creation request:", req.body);
        const emiPlan = await storage.createEmiPlan(req.body);
        console.log("EMI plan created successfully:", emiPlan);
        res.status(201).json(emiPlan);
    } catch (error) {
        console.error("Failed to create EMI plan:", error);
        res.status(500).json({ message: "Failed to create EMI plan", error: error instanceof Error ? error.message : String(error) });
    }
});

app.get("/api/emi-plans", async (req, res) => {
    try {
        const result = await db.select().from(schema.emiPlans);
        res.json(result);
    } catch (error) {
        console.error("Failed to fetch EMI plans:", error);
        res.status(500).json({ message: "Failed to fetch EMI plans" });
    }
});
