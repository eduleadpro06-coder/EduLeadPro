import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { leads, organizations, users } from '../shared/schema';
import { sql } from 'drizzle-orm';

// CSV File Path
const csvFilePath = './2026-2027 Admission Enquiry - Enquiry 25-26 (2).csv';

async function manualReimport() {
    console.log('🚀 STARTING MANUAL RE-IMPORT PROCESS (Org 1, Custom Class Mappings) 🚀');
    console.log('----------------------------------------------------');

    try {
        // 1. RE-CREATE ORGANIZATION AND USER
        console.log('\n🏢 Creating Organization and Admin User...');

        // Update to Org ID 1
        await db.execute(sql`
      INSERT INTO organizations (id, name, slug, is_active, created_at, updated_at) 
      VALUES (1, 'EduLead Pro', 'edulead-pro', true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'EduLead Pro';
    `);
        console.log('   - Organization ID 1 ensured.');

        // Create a default admin user link to this org
        await db.insert(users).values({
            username: 'admin',
            password: 'password123',
            role: 'super_admin',
            name: 'System Admin',
            email: 'admin@edulead.pro',
            organizationId: 1
        }).onConflictDoNothing();
        console.log('   - Admin user ensured.');

        // 2. PARSE AND IMPORT CSV LEADS
        console.log('\n📄 Parsing CSV file...');
        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found at ${csvFilePath}`);
        }

        const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        });

        console.log(`   - Found ${records.length} records.`);

        const mappedLeads = [];

        records.forEach((row) => {
            try {
                if (!row['Student Name'] || !row['Enquirer Mobile']) return;

                // Clean phone
                let phone = row['Enquirer Mobile'].replace(/[\s\-\/]/g, '');
                if (phone.length > 10) phone = phone.slice(0, 10);
                if (!/^\d{10}$/.test(phone)) return;

                // Standardize Class
                const programName = row['Program Name'] || '';
                let className = 'Nursery';

                // Mappings: 
                // LKG / Euro Junior / UKG -> Junior KG  (User Specific Request)
                // SKG / Euro Senior -> Senior KG         (User Specific Request)

                if (programName.match(/Play\s*Group/i)) {
                    className = 'Playgroup';
                } else if (programName.match(/Nursery/i)) {
                    className = 'Nursery';
                } else if (programName.match(/Euro\s*Junior/i) || programName.match(/LKG/i) || programName.match(/Junior\s*KG/i) || programName.match(/UKG/i)) {
                    className = 'Junior KG'; // UKG explicitly mapped to Junior KG per request
                } else if (programName.match(/Euro\s*Senior/i) || programName.match(/SKG/i) || programName.match(/Senior\s*KG/i)) {
                    className = 'Senior KG'; // SKG explicitly mapped to Senior KG
                } else if (programName.match(/Daycare/i)) {
                    className = 'Daycare';
                } else if (programName) {
                    // Fallback logic
                    if (programName.includes('Junior')) className = 'Junior KG';
                    else if (programName.includes('Senior')) className = 'Senior KG';
                    else className = programName;
                }

                // Standardize Status
                const admissionStatus = row['Admission Status'] || '';
                let status = 'new';
                if (admissionStatus.includes('Admission Done')) status = 'enrolled';
                else if (admissionStatus.includes('Not Interested') || admissionStatus.includes('Fake')) status = 'dropped';
                else if (admissionStatus.includes('Highly Potential') || admissionStatus.includes('Potential Lead')) status = 'interested';
                else if (admissionStatus.includes('Call Not Recieved') || admissionStatus.includes('New')) status = 'new';
                else status = 'contacted';

                // Standardize Source
                let sourceInput = (row['Source'] || '').toLowerCase();
                let source = 'walk_in';
                if (sourceInput.includes('google')) source = 'google_ads';
                else if (sourceInput.includes('facebook') || sourceInput.includes('fb')) source = 'facebook';
                else if (sourceInput.includes('walk') || sourceInput.includes('visit') || sourceInput.includes('walk inn')) source = 'walk_in';
                else if (sourceInput.includes('referral') || sourceInput.includes('ref')) source = 'referral';
                else if (sourceInput.includes('web')) source = 'website';
                else if (sourceInput.includes('phone') || sourceInput.includes('call')) source = 'phone_inquiry';
                else if (sourceInput.includes('banner') || sourceInput.includes('pamphlet') || sourceInput.includes('flex')) source = 'walk_in';

                mappedLeads.push({
                    name: row['Student Name'].trim(),
                    phone: phone,
                    email: null,
                    class: className,
                    stream: null,
                    source: source,
                    status: status,
                    parentName: row['Enquirer Name'] || '',
                    parentPhone: phone,
                    address: row['Locality'] || '',
                    organizationId: 1, // Organization ID 1
                    notes: [
                        row['Notes For Follow Up '] || '',
                        row['Admission Status'] ? `Original Status: ${row['Admission Status']}` : '',
                        row['Program Name'] !== className ? `Original Program: ${row['Program Name']}` : ''
                    ].filter(Boolean).join(' | '),
                    interestedProgram: programName
                });
            } catch (e) {
                // Skip invalid rows silently or log
            }
        });

        // Remove duplicates within the CSV itself
        const uniqueLeads = [];
        const seenPhones = new Set();
        mappedLeads.forEach(lead => {
            if (!seenPhones.has(lead.phone)) {
                seenPhones.add(lead.phone);
                uniqueLeads.push(lead);
            }
        });

        console.log(`\n🚀 Processing ${uniqueLeads.length} unique leads from CSV...`);

        // Get all existing leads to handle UPSERT manually (avoiding unique constraint issue)
        const existingLeads = await db.select({ id: leads.id, phone: leads.phone }).from(leads);
        const existingPhoneMap = new Map(existingLeads.map(l => [l.phone, l.id]));

        const toInsert = [];
        const idsToUpdate = [];

        // Separate into Inserts and Updates
        uniqueLeads.forEach(lead => {
            if (existingPhoneMap.has(lead.phone)) {
                // Found existing lead, prepare update
                idsToUpdate.push({
                    id: existingPhoneMap.get(lead.phone),
                    ...lead
                });
            } else {
                // New lead
                toInsert.push(lead);
            }
        });

        console.log(`   - New Leads to Insert: ${toInsert.length}`);
        console.log(`   - Existing Leads to Update: ${idsToUpdate.length}`);

        // Batch Insert
        if (toInsert.length > 0) {
            const insertChunkSize = 50;
            for (let i = 0; i < toInsert.length; i += insertChunkSize) {
                const chunk = toInsert.slice(i, i + insertChunkSize);
                await db.insert(leads).values(chunk);
                console.log(`     Inserted chunk ${Math.floor(i / insertChunkSize) + 1} (${chunk.length} leads)`);
            }
        }

        // Batch Update
        if (idsToUpdate.length > 0) {
            console.log('     Updating existing records...');
            let updatedCount = 0;
            for (const lead of idsToUpdate) {
                await db.update(leads)
                    .set({
                        organizationId: 1,
                        class: lead.class,
                        status: lead.status,
                        source: lead.source,
                        updatedAt: new Date()
                    })
                    .where(sql`id = ${lead.id}`);
                updatedCount++;
                if (updatedCount % 50 === 0) process.stdout.write('.');
            }
            console.log(`\n     Updated ${updatedCount} leads.`);
        }

        console.log('\n✅ Import complete. Please verify data in the dashboard.');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error);
        process.exit(1);
    }
}

manualReimport();
