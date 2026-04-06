import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fmmipkxamcopszteisce.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTIzOTUsImV4cCI6MjA2OTg2ODM5NX0.LK2LlzykKgE3Q3pdXJZyg8JjfsRTTMRPayHkmV-dS7U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('student_gate_logs')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);
        
    console.log("Error:", error);
    console.log("Data:", data);
}

check();
