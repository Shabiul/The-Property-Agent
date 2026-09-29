const https = require('https');
const fs = require('fs');
const path = require('path');

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('Error: VERCEL_TOKEN environment variable is required.');
  process.exit(1);
}
const teamId = 'team_tQGWirOXAjvitedVdFJW7b5y';
const projectId = 'prj_brDRaIwMk38t4irArKwQFBRMR327';

function api(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('https://api.vercel.com' + endpoint);
    url.searchParams.set('teamId', teamId);
    const req = https.request(url, {
      method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envLines = envFile.split(/\r?\n/);
  const localEnvs = {};
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      localEnvs[key] = val;
    }
  }

  const { body: listBody } = await api(`/v9/projects/${projectId}/env`);
  const remoteEnvs = listBody.envs || [];
  console.log('Remote env count:', remoteEnvs.length);

  for (const [key, value] of Object.entries(localEnvs)) {
    const existing = remoteEnvs.find(e => e.key === key);
    if (existing) {
      console.log(`Updating existing env var: ${key} (id: ${existing.id})`);
      const res = await api(`/v9/projects/${projectId}/env/${existing.id}`, 'PATCH', {
        value,
        target: ['production', 'preview', 'development']
      });
      console.log(`Update ${key} status:`, res.status);
    } else {
      console.log(`Creating new env var: ${key}`);
      const res = await api(`/v10/projects/${projectId}/env`, 'POST', {
        key,
        value,
        type: 'sensitive',
        target: ['production', 'preview', 'development']
      });
      console.log(`Create ${key} status:`, res.status);
    }
  }

  console.log('All environment variables synced successfully.');
}

run().catch(console.error);
