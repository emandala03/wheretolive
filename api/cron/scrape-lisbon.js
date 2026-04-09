// api/cron/scrape-lisbon.js — v4
// Uses /s/lisbon/for-rent:rooms URL format which is SSR and returns prices in HTML

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
  // Try multiple price patterns
  const patterns = [
    /(\d{3,4})\s*€\/month/g,           // "500 €/month"
    /\"price\":\s*(\d{3,4})/g,          // JSON: "price": 500
    /data-price=\"(\d{3,4})\"/g,        // data-price="500"
    /(\d{3,4})\s*€\s*\/\s*month/g,     // "500 € / month"
    /price[^>]*>\s*(\d{3,4})/g,        // price>500
  ];
  
  for (const re of patterns) {
    re.lastIndex = 0;
    while ((m = re.exec(html)) !== null) {
      const p = parseInt(m[1], 10);
      if (p >= 200 && p <= 3000) prices.push(p); // sanity range
    }
  }
  
  // Deduplicate
  const unique = [...new Set(prices)];
  const billsCount = (html.match(/BILLS INCLUDED/gi) || []).length;
  return { prices: unique, billsIncluded: billsCount > unique.length * 0.5 };
}

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.log(`  fetchPage ${url} → status ${res.status}`);
      return null;
    }
    return await res.text();
  } catch(e) {
    console.log(`  fetchPage error: ${e.message}`);
    return null;
  }
}

// Build URLs using the SSR format that worked in our manual test
function buildUrl(hood, type) {
  const base = "https://www.spotahome.com/s/lisbon";
  if (type === "room")   return `${base}/for-rent:rooms?neighborhood=${hood}`;
  if (type === "studio") return `${base}/for-rent:studios?neighborhood=${hood}`;
  if (type === "oneBed") return `${base}/for-rent:apartments?neighborhood=${hood}&bedrooms=1`;
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`)
    return res.status(401).json({ error: "Unauthorized" });

  // TEST MODE: only 2 neighborhoods, only rooms
  const TEST_MODE = true;
  const TEST_HOODS = ["alfama", "arroios"];

  const runId = new Date().toISOString().slice(0, 10);
  const allListings = [];
  const summary = {};

  console.log(`[scrape-lisbon] v4 — run ${runId}`);

  for (const type of ["room"]) {
    for (const zone of ["center", "outside"]) {
      const neighborhoods = TEST_MODE
        ? TEST_HOODS.filter(h => LISBON_NEIGHBORHOODS[zone].includes(h))
        : LISBON_NEIGHBORHOODS[zone];

      const zonePrices = [];

      for (const hood of neighborhoods) {
        const url = buildUrl(hood, type);
        console.log(`  Fetching: ${url}`);
        const html = await fetchPage(url);

        if (!html) { console.log(`  → NULL`); continue; }

        console.log(`  → HTML: ${html.length} chars`);

        // Log snippet around price patterns to debug
        const priceIdx = html.indexOf("€");
        if (priceIdx > 0) {
          console.log(`  → Near first €: ${html.substring(priceIdx-50, priceIdx+50).replace(/\n/g,' ')}`);
        } else {
          console.log(`  → No € found in HTML`);
          // Log first 300 chars to see what we got
          console.log(`  → Start: ${html.substring(0,300).replace(/\n/g,' ')}`);
        }

        const { prices, billsIncluded } = parsePrices(html);
        console.log(`  → Prices: [${prices.join(', ')}]`);

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

      if (filtered.length >= 3) {
        const { median, p25, p75 } = calcStats(filtered);
        summary[key] = { ...summary[key], ok: true, median, p25, p75 };
        console.log(`  → STATS ${key}: median=${median} range=${p25}–${p75}`);
      }
    }
  }

  console.log(`[scrape-lisbon] Done — ${allListings.length} listings`);
  return res.status(200).json({ runId, summary, total: allListings.length });
}
