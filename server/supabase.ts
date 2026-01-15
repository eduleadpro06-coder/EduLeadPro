/**
 * Supabase Client
 * Shared Supabase client instance for server-side operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase credentials not fully configured. Some features may not work.');
}

// Create Supabase client with service key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export default supabase;
