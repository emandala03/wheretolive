// ============================================================
// Lisbon neighborhood classification for Spotahome scraping
// Spotahome URL slug → zone mapping
// ============================================================

export const LISBON_NEIGHBORHOODS = {

  // ── CENTRO ──────────────────────────────────────────────
  // Historic core, tourist belt, high demand = high prices
  center: [
    "alfama",
    "castelo",
    "baixa",
    "chiado",
    "bairro-alto",
    "principe-real",
    "santa-maria-maior",
    "mouraria",
    "intendente",
    "santos",
    "lapa",
    "sao-bento",
    "rato",
    "cais-do-sodre",
    "graca",
    "bica",
    "madragoa",
  ],

  // ── FUORI CENTRO ────────────────────────────────────────
  // Residential, well-connected by metro/bus, lower prices
  outside: [
    "arroios",
    "alvalade",
    "areeiro",
    "penha-de-franca",
    "avenidas-novas",
    "saldanha",
    "entrecampos",
    "campo-grande",
    "benfica",
    "lumiar",
    "campolide",
    "olivais",
    "alcantara",
    "ajuda",
    "estrela",
    "campo-de-ourique",
    "belem",
    "telheiras",
    "chelas",
    "marvila",
    "beato",
    "xabregas",
    "anjos",
    "roma-areeiro",
  ],

  // ── ESCLUSI ─────────────────────────────────────────────
  // Comuni limitrofi — non sono Lisbona città
  excluded: [
    "almada",
    "amadora",
    "odivelas",
    "sintra",
    "cascais",
    "setubal",
    "barreiro",
    "moita",
    "seixal",
  ],
};

// Spotahome base URLs per tipo di annuncio
export const SPOTAHOME_URLS = {
  lisbon: {
    room:   "https://www.spotahome.com/for-rent/lisbon/{neighborhood}-rooms",
    studio: "https://www.spotahome.com/for-rent/lisbon/{neighborhood}-studios",
    oneBed: "https://www.spotahome.com/for-rent/lisbon/{neighborhood}-apartments/bedrooms:1",
  },
};
