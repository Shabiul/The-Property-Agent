import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && val && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecret) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be defined in .env');
  process.exit(1);
}

const email = process.argv[2] || 'admin@thepropertyagent.in';
const password = process.argv[3] || 'ThePropertyAgent@2026!';

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log(`Creating or updating admin user: ${email}...`);
  
  // Check if user already exists
  const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list users:', listErr);
    process.exit(1);
  }

  const existing = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`User already exists with ID: ${existing.id}. Updating password...`);
    const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (updateErr) {
      console.error('❌ Update failed:', updateErr);
      process.exit(1);
    }
    console.log('✅ Admin user password updated successfully!');
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (error) {
      console.error('❌ Creation failed:', error);
      process.exit(1);
    }
    console.log('✅ Admin user created successfully!', { id: data.user.id, email: data.user.email });
  }

  console.log('\n--- Admin Credentials ---');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('-------------------------\n');
}

main().catch(console.error);
