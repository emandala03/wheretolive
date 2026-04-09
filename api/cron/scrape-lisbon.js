// api/cron/scrape-lisbon.js — v3, with debug logging
// Uses fetch directly to Supabase REST API — no npm dependencies

import { LISBON_NEIGHBORHOODS } from "../neighborhoods.js";

const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

async function supaInsert(table, rows) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) console.error(`supaInsert ${table}:`, await res.text());
  return res.ok;
}

function filterIQR(prices) {
  if (prices.length < 4) return prices;
  const s = [...prices].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  const iqr = q3 - q1;
  return s.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

function calcStats(prices) {
  const s = [...prices].sort((a, b) => a - b);
  const n = s.length;
  const median = n % 2 === 0 ? Math.round((s[n/2-1]+s[n/2])/2) : s[Math.floor(n/2)];
  return { median, p25: s[Math.floor(n*0.25)], p75: s[Math.floor(n*0.75)] };
}

function parsePrices(html) {
  const prices = [];
  let m;
  const re = /(\d{3,4})\s*€\/month/g;
  while ((m = re.exec(html)) !== null) prices.push(parseInt(m[1], 10));
  const billsCount = (html.match(/BILLS INCLUDED/gi) || []).length;
  return { prices, billsIncluded: billsCount > prices.length * 0.5 };
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.log(`  fetchPage ${url} → status ${res.status}`);
      return null;
    }
    return await res.text();
  } catch(e) {
    console.log(`  fetchPage ${url} → error: ${e.message}`);
    return null;
  }
}

function buildUrl(hood, type) {
  const base = "https://www.spotahome.com/for-rent/lisbon";
  if (type === "room")   return `${base}/${hood}-rooms`;
  if (type === "studio") return `${base}/${hood}-studios`;
  if (type === "oneBed") return `${base}/${hood}-1-bedroom-apartments`;
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`)
    return res.status(401).json({ error: "Unauthorized" });

  // TEST MODE: only fetch 2 neighborhoods to verify the pipeline works
  const TEST_MODE = true;
  const TEST_HOODS = ["alfama", "arroios"];

  const runId = new Date().toISOString().slice(0, 10);
  const allListings = [];
  const summary = {};

  console.log(`[scrape-lisbon] Starting run ${runId} — TEST_MODE=${TEST_MODE}`);

  for (const type of ["room"]) { // only rooms in test mode
    for (const zone of ["center", "outside"]) {
      const neighborhoods = TEST_MODE
        ? TEST_HOODS.filter(h => LISBON_NEIGHBORHOODS[zone].includes(h))
        : LISBON_NEIGHBORHOODS[zone];

      const zonePrices = [];

      for (const hood of neighborhoods) {
        const url = buildUrl(hood, type);
        console.log(`  Fetching: ${url}`);
        const html = await fetchPage(url);

        if (!html) {
          console.log(`  → NULL response`);
          continue;
        }

        console.log(`  → HTML length: ${html.length} chars`);

        // Log a snippet to see what we got
        const snippet = html.substring(0, 500).replace(/\n/g, ' ');
        console.log(`  → Snippet: ${snippet}`);

        const { prices, billsIncluded } = parsePrices(html);
        console.log(`  → Prices found: ${prices.join(', ')}`);

        for (const price of prices) {
          allListings.push({
            city: "lisbon", type, zone,
            neighborhood: hood, price,
            bills_included: billsIncluded,
            run_id: runId,
            fetched_at: new Date().toISOString(),
          });
          zonePrices.push(price);
        }

        await new Promise(r => setTimeout(r, 1000));
      }

      const key = `${type}_${zone}`;
      const filtered = filterIQR(zonePrices);
      summary[key] = { n_raw: zonePrices.length, n_filtered: filtered.length, prices: zonePrices };

      if (filtered.length >= 5) { // lower threshold for test
        const { median, p25, p75 } = calcStats(filtered);
        summary[key] = { ...summary[key], ok: true, median, p25, p75 };
        console.log(`  → STATS ${key}: median=${median} p25=${p25} p75=${p75}`);
      }
    }
  }

  console.log(`[scrape-lisbon] Done — ${allListings.length} listings`);
  return res.status(200).json({ runId, summary, total: allListings.length });
}
