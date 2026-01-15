
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeBackup() {
    const fileName = 'test_backup_2026-01-12T19-58-09-943Z.json';
    console.log(`Downloading ${fileName}...`);

    const { data, error } = await supabase.storage.from('backups').download(fileName);

    if (error) {
        console.error('Error downloading backup:', error);
        return;
    }

    const text = await data.text();
    const json = JSON.parse(text);

    console.log(`\nAnalysis of ${fileName}:`);
    console.log('--------------------------------------------------');
    let totalRecords = 0;

    for (const [table, records] of Object.entries(json)) {
        if (Array.isArray(records) && records.length > 0) {
            console.log(`${table}: ${records.length} records`);
            totalRecords += records.length;
        }
    }

    if (totalRecords === 0) {
        console.log('No records found in any table (all arrays empty).');
    } else {
        console.log('--------------------------------------------------');
        console.log(`Total Records Found: ${totalRecords}`);
    }
}

analyzeBackup();
