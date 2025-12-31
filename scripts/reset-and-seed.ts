import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { leads, organizations, users } from '../shared/schema';
import { sql } from 'drizzle-orm';

// CSV File Path
const csvFilePath = './2026-2027 Admission Enquiry - Enquiry 25-26 (2).csv';

async function resetAndSeed() {
    console.log('🛑 STARTING COMPLETE DATABASE RESET AND RE-IMPORT 🛑');
    console.log('----------------------------------------------------');

    try {
        // 1. TRUNCATE ALL TABLES
        console.log('\n🧹 Truncating all tables...');

        // Fetch all table names from public schema
        const resultQuery = sql.raw(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
        const result = await db.execute(resultQuery);

        let tables = [];
        if (Array.isArray(result)) {
            tables = result.map(r => r.tablename);
        } else {
            // Fallback if result is not array (unlikely with postgres-js but safe)
            // @ts-ignore
            tables = result.rows ? result.rows.map(r => r.tablename) : [];
        }

        console.log(`   - Found ${tables.length} tables.`);

        if (tables.length > 0) {
            // Construct Truncate query with quoted names
            const tableList = tables.map(t => `"${t}"`).join(', ');
            console.log(`   - Truncating: ${tableList.substring(0, 100)}...`);

            const truncateQuery = sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
            await db.execute(truncateQuery);

            console.log('✅ All tables truncated successfully.');
        } else {
            console.log('ℹ️ No tables found to truncate.');
        }

        // 2. RE-CREATE ORGANIZATION AND USER
        console.log('\n🏢 Re-creating Organization and Admin User...');

        // Link leads to Org 60
        await db.execute(sql`
      INSERT INTO organizations (id, name, slug, is_active, created_at, updated_at) 
      VALUES (60, 'EduLead Pro', 'edulead-pro', true, NOW(), NOW())
      OVERRIDING SYSTEM VALUE;
    `);
        console.log('   - Organization ID 60 created.');

        // Create a default admin user
        await db.insert(users).values({
            username: 'admin',
            password: 'password123',
            role: 'super_admin',
            name: 'System Admin',
            email: 'admin@edulead.pro',
            organizationId: 60
        });
        console.log('   - Admin user created.');

        // 3. PARSE AND IMPORT CSV LEADS
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

                let phone = row['Enquirer Mobile'].replace(/[\s\-\/]/g, '');
                if (phone.length > 10) phone = phone.slice(0, 10);
                if (!/^\d{10}$/.test(phone)) return;

                const programName = row['Program Name'] || '';
                let className = 'Nursery';
                if (programName.match(/Play\s*Group/i)) className = 'Playgroup';
                else if (programName.match(/Nursery/i)) className = 'Nursery';
                else if (programName.match(/Euro\s*Junior/i) || programName.match(/LKG/i)) className = 'LKG';
                else if (programName.match(/Euro\s*Senior/i) || programName.match(/UKG/i)) className = 'UKG';
                else if (programName.match(/Daycare/i)) className = 'Daycare';
                else if (programName) className = programName;

                const admissionStatus = row['Admission Status'] || '';
                let status = 'new';
                if (admissionStatus.includes('Admission Done')) status = 'enrolled';
                else if (admissionStatus.includes('Not Interested') || admissionStatus.includes('Fake')) status = 'dropped';
                else if (admissionStatus.includes('Highly Potential') || admissionStatus.includes('Potential Lead')) status = 'interested';
                else if (admissionStatus.includes('Call Not Recieved') || admissionStatus.includes('New')) status = 'new';
                else status = 'contacted';

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
                    organizationId: 60,
                    notes: [
                        row['Notes For Follow Up '] || '',
                        row['Admission Status'] ? `Original Status: ${row['Admission Status']}` : '',
                        row['Program Name'] !== className ? `Original Program: ${row['Program Name']}` : ''
                    ].filter(Boolean).join(' | '),
                    interestedProgram: programName
                });
            } catch (e) {
                // Skip invalid rows silently
            }
        });

        const uniqueLeads = [];
        const seenPhones = new Set();
        mappedLeads.forEach(lead => {
            if (!seenPhones.has(lead.phone)) {
                seenPhones.add(lead.phone);
                uniqueLeads.push(lead);
            }
        });

        console.log(`\n🚀 Inserting ${uniqueLeads.length} unique leads...`);

        // Chunk insert
        const chunkSize = 50;
        for (let i = 0; i < uniqueLeads.length; i += chunkSize) {
            const chunk = uniqueLeads.slice(i, i + chunkSize);
            await db.insert(leads).values(chunk);
            console.log(`   - Inserted chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} leads)`);
        }

        console.log('\n✅ Leads inserted successfully.');
        console.log('----------------------------------------------------');
        console.log('🎉 DATABASE RESET AND RE-IMPORT COMPLETE');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

resetAndSeed();
