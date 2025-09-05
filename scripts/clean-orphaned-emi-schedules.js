#!/usr/bin/env node

/**
 * Clean up orphaned EMI schedule records
 * 
 * This script removes EMI schedule records that reference non-existent e-mandates,
 * which can cause foreign key constraint violations.
 */

import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq, notInArray } from 'drizzle-orm';

async function cleanupOrphanedEmiSchedules() {
  console.log('🧹 Starting cleanup of orphaned EMI schedule records...');

  try {
    // Get all existing e-mandate IDs
    const eMandates = await db.select({ id: schema.eMandates.id }).from(schema.eMandates);
    const existingMandateIds = eMandates.map(m => m.id);
    
    console.log(`📊 Found ${existingMandateIds.length} existing e-mandates`);

    // Get all EMI schedule records
    const allEmiSchedules = await db.select().from(schema.emiSchedule);
    console.log(`📅 Found ${allEmiSchedules.length} total EMI schedule records`);

    // Find orphaned records (those with e-mandate IDs that don't exist)
    const orphanedRecords = allEmiSchedules.filter(schedule => 
      schedule.eMandateId && !existingMandateIds.includes(schedule.eMandateId)
    );

    if (orphanedRecords.length === 0) {
      console.log('✅ No orphaned EMI schedule records found. Database is clean!');
      return;
    }

    console.log(`❌ Found ${orphanedRecords.length} orphaned EMI schedule records:`);
    
    // Group by e-mandate ID for better reporting
    const orphansByMandate = {};
    orphanedRecords.forEach(record => {
      if (!orphansByMandate[record.eMandateId]) {
        orphansByMandate[record.eMandateId] = [];
      }
      orphansByMandate[record.eMandateId].push(record);
    });

    // Show what will be deleted
    Object.entries(orphansByMandate).forEach(([mandateId, records]) => {
      console.log(`  📋 E-Mandate ID ${mandateId} (doesn't exist): ${records.length} schedule records`);
      records.forEach(record => {
        console.log(`    - Schedule ID: ${record.id}, Student: ${record.studentId}, Amount: ₹${record.amount}, Due: ${record.dueDate}, Status: ${record.status}`);
      });
    });

    console.log('\n⚠️  This will permanently delete these records. Continue? (y/n)');
    
    // For now, let's make it safe and require manual confirmation
    console.log('\n🔧 To actually perform the cleanup, uncomment the deletion code in the script.');
    console.log('   The records to be deleted are listed above.');

    /*
    // Uncomment this section to actually perform the cleanup
    
    const orphanedIds = orphanedRecords.map(r => r.id);
    
    console.log('\n🗑️  Deleting orphaned records...');
    const deleteResult = await db.delete(schema.emiSchedule)
      .where(inArray(schema.emiSchedule.id, orphanedIds));
    
    console.log(`✅ Successfully deleted ${orphanedIds.length} orphaned EMI schedule records`);
    console.log('   E-mandate deletion should now work without foreign key constraints.');
    */

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOrphanedEmiSchedules().catch(console.error);
}

export { cleanupOrphanedEmiSchedules };
