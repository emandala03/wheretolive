import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const C = {
  bg:           "#080812",
  surface:      "#0e0e1c",
  surfaceHi:    "#13132a",
  border:       "#1c1c38",
  borderHi:     "#2a2a50",
  accent:       "#6366f1",
  accentLt:     "#818cf8",
  accentDim:    "#6366f115",
  accentBorder: "#6366f130",
  text:         "#f0f0ff",
  textMid:      "#9090b8",
  textDim:      "#4a4a72",
  positive:     "#34d399",
  warning:      "#fbbf24",
  negative:     "#f87171",
  code:         "#1a1a2e",
};

// ─── DOT + RING CURSOR ────────────────────────────────────────────────────────
function useDotRingCursor() {
  useEffect(() => {
    const dot = document.createElement("div");
    dot.style.cssText = `position:fixed;top:0;left:0;width:8px;height:8px;background:#818cf8;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:transform 0.1s ease;`;
    const ring = document.createElement("div");
    ring.style.cssText = `position:fixed;top:0;left:0;width:36px;height:36px;border:1.5px solid rgba(129,140,248,0.6);border-radius:50%;pointer-events:none;z-index:99998;transform:translate(-50%,-50%);transition:width .2s ease,height .2s ease,border-color .2s ease;`;
    if (window.matchMedia("(hover: none)").matches) return;
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.style.cursor = "none";
    let mx = -999, my = -999, rx = -999, ry = -999, raf;
    const onMove = e => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMove);
    const tick = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onEnter = () => { ring.style.width = "56px"; ring.style.height = "56px"; ring.style.borderColor = "rgba(129,140,248,0.9)"; dot.style.transform = "translate(-50%,-50%) scale(0)"; };
    const onLeave = () => { ring.style.width = "36px"; ring.style.height = "36px"; ring.style.borderColor = "rgba(129,140,248,0.6)"; dot.style.transform = "translate(-50%,-50%) scale(1)"; };
    const targets = document.querySelectorAll("a,button,input,[role='button']");
    targets.forEach(el => { el.style.cursor = "none"; el.addEventListener("mouseenter", onEnter); el.addEventListener("mouseleave", onLeave); });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.body.style.cursor = "";
      targets.forEach(el => { el.style.cursor = ""; el.removeEventListener("mouseenter", onEnter); el.removeEventListener("mouseleave", onLeave); });
      document.body.removeChild(dot);
      document.body.removeChild(ring);
    };
  }, []);
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "Select your gross salary",
    body: "Use the slider to set your annual gross in the local currency of the city you're looking at — GBP for London, CHF for Zurich, EUR for most others. The tool handles the conversion.",
  },
  {
    n: "02",
    title: "Taxes and contributions are applied",
    body: "Each country has its own tax brackets, social security rates, and deductions. The calculator applies the real 2026 rules for each city — not averages or guesses.",
  },
  {
    n: "03",
    title: "Living costs are subtracted",
    body: "Rent (room, studio, or 1-bed), food and utilities, and public transport are deducted based on real data for that city and neighbourhood type.",
  },
  {
    n: "04",
    title: "You see what's actually left",
    body: "Everything is converted to EUR/month so cities are directly comparable. You get take-home pay, monthly costs, disposable income, and savings rate — side by side.",
  },
];

const INCLUDED = [
  "Income tax (2026 brackets)",
  "Social security contributions",
  "Standard deductions & credits",
  "Monthly rent (room / studio / 1-bed)",
  "Food & utilities estimate",
  "Public transport pass",
  "Health insurance (NL only, explicit)",
  "UK pension (optional toggle)",
  "NL 30% ruling (optional toggle)",
  "PT IRS Jovem early-career exemption",
];

const NOT_INCLUDED = [
  "Variable bonuses or stock options",
  "Regional or city-level surcharges",
  "Personal spending habits",
  "Childcare or dependent costs",
  "Private health insurance",
  "One-off moving or setup costs",
  "Wealth or capital gains tax",
  "Church tax (DK, DE — excluded by default)",
];

const SOURCES = [
  // ── Rent — general ────────────────────────────────────────────────────────
  { category: "Rent — all cities",    source: "HousingAnywhere",               detail: "Q4 2025 median listings",                          url: "https://housinganywhere.com" },
  { category: "Rent — cross-check",   source: "Numbeo",                        detail: "March 2026 crowd-sourced data",                     url: "https://numbeo.com" },
  // ── Rent — city specific ──────────────────────────────────────────────────
  { category: "Rent — PT (Lisbon)",   source: "INE Portugal",                  detail: "Official statistics institute",                     url: "https://ine.pt" },
  { category: "Rent — GB (London)",   source: "Rightmove / Zoopla",            detail: "Live listings avg, Q4 2025",                       url: "https://rightmove.co.uk" },
  { category: "Rent — FR (Paris)",    source: "SeLoger / PAP",                 detail: "Median listings, Q4 2025",                         url: "https://seloger.com" },
  { category: "Rent — DE (Berlin)",   source: "Mietspiegel Berlin",            detail: "Berlin rent index 2024",                           url: "https://stadtentwicklung.berlin.de" },
  { category: "Rent — NL (Amsterdam)",source: "CBS Netherlands / Funda",       detail: "CBS stats + Funda listings Q4 2025",               url: "https://cbs.nl" },
  { category: "Rent — LU (Luxembourg)",source:"Athome.lu",                     detail: "Median listings, Q4 2025",                         url: "https://athome.lu" },
  { category: "Rent — IE (Dublin)",   source: "Daft.ie",                       detail: "Rental report Q4 2025",                            url: "https://daft.ie" },
  { category: "Rent — ES (Madrid)",   source: "Idealista ES",                  detail: "Median listings, Q4 2025",                         url: "https://idealista.com" },
  { category: "Rent — IT (Milan)",    source: "Idealista IT",                  detail: "Median listings, Q4 2025",                         url: "https://idealista.it" },
  { category: "Rent — CH (Zurich)",   source: "Homegate.ch",                   detail: "Median listings, Q4 2025",                         url: "https://homegate.ch" },
  { category: "Rent — AT (Vienna)",   source: "Willhaben.at",                  detail: "Median listings, Q4 2025",                         url: "https://willhaben.at" },
  { category: "Rent — BE (Brussels)", source: "Immoweb.be",                    detail: "Median listings, Q4 2025",                         url: "https://immoweb.be" },
  { category: "Rent — SE (Stockholm)",source: "Hemnet.se",                     detail: "Median listings, Q4 2025",                         url: "https://hemnet.se" },
  { category: "Rent — DK (Copenhagen)",source:"Boligsiden.dk",                 detail: "Median listings, Q4 2025",                         url: "https://boligsiden.dk" },
  { category: "Rent — PL (Warsaw)",   source: "Otodom.pl",                     detail: "Median listings, Q4 2025",                         url: "https://otodom.pl" },
  { category: "Rent — CZ (Prague)",   source: "Sreality.cz",                   detail: "Median listings, Q4 2025",                         url: "https://sreality.cz" },
  // ── Tax law ───────────────────────────────────────────────────────────────
  { category: "Tax — PT",             source: "Autoridade Tributária",         detail: "IRS 2026 brackets + IRS Jovem",                    url: "https://at.gov.pt" },
  { category: "Tax — UK",             source: "HMRC",                          detail: "Income Tax & NI 2026/27",                          url: "https://hmrc.gov.uk" },
  { category: "Tax — FR",             source: "Direction Générale des Finances", detail: "Barème IR 2026",                                url: "https://impots.gouv.fr" },
  { category: "Tax — DE",             source: "Bundeszentralamt für Steuern",  detail: "Einkommensteuer 2026",                             url: "https://bzst.de" },
  { category: "Tax — NL",             source: "Belastingdienst",               detail: "Box 1 tarieven 2026 + 30% ruling",                 url: "https://belastingdienst.nl" },
  { category: "Tax — LU",             source: "Administration des contributions", detail: "Barème 2026 + CIS",                            url: "https://impotsdirects.public.lu" },
  { category: "Tax — IE",             source: "Revenue.ie",                    detail: "Income Tax + USC + PRSI 2026",                     url: "https://revenue.ie" },
  { category: "Tax — ES",             source: "Agencia Tributaria",            detail: "IRPF 2026 tramos",                                 url: "https://agenciatributaria.es" },
  { category: "Tax — IT",             source: "Agenzia delle Entrate",         detail: "IRPEF 2026 aliquote",                              url: "https://agenziaentrate.gov.it" },
  { category: "Tax — CH",             source: "Federal Tax Administration",    detail: "Federal + cantonal (Zurich) 2026",                 url: "https://estv.admin.ch" },
  { category: "Tax — AT",             source: "Bundesministerium für Finanzen", detail: "ESt 2026 + Sonderzahlungen regime",               url: "https://bmf.gv.at" },
  { category: "Tax — BE",             source: "SPF Finances",                  detail: "IPP 2026 + additionnels communaux",                url: "https://finances.belgium.be" },
  { category: "Tax — SE",             source: "Skatteverket",                  detail: "2026 tables + Smartly.se calibration",             url: "https://skatteverket.se" },
  { category: "Tax — DK",             source: "SKAT",                          detail: "AM-bidrag, bundskat, mellemskat 2026",             url: "https://skat.dk" },
  { category: "Tax — PL",             source: "Ministerstwo Finansów",         detail: "PIT 2026 + ZUS składki",                           url: "https://gov.pl/finanse" },
  { category: "Tax — CZ",             source: "Finanční správa",               detail: "Daň z příjmů 2026 + zdravotní/sociální",          url: "https://financnisprava.cz" },
  // ── Transport ─────────────────────────────────────────────────────────────
  { category: "Transport — all",      source: "Official operators",            detail: "Monthly pass prices, Jan 2026",                    url: "#" },
];

const CODE = `// tax_engine.js — core calculation (simplified)

// 1. Apply national tax system → net annual salary
const result = calcByCountry(taxSystem, grossLocal, opts);
//   result = { ss, tax, pension?, bonus?, net }

// 2. Convert to EUR using fixed exchange rate
const netEUR = result.net * (city.fxToEUR ?? 1);

// 3. Annualise to a monthly figure (on 12-month basis)
const m12 = netEUR / 12;

// 4. Estimate monthly fixed costs
const hCost   = city.housing[housingType][zone];   // rent
const ess     = hCost
              + city.essentials                     // food + utilities
              + city.transport                      // monthly pass
              + (city.healthIns ?? 0);              // NL only

// 5. Disposable income
const disp    = m12 - ess;
const savRate = disp > 0 ? disp / m12 : 0;

// 6. Effective total burden rate
const effRate = (result.ss + result.tax + (result.pension ?? 0))
              / grossLocal;`;

// ─── COPY BUTTON ──────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: "transparent", border: `1px solid ${C.border}`,
        color: copied ? C.positive : C.textDim,
        borderColor: copied ? C.positive + "60" : C.border,
        borderRadius: 6, padding: "4px 10px", fontSize: 11,
        fontFamily: "'DM Mono',monospace", cursor: "pointer",
        transition: "all .2s",
      }}
    >
      {copied ? "✓ copied" : "copy"}
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function HowItWorks() {
  useDotRingCursor();

  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fu { animation: fadeUp .5s ease-out both; }

        .step-card {
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 16px; padding: 28px 24px;
          position: relative; overflow: hidden;
          transition: border-color .2s;
        }
        .step-card:hover { border-color: ${C.accentBorder}; }
        .step-card::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 3px; height: 100%;
          background: linear-gradient(180deg, ${C.accent}, transparent);
        }

        .source-row:hover { background: ${C.accentDim}; }

        /* Code block */
        .code-block {
          background: ${C.code}; border: 1px solid ${C.border};
          border-radius: 14px; overflow: hidden;
          font-family: 'DM Mono', monospace; font-size: 13px;
          line-height: 1.75;
        }
        .code-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px;
          background: ${C.surfaceHi}; border-bottom: 1px solid ${C.border};
        }
        .traffic { display:flex; gap:6px; align-items:center; }
        .traffic span { width:12px; height:12px; border-radius:50%; display:inline-block; }
        .code-body { padding: 24px; overflow-x: auto; color: #c8c8e8; }

        /* Syntax colors */
        .kw  { color: #818cf8; }   /* keywords / operators */
        .cm  { color: #4a4a72; font-style: italic; }  /* comments */
        .fn  { color: #34d399; }   /* function calls / properties */
        .st  { color: #fbbf24; }   /* strings */
        .nm  { color: #f87171; }   /* numbers */
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* ── PAGE HEADER ── */}
        <div className="fu" style={{ marginBottom: 56 }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.accent, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>
            How it works
          </p>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 700, letterSpacing: -1, lineHeight: 1.15, marginBottom: 16 }}>
            From gross to disposable — step by step.
          </h1>
          <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.75, maxWidth: 620 }}>
            Gross salaries across Europe aren't comparable. A €50k offer in Berlin and a €50k offer in Amsterdam
            leave very different amounts in your pocket once taxes, contributions, and living costs are applied.
            Here's exactly how WhereToLive does the math.
          </p>
        </div>

        {/* ── STEPS ── */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: C.text }}>The process</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 14 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 12 }}>{s.n}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: C.text }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── INCLUDED / NOT INCLUDED ── */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: C.text }}>What's included</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Included */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 20px" }}>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.positive, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                ✓ Included
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {INCLUDED.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                    <span style={{ color: C.positive, marginTop: 1, flexShrink: 0 }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Not included */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 20px" }}>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.negative, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
                ✗ Not included
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {NOT_INCLUDED.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                    <span style={{ color: C.negative, marginTop: 1, flexShrink: 0 }}>✗</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── THE FORMULA ── */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: C.text }}>The formula</h2>
          <p style={{ fontSize: 13.5, color: C.textMid, marginBottom: 20, lineHeight: 1.7 }}>
            This is the actual calculation the tool runs for every city — simplified to the essential steps.
          </p>
          <div className="code-block">
            {/* Header */}
            <div className="code-header">
              <div className="traffic">
                <span style={{ background: "#ff5f57" }}/>
                <span style={{ background: "#febc2e" }}/>
                <span style={{ background: "#28c840" }}/>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textDim, marginLeft: 8 }}>
                  tax_engine.js
                </span>
              </div>
              <CopyButton text={CODE}/>
            </div>
            {/* Body — rendered with basic syntax highlighting */}
            <pre className="code-body" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              <span className="cm">{"// tax_engine.js — core calculation (simplified)\n\n"}</span>
              <span className="cm">{"// 1. Apply national tax system → net annual salary\n"}</span>
              <span className="kw">const </span><span className="fn">result</span>{" = "}<span className="fn">calcByCountry</span>{"("}<span className="fn">taxSystem</span>{", "}<span className="fn">grossLocal</span>{", "}<span className="fn">opts</span>{")\n"}
              <span className="cm">{"//   result = { ss, tax, pension?, bonus?, net }\n\n"}</span>
              <span className="cm">{"// 2. Convert to EUR using fixed exchange rate\n"}</span>
              <span className="kw">const </span><span className="fn">netEUR</span>{" = "}<span className="fn">result</span>{"."}<span className="fn">net</span>{" * ("}<span className="fn">city</span>{"."}<span className="fn">fxToEUR</span>{" ?? "}<span className="nm">1</span>{")\n\n"}
              <span className="cm">{"// 3. Annualise to a monthly figure (on 12-month basis)\n"}</span>
              <span className="kw">const </span><span className="fn">m12</span>{" = "}<span className="fn">netEUR</span>{" / "}<span className="nm">12</span>{"\n\n"}
              <span className="cm">{"// 4. Estimate monthly fixed costs\n"}</span>
              <span className="kw">const </span><span className="fn">hCost</span>{"   = "}<span className="fn">city</span>{"."}<span className="fn">housing</span>{"["}<span className="fn">housingType</span>{"]["}<span className="fn">zone</span>{"]   "}<span className="cm">{"// rent\n"}</span>
              <span className="kw">const </span><span className="fn">ess</span>{"     = "}<span className="fn">hCost</span>{"\n              + "}<span className="fn">city</span>{"."}<span className="fn">essentials</span>{"                     "}<span className="cm">{"// food + utilities\n"}</span>
              {"              + "}<span className="fn">city</span>{"."}<span className="fn">transport</span>{"                      "}<span className="cm">{"// monthly pass\n"}</span>
              {"              + ("}<span className="fn">city</span>{"."}<span className="fn">healthIns</span>{" ?? "}<span className="nm">0</span>{")"}<span className="cm">{"              // NL only\n\n"}</span>
              <span className="cm">{"// 5. Disposable income\n"}</span>
              <span className="kw">const </span><span className="fn">disp</span>{"    = "}<span className="fn">m12</span>{" - "}<span className="fn">ess</span>{"\n"}
              <span className="kw">const </span><span className="fn">savRate</span>{" = "}<span className="fn">disp</span>{" > "}<span className="nm">0</span>{" ? "}<span className="fn">disp</span>{" / "}<span className="fn">m12</span>{" : "}<span className="nm">0</span>{"\n\n"}
              <span className="cm">{"// 6. Effective total burden rate\n"}</span>
              <span className="kw">const </span><span className="fn">effRate</span>{" = ("}<span className="fn">result</span>{"."}<span className="fn">ss</span>{" + "}<span className="fn">result</span>{"."}<span className="fn">tax</span>{" + ("}<span className="fn">result</span>{"."}<span className="fn">pension</span>{" ?? "}<span className="nm">0</span>{"))\n              / "}<span className="fn">grossLocal</span>
            </pre>
          </div>
        </section>

        {/* ── DATA SOURCES ── */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: C.text }}>Data sources</h2>
          <p style={{ fontSize: 13.5, color: C.textMid, marginBottom: 20, lineHeight: 1.7 }}>
            All figures are sourced from official or widely-used reference datasets. Exchange rates are fixed
            quarterly estimates — not live market rates.
          </p>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "1.2fr 1.4fr 2fr",
              padding: "10px 20px", borderBottom: `1px solid ${C.border}`,
              background: C.surfaceHi,
            }}>
              {["Category", "Source", "Detail"].map((h, i) => (
                <span key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.textDim, letterSpacing: 1.5, textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {SOURCES.map((s, i) => (
              <div
                key={i}
                className="source-row"
                style={{
                  display: "grid", gridTemplateColumns: "1.2fr 1.4fr 2fr",
                  padding: "12px 20px",
                  borderBottom: i < SOURCES.length - 1 ? `1px solid ${C.border}` : "none",
                  transition: "background .15s",
                }}
              >
                <span style={{ fontSize: 12, color: C.textMid }}>{s.category}</span>
                <a
                  href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: C.accentLt, textDecoration: "none", fontFamily: "'DM Mono',monospace" }}
                >
                  {s.source}
                </a>
                <span style={{ fontSize: 12, color: C.textDim }}>{s.detail}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── DISCLAIMER ── */}
        <section>
          <div style={{
            background: C.surface, border: `1px solid ${C.borderHi}`,
            borderRadius: 14, padding: "28px 28px",
            borderLeft: `3px solid ${C.warning}`,
          }}>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: C.warning, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              ⚠ Disclaimer
            </p>
            <p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.8, marginBottom: 10 }}>
              WhereToLive is a <strong style={{ color: C.text }}>comparative tool with explicit assumptions</strong> — not a precision tax calculator.
              It is designed to help you rank cities and understand relative differences, not to determine your exact tax liability.
            </p>
            <p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.8, marginBottom: 10 }}>
              Results assume a single filer with no dependants, standard deductions, and no special regimes (except where toggled).
              Individual circumstances — contract type, residency status, municipality, employer benefits — may significantly change the outcome.
            </p>
            <p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.8 }}>
              Always consult a local tax advisor before making decisions based on salary comparisons.
              All calculations are indicative and provided without guarantee.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
