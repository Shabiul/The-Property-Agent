// Vercel serverless function (Node runtime) — generates a live sitemap of
// every published property so individual listing pages get discovered
// and re-crawled by Google without depending on a static file that goes
// stale the moment a property is added, sold, or removed.
//
// Served at /sitemap-properties.xml via the rewrite in vercel.json.
// /sitemap.xml (a static sitemap index) references this URL alongside
// the static pages sitemap.
import { createClient } from '@supabase/supabase-js';

// Minimal request/response typing so this compiles without the
// @vercel/node package — Vercel's Node runtime calls this with a
// standard Node-style (req, res) pair either way.
interface VercelRequest { method?: string }
interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  send(body: string): void;
}

const SITE_URL = 'https://www.thepropertyagent.in';

// Same anon/publishable key the client app ships with — safe to read
// server-side too, since RLS already restricts anonymous reads to
// published properties only (see properties_public_select_published).
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const urls: string[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('properties')
        .select('id, updated_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      for (const row of data ?? []) {
        const lastmod = row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : undefined;
        urls.push(
          `  <url>\n` +
          `    <loc>${escapeXml(`${SITE_URL}/listings/${row.id}`)}</loc>\n` +
          (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
          `    <changefreq>weekly</changefreq>\n` +
          `    <priority>0.7</priority>\n` +
          `  </url>`
        );
      }
    } catch (err) {
      // Fail soft — an empty-but-valid sitemap is far better than a 500
      // that could make Search Console flag the whole sitemap as broken.
      console.error('sitemap-properties: failed to load properties', err);
    }
  } else {
    console.error('sitemap-properties: missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY');
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    (urls.length > 0 ? urls.join('\n') + '\n' : '') +
    `</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Cache at the edge for an hour so this doesn't hit Supabase on every
  // single crawl request, while still staying fresh within a business day.
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
