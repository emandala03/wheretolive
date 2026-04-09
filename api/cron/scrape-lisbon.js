// api/cron/scrape-lisbon.js — v2, no npm dependencies
// Uses fetch directly to Supabase REST API

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
      headers: { "User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    return res.ok ? res.text() : null;
  } catch { return null; }
}

function buildUrl(hood, type) {
  const base = "https://www.spotahome.com/for-rent/lisbon";
  if (type === "room")   return `${base}/${hood}-rooms`;
  if (type === "studio") return `${base}/${hood}-studios`;
  if (type === "oneBed") return `${base}/${hood}-apartments/bedrooms:1`;
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`)
    return res.status(401).json({ error: "Unauthorized" });

  const runId = new Date().toISOString().slice(0, 10);
  const allListings = [];
  const summary = {};

  for (const type of ["room", "studio", "oneBed"]) {
    for (const zone of ["center", "outside"]) {
      const zonePrices = [];
      for (const hood of LISBON_NEIGHBORHOODS[zone]) {
        const html = await fetchPage(buildUrl(hood, type));
        if (!html) continue;
        const { prices, billsIncluded } = parsePrices(html);
        for (const price of prices) {
          allListings.push({ city:"lisbon", type, zone, neighborhood:hood, price, bills_included:billsIncluded, run_id:runId, fetched_at:new Date().toISOString() });
          zonePrices.push(price);
        }
        await new Promise(r => setTimeout(r, 600));
      }
      const filtered = filterIQR(zonePrices);
      const key = `${type}_${zone}`;
      if (filtered.length >= 20) {
        const { median, p25, p75 } = calcStats(filtered);
        summary[key] = { ok:true, median, p25, p75, n:filtered.length };
        await supaInsert("rent_stats", [{ city:"lisbon", type, zone, median, p25, p75, n_listings:filtered.length, n_raw:zonePrices.length, run_id:runId }]);
      } else {
        summary[key] = { ok:false, n:filtered.length };
      }
    }
  }

  for (let i = 0; i < allListings.length; i += 500)
    await supaInsert("listings", allListings.slice(i, i+500));

  return res.status(200).json({ runId, summary, total: allListings.length });
}
