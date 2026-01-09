
import { db } from "../server/db";
import { studentBusAssignments, busStops, busRoutes, leads } from "../shared/schema";
import { eq, aliasedTable } from "drizzle-orm";

async function checkBusData() {
    console.log("=== DIAGNOSING BUS ASSIGNMENT DATA ===");

    const pickupStopApi = aliasedTable(busStops, "pickup_stop");
    const dropStopApi = aliasedTable(busStops, "drop_stop");

    const assignments = await db.select({
        assignmentId: studentBusAssignments.id,
        studentId: studentBusAssignments.studentId,
        studentName: leads.name,
        routeId: studentBusAssignments.routeId,
        routeName: busRoutes.routeName,
        pickupStop: {
            id: pickupStopApi.id,
            name: pickupStopApi.stopName,
            latitude: pickupStopApi.latitude,
            longitude: pickupStopApi.longitude
        },
        dropStop: {
            id: dropStopApi.id,
            name: dropStopApi.stopName,
            latitude: dropStopApi.latitude,
            longitude: dropStopApi.longitude
        }
    })
        .from(studentBusAssignments)
        .innerJoin(leads, eq(studentBusAssignments.studentId, leads.id))
        .innerJoin(busRoutes, eq(studentBusAssignments.routeId, busRoutes.id))
        .leftJoin(pickupStopApi, eq(studentBusAssignments.pickupStopId, pickupStopApi.id))
        .leftJoin(dropStopApi, eq(studentBusAssignments.dropStopId, dropStopApi.id));

    console.log(`Found ${assignments.length} assignments.`);

    assignments.forEach(a => {
        console.log(`\nStudent: ${a.studentName} (ID: ${a.studentId})`);
        console.log(`Route: ${a.routeName} (ID: ${a.routeId})`);

        if (a.pickupStop) {
            console.log(`Pickup Stop: ${a.pickupStop.name}`);
            console.log(`  Coordinates: Lat ${a.pickupStop.latitude}, Lng ${a.pickupStop.longitude}`);

            const lat = parseFloat(String(a.pickupStop.latitude));
            const lng = parseFloat(String(a.pickupStop.longitude));

            if (isNaN(lat) || isNaN(lng)) {
                console.error(`  ERROR: Invalid coordinates for pickup stop!`);
            } else if (lat === 0 && lng === 0) {
                console.warn(`  WARNING: Coordinates are 0,0.`);
            }
        } else {
            console.warn(`  WARNING: No pickup stop assigned.`);
        }
    });

    console.log("\n=== DIAGNOSIS COMPLETE ===");
    process.exit(0);
}

checkBusData().catch(err => {
    console.error(err);
    process.exit(1);
});
