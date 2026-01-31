import { Router } from "express";
import { storage } from "../storage.js";
import { getOrganizationId } from "../utils.js";

const router = Router();

// ===== INVENTORY CATEGORY ROUTES =====
router.get("/categories", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const categories = await storage.getInventoryCategories(organizationId);
        res.json(categories);
    } catch (error) {
        console.error("Failed to fetch inventory categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});

router.post("/categories", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const category = await storage.createInventoryCategory({
            ...req.body,
            organizationId
        });
        res.json(category);
    } catch (error) {
        console.error("Failed to create category:", error);
        res.status(500).json({ message: "Failed to create category" });
    }
});

router.put("/categories/:id", async (req, res) => {
    try {
        const category = await storage.updateInventoryCategory(
            parseInt(req.params.id),
            req.body
        );
        res.json(category);
    } catch (error) {
        console.error("Failed to update category:", error);
        res.status(500).json({ message: "Failed to update category" });
    }
});

router.delete("/categories/:id", async (req, res) => {
    try {
        await storage.deleteInventoryCategory(parseInt(req.params.id));
        res.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete category:", error);
        res.status(500).json({ message: error?.message || "Failed to delete category" });
    }
});

// ===== INVENTORY SUPPLIER ROUTES =====
router.get("/suppliers", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const suppliers = await storage.getInventorySuppliers(organizationId);
        res.json(suppliers);
    } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        res.status(500).json({ message: "Failed to fetch suppliers" });
    }
});

router.post("/suppliers", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const supplier = await storage.createInventorySupplier({
            ...req.body,
            organizationId
        });
        res.json(supplier);
    } catch (error) {
        console.error("Failed to create supplier:", error);
        res.status(500).json({ message: "Failed to create supplier" });
    }
});

router.put("/suppliers/:id", async (req, res) => {
    try {
        const supplier = await storage.updateInventorySupplier(
            parseInt(req.params.id),
            req.body
        );
        res.json(supplier);
    } catch (error) {
        console.error("Failed to update supplier:", error);
        res.status(500).json({ message: "Failed to update supplier" });
    }
});

router.delete("/suppliers/:id", async (req, res) => {
    try {
        await storage.deleteInventorySupplier(parseInt(req.params.id));
        res.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete supplier:", error);
        res.status(500).json({ message: error?.message || "Failed to delete supplier" });
    }
});

// ===== INVENTORY ITEMS ROUTES =====
router.get("/items", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }

        const filters: any = {};
        if (req.query.categoryId) filters.categoryId = parseInt(req.query.categoryId as string);
        if (req.query.supplierId) filters.supplierId = parseInt(req.query.supplierId as string);
        if (req.query.search) filters.searchTerm = req.query.search;
        if (req.query.isActive) filters.isActive = req.query.isActive === 'true';

        const items = await storage.getInventoryItems(organizationId, filters);
        res.json(items);
    } catch (error) {
        console.error("Failed to fetch inventory items:", error);
        res.status(500).json({ message: "Failed to fetch items" });
    }
});

router.get("/items/:id", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const item = await storage.getInventoryItem(parseInt(req.params.id), organizationId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        res.json(item);
    } catch (error) {
        console.error("Failed to fetch item:", error);
        res.status(500).json({ message: "Failed to fetch item" });
    }
});

router.post("/items", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const item = await storage.createInventoryItem({
            ...req.body,
            organizationId
        });
        res.json(item);
    } catch (error) {
        console.error("Failed to create item:", error);
        res.status(500).json({ message: "Failed to create item" });
    }
});

router.put("/items/:id", async (req, res) => {
    try {
        const item = await storage.updateInventoryItem(
            parseInt(req.params.id),
            req.body
        );
        res.json(item);
    } catch (error) {
        console.error("Failed to update item:", error);
        res.status(500).json({ message: "Failed to update item" });
    }
});

router.delete("/items/:id", async (req, res) => {
    try {
        const result = await storage.deleteInventoryItem(parseInt(req.params.id));
        res.json(result);
    } catch (error) {
        console.error("Failed to delete item:", error);
        res.status(500).json({ message: "Failed to delete item" });
    }
});

// ===== INVENTORY TRANSACTIONS ROUTES =====
router.get("/transactions", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }

        const filters: any = {};
        if (req.query.itemId) filters.itemId = parseInt(req.query.itemId as string);
        if (req.query.transactionType) filters.transactionType = req.query.transactionType;
        if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
        if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

        const transactions = await storage.getInventoryTransactions(organizationId, filters);
        res.json(transactions);
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
});

router.post("/transactions", async (req, res) => {
    try {
        const userId = req.user?.id;
        const transaction = await storage.createInventoryTransaction({
            ...req.body,
            userId
        });
        res.json(transaction);
    } catch (error) {
        console.error("Failed to create transaction:", error);
        res.status(500).json({ message: "Failed to create transaction" });
    }
});

// ===== LOW STOCK ALERTS =====
router.get("/low-stock", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const lowStockItems = await storage.getLowStockItems(organizationId);
        res.json(lowStockItems);
    } catch (error) {
        console.error("Failed to fetch low stock items:", error);
        res.status(500).json({ message: "Failed to fetch low stock items" });
    }
});

// ===== INVENTORY STATS =====
router.get("/stats", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }
        const stats = await storage.getInventoryStats(organizationId);
        res.json(stats);
    } catch (error) {
        console.error("Failed to fetch inventory stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
});

// ===== SELL ORDERS ROUTES =====
router.get("/sell-orders", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }

        const filters: any = {};
        if (req.query.leadId) filters.leadId = parseInt(req.query.leadId as string);
        if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus;
        if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
        if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

        const orders = await storage.getSellOrders(organizationId, filters);
        res.json(orders);
    } catch (error) {
        console.error("Failed to fetch sell orders:", error);
        res.status(500).json({ message: "Failed to fetch sell orders" });
    }
});

router.get("/sell-orders/:id", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }

        const order = await storage.getSellOrderById(parseInt(req.params.id), organizationId);
        if (!order) {
            return res.status(404).json({ message: "Sell order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error("Failed to fetch sell order:", error);
        res.status(500).json({ message: "Failed to fetch sell order" });
    }
});

router.post("/sell-orders", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }

        const userId = (req.user as any)?.userId;
        const { leadId, parentName, items, notes, paymentMode, paymentStatus } = req.body;

        // Validation
        if (!leadId || !parentName || !items || items.length === 0) {
            return res.status(400).json({
                message: "Missing required fields: leadId, parentName, and items are required"
            });
        }

        const order = await storage.createSellOrder({
            leadId,
            parentName,
            items,
            organizationId,
            billGeneratedBy: userId,
            notes,
            paymentMode,
            paymentStatus
        });

        res.json(order);
    } catch (error: any) {
        console.error("Failed to create sell order:", error);
        res.status(500).json({
            message: error?.message || "Failed to create sell order"
        });
    }
});

router.patch("/sell-orders/:id/payment", async (req, res) => {
    try {
        const { paymentStatus, paymentMode, paymentDate, transactionId } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({ message: "Payment status is required" });
        }

        const order = await storage.updateSellOrderPayment(parseInt(req.params.id), {
            paymentStatus,
            paymentMode,
            paymentDate,
            transactionId
        });

        if (!order) {
            return res.status(404).json({ message: "Sell order not found" });
        }

        res.json(order);
    } catch (error) {
        console.error("Failed to update payment:", error);
        res.status(500).json({ message: "Failed to update payment" });
    }
});

// ===== SEARCH ENROLLED STUDENTS (For Sell Order Parent Selection) =====
router.get("/students/search", async (req, res) => {
    try {
        const organizationId = await getOrganizationId(req);
        if (!organizationId) {
            return res.status(403).json({ message: "No organization assigned" });
        }

        const searchTerm = req.query.search as string || "";

        // Search enrolled leads (students)
        const leads = await storage.getAllLeads(false, organizationId);
        const enrolledStudents = leads
            .filter(lead => lead.isEnrolled)
            .filter(lead =>
                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (lead.phone && lead.phone.includes(searchTerm))
            )
            .slice(0, 20) // Limit to 20 results
            .map(lead => ({
                id: lead.id,
                name: lead.name,
                phone: lead.phone,
                class: lead.class,
                // Parent name construction
                parentName: lead.fatherFirstName
                    ? `${lead.fatherFirstName} ${lead.fatherLastName || ''}`
                    : lead.motherFirstName
                        ? `${lead.motherFirstName} ${lead.motherLastName || ''}`
                        : 'N/A'
            }));

        res.json(enrolledStudents);
    } catch (error) {
        console.error("Failed to search students:", error);
        res.status(500).json({ message: "Failed to search students" });
    }
});

export default router;
