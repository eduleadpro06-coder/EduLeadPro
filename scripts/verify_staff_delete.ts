
import { storage } from "../server/storage.js";

async function verifyStaffDelete() {
    console.log("🚀 Starting staff deletion verification...");
    try {
        // 1. Get an organization ID
        const leads = await storage.getLeadsByStatus("enrolled");
        const orgId = leads[0]?.organizationId || 1;

        const timestamp = Date.now();
        const joiningDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 2. Create a dummy staff member
        console.log("📝 Creating dummy staff...");
        const staff = await storage.createStaff({
            name: "Test Delete Staff",
            email: `test_delete_${timestamp}@example.com`,
            phone: `999${timestamp.toString().slice(-7)}`,
            role: "Teacher",
            department: "Test",
            employeeId: `EMP_TEST_${timestamp}`,
            isActive: true,
            organizationId: orgId,
            salary: "50000",
            dateOfJoining: joiningDate as any // Drizzle might expect string or Date depending on config
        });
        console.log(`✅ Created staff with ID: ${staff.id}`);

        // 3. Create a lead assigned to this staff
        console.log("📝 Creating lead assigned to staff...");
        await storage.createLead({
            name: "Test Student for Delete",
            phone: `888${timestamp.toString().slice(-7)}`,
            status: "new",
            organizationId: orgId,
            counselorId: staff.id,
            class: "Class 10",
            source: "Direct",
            address: "Test Address",
            fatherFirstName: "Test",
            fatherLastName: "Father",
            fatherPhone: "9999999999"
        } as any);

        // 4. Create a follow-up (non-nullable counselorId)
        console.log("📝 Creating follow-up for staff...");
        const lead2 = await storage.createLead({
            name: "Test Follow-up Student",
            phone: `777${timestamp.toString().slice(-7)}`,
            status: "contacted",
            organizationId: orgId,
            class: "Class 10",
            source: "Direct",
            address: "Test Address",
            fatherFirstName: "Test",
            fatherLastName: "Father",
            fatherPhone: "9999999999"
        } as any);
        
        await storage.createFollowUp({
            leadId: lead2.id,
            scheduledAt: new Date(),
            counselorId: staff.id,
            remarks: "Test follow-up for deletion",
            organizationId: orgId
        });

        // 5. Attempt Deletion
        console.log(`🗑️ Attempting to delete staff ID ${staff.id}...`);
        const success = await storage.deleteStaff(staff.id);
        
        if (success) {
            console.log("✅ Staff deleted successfully without 500 error!");
            
            // 6. Verify dependencies are handled
            const deletedStaff = await storage.getStaff(staff.id);
            if (deletedStaff) {
                console.error("❌ Staff record still exists!");
            } else {
                console.log("✅ Staff record confirmed deleted.");
            }
        } else {
            console.error("❌ Deletion failed!");
        }

    } catch (err) {
        console.error("💥 Error during verification:", err);
    }
    process.exit(0);
}

verifyStaffDelete().catch(console.error);
