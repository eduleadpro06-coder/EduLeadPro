
import { db } from "../server/db";
import { organizations, accountMaster } from "../shared/schema";
import { eq } from "drizzle-orm";

const DEFAULT_ACCOUNTS = [
    // Assets
    { name: "Assets", type: "Asset", isSystem: true, code: "1000" },
    { name: "Bank Account", type: "Asset", isSystem: true, code: "1010", parentName: "Assets" },

    // Liabilities
    { name: "Liabilities", type: "Liability", isSystem: true, code: "2000" },
    { name: "Advances Received", type: "Liability", isSystem: true, code: "2010", parentName: "Liabilities" },

    // Income
    { name: "Income", type: "Income", isSystem: true, code: "3000" },
    { name: "Fees Income", type: "Income", isSystem: true, code: "3010", parentName: "Income" },
    { name: "Daycare Income", type: "Income", isSystem: true, code: "3020", parentName: "Income" },
    { name: "Misc Income", type: "Income", isSystem: true, code: "3030", parentName: "Income" },

    // Expenses
    { name: "Expenses", type: "Expense", isSystem: true, code: "4000" },
    { name: "Salary Expense", type: "Expense", isSystem: true, code: "4010", parentName: "Expenses" },
    { name: "Rent Expense", type: "Expense", isSystem: true, code: "4020", parentName: "Expenses" },
    { name: "Utilities", type: "Expense", isSystem: true, code: "4030", parentName: "Expenses" },
    { name: "Food & Beverages", type: "Expense", isSystem: true, code: "4040", parentName: "Expenses" },
    { name: "Marketing", type: "Expense", isSystem: true, code: "4050", parentName: "Expenses" },
    { name: "Maintenance", type: "Expense", isSystem: true, code: "4060", parentName: "Expenses" },
];

async function seedAccounts() {
    console.log("Starting Chart of Accounts seeding...");

    try {
        const orgs = await db.select().from(organizations);
        console.log(`Found ${orgs.length} organizations.`);

        for (const org of orgs) {
            console.log(`Processing org: ${org.name} (${org.id})`);

            // Check if accounts exist
            const existingAccounts = await db.select().from(accountMaster).where(eq(accountMaster.organizationId, org.id));
            if (existingAccounts.length > 0) {
                console.log(`  - Accounts already exist. Skipping.`);
                continue;
            }

            // Map to store created accounts for parent linkage
            const accountMap = new Map<string, number>();

            for (const acc of DEFAULT_ACCOUNTS) {
                let parentId = null;
                if (acc.parentName) {
                    parentId = accountMap.get(acc.parentName) || null;
                }

                const [newAcc] = await db.insert(accountMaster).values({
                    organizationId: org.id,
                    name: acc.name,
                    type: acc.type,
                    code: acc.code,
                    isSystem: acc.isSystem,
                    parentId: parentId,
                }).returning();

                accountMap.set(acc.name, newAcc.id);
                console.log(`  - Created: ${acc.name}`);
            }
        }
        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding accounts:", error);
        process.exit(1);
    }
}

seedAccounts();
