#!/usr/bin/env node

/**
 * EMI Data Cleanup and Investigation Script
 * 
 * This script helps identify and clean up orphaned EMI data
 * that causes foreign key constraint violations.
 */

import { db } from '../server/db.js';
import * as schema from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('🔍 EMI Data Investigation and Cleanup Script');
  console.log('=' .repeat(50));

  try {
    // 1. Check EMI Plans
    const emiPlans = await db.select().from(schema.emiPlans);
    console.log(`📊 Total EMI Plans: ${emiPlans.length}`);
    
    if (emiPlans.length > 0) {
      console.log('📝 EMI Plans:');
      emiPlans.forEach(plan => {
        console.log(`  - Plan ID: ${plan.id}, Student ID: ${plan.studentId}, Status: ${plan.status}`);
      });
    }

    // 2. Check EMI Schedules
    const emiSchedules = await db.select().from(schema.emiSchedule);
    console.log(`\n📅 Total EMI Schedule Records: ${emiSchedules.length}`);
    
    // Group EMI schedules by e-mandate ID
    const schedulesByMandate = {};
    emiSchedules.forEach(schedule => {
      if (schedule.eMandateId) {
        if (!schedulesByMandate[schedule.eMandateId]) {
          schedulesByMandate[schedule.eMandateId] = [];
        }
        schedulesByMandate[schedule.eMandateId].push(schedule);
      }
    });

    console.log('\n📋 EMI Schedules grouped by E-Mandate ID:');
    Object.keys(schedulesByMandate).forEach(mandateId => {
      console.log(`  - E-Mandate ID ${mandateId}: ${schedulesByMandate[mandateId].length} schedule records`);
    });

    // 3. Check E-Mandates
    const eMandates = await db.select().from(schema.eMandates);
    console.log(`\n💳 Total E-Mandates: ${eMandates.length}`);
    
    if (eMandates.length > 0) {
      console.log('📝 E-Mandates:');
      eMandates.forEach(mandate => {
        console.log(`  - Mandate ID: ${mandate.id}, Student/Lead ID: ${mandate.leadId}, Status: ${mandate.status}`);
      });
    }

    // 4. Identify orphaned EMI schedules
    console.log('\n🔍 Checking for orphaned EMI schedule records...');
    const orphanedSchedules = [];
    
    for (const [mandateIdStr, schedules] of Object.entries(schedulesByMandate)) {
      const mandateId = parseInt(mandateIdStr);
      const mandateExists = eMandates.some(m => m.id === mandateId);
      
      if (!mandateExists) {
        orphanedSchedules.push({ mandateId, schedules });
        console.log(`❌ Found ${schedules.length} orphaned EMI schedule records for non-existent e-mandate ID ${mandateId}`);
      }
    }

    // 5. Check students with EMI data
    const students = await db.select().from(schema.students);
    console.log(`\n👥 Total Students: ${students.length}`);

    // Find students mentioned in EMI plans vs EMI schedules
    const studentsWithPlans = new Set(emiPlans.map(p => p.studentId));
    const studentsWithSchedules = new Set(emiSchedules.map(s => s.studentId));
    
    console.log(`\n📈 Students with EMI Plans: ${studentsWithPlans.size}`);
    console.log(`📅 Students with EMI Schedules: ${studentsWithSchedules.size}`);

    // Students with schedules but no plans
    const studentsWithSchedulesNoPlans = [...studentsWithSchedules].filter(id => !studentsWithPlans.has(id));
    if (studentsWithSchedulesNoPlans.length > 0) {
      console.log(`\n⚠️  Students with EMI schedules but no EMI plans: ${studentsWithSchedulesNoPlans.length}`);
      studentsWithSchedulesNoPlans.forEach(studentId => {
        const student = students.find(s => s.id === studentId);
        console.log(`  - Student ID: ${studentId} (${student?.name || 'Unknown'})`);
      });
    }

    // 6. Cleanup recommendations
    console.log('\n' + '='.repeat(50));
    console.log('🛠️  CLEANUP RECOMMENDATIONS:');
    console.log('='.repeat(50));

    if (orphanedSchedules.length > 0) {
      console.log(`\n❌ Found ${orphanedSchedules.length} groups of orphaned EMI schedule records.`);
      console.log('   These are preventing e-mandate deletion.');
      console.log('   Options:');
      console.log('   1. Delete orphaned EMI schedule records (recommended)');
      console.log('   2. Create corresponding EMI plans if the data is valid');
      
      // Ask user if they want to clean up
      console.log('\n🧹 Would you like to clean up orphaned EMI schedule records? (y/n)');
      
      // For now, just show what would be deleted
      console.log('\n📝 Records that would be deleted:');
      for (const orphan of orphanedSchedules) {
        console.log(`   - ${orphan.schedules.length} EMI schedule records for e-mandate ID ${orphan.mandateId}`);
        orphan.schedules.forEach(schedule => {
          console.log(`     * Schedule ID: ${schedule.id}, Student: ${schedule.studentId}, Amount: ₹${schedule.amount}, Due: ${schedule.dueDate}`);
        });
      }
    } else {
      console.log('\n✅ No orphaned EMI schedule records found.');
    }

    if (studentsWithSchedulesNoPlans.length > 0) {
      console.log(`\n⚠️  Found ${studentsWithSchedulesNoPlans.length} students with EMI schedules but no EMI plans.`);
      console.log('   This might be why EMI plans don\'t show up in the UI.');
      console.log('   Consider creating EMI plan records for these students.');
    } else {
      console.log('\n✅ All students with EMI schedules have corresponding EMI plans.');
    }

  } catch (error) {
    console.error('❌ Error during investigation:', error);
  }
}

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
