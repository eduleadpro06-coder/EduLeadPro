import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq, desc } from 'drizzle-orm';

async function test() {
  const notifs = await db.select().from(schema.notifications)
    .where(eq(schema.notifications.type, 'followup'))
    .orderBy(desc(schema.notifications.id))
    .limit(5);
  console.log("Notifs:", notifs);
  
  if (notifs.length > 0) {
    const actionId = notifs[0].actionId;
    console.log("Sample actionId:", actionId);
    
    // Check if there is a follow up with this ID
    if (actionId.startsWith('followup:')) {
      const id = parseInt(actionId.split(':')[1], 10);
      const fu = await db.select().from(schema.followUps).where(eq(schema.followUps.id, id));
      console.log("Follow up:", fu);
      if (fu.length > 0) {
        const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, fu[0].leadId));
        console.log("Lead:", lead);
      }
    } else {
      const id = parseInt(actionId, 10);
      const fu = await db.select().from(schema.followUps).where(eq(schema.followUps.id, id));
      console.log("Follow up by ID:", fu);
      const lead = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
      console.log("Lead by ID:", lead);
    }
  }
}
test().catch(console.error).then(() => process.exit(0));
