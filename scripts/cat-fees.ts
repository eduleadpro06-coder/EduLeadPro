
import { db } from "../server/db";
import { globalClassFees } from "../shared/schema";

async function listClasses() {
    const fees = await db.select().from(globalClassFees);
    console.log("Found " + fees.length + " fees.");
    console.log(JSON.stringify(fees, null, 2));
    process.exit(0);
}

listClasses().catch(console.error);
