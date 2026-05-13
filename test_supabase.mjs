import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xenaadxtkqobdndtzbyv.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbmFhZHh0a3FvYmRuZHR6Ynl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU0ODg0MiwiZXhwIjoyMDkyMTI0ODQyfQ.R-zjPLfEpnvBYD3fOwAEhKtzNDasrTEDI-hjua75FOQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('project_vault')
    .insert({
      project_id: "36a362ff-04ac-4841-a214-08f3bfadd9ad",
      title: "Test without created_by",
      content: "Test",
      item_type: "nota"
    })
    .select();
    
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
