// src/hooks/useRentData.js
// Fetches live Spotahome-based rent stats from our API.
// Falls back to null if unavailable (Calculator uses static values).

import { useState, useEffect } from "react";

const CACHE = {};  // in-memory cache per session

export function useRentData(cityKey) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!cityKey) return;

    // Only cities with live data (expand as we add more)
    const LIVE_CITIES = ["lisbon"];
    if (!LIVE_CITIES.includes(cityKey)) return;

    // Return cached result immediately
    if (CACHE[cityKey]) {
      setData(CACHE[cityKey]);
      return;
    }

    setLoading(true);
    fetch(`/api/rent-data/${cityKey}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.data) {
          CACHE[cityKey] = json.data;
          setData(json.data);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [cityKey]);

  return { data, loading, error };
}
