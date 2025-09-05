// Supabase client initialization
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Check if environment variables are properly set
const isConfigured = !!supabaseUrl && !!supabaseAnonKey && 
                     supabaseUrl !== 'https://your-project.supabase.co' && 
                     supabaseAnonKey !== 'your-anon-key-here'

// Log detailed information about the configuration
if (!isConfigured) {
  console.error('⚠️ Supabase authentication is not properly configured:')
  if (!supabaseUrl) {
    console.error('- VITE_SUPABASE_URL is missing')
  } else if (supabaseUrl === 'https://your-project.supabase.co') {
    console.error('- VITE_SUPABASE_URL is set to the example value, not a real Supabase URL')
  }
  
  if (!supabaseAnonKey) {
    console.error('- VITE_SUPABASE_ANON_KEY is missing')
  } else if (supabaseAnonKey === 'your-anon-key-here') {
    console.error('- VITE_SUPABASE_ANON_KEY is set to the example value, not a real anon key')
  }
  
  console.error('Please set these environment variables in your Vercel project settings.')
}

// Get the correct redirect URL based on environment
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // For local development (localhost or 127.0.0.1)
    if (hostname.includes('localhost') || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}${port ? ':' + port : ''}/auth/callback`;
    }
    
    // For production or deployed environments
    return `${window.location.origin}/auth/callback`;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:5000/auth/callback';
};

// Create the Supabase client with actual values or fallbacks if missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'eduleadpro.auth',
      redirectTo: getRedirectUrl(),
    },
  }
)

// Helper function to check if auth is properly configured
export const isAuthConfigured = () => isConfigured

// Helper function to get configuration status details
export const getAuthConfigStatus = () => {
  return {
    isConfigured,
    supabaseUrlSet: !!supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co',
    supabaseKeySet: !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here',
    url: supabaseUrl ? 
         (supabaseUrl === 'https://your-project.supabase.co' ? 'example-value' : 'custom-value') : 
         'missing',
    key: supabaseAnonKey ? 
         (supabaseAnonKey === 'your-anon-key-here' ? 'example-value' : 'custom-value') : 
         'missing'
  }
}