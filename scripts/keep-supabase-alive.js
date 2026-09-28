import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to read .env file manually without external dependencies
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
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const googleSheetWebhook = process.env.GOOGLE_SHEET_WEBHOOK_URL || process.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL or Anon/Publishable Key is missing from environment variables.');
  console.error('Please make sure SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) are set.');
  process.exit(1);
}

async function logToGoogleSheet(logData) {
  if (!googleSheetWebhook || googleSheetWebhook.includes('YOUR_DEPLOYMENT_ID')) {
    console.log('ℹ️ GOOGLE_SHEET_WEBHOOK_URL not set or is using placeholder. Skipping Google Sheet log dumping.');
    return;
  }

  try {
    console.log('📊 Dumping log to Google Sheet...');
    const res = await fetch(googleSheetWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(logData),
      redirect: 'follow',
    });
    if (res.ok) {
      console.log('✅ Log successfully appended to Google Sheet!');
    } else {
      console.warn(`⚠️ Google Sheet Webhook returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('⚠️ Failed to dump log to Google Sheet:', err.message);
  }
}

async function pingSupabase() {
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`;
  const timestamp = new Date().toISOString();
  console.log(`📡 Pinging Supabase project at: ${endpoint}`);

  try {
    const startTime = Date.now();
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    const duration = Date.now() - startTime;
    const isSuccess = response.ok || response.status < 500;

    const logPayload = {
      timestamp,
      projectUrl: supabaseUrl,
      statusCode: response.status,
      statusText: response.statusText,
      durationMs: duration,
      message: isSuccess ? 'Ping Successful - Project Active' : `Unexpected Status ${response.status}`,
    };

    if (isSuccess) {
      console.log(`✅ Success! Supabase project pinged in ${duration}ms (HTTP ${response.status} ${response.statusText}).`);
      console.log('🎉 Your Supabase project status is updated and will remain active without pausing.');
      await logToGoogleSheet(logPayload);
    } else {
      console.error(`⚠️ Received unexpected response code: ${response.status} ${response.statusText}`);
      await logToGoogleSheet(logPayload);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to ping Supabase project:', error.message);
    await logToGoogleSheet({
      timestamp,
      projectUrl: supabaseUrl,
      statusCode: 'ERROR',
      statusText: 'FETCH_FAILED',
      durationMs: 0,
      message: error.message,
    });
    process.exit(1);
  }
}

pingSupabase();

