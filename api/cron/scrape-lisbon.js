// ============================================================
// api/cron/scrape-lisbon.js
// Vercel Serverless Function — runs weekly via cron
//
// Vercel cron config (in vercel.json):
//   { "path": "/api/cron/scrape-lisbon", "schedule": "0 6 * * 1" }
//   → Every Monday at 06:00 UTC
//
// Env vars needed (set in Vercel dashboard):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY   ← service role key (not anon)
//   CRON_SECRET            ← secret to protect the endpoint
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { LISBON_NEIGHBORHOODS } from "../neighborhoods.js";

// ── Supabase client ─────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── IQR outlier filter ──────────────────────────────────────
function filterIQR(prices) {
  if (prices.length < 4) return prices;
  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
}

// ── Statistics ───────────────────────────────────────────────
function calcStats(prices) {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 === 0
    ? Math.round((sorted[n/2 - 1] + sorted[n/2]) / 2)
    : sorted[Math.floor(n/2)];
  const p25 = sorted[Math.floor(n * 0.25)];
  const p75 = sorted[Math.floor(n * 0.75)];
  return { median, p25, p75 };
}

// ── Parse prices from Spotahome HTML ────────────────────────
function parsePrices(html) {
  const listings = [];

  // Extract price blocks: "NNN €/month" pattern
  // Also capture bills_included status
  const priceRegex = /(\d{3,4})\s*€\/month/g;
  const billsRegex = /BILLS INCLUDED/gi;

  let match;
  const prices = [];
  while ((match = priceRegex.exec(html)) !== null) {
    prices.push(parseInt(match[1], 10));
  }

  // Count bills included mentions (approximate — page has one per listing)
  const billsCount = (html.match(billsRegex) || []).length;
  const billsIncluded = billsCount > prices.length * 0.5; // majority bills included

  return { prices, billsIncluded };
}

// ── Fetch a single neighborhood page ────────────────────────
async function fetchNeighborhood(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; research-bot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Build Spotahome URL for neighborhood + type ──────────────
function buildUrl(neighborhood, type) {
  const base = "https://www.spotahome.com/for-rent/lisbon";
  if (type === "room")   return `${base}/${neighborhood}-rooms`;
  if (type === "studio") return `${base}/${neighborhood}-studios`;
  if (type === "oneBed") return `${base}/${neighborhood}-apartments/bedrooms:1`;
  return null;
}

// ── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  // Auth check — only allow Vercel cron or manual trigger with secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const runId = new Date().toISOString().slice(0, 10); // e.g. "2026-04-09"
  const types = ["room", "studio", "oneBed"];
  const allListings = [];
  const summary = {};

  console.log(`[scrape-lisbon] Starting run ${runId}`);

  // ── Scrape each neighborhood × type ─────────────────────
  for (const type of types) {
    for (const zone of ["center", "outside"]) {
      const neighborhoods = LISBON_NEIGHBORHOODS[zone];
      const zonePrices = [];

      for (const hood of neighborhoods) {
        const url = buildUrl(hood, type);
        if (!url) continue;

        const html = await fetchNeighborhood(url);
        if (!html) {
          console.log(`  ✗ ${hood}/${type} — fetch failed`);
          continue;
        }

        const { prices, billsIncluded } = parsePrices(html);
        console.log(`  ✓ ${hood}/${type} — ${prices.length} listings`);

        // Store raw listings
        for (const price of prices) {
          allListings.push({
            city: "lisbon",
            type,
            zone,
            neighborhood: hood,
            price,
            bills_included: billsIncluded,
            run_id: runId,
            fetched_at: new Date().toISOString(),
          });
          zonePrices.push(price);
        }

        // Rate limiting — be polite
        await new Promise(r => setTimeout(r, 800));
      }

      // ── Compute stats for this city/type/zone ──────────
      const filtered = filterIQR(zonePrices);
      const key = `${type}_${zone}`;
      summary[key] = {
        n_raw: zonePrices.length,
        n_filtered: filtered.length,
      };

      if (filtered.length >= 20) {
        const { median, p25, p75 } = calcStats(filtered);
        summary[key] = { ...summary[key], median, p25, p75, ok: true };

        // Write stats to Supabase
        const { error } = await supabase.from("rent_stats").insert({
          city: "lisbon",
          type,
          zone,
          median,
          p25,
          p75,
          n_listings: filtered.length,
          n_raw: zonePrices.length,
          run_id: runId,
        });
        if (error) console.error(`  DB error ${key}:`, error.message);
        else console.log(`  → stats saved: ${key} median=${median} range=${p25}–${p75} n=${filtered.length}`);
      } else {
        console.log(`  → insufficient data for ${key}: ${filtered.length} listings (need 20+)`);
        summary[key].ok = false;
      }
    }
  }

  // ── Batch-insert all raw listings ───────────────────────
  if (allListings.length > 0) {
    const BATCH = 500;
    for (let i = 0; i < allListings.length; i += BATCH) {
      const { error } = await supabase
        .from("listings")
        .insert(allListings.slice(i, i + BATCH));
      if (error) console.error("listings insert error:", error.message);
    }
    console.log(`[scrape-lisbon] Inserted ${allListings.length} raw listings`);
  }

  console.log(`[scrape-lisbon] Run ${runId} complete`);
  return res.status(200).json({ runId, summary, total: allListings.length });
}
