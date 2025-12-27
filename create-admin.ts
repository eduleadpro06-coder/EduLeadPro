import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createAdminUser() {
    try {
        // Check if admin user already exists
        const existingAdmin = await db
            .select()
            .from(users)
            .where(eq(users.username, "admin"))
            .limit(1);

        if (existingAdmin.length > 0) {
            console.log("✅ Admin user already exists!");
            console.log("Username: admin");
            console.log("Password: admin");
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash("admin", 10);

        const newAdmin = await db
            .insert(users)
            .values({
                username: "admin",
                password: hashedPassword,
                role: "admin",
                name: "Admin User",
                email: "admin@melons.com",
            })
            .returning();

        console.log("✅ Admin user created successfully!");
        console.log("Username: admin");
        console.log("Password: admin");
        console.log("User details:", newAdmin[0]);

    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    }

    process.exit(0);
}

createAdminUser();
