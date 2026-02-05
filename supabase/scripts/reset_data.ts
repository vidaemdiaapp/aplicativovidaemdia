import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Load environment variables (ensure these are set or passed)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Fatal: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetAuth() {
  console.log("🔄 Starting Auth Reset...");
  let count = 0;
  
  // List all users (pagination required)
  let { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("❌ Error listing users:", error);
    return;
  }

  while (users && users.length > 0) {
    console.log(`Found ${users.length} users page...`);
    
    for (const user of users) {
      const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
      if (delError) {
        console.error(`❌ Failed to delete user ${user.id}:`, delError);
      } else {
        process.stdout.write("."); // Progress dot
        count++;
      }
    }
    
    // Fetch next page
    const { data: nextPage } = await supabase.auth.admin.listUsers();
    users = nextPage.users;
    
    // Simple breaker for now to separate pages logic if listUsers pagination changes
    // But createClient v2 default listUsers returns first 50.
    // If we just re-call listUsers() after deleting, we effectively paginate.
    if (users.length === 0) break;
  }
  
  console.log(`\n✅ Auth Reset Complete. Deleted ${count} users.`);
}

async function resetStorage() {
  console.log("🔄 Starting Storage Reset...");
  
  // Buckets identified from SQL: 'documents', 'fiscal-documents'
  // Also common ones likely to appear: 'avatars', 'receipts'
  // We will iterate dynamically if listBuckets works, or static list.
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error("❌ Error listing buckets:", error);
    return;
  }

  for (const bucket of buckets) {
    console.log(`\n📂 Cleaning bucket: ${bucket.name}`);
    
    // List files
    let { data: files } = await supabase.storage.from(bucket.name).list(null, { limit: 100 });
    
    while (files && files.length > 0) {
      const paths = files.map(f => f.name);
      
      const { error: rmError } = await supabase.storage.from(bucket.name).remove(paths);
      if (rmError) {
        console.error(`❌ Error removing files in ${bucket.name}:`, rmError);
      } else {
        console.log(`   - Deleted ${files.length} files.`);
      }
      
      // Fetch next batch
      const { data: nextFiles } = await supabase.storage.from(bucket.name).list(null, { limit: 100 });
      files = nextFiles;
    }
  }
  
  console.log("\n✅ Storage Reset Complete.");
}

async function main() {
  console.log("⚠️  WARNING: STARTING DATA RESET ⚠️");
  await resetAuth();
  await resetStorage();
  console.log("✨ All Cleaning Tasks Finished.");
}

main();
