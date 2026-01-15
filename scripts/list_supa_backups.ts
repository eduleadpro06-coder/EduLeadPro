
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBackups() {
    console.log('Listing backups from bucket "backups"...');
    const { data, error } = await supabase.storage.from('backups').list();

    if (error) {
        console.error('Error listing backups:', error);
    } else {
        if (data.length === 0) {
            console.log('No backups found in "backups" bucket.');
        } else {
            console.log('Found backups:');
            data.forEach(file => {
                console.log(`- ${file.name} (${file.metadata?.size} bytes, created: ${file.created_at})`);
            });
        }
    }
}

listBackups();
