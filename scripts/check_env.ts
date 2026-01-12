import 'dotenv/config';

console.log('Checking Environment Variables...');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Present (starts with ' + process.env.SUPABASE_SERVICE_KEY.substring(0, 5) + '...)' : 'MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'MISSING');
console.log('CRON_SECRET:', process.env.CRON_SECRET ? 'Present' : 'MISSING');
