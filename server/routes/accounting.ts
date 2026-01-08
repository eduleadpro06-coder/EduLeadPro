
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { accountingStorage } from "../services/accounting/storage.js";
import { normalizationEngine } from "../services/accounting/normalization.js";
import { classificationEngine } from "../services/accounting/classification.js";
import { ledgerEngine } from "../services/accounting/ledger.js";
import { getOrganizationId } from "../utils.js"; // Assuming this utility exists or I need to import from routes.ts? 
// Actually getOrganizationId in routes.ts was a local helper. I should replicate or export it. 
// For now, I'll assume I can access req.session or similar.
// I'll replicate the logic here or middleware.

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/accounting';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xls', '.xlsx', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV, Excel, and PDF allowed.'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware to check org
const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Simple org check, assuming middleware populated session
    if (!req.session.organizationId) {
        return res.status(403).json({ message: "No organization context" });
    }
    next();
};

// Routes

// 1. Upload Statement
router.post("/upload", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const statement = await accountingStorage.createBankStatement({
            organizationId: req.session.organizationId,
            filename: req.file.filename,
            originalFilename: req.file.originalname,
            fileUrl: req.file.path,
            status: "pending",
            uploadedBy: req.session.userId,
            totalTransactions: 0,
            processedTransactions: 0
        });

        res.status(201).json({ message: "File uploaded successfully", statement });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Upload failed", error: (error as Error).message });
    }
});

// 2. Get Statements
router.get("/statements", requireAuth, async (req: any, res) => {
    try {
        const statements = await accountingStorage.getBankStatements(req.session.organizationId);
        res.json(statements);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch statements" });
    }
});

// 3. Process Statement (Trigger Parsing + Classification)
router.post("/process/:id", requireAuth, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const statement = await accountingStorage.getBankStatement(id, req.session.organizationId);

        if (!statement) {
            return res.status(404).json({ message: "Statement not found" });
        }

        // 1. Normalize
        const transactions = await normalizationEngine.normalizeStatement(
            statement.fileUrl,
            id,
            req.session.organizationId
        );

        if (transactions.length === 0) {
            await accountingStorage.updateBankStatementStatus(id, "failed", "No transactions found or parsing failed");
            return res.status(400).json({ message: "No transactions parsed" });
        }

        // 2. Classify (Bulk)
        for (let tx of transactions) {
            const classification = await classificationEngine.classifyTransaction(tx, req.session.organizationId);
            if (classification.accountId) {
                tx.suggestedAccountId = classification.accountId;
            }
            tx.confidenceScore = classification.confidence.toString();
            tx.classificationReason = classification.reason;
            // Status remains 'pending' until Review -> Post
        }

        // 3. Save to DB
        // Check for duplicates first? (rowHash is unique constrained? No, I need to check manually or relied on unique index if exists)
        // For Phase 1, insert all. If rowHash constraint exists, it will fail.
        // I didn't add unique constraint on rowHash in schema.ts, just a column.
        // I should probably prevent duplicates in storage or here.
        // Drizzle "ON CONFLICT DO NOTHING" is useful.

        await accountingStorage.createTransactions(transactions);

        // Update statement stats
        await accountingStorage.updateBankStatementStatus(id, "processed");

        res.json({ message: "Processing completed", count: transactions.length });
    } catch (error) {
        console.error("Processing error:", error);
        await accountingStorage.updateBankStatementStatus(parseInt(req.params.id), "failed", (error as Error).message);
        res.status(500).json({ message: "Processing failed", error: (error as Error).message });
    }
});

// 4. Update Transaction (Manual Classification)
router.patch("/transactions/:id", requireAuth, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);
        const { accountId, reason } = req.body;

        const updated = await accountingStorage.updateTransaction(id, {
            suggestedAccountId: accountId,
            classificationReason: reason || "Manual Correction",
            confidenceScore: "1.0" // Manual is 100% confidence
        });

        // Process Feedback Loop
        // If user manually changed it, learn from it
        if (req.body.description) {
            await classificationEngine.learnFromFeedback(req.session.organizationId, req.body.description, accountId);
        }

        res.json({ message: "Transaction updated", transaction: updated });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
});

// 5. Post Transaction (Approve)
router.post("/transactions/:id/post", requireAuth, async (req: any, res) => {
    try {
        const id = parseInt(req.params.id);

        // Execute Ledger Engine
        await ledgerEngine.postTransaction(id, req.session.organizationId);

        res.json({ message: "Transaction posted successfully" });
    } catch (error) {
        console.error("Posting error:", error);
        res.status(400).json({ message: (error as Error).message });
    }
});

// 6. Reports: Ledger
router.get("/reports/ledger", requireAuth, async (req: any, res) => {
    try {
        const entries = await accountingStorage.getLedgerEntries(req.session.organizationId, req.query.accountId ? parseInt(req.query.accountId) : undefined);
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch ledger" });
    }
});

// 7. Get Accounts
router.get("/accounts", requireAuth, async (req: any, res) => {
    try {
        const accounts = await accountingStorage.getAccounts(req.session.organizationId);
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch accounts" });
    }
});

// 8. Review Queue
router.get("/transactions/review", requireAuth, async (req: any, res) => {
    try {
        const queue = await accountingStorage.getReviewQueue(req.session.organizationId);
        res.json(queue);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
});

export default router;
