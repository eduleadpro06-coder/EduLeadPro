import { supabase } from "../server/supabase";

async function run() {
  const { data, error } = await supabase
    .from('daily_updates')
    .select(`
      *,
      leads:leads!daily_updates_lead_id_fkey (
        id,
        name,
        class
      )
    `)
    .eq('status', 'pending');

  console.log("Error:", error);
  console.log("Data length:", data?.length);
  console.log("First item:", data?.[0]);
  process.exit(0);
}
run();
