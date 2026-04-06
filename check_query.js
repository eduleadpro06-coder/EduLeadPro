import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fmmipkxamcopszteisce.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTIzOTUsImV4cCI6MjA2OTg2ODM5NX0.LK2LlzykKgE3Q3pdXJZyg8JjfsRTTMRPayHkmV-dS7U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: data2, error: error2 } = await supabase
        .from('student_gate_logs')
        .select(`
            *,
            student:leads(name, class, section, phone),
            recorder:staff(name)
        `)
        .eq('organization_id', 1)
        .gte('date', '2026-04-06')
        .lte('date', '2026-04-06')
        .order('date', { ascending: false })
        .order('check_in_time', { ascending: false });
        
    console.log("Error:", error2);
    console.log("Data size:", data2?.length);
    console.log("Data elements:", JSON.stringify(data2, null, 2));
}

check();
