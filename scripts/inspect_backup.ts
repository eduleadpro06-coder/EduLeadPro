
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectBackup() {
    const fileName = 'test_backup_2026-01-12T19-58-09-943Z.json';
    console.log(`Downloading ${fileName}...`);

    const { data, error } = await supabase.storage.from('backups').download(fileName);

    if (error) {
        console.error('Error downloading backup:', error);
        return;
    }

    const text = await data.text();
    console.log(`File size: ${text.length} characters`);
    console.log('--- CONTENT START ---');
    console.log(text.substring(0, 500));
    console.log('--- CONTENT END ---');
}

inspectBackup();
