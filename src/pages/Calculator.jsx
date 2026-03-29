import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/*
  WHERETOLIVE — European Graduate Salary & Living-Cost Comparator
  ================================================================
  v3.0 — Full UI redesign: indigo palette, English copy, fintech modern aesthetic.
         All tax logic preserved from v2.3.2.

  v2.3.2 corrections (retained):
  - SE: fixed extrapolation base above 1,200,000 SEK (438000)
  - SE: calibrated interpolation from verified benchmark net salaries
  - DK: AM-bidrag on (gross - ATP); mellemskat capped at topThresh
  - AT: Sonderzahlungen preferential regime (~6% up to threshold, then graduated)
  - UI: currency labels clarified; SUG.prague corrected to 550k CZK

  NOTE: Comparative tool with explicit assumptions — not a precision tax engine.
  Suitable for ranking cities and understanding relative differences.
  Individual tax liability may vary. Consult a local advisor.
*/

// ─── CITY DATA ────────────────────────────────────────────────────────────────

const CITIES = {
  lisbon:     { name:"Lisbon",     flag:"PT", currency:"EUR", months:14, taxSystem:"portugal",
    housing:{ room:{center:550,outside:420}, studio:{center:750,outside:600}, oneBed:{center:1430,outside:1000} },
    essentials:350, transport:40 },
  london:     { name:"London",     flag:"GB", currency:"GBP", months:12, taxSystem:"uk",          fxToEUR:1.15,
    housing:{ room:{center:1000,outside:780}, studio:{center:1700,outside:1300}, oneBed:{center:2300,outside:1700} },
    essentials:500, transport:160 },
  paris:      { name:"Paris",      flag:"FR", currency:"EUR", months:12, taxSystem:"france",
    housing:{ room:{center:800,outside:620}, studio:{center:1100,outside:850}, oneBed:{center:1500,outside:1100} },
    essentials:400, transport:86 },
  berlin:     { name:"Berlin",     flag:"DE", currency:"EUR", months:12, taxSystem:"germany",
    housing:{ room:{center:700,outside:550}, studio:{center:950,outside:750}, oneBed:{center:1350,outside:1000} },
    essentials:350, transport:58 },
  amsterdam:  { name:"Amsterdam",  flag:"NL", currency:"EUR", months:12, taxSystem:"netherlands",
    housing:{ room:{center:1050,outside:850}, studio:{center:1500,outside:1200}, oneBed:{center:2100,outside:1600} },
    essentials:230, transport:100, healthIns:150 },
  luxembourg: { name:"Luxembourg", flag:"LU", currency:"EUR", months:12, taxSystem:"luxembourg",
    housing:{ room:{center:1000,outside:800}, studio:{center:1500,outside:1200}, oneBed:{center:2000,outside:1650} },
    essentials:420, transport:0 },
  dublin:     { name:"Dublin",     flag:"IE", currency:"EUR", months:12, taxSystem:"ireland",
    housing:{ room:{center:950,outside:750}, studio:{center:1500,outside:1200}, oneBed:{center:2100,outside:1700} },
    essentials:400, transport:120 },
  madrid:     { name:"Madrid",     flag:"ES", currency:"EUR", months:14, taxSystem:"spain",
    housing:{ room:{center:600,outside:450}, studio:{center:900,outside:700}, oneBed:{center:1250,outside:950} },
    essentials:320, transport:55 },
  milan:      { name:"Milan",      flag:"IT", currency:"EUR", months:13, taxSystem:"italy",
    housing:{ room:{center:720,outside:580}, studio:{center:1050,outside:800}, oneBed:{center:1710,outside:1200} },
    essentials:350, transport:39 },
  zurich:     { name:"Zurich",     flag:"CH", currency:"CHF", months:12, taxSystem:"switzerland", fxToEUR:1.05,
    housing:{ room:{center:1150,outside:950}, studio:{center:1900,outside:1550}, oneBed:{center:2650,outside:2100} },
    essentials:600, transport:87 },
  vienna:     { name:"Vienna",     flag:"AT", currency:"EUR", months:14, taxSystem:"austria",
    housing:{ room:{center:550,outside:430}, studio:{center:800,outside:650}, oneBed:{center:1100,outside:850} },
    essentials:330, transport:33 },
  brussels:   { name:"Brussels",   flag:"BE", currency:"EUR", months:13.92, taxSystem:"belgium",
    housing:{ room:{center:600,outside:480}, studio:{center:850,outside:700}, oneBed:{center:1150,outside:900} },
    essentials:350, transport:50 },
  stockholm:  { name:"Stockholm",  flag:"SE", currency:"SEK", months:12, taxSystem:"sweden",      fxToEUR:0.088,
    housing:{ room:{center:720,outside:550}, studio:{center:1200,outside:950}, oneBed:{center:1600,outside:1200} },
    essentials:380, transport:100 },
  copenhagen: { name:"Copenhagen", flag:"DK", currency:"DKK", months:12, taxSystem:"denmark",     fxToEUR:0.134,
    housing:{ room:{center:780,outside:600}, studio:{center:1250,outside:1000}, oneBed:{center:1700,outside:1350} },
    essentials:400, transport:55 },
  warsaw:     { name:"Warsaw",     flag:"PL", currency:"PLN", months:12, taxSystem:"poland",       fxToEUR:0.23,
    housing:{ room:{center:450,outside:320}, studio:{center:650,outside:500}, oneBed:{center:900,outside:650} },
    essentials:250, transport:25 },
  prague:     { name:"Prague",     flag:"CZ", currency:"CZK", months:12, taxSystem:"czechia",      fxToEUR:0.040,
    housing:{ room:{center:480,outside:380}, studio:{center:700,outside:550}, oneBed:{center:950,outside:700} },
    essentials:280, transport:25 },
};

// ─── TAX CALCULATION FUNCTIONS ────────────────────────────────────────────────

function progTax(income, brackets) {
  let tax = 0, prev = 0;
  for (const { limit, rate } of brackets) {
    if (income <= prev) break;
    tax += (Math.min(income, limit) - prev) * rate;
    prev = limit;
  }
  return Math.max(0, tax);
}

function calcPortugal(gross, year) {
  const ss = gross * 0.11;
  const base = gross - ss;
  let er = 0;
  if (year === 1) er = 1; else if (year <= 4) er = 0.75;
  else if (year <= 7) er = 0.5; else if (year <= 10) er = 0.25;
  const exempt = Math.min(base, 29542.15) * er;
  const taxable = Math.max(0, base - exempt);
  const b = [{limit:8342,rate:.125},{limit:12587,rate:.165},{limit:18188,rate:.22},{limit:25075,rate:.25},{limit:29397,rate:.327},{limit:38632,rate:.37},{limit:51066,rate:.435},{limit:80000,rate:.45},{limit:Infinity,rate:.48}];
  let irs = progTax(taxable, b);
  irs = Math.max(0, irs - Math.min(irs, 400));
  return { ss, tax: irs, net: gross - ss - irs, details: [`IRS Jovem ${(er*100)}%`] };
}

function calcUK(gross, inclPension) {
  let pa = 12570;
  if (gross > 100000) pa = Math.max(0, pa - (gross - 100000) / 2);
  const tax = progTax(Math.max(0, gross - pa), [{limit:37700,rate:.20},{limit:125140,rate:.40},{limit:Infinity,rate:.45}]);
  const ni = Math.min(Math.max(0, gross - 12570), 50270 - 12570) * 0.08 + Math.max(0, gross - 50270) * 0.02;
  const pen = inclPension ? Math.min(Math.max(0, gross - 6240), 50270 - 6240) * 0.05 : 0;
  return { ss: ni, tax, pension: pen, net: gross - tax - ni - pen, details: [inclPension ? `Pension 5%` : `Pension opt-out`] };
}

function calcFrance(gross) {
  const csgCrds = gross * 0.9825 * 0.097; const otherSS = gross * 0.118;
  const totalSS = csgCrds + otherSS;
  const deductCSG = gross * 0.9825 * 0.068;
  const prof = Math.min((gross - deductCSG) * 0.10, 14171);
  const taxable = Math.max(0, gross - deductCSG - prof);
  const tax = progTax(taxable, [{limit:11294,rate:0},{limit:28797,rate:.11},{limit:82341,rate:.30},{limit:177106,rate:.41},{limit:Infinity,rate:.45}]);
  return { ss: totalSS, tax, net: gross - totalSS - tax, details: [`Abattement 10%`] };
}

function calcGermany(gross) {
  const h = Math.min(gross, 66150) * 0.087, p = Math.min(gross, 96600) * 0.093;
  const u = Math.min(gross, 96600) * 0.013, l = Math.min(gross, 66150) * 0.023;
  const totalSS = h + p + u + l;
  const taxable = Math.max(0, gross - totalSS - 1230 - 36);
  let tax = 0;
  if (taxable <= 12084) tax = 0;
  else if (taxable <= 17005) { const y = (taxable - 12084) / 10000; tax = (922.98 * y + 1400) * y; }
  else if (taxable <= 66760) { const z = (taxable - 17005) / 10000; tax = (181.19 * z + 2397) * z + 1025.38; }
  else if (taxable <= 277825) tax = 0.42 * taxable - 10636.31;
  else tax = 0.45 * taxable - 18971.06;
  tax = Math.max(0, Math.round(tax));
  const soli = tax > 18130 ? tax * 0.055 : 0;
  return { ss: totalSS, tax: tax + soli, net: gross - totalSS - tax - soli, details: [`Grundfrei. €12,084`] };
}

function calcNetherlands(gross, use30) {
  let tg = use30 ? gross * 0.70 : gross;
  const gt = progTax(tg, [{limit:38883,rate:.3575},{limit:78426,rate:.3756},{limit:Infinity,rate:.4950}]);
  let ahk = 3115; if (tg > 29736) ahk = Math.max(0, 3115 - (tg - 29736) * 0.06398);
  let ak = 0;
  if (tg <= 11491) ak = tg * 0.08425;
  else if (tg <= 24821) ak = 968 + (tg - 11491) * 0.31433;
  else if (tg <= 39958) ak = 5158 + (tg - 24821) * 0.02471;
  else if (tg <= 124934) ak = 5532 - (tg - 39958) * 0.06510;
  ak = Math.max(0, Math.min(ak, 5685));
  return { ss: 0, tax: Math.max(0, gt - ahk - ak), net: gross - Math.max(0, gt - ahk - ak), details: [use30 ? '30% ruling' : `AK €${Math.round(ak)}`] };
}

function calcLuxembourg(gross) {
  const ss = Math.min(gross, 131880) * 0.1245; const tx = gross - ss;
  const b = [{limit:11265,rate:0},{limit:13137,rate:.08},{limit:15009,rate:.10},{limit:16881,rate:.12},{limit:18753,rate:.14},{limit:20625,rate:.16},{limit:22497,rate:.18},{limit:24369,rate:.20},{limit:26241,rate:.22},{limit:28113,rate:.24},{limit:29985,rate:.26},{limit:31857,rate:.28},{limit:33729,rate:.30},{limit:35601,rate:.32},{limit:37473,rate:.34},{limit:39345,rate:.36},{limit:41217,rate:.38},{limit:43089,rate:.39},{limit:200004,rate:.41},{limit:Infinity,rate:.42}];
  let tax = progTax(tx, b);
  const cis = (tx >= 936 && tx <= 46000) ? 696 : Math.max(0, 696 - Math.max(0, tx - 46000) * 0.01);
  tax = Math.max(0, tax - cis); if (tax > 10000) tax *= 1.07;
  return { ss, tax, net: gross - ss - tax, details: [`CIS €696`] };
}

function calcIreland(gross) {
  const prsi = gross * 0.0427;
  let usc = 0;
  if (gross > 13000) { usc = Math.min(gross, 12012) * 0.005 + Math.min(Math.max(0, gross - 12012), 16688) * 0.02 + Math.min(Math.max(0, gross - 28700), 41344) * 0.03 + Math.max(0, gross - 70044) * 0.08; }
  const gt = Math.min(gross, 44000) * 0.20 + Math.max(0, gross - 44000) * 0.40;
  return { ss: prsi + usc, tax: Math.max(0, gt - 4000), net: gross - prsi - usc - Math.max(0, gt - 4000), details: [`Credits €4,000`] };
}

function calcSpain(gross) {
  const ss = Math.min(gross, 56646) * 0.0635; const tx = Math.max(0, gross - ss);
  const b = [{limit:12450,rate:.19},{limit:20200,rate:.24},{limit:35200,rate:.30},{limit:60000,rate:.37},{limit:300000,rate:.45},{limit:Infinity,rate:.47}];
  let tax = progTax(tx, b);
  let wd = 2000; if (gross <= 13115) wd += 5565; else if (gross <= 16825) wd += 5565 - (gross - 13115) * 1.5;
  tax = Math.max(0, tax - 5550 * 0.19 - wd * 0.19);
  return { ss, tax, net: gross - ss - tax, details: [`Mín. personal`] };
}

function calcItaly(gross) {
  const inps = gross * 0.0919; const tx = gross - inps;
  let irpef = progTax(tx, [{limit:28000,rate:.23},{limit:50000,rate:.33},{limit:Infinity,rate:.43}]);
  let det = 0;
  if (tx <= 15000) det = 1955; else if (tx <= 28000) det = 1910 + 1190 * ((28000 - tx) / 13000);
  else if (tx <= 50000) det = 1910 * ((50000 - tx) / 22000);
  let bonus = (tx <= 15000 && irpef > det) ? 1200 : 0;
  irpef = Math.max(0, irpef - det); const add = tx * 0.0253;
  return { ss: inps, tax: irpef + add, bonus, net: gross - inps - irpef - add + bonus, details: [`Detraz. €${Math.round(det)}`] };
}

function calcSwitzerland(gross) {
  const ahv = gross * 0.053, alv = Math.min(gross, 176000) * 0.011;
  const bvg = Math.max(0, Math.min(gross, 90720) - 22680) * 0.035;
  const ss = ahv + alv + bvg; const tx = gross - ss;
  const fed = progTax(tx, [{limit:17800,rate:0},{limit:31600,rate:.0077},{limit:41400,rate:.0088},{limit:55200,rate:.026},{limit:72600,rate:.0291},{limit:78100,rate:.0556},{limit:103600,rate:.0661},{limit:134600,rate:.0888},{limit:176000,rate:.1098},{limit:Infinity,rate:.115}]);
  const cant = progTax(tx, [{limit:6500,rate:0},{limit:11600,rate:.02},{limit:16400,rate:.03},{limit:23700,rate:.04},{limit:33400,rate:.05},{limit:43100,rate:.06},{limit:52800,rate:.07},{limit:68900,rate:.08},{limit:89000,rate:.09},{limit:115900,rate:.10},{limit:137200,rate:.11},{limit:181600,rate:.12},{limit:Infinity,rate:.13}]);
  return { ss, tax: fed + cant, net: gross - ss - fed - cant, details: [`BVG ~3.5% (50% split)`] };
}

function calcAustria(gross) {
  const regularGross = gross * (12 / 14);
  const sonderGross = gross * (2 / 14);
  const ss = gross * 0.1812;
  const ssRegular = regularGross * 0.1812;
  const ssSonder = sonderGross * 0.1812;
  const txRegular = regularGross - ssRegular;
  let taxRegular = progTax(txRegular, [{limit:12816,rate:0},{limit:20818,rate:.20},{limit:34513,rate:.30},{limit:66612,rate:.40},{limit:99266,rate:.48},{limit:1000000,rate:.50},{limit:Infinity,rate:.55}]);
  const sonderTaxable = Math.max(0, sonderGross - ssSonder - 620);
  const taxSonder = Math.min(sonderTaxable, 25000) * 0.06 + Math.max(0, sonderTaxable - 25000) * 0.27;
  const svRef = txRegular <= 13308 ? Math.min(ssRegular * 0.55, 579) : 0;
  taxRegular = Math.max(0, taxRegular - 463) - svRef;
  const totalTax = Math.max(0, taxRegular) + taxSonder;
  return { ss, tax: totalTax, net: gross - ss - totalTax, details: [`13./14. Gehalt ~6%`, `Verkehrsabsetzbetr.`] };
}

function calcBelgium(gross) {
  const ss = gross * 0.1307; const fb = gross - ss;
  const forf = Math.min(progTax(fb, [{limit:18750,rate:.30},{limit:66444,rate:.11},{limit:Infinity,rate:.03}]), 5520);
  const tx = Math.max(0, fb - forf);
  let tax = progTax(tx, [{limit:15820,rate:.25},{limit:27920,rate:.40},{limit:48320,rate:.45},{limit:Infinity,rate:.50}]);
  const bvs = 10570 * 0.25;
  const wb = gross <= 31984 ? Math.max(0, 434 - Math.max(0, gross - 25000) * 0.06) : 0;
  tax = Math.max(0, tax - bvs - wb) * 1.07;
  return { ss, tax, net: gross - ss - tax, details: [`Forfait €${Math.round(forf)}`] };
}

function calcSweden(gross) {
  // SE: calibrated interpolation based on verified benchmark net salaries
  // (Stockholm municipality 30.55%, 2026). Not formula-reconstructed.
  // Source: Smartly.se, Talent.com, Skatteverket tables. Under 66, no church tax.
  const pts = [
    [0,0],[100000,6000],[200000,26000],[300000,47000],[360000,63000],
    [420000,86400],[480000,104400],[540000,118200],[600000,135600],
    [660000,165600],[720000,196200],[780000,226800],[900000,288000],[1200000,438000]
  ];
  let tax = 0;
  if (gross <= 0) tax = 0;
  else if (gross >= 1200000) tax = 438000 + (gross - 1200000) * 0.53;
  else {
    for (let i = 1; i < pts.length; i++) {
      if (gross <= pts[i][0]) {
        tax = pts[i-1][1] + (pts[i][1] - pts[i-1][1]) * (gross - pts[i-1][0]) / (pts[i][0] - pts[i-1][0]);
        break;
      }
    }
  }
  tax = Math.round(tax);
  return { ss: 0, tax, net: gross - tax, details: [`Stockholm 30.55%`, `Calibrated interpolation`] };
}

function calcDenmark(gross) {
  const atp = 3408;
  const amBase = Math.max(0, gross - atp);
  const am = amBase * 0.08;
  const personalIncome = amBase - am;
  const pa = 49700;
  const taxableAfterPA = Math.max(0, personalIncome - pa);
  const munRate = 0.2498;
  const bundRate = 0.1201;
  const mellemThresh = 641200;
  const topThresh = 777900;
  const munTax = taxableAfterPA * munRate;
  const bundTax = taxableAfterPA * bundRate;
  const mellemTax = Math.max(0, Math.min(personalIncome, topThresh) - mellemThresh) * 0.075;
  const topTax = Math.max(0, personalIncome - topThresh) * 0.075;
  const empDed = Math.min(personalIncome * 0.1275, 63300);
  const jobAllow = Math.min(Math.max(0, personalIncome - 235200) * 0.045, 3100);
  const dedSaving = (empDed + jobAllow) * (munRate + bundRate);
  const totalTax = Math.max(0, munTax + bundTax + mellemTax + topTax - dedSaving);
  return { ss: am + atp, tax: totalTax, net: gross - am - atp - totalTax,
    details: [`Besk.fradrag 12.75%`, `Personfradrag 49,700`] };
}

function calcPoland(gross) {
  const zus = gross * 0.1371; const health = (gross - zus) * 0.09;
  const tx = Math.max(0, gross - zus - 3000);
  const tax = Math.max(0, progTax(tx, [{limit:120000,rate:.12},{limit:Infinity,rate:.32}]) - 3600);
  return { ss: zus + health, tax, net: gross - zus - health - tax, details: [`Kwota wolna 30k`] };
}

function calcCzechia(gross) {
  const soc = gross * 0.071; const hea = gross * 0.045;
  const tax = Math.max(0, Math.min(gross, 1935552) * 0.15 + Math.max(0, gross - 1935552) * 0.23 - 30840);
  return { ss: soc + hea, tax, net: gross - soc - hea - tax, details: [`Sleva 30,840`] };
}

function calculate(cityKey, grossLocal, year, opts = {}) {
  const city = CITIES[cityKey]; const fx = city.fxToEUR || 1;
  let result;
  switch (city.taxSystem) {
    case "portugal":    result = calcPortugal(grossLocal, year); break;
    case "uk":          result = calcUK(grossLocal, opts.ukPension !== false); break;
    case "france":      result = calcFrance(grossLocal); break;
    case "germany":     result = calcGermany(grossLocal); break;
    case "netherlands": result = calcNetherlands(grossLocal, opts.nl30 || false); break;
    case "luxembourg":  result = calcLuxembourg(grossLocal); break;
    case "ireland":     result = calcIreland(grossLocal); break;
    case "spain":       result = calcSpain(grossLocal); break;
    case "italy":       result = calcItaly(grossLocal); break;
    case "switzerland": result = calcSwitzerland(grossLocal); break;
    case "austria":     result = calcAustria(grossLocal); break;
    case "belgium":     result = calcBelgium(grossLocal); break;
    case "sweden":      result = calcSweden(grossLocal); break;
    case "denmark":     result = calcDenmark(grossLocal); break;
    case "poland":      result = calcPoland(grossLocal); break;
    case "czechia":     result = calcCzechia(grossLocal); break;
    default:            result = { ss: 0, tax: 0, net: grossLocal, details: [] };
  }
  const netEUR = result.net * fx;
  const m12 = netEUR / 12;
  const hType = opts.housing || "room";
  const zone = opts.zone || "outside";
  const hCost = city.housing[hType]?.[zone] || city.housing.room.outside;
  const healthIns = city.healthIns || 0;
  const ess = hCost + city.essentials + city.transport + healthIns;
  const disp = m12 - ess;
  const savRate = m12 > 0 ? Math.max(0, disp) / m12 : 0;
  return { ...result, grossLocal, grossEUR: grossLocal * fx, netEUR, m12,
    monthlyNetLocal: result.net / (city.months || 12), fx, currency: city.currency,
    months: city.months, hCost, ess, disp, savRate,
    effRate: Math.max(0, Math.min((result.ss + result.tax + (result.pension || 0)) / grossLocal, 0.99)) };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const SUG = { lisbon:35000,london:55000,paris:45000,berlin:50000,amsterdam:52000,luxembourg:60000,
  dublin:50000,madrid:35000,milan:38000,zurich:95000,vienna:45000,brussels:48000,
  stockholm:550000,copenhagen:450000,warsaw:140000,prague:550000 };

const fN = n => Math.round(n).toLocaleString("en-US");
const fC = (n, c) => {
  const s = fN(Math.abs(n)); const sg = n < 0 ? "−" : "";
  if (c==="EUR") return sg+"€"+s; if (c==="GBP") return sg+"£"+s; if (c==="CHF") return sg+"CHF "+s;
  if (c==="SEK"||c==="DKK") return sg+s+" kr"; if (c==="PLN") return sg+s+" zł"; if (c==="CZK") return sg+s+" Kč";
  return sg+c+" "+s;
};
// Emoji flag from ISO country code (e.g. "PT" → 🇵🇹)
const FL = c => [...c.toUpperCase()].map(ch => String.fromCodePoint(0x1F1E6 - 65 + ch.charCodeAt(0))).join("");

const HL = { room: "Room", studio: "Studio", oneBed: "1-Bed" };
const ZL = { center: "City centre", outside: "Outside centre" };

// ─── COLOUR TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:       "#080812",
  surface:  "#0e0e1c",
  surfaceHi:"#13132a",
  border:   "#1c1c38",
  borderHi: "#2a2a50",
  accent:   "#6366f1",   // indigo-500
  accentLt: "#818cf8",   // indigo-400
  accentDim: "#6366f115",
  accentBorder: "#6366f130",
  blue:     "#60a5fa",   // compare city 2
  blueDim:  "#60a5fa15",
  blueBorder:"#60a5fa30",
  text:     "#f0f0ff",
  textMid:  "#9090b8",
  textDim:  "#4a4a72",
  positive: "#34d399",   // emerald
  warning:  "#fbbf24",   // amber
  negative: "#f87171",   // red
  negativeDim:"#f8717140",
};

// ─── HASH STATE HELPERS ───────────────────────────────────────────────────────

function parseHash() {
  const h = window.location.hash.slice(1);
  if (!h) return null;
  const p = Object.fromEntries(h.split("&").map(s => s.split("=")));
  const cityKeys = Object.keys(CITIES);
  return {
    c1:      cityKeys.includes(p.c1) ? p.c1 : null,
    c2:      cityKeys.includes(p.c2) ? p.c2 : null,
    s1:      p.s1 ? Number(p.s1) : null,
    s2:      p.s2 ? Number(p.s2) : null,
    year:    p.y  ? Number(p.y)  : null,
    housing: ["room","studio","oneBed"].includes(p.h) ? p.h : null,
    zone:    ["center","outside"].includes(p.z) ? p.z : null,
    ukP:     p.ukp !== undefined ? p.ukp === "1" : null,
    nl30:    p.nl30 !== undefined ? p.nl30 === "1" : null,
    view:    ["compare","ranking"].includes(p.v) ? p.v : null,
    rSal:    p.rs  ? Number(p.rs) : null,
  };
}

function buildHash(state) {
  const { c1,s1,c2,s2,year,housing,zone,ukP,nl30,view,rSal } = state;
  return [
    `c1=${c1}`, `s1=${s1}`, `c2=${c2}`, `s2=${s2}`,
    `y=${year}`, `h=${housing}`, `z=${zone}`,
    `ukp=${ukP?1:0}`, `nl30=${nl30?1:0}`,
    `v=${view}`, `rs=${rSal}`,
  ].join("&");
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

// ─── DOT + RING CURSOR ────────────────────────────────────────────────────────
function useDotRingCursor() {
  useEffect(() => {
    const dot = document.createElement("div");
    dot.style.cssText = `position:fixed;top:0;left:0;width:8px;height:8px;background:#818cf8;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:transform 0.1s ease;`;
    const ring = document.createElement("div");
    ring.style.cssText = `position:fixed;top:0;left:0;width:36px;height:36px;border:1.5px solid rgba(129,140,248,0.6);border-radius:50%;pointer-events:none;z-index:99998;transform:translate(-50%,-50%);transition:width .2s ease,height .2s ease,border-color .2s ease;`;
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
    const onEnter = () => { ring.style.width="56px"; ring.style.height="56px"; ring.style.borderColor="rgba(129,140,248,0.9)"; dot.style.transform="translate(-50%,-50%) scale(0)"; };
    const onLeave = () => { ring.style.width="36px"; ring.style.height="36px"; ring.style.borderColor="rgba(129,140,248,0.6)"; dot.style.transform="translate(-50%,-50%) scale(1)"; };
    const targets = document.querySelectorAll("a,button,input,[role='button']");
    targets.forEach(el => { el.style.cursor="none"; el.addEventListener("mouseenter",onEnter); el.addEventListener("mouseleave",onLeave); });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.body.style.cursor = "";
      targets.forEach(el => { el.style.cursor=""; el.removeEventListener("mouseenter",onEnter); el.removeEventListener("mouseleave",onLeave); });
      document.body.removeChild(dot);
      document.body.removeChild(ring);
    };
  }, []);
}

export default function App() {
  useDotRingCursor();
  const parsed = parseHash();

  const [c1, setC1]     = useState(parsed?.c1 ?? "lisbon");
  const [c2, setC2]     = useState(parsed?.c2 ?? "london");
  const [s1, setS1]     = useState(parsed?.s1 ?? 35000);
  const [s2, setS2]     = useState(parsed?.s2 ?? 55000);
  const [year, setYear] = useState(parsed?.year ?? 1);
  const [housing, setHousing] = useState(parsed?.housing ?? "room");
  const [zone, setZone] = useState(parsed?.zone ?? "outside");
  const [ukP, setUkP]   = useState(parsed?.ukP ?? true);
  const [nl30, setNl30] = useState(parsed?.nl30 ?? false);
  const [view, setView] = useState(parsed?.view ?? "compare");
  const [rSal, setRSal] = useState(parsed?.rSal ?? 45000);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  // Sync state → hash on every change
  useEffect(() => {
    const hash = buildHash({ c1,s1,c2,s2,year,housing,zone,ukP,nl30,view,rSal });
    window.history.replaceState(null, "", "#" + hash);
  }, [c1,s1,c2,s2,year,housing,zone,ukP,nl30,view,rSal]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const pick = useCallback((sc, ss) => k => { sc(k); ss(SUG[k]); }, []);
  const opts = { housing, zone, ukPension: ukP, nl30 };
  const r1 = useMemo(() => calculate(c1, s1, year, opts), [c1, s1, year, housing, zone, ukP, nl30]);
  const r2 = useMemo(() => calculate(c2, s2, year, opts), [c2, s2, year, housing, zone, ukP, nl30]);
  const ranks = useMemo(() => Object.keys(CITIES).map(k => {
    const c = CITIES[k]; return { key: k, ...c, ...calculate(k, rSal / (c.fxToEUR || 1), year, opts) };
  }).sort((a, b) => b.disp - a.disp), [rSal, year, housing, zone, ukP, nl30]);
  const maxD = Math.max(1, ...ranks.map(r => Math.max(0, r.disp)));

  const rng = k => {
    const c = CITIES[k].currency;
    if (c==="SEK") return {min:200000,max:1200000,step:10000};
    if (c==="DKK") return {min:200000,max:1000000,step:10000};
    if (c==="PLN") return {min:50000,max:500000,step:5000};
    if (c==="CZK") return {min:300000,max:2500000,step:10000};
    if (c==="CHF") return {min:50000,max:200000,step:1000};
    if (c==="GBP") return {min:25000,max:150000,step:1000};
    return {min:20000,max:150000,step:1000};
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::selection { background: ${C.accentDim}; color: ${C.accentLt}; }

    body { background: ${C.bg}; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; } 
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }

    /* Range inputs */
    input[type="range"] {
      -webkit-appearance: none; width: 100%; height: 2px;
      background: ${C.border}; border-radius: 2px; outline: none; cursor: pointer;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      background: ${C.accent}; border-radius: 50%; cursor: pointer;
      box-shadow: 0 0 0 3px ${C.accentDim}, 0 0 16px ${C.accentBorder};
      transition: box-shadow .15s;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      box-shadow: 0 0 0 4px ${C.accentBorder}, 0 0 20px ${C.accentBorder};
    }
    input[type="range"]::-moz-range-thumb {
      width: 14px; height: 14px; background: ${C.accent};
      border-radius: 50%; cursor: pointer; border: none;
    }

    /* Tab buttons */
    .tab {
      padding: 8px 20px; border-radius: 20px; border: 1px solid ${C.border};
      background: transparent; color: ${C.textMid}; cursor: pointer;
      font-size: 12px; font-family: 'DM Mono', monospace; font-weight: 500;
      letter-spacing: .5px; transition: all .2s; white-space: nowrap;
    }
    .tab:hover { border-color: ${C.borderHi}; color: ${C.text}; }
    .tab.active {
      background: ${C.accent}; border-color: ${C.accent}; color: #fff;
      box-shadow: 0 0 20px ${C.accentBorder};
    }

    /* Chip buttons (city / option selectors) */
    .chip {
      padding: 4px 10px; border: 1px solid ${C.border}; border-radius: 6px;
      background: transparent; color: ${C.textDim}; cursor: pointer;
      font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 400;
      transition: all .15s; white-space: nowrap;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .chip:hover { border-color: ${C.borderHi}; color: ${C.textMid}; }
    .chip.active { background: ${C.accentDim}; border-color: ${C.accentBorder}; color: ${C.accentLt}; }
    .chip.active2 { background: ${C.blueDim}; border-color: ${C.blueBorder}; color: ${C.blue}; }

    /* Toggle checkboxes */
    .toggle {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
      font-size: 11px; color: ${C.textMid}; font-family: 'DM Mono', monospace;
      user-select: none;
    }
    .toggle input { accent-color: ${C.accent}; width: 13px; height: 13px; cursor: pointer; }

    /* Card */
    .card {
      background: ${C.surface}; border: 1px solid ${C.border};
      border-radius: 14px; padding: 18px 20px;
    }

    /* Divider */
    .divider { border-left: 1px solid ${C.border}; height: 18px; margin: 0 4px; }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-up { animation: fadeUp .3s ease-out; }

    /* Badge */
    .badge {
      display: inline-block; padding: 2px 7px; border-radius: 4px;
      font-size: 9px; font-family: 'DM Mono', monospace; font-weight: 500;
      letter-spacing: 1px; text-transform: uppercase;
    }

    /* Mono label */
    .mono { font-family: 'DM Mono', monospace; }
  `;

  const accentPairs = [
    { accent: C.accent, accentBg: C.accentDim, accentBorder: C.accentBorder, chipClass: "chip active" },
    { accent: C.blue,   accentBg: C.blueDim,   accentBorder: C.blueBorder,   chipClass: "chip active2" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans','Helvetica Neue',sans-serif" }}>
      <style>{styles}</style>

      <div style={{ maxWidth:940, margin:"0 auto", padding:"32px 20px 60px" }}>

        {/* ── BACK LINK ── */}
        <a href="/" style={{
          display:"inline-flex", alignItems:"center", gap:6, marginBottom:20,
          fontFamily:"'DM Mono',monospace", fontSize:12, color:C.textMid,
          textDecoration:"none", transition:"color .15s",
        }}
          onMouseEnter={e => e.target.style.color = C.accentLt}
          onMouseLeave={e => e.target.style.color = C.textMid}
        >
          ← Back to home
        </a>

        {/* ── HEADER ── */}
        <header style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:30, fontWeight:400, lineHeight:1.25, letterSpacing:-0.8, color:C.text }}>
            What's actually left after{" "}
            <span style={{ color:C.accentLt, fontWeight:600, background:`linear-gradient(135deg, ${C.accent}, ${C.accentLt})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              rent and taxes?
            </span>
          </h1>
          <p style={{ fontSize:12.5, color:C.textMid, marginTop:8, maxWidth:580, lineHeight:1.7 }}>
            Compare take-home pay, living costs, and disposable income across 16 European cities.
            Built for graduates evaluating their first move. Reasoned estimates with explicit assumptions — not a precision tax engine.
          </p>
        </header>

        {/* ── VIEW TABS ── */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <button className={`tab ${view==="compare" ? "active" : ""}`} onClick={() => setView("compare")}>
            Compare cities
          </button>
          <button className={`tab ${view==="ranking" ? "active" : ""}`} onClick={() => setView("ranking")}>
            Ranking
          </button>
        </div>

        {/* ── GLOBAL OPTIONS BAR ── */}
        <div className="card" style={{ marginBottom:16, padding:"11px 16px", display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
          <span className="mono" style={{ fontSize:9, color:C.textDim, letterSpacing:2, textTransform:"uppercase" }}>Housing</span>
          {Object.entries(HL).map(([k,v]) => (
            <button key={k} className={`chip ${housing===k ? "active" : ""}`} onClick={() => setHousing(k)}>{v}</button>
          ))}
          <div className="divider"/>
          <span className="mono" style={{ fontSize:9, color:C.textDim, letterSpacing:2, textTransform:"uppercase" }}>Location</span>
          {Object.entries(ZL).map(([k,v]) => (
            <button key={k} className={`chip ${zone===k ? "active" : ""}`} onClick={() => setZone(k)}>{v}</button>
          ))}
          <div className="divider"/>
          <label className="toggle"><input type="checkbox" checked={ukP} onChange={e => setUkP(e.target.checked)}/>UK pension</label>
          <label className="toggle"><input type="checkbox" checked={nl30} onChange={e => setNl30(e.target.checked)}/>NL 30% ruling</label>
        </div>

        {/* ════════════════════════════════════════════════════════
            COMPARE VIEW
        ════════════════════════════════════════════════════════ */}
        {view === "compare" && (
          <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* City pickers */}
            {[
              { label:"City A", city:c1, pick:pick(setC1,setS1), sal:s1, setSal:setS1, pair:accentPairs[0] },
              { label:"City B", city:c2, pick:pick(setC2,setS2), sal:s2, setSal:setS2, pair:accentPairs[1] },
            ].map(({ label, city, pick:pk, sal, setSal, pair }, i) => (
              <div key={i} className="card" style={{ borderColor: pair.accentBorder }}>
                <p className="mono" style={{ fontSize:9, color:pair.accent, letterSpacing:2.5, textTransform:"uppercase", marginBottom:10 }}>{label}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
                  {Object.keys(CITIES).map(k => (
                    <button key={k} className={`chip ${city===k ? (i===0 ? "active" : "active2") : ""}`} onClick={() => pk(k)}>
                      <span style={{ fontSize:12 }}>{FL(CITIES[k].flag)}</span>
                      {CITIES[k].name}
                    </button>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <label className="mono" style={{ fontSize:10, color:C.textDim, whiteSpace:"nowrap" }}>
                    Gross ({CITIES[city].currency})
                  </label>
                  <input type="range" {...rng(city)} value={sal} onChange={e => setSal(Number(e.target.value))} style={{ flex:1 }}/>
                  <span className="mono" style={{ fontSize:13, color:pair.accent, minWidth:88, textAlign:"right" }}>
                    {fC(sal, CITIES[city].currency)}
                  </span>
                </div>
              </div>
            ))}

            {/* IRS Jovem slider — PT only */}
            {(c1==="lisbon" || c2==="lisbon") && (
              <div className="card" style={{ padding:"12px 16px", borderColor:C.accentBorder }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div>
                    <span className="mono" style={{ fontSize:10, color:C.accentLt, display:"block", marginBottom:2 }}>IRS Jovem</span>
                    <span style={{ fontSize:10, color:C.textDim }}>PT only — early-career income tax exemption</span>
                  </div>
                  <input type="range" min="1" max="12" step="1" value={year} onChange={e => setYear(Number(e.target.value))} style={{ flex:1 }}/>
                  <span className="mono" style={{ fontSize:12, color:year<=10 ? C.accentLt : C.textDim, minWidth:108, textAlign:"right" }}>
                    Year {year} {year===1?"(100%)":year<=4?"(75%)":year<=7?"(50%)":year<=10?"(25%)":"(expired)"}
                  </span>
                </div>
              </div>
            )}

            {/* Result cards side by side */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[
                { r:r1, c:CITIES[c1], pair:accentPairs[0] },
                { r:r2, c:CITIES[c2], pair:accentPairs[1] },
              ].map(({ r, c, pair }, i) => (
                <div key={i} className="card" style={{ borderColor:pair.accentBorder }}>

                  {/* City header */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, padding:"4px 0" }}>
                    <span style={{ fontSize:36, lineHeight:1 }}>{FL(c.flag)}</span>
                    <div>
                      <span style={{ fontSize:16, fontWeight:700, color:C.text, display:"block" }}>{c.name}</span>
                      <span style={{ fontSize:10, color:C.textDim }}>{ZL[zone]}</span>
                    </div>
                  </div>

                  {/* Tax section */}
                  <p className="mono" style={{ fontSize:9, color:C.textDim, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                    Tax breakdown ({r.currency})
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:3, fontSize:12 }}>
                    {[
                      { l:"Gross",        v: fC(r.grossLocal, r.currency), cl: C.text },
                      { l:"Social sec.",  v: "−"+fC(r.ss, r.currency),     cl: C.negativeDim },
                      { l:"Income tax",   v: "−"+fC(r.tax, r.currency),    cl: C.negativeDim },
                      ...(r.pension ? [{ l:"Pension",    v: "−"+fC(r.pension, r.currency), cl: C.negativeDim }] : []),
                      ...(r.bonus   ? [{ l:"Bonus",      v: "+"+fC(r.bonus, r.currency),   cl: C.positive }] : []),
                    ].map((row, j) => (
                      <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0" }}>
                        <span style={{ color:C.textDim }}>{row.l}</span>
                        <span className="mono" style={{ fontSize:11, color:row.cl }}>{row.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Take-home */}
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:8, paddingTop:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                      <span style={{ fontSize:11, color:C.textMid }}>Take-home (EUR/mo, annualised)</span>
                      <span className="mono" style={{ fontSize:14, fontWeight:600, color:pair.accent }}>€{fN(r.m12)}</span>
                    </div>
                  </div>

                  {/* Monthly costs */}
                  <div style={{ borderTop:`1px solid ${C.border}`, marginTop:10, paddingTop:8 }}>
                    <p className="mono" style={{ fontSize:9, color:C.textDim, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                      Monthly costs
                    </p>
                    {[
                      { l: HL[housing],           v: "€"+fN(r.hCost) },
                      { l: "Food + utilities",    v: "€"+fN(c.essentials) },
                      { l: "Transport",            v: c.transport===0 ? "Free" : "€"+fN(c.transport) },
                      ...(c.healthIns ? [{ l:"Health insurance", v:"€"+fN(c.healthIns) }] : []),
                    ].map((row, j) => (
                      <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"2px 0", fontSize:11 }}>
                        <span style={{ color:C.textDim }}>{row.l}</span>
                        <span className="mono" style={{ color:C.negative, fontSize:11 }}>{row.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Disposable */}
                  <div style={{ marginTop:10, padding:"11px 13px", background:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                      <span style={{ fontSize:12, fontWeight:500 }}>Left after costs (EUR/mo)</span>
                      <span className="mono" style={{ fontSize:16, fontWeight:700, color:r.disp>0 ? pair.accent : C.negative }}>
                        €{fN(r.disp)}
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                      <span style={{ fontSize:10, color:C.textDim }}>Savings rate</span>
                      <span className="mono" style={{
                        fontSize:11,
                        color: r.savRate>.15 ? C.positive : r.savRate>.05 ? C.warning : C.negative
                      }}>
                        {(r.savRate*100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Detail badges */}
                  {r.details?.filter(Boolean).length > 0 && (
                    <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
                      {r.details.filter(Boolean).map((d, j) => (
                        <span key={j} className="badge" style={{ background:pair.accentBg, color:pair.accent, border:`1px solid ${pair.accentBorder}` }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            RANKING VIEW
        ════════════════════════════════════════════════════════ */}
        {view === "ranking" && (
          <div className="fade-up" style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* Controls */}
            <div className="card">
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <span className="mono" style={{ fontSize:10, color:C.textDim, whiteSpace:"nowrap", minWidth:110 }}>
                    Gross (EUR equiv.)
                  </span>
                  <input type="range" min="25000" max="120000" step="5000" value={rSal} onChange={e => setRSal(Number(e.target.value))} style={{ flex:1 }}/>
                  <span className="mono" style={{ fontSize:13, color:C.accentLt, minWidth:72, textAlign:"right" }}>€{fN(rSal)}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <span className="mono" style={{ fontSize:10, color:C.textDim, whiteSpace:"nowrap", minWidth:110 }}>
                    Work year
                  </span>
                  <input type="range" min="1" max="12" step="1" value={year} onChange={e => setYear(Number(e.target.value))} style={{ flex:1 }}/>
                  <span className="mono" style={{ fontSize:13, color:C.textMid, minWidth:72, textAlign:"right" }}>Year {year}</span>
                </div>
                <p className="mono" style={{ fontSize:10, color:C.textDim, marginTop:-4 }}>
                  Work year affects early-career regimes only — mainly PT (IRS Jovem).
                </p>
              </div>
            </div>

            {/* Ranking table */}
            <div className="card">
              <p className="mono" style={{ fontSize:9, color:C.accent, letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>
                Disposable income — {HL[housing].toLowerCase()}, {ZL[zone].toLowerCase()}
              </p>
              <p style={{ fontSize:11.5, color:C.textDim, marginBottom:16, lineHeight:1.6 }}>
                €{fN(rSal)} gross → taxed → minus {HL[housing].toLowerCase()} ({ZL[zone].toLowerCase()}) + essentials.
              </p>

              {/* Table header */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 0 8px", borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
                <span style={{ minWidth:22 }}/>
                <span style={{ width:16 }}/>
                <span className="mono" style={{ fontSize:9, color:C.textDim, minWidth:92, letterSpacing:1, textTransform:"uppercase" }}>City</span>
                <span style={{ flex:1 }}/>
                <span className="mono" style={{ fontSize:9, color:C.textDim, minWidth:80, textAlign:"right", letterSpacing:1, textTransform:"uppercase" }}>Left/mo</span>
                <span className="mono" style={{ fontSize:9, color:C.textDim, minWidth:54, textAlign:"right", letterSpacing:1, textTransform:"uppercase" }}>Tax burden</span>
              </div>

              {/* Rows */}
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {ranks.map((r, i) => (
                  <div key={r.key} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderRadius:6,
                    background: i===0 ? C.accentDim : "transparent", paddingLeft: i===0 ? 6 : 0, paddingRight: i===0 ? 6 : 0 }}>
                    <span className="mono" style={{ fontSize:11, color:i===0 ? C.accentLt : C.textDim, minWidth:22, textAlign:"right" }}>{i+1}</span>
                    <span style={{ fontSize:16, lineHeight:1 }}>{FL(r.flag)}</span>
                    <span style={{ fontSize:12, minWidth:92, color:i===0 ? C.accentLt : C.textMid, fontWeight:i===0?600:400 }}>{r.name}</span>
                    <div style={{ flex:1, height:20, position:"relative" }}>
                      <div style={{
                        height:"100%", borderRadius:4,
                        width:`${Math.max(0, (r.disp / maxD) * 100)}%`,
                        background: i===0
                          ? `linear-gradient(90deg, ${C.accent}40, ${C.accent}80)`
                          : r.disp < 0
                            ? `linear-gradient(90deg, ${C.negative}20, ${C.negative}40)`
                            : `linear-gradient(90deg, ${C.border}, ${C.borderHi})`,
                        transition:"width .5s cubic-bezier(.25,.46,.45,.94)",
                      }}/>
                    </div>
                    <span className="mono" style={{
                      fontSize:12, minWidth:80, textAlign:"right",
                      color: r.disp<0 ? C.negative : i===0 ? C.accentLt : C.textMid
                    }}>
                      €{fN(r.disp)}
                    </span>
                    <span
                      className="mono"
                      title="Effective total burden: (income tax + social security + pension if included) / gross"
                      style={{ fontSize:10, color:C.textDim, minWidth:54, textAlign:"right", cursor:"help" }}>
                      {(r.effRate*100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / methodology note */}
            <div style={{ padding:"14px 18px", borderRadius:12, border:`1px solid ${C.border}`, background:C.surface }}>
              <p className="mono" style={{ fontSize:9, color:C.textDim, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>
                Methodology & data sources
              </p>
              <p style={{ fontSize:11, color:C.textDim, lineHeight:1.7 }}>
                Single filer, no dependants. 2026 tax law.
                SE: calibrated interpolation against benchmark net-salary points (Stockholm 30.55%).
                DK: AM-bidrag on gross−ATP; mellemskat capped at top-tax threshold.
                AT: Sonderzahlungen modelled with preferential regime (~6% up to threshold, then graduated).
                CH: BVG 3.5% employee share. NL: Zvw employer-paid.
                IE: credits €4,000. UK pension: {ukP ? "included (5%)" : "opt-out"}.
                NL 30% ruling: {nl30 ? "active" : "inactive"}.
              </p>
              <p style={{ fontSize:11, color:C.textDim, marginTop:6, lineHeight:1.7 }}>
                Rents: HousingAnywhere Q4 2025 + Numbeo Mar 2026. Cross-checked with INE Portugal, CBS Netherlands, Mietspiegel Berlin.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, background:C.surface, padding:"28px 24px" }}>
        <div style={{ maxWidth:940, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:14, textAlign:"center" }}>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            <a href="https://www.linkedin.com/in/eugeniomandala/" target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:6, color:C.textMid, textDecoration:"none", fontSize:12, fontFamily:"'DM Mono',monospace", transition:"color .15s" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              </svg>
              LinkedIn
            </a>
            <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:6, color:C.textMid, textDecoration:"none", fontSize:12, fontFamily:"'DM Mono',monospace", transition:"color .15s" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              GitHub
            </a>
          </div>
          <div>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:C.textDim }}>
              All calculations are indicative and provided without guarantee.
            </span>
            <div style={{ marginTop:5, fontSize:10, color:C.textDim, fontFamily:"'DM Mono',monospace" }}>
              <span style={{ color:C.accent }}>↗</span> Currently covering 16 cities — actively working to expand the list.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
