import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db';
import { leads } from './shared/schema';
import { eq, inArray } from 'drizzle-orm';

// Read the CSV file
const csvFilePath = './2026-2027 Admission Enquiry - Enquiry 25-26 (2).csv';
const csvContent = fs.readFileSync(csvFilePath, 'utf-8');

// Parse CSV
const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
});

console.log(`📊 Total records in CSV: ${records.length}`);

// Map CSV data to leads format
const mappedLeads = [];
const errors = [];

records.forEach((row, index) => {
    try {
        // Skip if no student name or phone
        if (!row['Student Name'] || !row['Enquirer Mobile']) {
            errors.push({ row: index + 2, reason: 'Missing student name or mobile' });
            return;
        }

        // Clean phone number - remove spaces, dashes, slashes
        let phone = row['Enquirer Mobile'].replace(/[\s\-\/]/g, '');

        // Take first 10 digits if multiple numbers
        if (phone.length > 10) {
            phone = phone.slice(0, 10);
        }

        // Validate phone is exactly 10 digits
        if (!/^\d{10}$/.test(phone)) {
            errors.push({ row: index + 2, phone: row['Enquirer Mobile'], reason: 'Invalid phone number format' });
            return;
        }

        // --- Standardize Class Name ---
        const programName = row['Program Name'] || '';
        let className = 'Nursery';

        if (programName.match(/Play\s*Group/i)) {
            className = 'Playgroup';
        } else if (programName.match(/Nursery/i)) {
            className = 'Nursery';
        } else if (programName.match(/Euro\s*Junior/i) || programName.match(/LKG/i)) {
            className = 'LKG';
        } else if (programName.match(/Euro\s*Senior/i) || programName.match(/UKG/i)) {
            className = 'UKG';
        } else if (programName.match(/Daycare/i)) {
            className = 'Daycare';
        } else if (programName) {
            className = programName;
        }

        // --- Standardize Status ---
        const admissionStatus = row['Admission Status'] || '';
        let status = 'new';

        if (admissionStatus.includes('Admission Done')) {
            status = 'enrolled';
        } else if (admissionStatus.includes('Not Interested') || admissionStatus.includes('Fake')) {
            status = 'dropped';
        } else if (admissionStatus.includes('Highly Potential') || admissionStatus.includes('Potential Lead')) {
            status = 'interested';
        } else if (admissionStatus.includes('Call Not Recieved') || admissionStatus.includes('New')) {
            status = 'new';
        } else {
            status = 'contacted';
        }

        // --- Standardize Source ---
        let sourceInput = (row['Source'] || '').toLowerCase();
        let source = 'walk_in';

        if (sourceInput.includes('google')) {
            source = 'google_ads';
        } else if (sourceInput.includes('facebook') || sourceInput.includes('fb')) {
            source = 'facebook';
        } else if (sourceInput.includes('walk') || sourceInput.includes('visit') || sourceInput.includes('walk inn')) {
            source = 'walk_in';
        } else if (sourceInput.includes('referral') || sourceInput.includes('ref')) {
            source = 'referral';
        } else if (sourceInput.includes('web')) {
            source = 'website';
        } else if (sourceInput.includes('phone') || sourceInput.includes('call')) {
            source = 'phone_inquiry';
        } else if (sourceInput.includes('banner') || sourceInput.includes('pamphlet') || sourceInput.includes('flex')) {
            source = 'walk_in';
        }

        // Build the lead object
        const lead = {
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
        };

        mappedLeads.push(lead);
    } catch (error) {
        errors.push({ row: index + 2, reason: error.message });
    }
});

console.log(`✅ Successfully mapped: ${mappedLeads.length} leads`);

async function seedLeads() {
    try {
        console.log(`\n🚀 Checking for duplicates and inserting leads...`);

        // Get all existing phone numbers
        const existingLeads = await db.select({ phone: leads.phone }).from(leads);
        const existingPhones = new Set(existingLeads.map(l => l.phone));

        const leadsToInsert = [];
        const duplicates = [];

        mappedLeads.forEach(lead => {
            if (existingPhones.has(lead.phone)) {
                duplicates.push(lead);
            } else {
                leadsToInsert.push(lead);
                existingPhones.add(lead.phone); // Add to set to prevent internal duplicates in CSV
            }
        });

        console.log(`   - New Leads to Insert: ${leadsToInsert.length}`);
        console.log(`   - Duplicates Skipped: ${duplicates.length}`);

        if (leadsToInsert.length > 0) {
            // Chunk inserts to avoid query size limits
            const chunkSize = 50;
            for (let i = 0; i < leadsToInsert.length; i += chunkSize) {
                const chunk = leadsToInsert.slice(i, i + chunkSize);
                await db.insert(leads).values(chunk);
                console.log(`     Inserted chunk ${i / chunkSize + 1} (${chunk.length} leads)`);
            }
            console.log(`✅ Successfully inserted ${leadsToInsert.length} leads!`);
        } else {
            console.log(`ℹ️ No new leads to insert.`);
        }

        fs.writeFileSync('import-results.json', JSON.stringify({
            imported: leadsToInsert.length,
            duplicates: duplicates.length,
            errors: errors.length,
            errorDetails: errors
        }, null, 2));

        console.log('\n💾 Detailed results saved to import-results.json');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

seedLeads();
