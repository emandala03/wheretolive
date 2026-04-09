// ============================================================
// api/rent-data/[city].js
// Public read endpoint — returns latest stats for a city
//
// GET /api/rent-data/lisbon
// Returns: { lisbon: { room: { center: {median,p25,p75,n,updatedAt}, outside: {...} }, studio: {...}, oneBed: {...} } }
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY   // public anon key for reads
);

export default async function handler(req, res) {
  const { city } = req.query;

  if (!city || typeof city !== "string") {
    return res.status(400).json({ error: "city param required" });
  }

  // Get the latest run_id for this city
  const { data: latestRun, error: runError } = await supabase
    .from("rent_stats")
    .select("run_id, computed_at")
    .eq("city", city)
    .order("computed_at", { ascending: false })
    .limit(1)
    .single();

  if (runError || !latestRun) {
    return res.status(404).json({ error: "No data found for city", city });
  }

  // Get all stats for the latest run
  const { data: stats, error: statsError } = await supabase
    .from("rent_stats")
    .select("type, zone, median, p25, p75, n_listings, computed_at")
    .eq("city", city)
    .eq("run_id", latestRun.run_id);

  if (statsError) {
    return res.status(500).json({ error: statsError.message });
  }

  // Shape into nested object: { type: { zone: {...} } }
  const result = {};
  for (const row of stats) {
    if (!result[row.type]) result[row.type] = {};
    result[row.type][row.zone] = {
      median:    row.median,
      p25:       row.p25,
      p75:       row.p75,
      n:         row.n_listings,
      updatedAt: row.computed_at,
    };
  }

  // Cache for 6 hours (data changes weekly, no need to hit DB on every visit)
  res.setHeader("Cache-Control", "s-maxage=21600, stale-while-revalidate");
  return res.status(200).json({
    city,
    runId:     latestRun.run_id,
    updatedAt: latestRun.computed_at,
    data:      result,
  });
}
