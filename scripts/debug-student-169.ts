import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function debugStudent() {
    const studentId = 169;
    console.log(`--- Debugging Student ${studentId} ---`);

    // 1. Check Assignment
    const assignments = await sql`
    SELECT a.*, r.route_name, r.bus_number
    FROM student_bus_assignments a
    JOIN bus_routes r ON a.route_id = r.id
    WHERE a.student_id = ${studentId}
  `;
    console.log('Assignment:', JSON.stringify(assignments, null, 2));

    if (assignments.length > 0) {
        const routeId = assignments[0].route_id;

        // 2. Check Route Stops
        const stops = await sql`
      SELECT * FROM bus_stops
      WHERE route_id = ${routeId}
      ORDER BY stop_order
    `;
        console.log('Route Stops:', JSON.stringify(stops, null, 2));

        // 3. Check Recent Events
        const today = new Date().toISOString().split('T')[0];
        const events = await sql`
      SELECT * FROM bus_trip_passenger_events
      WHERE student_id = ${studentId}
      AND event_time >= ${today + 'T00:00:00'}
      ORDER BY event_time DESC
    `;
        console.log('Events Today:', JSON.stringify(events, null, 2));

        // 4. Check all events for this student (just in case)
        const allEvents = await sql`
      SELECT * FROM bus_trip_passenger_events
      WHERE student_id = ${studentId}
      ORDER BY event_time DESC
      LIMIT 5
    `;
        console.log('Last 5 Events (All Time):', JSON.stringify(allEvents, null, 2));
    }

    process.exit(0);
}

debugStudent().catch(err => {
    console.error(err);
    process.exit(1);
});
