import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

// ─── CITY DATA ────────────────────────────────────────────────────────────────

const CITIES = {
  lisbon:     { name:"Lisbon",     flag:"PT", currency:"EUR", months:14, taxSystem:"portugal",
    housing:{ room:{center:550,outside:420}, studio:{center:750,outside:600}, oneBed:{center:1430,outside:1175} },
    essentials:350, transport:40 },
  london:     { name:"London",     flag:"GB", currency:"GBP", months:12, taxSystem:"uk", fxToEUR:1.15,
    housing:{ room:{center:1000,outside:780}, studio:{center:1700,outside:1300}, oneBed:{center:2800,outside:2100} },
    essentials:500, transport:210 },
  paris:      { name:"Paris",      flag:"FR", currency:"EUR", months:12, taxSystem:"france",
    housing:{ room:{center:800,outside:620}, studio:{center:1100,outside:850}, oneBed:{center:1500,outside:1100} },
    essentials:400, transport:89 },
  berlin:     { name:"Berlin",     flag:"DE", currency:"EUR", months:12, taxSystem:"germany",
    housing:{ room:{center:700,outside:550}, studio:{center:950,outside:750}, oneBed:{center:1350,outside:1000} },
    essentials:350, transport:63 },
  amsterdam:  { name:"Amsterdam",  flag:"NL", currency:"EUR", months:12, taxSystem:"netherlands",
    housing:{ room:{center:1050,outside:850}, studio:{center:1500,outside:1200}, oneBed:{center:2200,outside:1850} },
    essentials:380, transport:90, healthIns:150 },
  luxembourg: { name:"Luxembourg", flag:"LU", currency:"EUR", months:12, taxSystem:"luxembourg",
    housing:{ room:{center:1000,outside:800}, studio:{center:1500,outside:1200}, oneBed:{center:2000,outside:1650} },
    essentials:420, transport:0 },
  dublin:     { name:"Dublin",     flag:"IE", currency:"EUR", months:12, taxSystem:"ireland",
    housing:{ room:{center:950,outside:750}, studio:{center:1500,outside:1200}, oneBed:{center:2400,outside:2000} },
    essentials:400, transport:96 },
  madrid:     { name:"Madrid",     flag:"ES", currency:"EUR", months:14, taxSystem:"spain",
    housing:{ room:{center:600,outside:450}, studio:{center:900,outside:700}, oneBed:{center:1350,outside:1000} },
    essentials:320, transport:40 },
  milan:      { name:"Milan",      flag:"IT", currency:"EUR", months:13, taxSystem:"italy",
    housing:{ room:{center:720,outside:580}, studio:{center:1050,outside:800}, oneBed:{center:1710,outside:1200} },
    essentials:350, transport:39 },
  zurich:     { name:"Zurich",     flag:"CH", currency:"CHF", months:12, taxSystem:"switzerland", fxToEUR:1.05,
    housing:{ room:{center:1150,outside:950}, studio:{center:1900,outside:1550}, oneBed:{center:2650,outside:2100} },
    essentials:600, transport:111 },
  vienna:     { name:"Vienna",     flag:"AT", currency:"EUR", months:14, taxSystem:"austria",
    housing:{ room:{center:550,outside:430}, studio:{center:800,outside:650}, oneBed:{center:1100,outside:850} },
    essentials:330, transport:58 },
  brussels:   { name:"Brussels",   flag:"BE", currency:"EUR", months:13.92, taxSystem:"belgium",
    housing:{ room:{center:600,outside:480}, studio:{center:850,outside:700}, oneBed:{center:1150,outside:900} },
    essentials:350, transport:63 },
  stockholm:  { name:"Stockholm",  flag:"SE", currency:"SEK", months:12, taxSystem:"sweden", fxToEUR:0.088,
    housing:{ room:{center:720,outside:550}, studio:{center:1200,outside:950}, oneBed:{center:1600,outside:1200} },
    essentials:380, transport:100 },
  copenhagen: { name:"Copenhagen", flag:"DK", currency:"DKK", months:12, taxSystem:"denmark", fxToEUR:0.134,
    housing:{ room:{center:780,outside:600}, studio:{center:1250,outside:1000}, oneBed:{center:1700,outside:1350} },
    essentials:400, transport:115 },
  warsaw:     { name:"Warsaw",     flag:"PL", currency:"PLN", months:12, taxSystem:"poland", fxToEUR:0.234,
    housing:{ room:{center:450,outside:320}, studio:{center:650,outside:500}, oneBed:{center:900,outside:650} },
    essentials:250, transport:29 },
  prague:     { name:"Prague",     flag:"CZ", currency:"CZK", months:12, taxSystem:"czechia", fxToEUR:0.040,
    housing:{ room:{center:480,outside:380}, studio:{center:700,outside:550}, oneBed:{center:950,outside:700} },
    essentials:280, transport:26 },
};

// ─── TAX FUNCTIONS ────────────────────────────────────────────────────────────

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
  const ss = gross * 0.11; const base = gross - ss;
  let er = 0;
  if (year===1) er=1; else if (year<=4) er=0.75; else if (year<=7) er=0.5; else if (year<=10) er=0.25;
  const exempt = Math.min(base, 29542.15) * er;
  const taxable = Math.max(0, base - exempt);
  const b = [{limit:8342,rate:.125},{limit:12587,rate:.165},{limit:18188,rate:.22},{limit:25075,rate:.25},{limit:29397,rate:.327},{limit:38632,rate:.37},{limit:51066,rate:.435},{limit:80000,rate:.45},{limit:Infinity,rate:.48}];
  let irs = progTax(taxable, b); irs = Math.max(0, irs - Math.min(irs, 400));
  return { ss, tax:irs, net:gross-ss-irs, details:[`IRS Jovem ${er*100}%`] };
}
function calcUK(gross, inclPension) {
  let pa = 12570; if (gross>100000) pa = Math.max(0, pa-(gross-100000)/2);
  const tax = progTax(Math.max(0,gross-pa), [{limit:37700,rate:.20},{limit:125140,rate:.40},{limit:Infinity,rate:.45}]);
  const ni = Math.min(Math.max(0,gross-12570),50270-12570)*0.08 + Math.max(0,gross-50270)*0.02;
  const pen = inclPension ? Math.min(Math.max(0,gross-6240),50270-6240)*0.05 : 0;
  return { ss:ni, tax, pension:pen, net:gross-tax-ni-pen, details:[inclPension?`Pension 5%`:`Pension opt-out`] };
}
function calcFrance(gross) {
  const csgCrds=gross*0.9825*0.097, otherSS=gross*0.118, totalSS=csgCrds+otherSS;
  const deductCSG=gross*0.9825*0.068, prof=Math.min((gross-deductCSG)*0.10,14171);
  const taxable=Math.max(0,gross-deductCSG-prof);
  const tax=progTax(taxable,[{limit:11294,rate:0},{limit:28797,rate:.11},{limit:82341,rate:.30},{limit:177106,rate:.41},{limit:Infinity,rate:.45}]);
  return { ss:totalSS, tax, net:gross-totalSS-tax, details:[`Abattement 10%`] };
}
function calcGermany(gross) {
  const h=Math.min(gross,66150)*0.087, p=Math.min(gross,96600)*0.093, u=Math.min(gross,96600)*0.013, l=Math.min(gross,66150)*0.023;
  const totalSS=h+p+u+l; const taxable=Math.max(0,gross-totalSS-1230-36);
  let tax=0;
  if (taxable<=12084) tax=0;
  else if (taxable<=17005) { const y=(taxable-12084)/10000; tax=(922.98*y+1400)*y; }
  else if (taxable<=66760) { const z=(taxable-17005)/10000; tax=(181.19*z+2397)*z+1025.38; }
  else if (taxable<=277825) tax=0.42*taxable-10636.31;
  else tax=0.45*taxable-18971.06;
  tax=Math.max(0,Math.round(tax)); const soli=tax>18130?tax*0.055:0;
  return { ss:totalSS, tax:tax+soli, net:gross-totalSS-tax-soli, details:[`Grundfrei. €12,084`] };
}
function calcNetherlands(gross, use30) {
  let tg=use30?gross*0.70:gross;
  const gt=progTax(tg,[{limit:38883,rate:.3575},{limit:78426,rate:.3756},{limit:Infinity,rate:.4950}]);
  let ahk=3115; if (tg>29736) ahk=Math.max(0,3115-(tg-29736)*0.06398);
  let ak=0;
  if (tg<=11491) ak=tg*0.08425;
  else if (tg<=24821) ak=968+(tg-11491)*0.31433;
  else if (tg<=39958) ak=5158+(tg-24821)*0.02471;
  else if (tg<=124934) ak=5532-(tg-39958)*0.06510;
  ak=Math.max(0,Math.min(ak,5685));
  return { ss:0, tax:Math.max(0,gt-ahk-ak), net:gross-Math.max(0,gt-ahk-ak), details:[use30?'30% ruling':`AK €${Math.round(ak)}`] };
}
function calcLuxembourg(gross) {
  const ss=Math.min(gross,131880)*0.1245, tx=gross-ss;
  const b=[{limit:11265,rate:0},{limit:13137,rate:.08},{limit:15009,rate:.10},{limit:16881,rate:.12},{limit:18753,rate:.14},{limit:20625,rate:.16},{limit:22497,rate:.18},{limit:24369,rate:.20},{limit:26241,rate:.22},{limit:28113,rate:.24},{limit:29985,rate:.26},{limit:31857,rate:.28},{limit:33729,rate:.30},{limit:35601,rate:.32},{limit:37473,rate:.34},{limit:39345,rate:.36},{limit:41217,rate:.38},{limit:43089,rate:.39},{limit:200004,rate:.41},{limit:Infinity,rate:.42}];
  let tax=progTax(tx,b);
  const cis=(tx>=936&&tx<=46000)?696:Math.max(0,696-Math.max(0,tx-46000)*0.01);
  tax=Math.max(0,tax-cis); if (tax>10000) tax*=1.07;
  return { ss, tax, net:gross-ss-tax, details:[`CIS €696`] };
}
function calcIreland(gross) {
  const prsi=gross*0.0427; let usc=0;
  if (gross>13000) { usc=Math.min(gross,12012)*0.005+Math.min(Math.max(0,gross-12012),16688)*0.02+Math.min(Math.max(0,gross-28700),41344)*0.03+Math.max(0,gross-70044)*0.08; }
  const gt=Math.min(gross,44000)*0.20+Math.max(0,gross-44000)*0.40;
  return { ss:prsi+usc, tax:Math.max(0,gt-4000), net:gross-prsi-usc-Math.max(0,gt-4000), details:[`Credits €4,000`] };
}
function calcSpain(gross) {
  const ss=Math.min(gross,56646)*0.0635, tx=Math.max(0,gross-ss);
  const b=[{limit:12450,rate:.19},{limit:20200,rate:.24},{limit:35200,rate:.30},{limit:60000,rate:.37},{limit:300000,rate:.45},{limit:Infinity,rate:.47}];
  let tax=progTax(tx,b);
  let wd=2000; if (gross<=13115) wd+=5565; else if (gross<=16825) wd+=5565-(gross-13115)*1.5;
  tax=Math.max(0,tax-5550*0.19-wd*0.19);
  return { ss, tax, net:gross-ss-tax, details:[`Mín. personal`] };
}
function calcItaly(gross) {
  const inps=gross*0.0919, tx=gross-inps;
  let irpef=progTax(tx,[{limit:28000,rate:.23},{limit:50000,rate:.35},{limit:Infinity,rate:.43}]);
  let det=0;
  if (tx<=15000) det=1955; else if (tx<=28000) det=1910+1190*((28000-tx)/13000); else if (tx<=50000) det=1910*((50000-tx)/22000);
  let bonus=(tx<=15000&&irpef>det)?1200:0;
  irpef=Math.max(0,irpef-det); const add=tx*0.0203;
  return { ss:inps, tax:irpef+add, bonus, net:gross-inps-irpef-add+bonus, details:[`Detraz. €${Math.round(det)}`] };
}
function calcSwitzerland(gross) {
  const ahv=gross*0.053, alv=Math.min(gross,176000)*0.011, bvg=Math.max(0,Math.min(gross,90720)-22680)*0.035;
  const ss=ahv+alv+bvg, tx=gross-ss;
  const fed=progTax(tx,[{limit:17800,rate:0},{limit:31600,rate:.0077},{limit:41400,rate:.0088},{limit:55200,rate:.026},{limit:72600,rate:.0291},{limit:78100,rate:.0556},{limit:103600,rate:.0661},{limit:134600,rate:.0888},{limit:176000,rate:.1098},{limit:Infinity,rate:.115}]);
  const cant=progTax(tx,[{limit:6500,rate:0},{limit:11600,rate:.02},{limit:16400,rate:.03},{limit:23700,rate:.04},{limit:33400,rate:.05},{limit:43100,rate:.06},{limit:52800,rate:.07},{limit:68900,rate:.08},{limit:89000,rate:.09},{limit:115900,rate:.10},{limit:137200,rate:.11},{limit:181600,rate:.12},{limit:Infinity,rate:.13}]);
  return { ss, tax:fed+cant, net:gross-ss-fed-cant, details:[`BVG ~3.5% (50% split)`] };
}
function calcAustria(gross) {
  const rG=gross*(12/14), sG=gross*(2/14), ss=gross*0.1812, ssR=rG*0.1812, ssS=sG*0.1812, txR=rG-ssR;
  let taxR=progTax(txR,[{limit:12816,rate:0},{limit:20818,rate:.20},{limit:34513,rate:.30},{limit:66612,rate:.40},{limit:99266,rate:.48},{limit:1000000,rate:.50},{limit:Infinity,rate:.55}]);
  const sTx=Math.max(0,sG-ssS-620), taxS=Math.min(sTx,25000)*0.06+Math.max(0,sTx-25000)*0.27;
  const svRef=txR<=13308?Math.min(ssR*0.55,579):0; taxR=Math.max(0,taxR-463)-svRef;
  return { ss, tax:Math.max(0,taxR)+taxS, net:gross-ss-Math.max(0,taxR)-taxS, details:[`13./14. Gehalt ~6%`,`Verkehrsabsetzbetr.`] };
}
function calcBelgium(gross) {
  const ss=gross*0.1307, fb=gross-ss;
  const forf=Math.min(progTax(fb,[{limit:18750,rate:.30},{limit:66444,rate:.11},{limit:Infinity,rate:.03}]),5520);
  const tx=Math.max(0,fb-forf);
  let tax=progTax(tx,[{limit:15820,rate:.25},{limit:27920,rate:.40},{limit:48320,rate:.45},{limit:Infinity,rate:.50}]);
  const bvs=10570*0.25, wb=gross<=31984?Math.max(0,434-Math.max(0,gross-25000)*0.06):0;
  tax=Math.max(0,tax-bvs-wb)*1.07;
  return { ss, tax, net:gross-ss-tax, details:[`Forfait €${Math.round(forf)}`] };
}
function calcSweden(gross) {
  const pts=[[0,0],[100000,6000],[200000,26000],[300000,47000],[360000,63000],[420000,86400],[480000,104400],[540000,118200],[600000,135600],[660000,165600],[720000,196200],[780000,226800],[900000,288000],[1200000,438000]];
  let tax=0;
  if (gross<=0) tax=0;
  else if (gross>=1200000) tax=438000+(gross-1200000)*0.53;
  else { for (let i=1;i<pts.length;i++) { if (gross<=pts[i][0]) { tax=pts[i-1][1]+(pts[i][1]-pts[i-1][1])*(gross-pts[i-1][0])/(pts[i][0]-pts[i-1][0]); break; } } }
  return { ss:0, tax:Math.round(tax), net:gross-Math.round(tax), details:[`Stockholm 30.55%`,`Calibrated interpolation`] };
}
function calcDenmark(gross) {
  const atp=3408, amBase=Math.max(0,gross-atp), am=amBase*0.08, pI=amBase-am, pa=49700;
  const tAPA=Math.max(0,pI-pa), mR=0.2498, bR=0.1201;
  const mTax=tAPA*mR, bTax=tAPA*bR, meTax=Math.max(0,Math.min(pI,777900)-641200)*0.075, tTax=Math.max(0,pI-777900)*0.075;
  const empDed=Math.min(pI*0.1275,63300), jA=Math.min(Math.max(0,pI-235200)*0.045,3100);
  const totalTax=Math.max(0,mTax+bTax+meTax+tTax-(empDed+jA)*(mR+bR));
  return { ss:am+atp, tax:totalTax, net:gross-am-atp-totalTax, details:[`Besk.fradrag 12.75%`,`Personfradrag 49,700`] };
}
function calcPoland(gross) {
  const zus=gross*0.1371, health=(gross-zus)*0.09, tx=Math.max(0,gross-zus-3000);
  const tax=Math.max(0,progTax(tx,[{limit:120000,rate:.12},{limit:Infinity,rate:.32}])-3600);
  return { ss:zus+health, tax, net:gross-zus-health-tax, details:[`Kwota wolna 30k`] };
}
function calcCzechia(gross) {
  const soc=gross*0.071, hea=gross*0.045;
  const tax=Math.max(0,Math.min(gross,1935552)*0.15+Math.max(0,gross-1935552)*0.23-30840);
  return { ss:soc+hea, tax, net:gross-soc-hea-tax, details:[`Sleva 30,840`] };
}

// ─── PERSONA CITY PRICES (Numbeo Mar 2026) ────────────────────────────────────

const _K = 2.205;
const CP = {
  lisbon:     { c:_K*3.20, e:3.46, m:1.03, b:1.44, r:_K*0.63, ap:_K*0.80, bn:_K*0.66, to:_K*0.94, po:_K*0.73, on:_K*0.77, rs:12, be:3.00, ci:8,    ut:95,     in:32,    gy:48.27, tr:40   },
  london:     { c:_K*3.17*1.15, e:3.70*1.15, m:1.35*1.15, b:1.49*1.15, r:_K*0.80*1.15, ap:_K*1.12*1.15, bn:_K*0.55*1.15, to:_K*1.15*1.15, po:_K*0.53*1.15, on:_K*0.61*1.15, rs:23, be:7.48, ci:19.55, ut:287.5, in:43.7, gy:92.99, tr:212.75 },
  paris:      { c:_K*6.30, e:4.42, m:1.36, b:1.60, r:_K*1.10, ap:_K*1.36, bn:_K*0.96, to:_K*1.46, po:_K*0.80, on:_K*1.01, rs:15, be:7.00, ci:14,   ut:240.65, in:28.48, gy:38,    tr:90   },
  berlin:     { c:_K*5.07, e:3.28, m:1.11, b:1.73, r:_K*1.39, ap:_K*1.38, bn:_K*0.80, to:_K*1.43, po:_K*0.81, on:_K*0.63, rs:15, be:4.50, ci:14,   ut:338.09, in:43.92, gy:30.81, tr:63   },
  amsterdam:  { c:_K*5.69, e:4.54, m:1.46, b:2.19, r:_K*1.15, ap:_K*1.41, bn:_K*1.11, to:_K*1.59, po:_K*0.83, on:_K*0.62, rs:20, be:6.00, ci:15,   ut:267.58, in:47.82, gy:51.14, tr:90   },
  luxembourg: { c:11.50, e:4.00, m:1.40, b:1.80, r:2.60, ap:2.80, bn:1.90, to:3.00, po:1.80, on:1.50, rs:20, be:5.00, ci:13, ut:200, in:38, gy:68.06, tr:0 },
  dublin:     { c:_K*4.34, e:3.91, m:1.50, b:1.97, r:_K*0.94, ap:_K*1.22, bn:_K*0.82, to:_K*2.15, po:_K*0.69, on:_K*0.61, rs:20, be:7.00, ci:13,   ut:221.23, in:47.08, gy:51.23, tr:96   },
  madrid:     { c:8.50, e:3.00, m:1.10, b:1.30, r:1.20, ap:2.20, bn:1.60, to:2.40, po:1.30, on:1.10, rs:12, be:3.00, ci:10, ut:130, in:33, gy:50.43, tr:40 },
  milan:      { c:10.50, e:3.50, m:1.40, b:1.80, r:2.00, ap:2.80, bn:1.80, to:3.00, po:1.80, on:1.50, rs:15, be:5.00, ci:10, ut:200, in:30, gy:86.21, tr:39 },
  zurich:     { c:17*1.05, e:5.5*1.05, m:1.8*1.05, b:2.5*1.05, r:3.0*1.05, ap:3.5*1.05, bn:2.0*1.05, to:4.5*1.05, po:2.5*1.05, on:2.0*1.05, rs:29.4, be:8.4, ci:21, ut:399, in:63, gy:93.07, tr:111 },
  vienna:     { c:9.50, e:3.40, m:1.20, b:1.60, r:2.00, ap:2.40, bn:1.70, to:2.80, po:1.50, on:1.20, rs:12, be:4.00, ci:12, ut:190, in:35, gy:42.87, tr:58 },
  brussels:   { c:9.80, e:3.60, m:1.25, b:1.70, r:2.20, ap:2.60, bn:1.70, to:3.00, po:1.60, on:1.30, rs:16, be:4.00, ci:12, ut:210, in:45, gy:37.44, tr:63 },
  stockholm:  { c:120*0.0917, e:45*0.0917, m:15*0.0917, b:25*0.0917, r:30*0.0917, ap:30*0.0917, bn:20*0.0917, to:40*0.0917, po:20*0.0917, on:15*0.0917, rs:160*0.0917, be:80*0.0917, ci:145*0.0917, ut:2800*0.0917, in:380*0.0917, gy:51.59, tr:112 },
  copenhagen: { c:100*0.134, e:38*0.134, m:12*0.134, b:20*0.134, r:22*0.134, ap:25*0.134, bn:15*0.134, to:35*0.134, po:18*0.134, on:13*0.134, rs:160*0.134, be:65*0.134, ci:135*0.134, ut:2500*0.134, in:310*0.134, gy:62.27, tr:115 },
  warsaw:     { c:30*0.234, e:12*0.234, m:3.5*0.234, b:4.5*0.234, r:5*0.234, ap:6*0.234, bn:5*0.234, to:8*0.234, po:4*0.234, on:3*0.234, rs:35*0.234, be:14*0.234, ci:28*0.234, ut:750*0.234, in:65*0.234, gy:48.61, tr:29 },
  prague:     { c:300*0.040, e:100*0.040, m:28*0.040, b:36*0.040, r:40*0.040, ap:55*0.040, bn:40*0.040, to:70*0.040, po:30*0.040, on:25*0.040, rs:290*0.040, be:55*0.040, ci:240*0.040, ut:4200*0.040, in:600*0.040, gy:61.73, tr:26 },
};

function calcPersonaCosts(cityKey, profile) {
  const p = CP[cityKey]; if (!p) return null;
  const { kcal=2500, cook=3, out=2, sport=0, cinema=0, smoke=0, stream=0, cloth=30, buf=5 } = profile;
  const kf = kcal/2500;
  const wk = (p.c+p.e+p.m*3.5+p.b*2+p.r+p.ap*0.5+p.bn*0.5+p.to*0.5+p.po*0.5+p.on*0.3) * kf;
  const grocery  = Math.round(wk * 4.3 * 1.65 * (1 + (6-cook)/4*0.5));
  const dineOut  = Math.round(p.rs * Math.max(0, 2-cook*0.3) * out * 0.6);
  const drinks   = Math.round(p.be * out * 4.3 * 2.5);
  const cinCost  = Math.round(p.ci * cinema);
  const social   = dineOut + drinks + cinCost;
  const gym      = sport===2 ? Math.round(p.gy) : sport===1 ? 20 : 0;
  const smoking  = [0,70,Math.round(p.rs*4.5)][smoke]||0;
  const streamC  = stream*13;
  const misc     = 50 + gym + smoking + streamC + cloth;
  const transport= Math.round(p.tr);
  const utils    = Math.round(p.ut/3);
  const internet = Math.round(p.in/3);
  const sub      = grocery + social + misc + transport + utils + internet;
  const buffer   = Math.round(sub * buf/100);
  return { grocery, social, gym, smoking, streamC, cloth, misc, transport, utils, internet, buffer, total:sub+buffer };
}

// ─── MAIN CALCULATE ───────────────────────────────────────────────────────────

function calculate(cityKey, grossLocal, year, opts={}) {
  const city=CITIES[cityKey], fx=city.fxToEUR||1;
  let result;
  switch(city.taxSystem) {
    case "portugal":    result=calcPortugal(grossLocal,year); break;
    case "uk":          result=calcUK(grossLocal,opts.ukPension!==false); break;
    case "france":      result=calcFrance(grossLocal); break;
    case "germany":     result=calcGermany(grossLocal); break;
    case "netherlands": result=calcNetherlands(grossLocal,opts.nl30||false); break;
    case "luxembourg":  result=calcLuxembourg(grossLocal); break;
    case "ireland":     result=calcIreland(grossLocal); break;
    case "spain":       result=calcSpain(grossLocal); break;
    case "italy":       result=calcItaly(grossLocal); break;
    case "switzerland": result=calcSwitzerland(grossLocal); break;
    case "austria":     result=calcAustria(grossLocal); break;
    case "belgium":     result=calcBelgium(grossLocal); break;
    case "sweden":      result=calcSweden(grossLocal); break;
    case "denmark":     result=calcDenmark(grossLocal); break;
    case "poland":      result=calcPoland(grossLocal); break;
    case "czechia":     result=calcCzechia(grossLocal); break;
    default:            result={ss:0,tax:0,net:grossLocal,details:[]};
  }
  const netEUR=result.net*fx, m12=netEUR/12;
  const hType=opts.housing||"room", zone=opts.zone||"outside";
  const hCost=city.housing[hType]?.[zone]||city.housing.room.outside;
  const healthIns=city.healthIns||0;
  const persona=opts.profile?calcPersonaCosts(cityKey,opts.profile):null;
  const livingCosts=persona?persona.total:(city.essentials+city.transport);
  const ess=hCost+livingCosts+healthIns;
  const disp=m12-ess, savRate=m12>0?Math.max(0,disp)/m12:0;
  return { ...result, grossLocal, grossEUR:grossLocal*fx, netEUR, m12,
    monthlyNetLocal:result.net/(city.months||12), fx, currency:city.currency,
    months:city.months, hCost, ess, disp, savRate, persona,
    effRate:Math.max(0,Math.min((result.ss+result.tax+(result.pension||0))/grossLocal,0.99)) };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const SUG = { lisbon:35000,london:55000,paris:45000,berlin:50000,amsterdam:52000,luxembourg:60000,dublin:50000,madrid:35000,milan:38000,zurich:95000,vienna:45000,brussels:48000,stockholm:550000,copenhagen:450000,warsaw:140000,prague:550000 };
const fN = n => Math.round(n).toLocaleString("en-US");
const fC = (n,c) => { const s=fN(Math.abs(n)),sg=n<0?"−":""; if(c==="EUR")return sg+"€"+s; if(c==="GBP")return sg+"£"+s; if(c==="CHF")return sg+"CHF "+s; if(c==="SEK"||c==="DKK")return sg+s+" kr"; if(c==="PLN")return sg+s+" zł"; if(c==="CZK")return sg+s+" Kč"; return sg+c+" "+s; };
const FL = c => [...c.toUpperCase()].map(ch=>String.fromCodePoint(0x1F1E6-65+ch.charCodeAt(0))).join("");
const HL = { room:"Room", studio:"Studio", oneBed:"1-Bed" };
const ZL = { center:"City centre", outside:"Outside centre" };
const C = { bg:"#080812",surface:"#0e0e1c",surfaceHi:"#13132a",border:"#1c1c38",borderHi:"#2a2a50",accent:"#6366f1",accentLt:"#818cf8",accentDim:"#6366f115",accentBorder:"#6366f130",blue:"#60a5fa",blueDim:"#60a5fa15",blueBorder:"#60a5fa30",text:"#f0f0ff",textMid:"#9090b8",textDim:"#4a4a72",positive:"#34d399",warning:"#fbbf24",negative:"#f87171",negativeDim:"#f8717140" };

function parseHash() {
  const h=window.location.hash.slice(1); if(!h)return null;
  const p=Object.fromEntries(h.split("&").map(s=>s.split("=")));
  const ck=Object.keys(CITIES);
  return { c1:ck.includes(p.c1)?p.c1:null, c2:ck.includes(p.c2)?p.c2:null, s1:p.s1?Number(p.s1):null, s2:p.s2?Number(p.s2):null, year:p.y?Number(p.y):null, housing:["room","studio","oneBed"].includes(p.h)?p.h:null, zone:["center","outside"].includes(p.z)?p.z:null, ukP:p.ukp!==undefined?p.ukp==="1":null, nl30:p.nl30!==undefined?p.nl30==="1":null, view:["compare","ranking"].includes(p.v)?p.v:null, rSal:p.rs?Number(p.rs):null };
}
function buildHash({c1,s1,c2,s2,year,housing,zone,ukP,nl30,view,rSal}) {
  return [`c1=${c1}`,`s1=${s1}`,`c2=${c2}`,`s2=${s2}`,`y=${year}`,`h=${housing}`,`z=${zone}`,`ukp=${ukP?1:0}`,`nl30=${nl30?1:0}`,`v=${view}`,`rs=${rSal}`].join("&");
}

// ─── CHARACTER FIGURE ─────────────────────────────────────────────────────────

function CharFigure({ savRate, profile={} }) {
  const mood=savRate>0.30?0:savRate>0.12?1:savRate>0.02?2:savRate>-0.08?3:4;
  const labels=["vivi bene","ce la fai","equilibrato","è stretto","è dura"];
  const clrs=["#34d399","#818cf8","#9090b8","#fbbf24","#f87171"];
  const mouths=["M64 70 Q74 82 84 70","M66 68 Q74 77 82 68","M66 68 L82 68","M66 70 Q74 63 82 70","M64 72 Q74 62 84 72"];
  const aLy=mood===0?70:148, aRy=mood===0?70:148;
  const eyeRy=mood>=3?2:3.5, skin=mood===4?"#2a1010":"#1a1838", body=mood===4?"#1e0e0e":"#151328";
  const hasGym=profile.sport===2, hasHp=profile.stream>0, hasCin=profile.cinema>0&&!hasHp;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <svg viewBox="0 0 148 220" width={82} height={122} xmlns="http://www.w3.org/2000/svg">
        <line x1="50" y1="104" x2="22" y2={aLy} stroke="#1c1c38" strokeWidth="10" strokeLinecap="round"/>
        <line x1="98" y1="104" x2="126" y2={aRy} stroke="#1c1c38" strokeWidth="10" strokeLinecap="round"/>
        <rect x="56" y="166" width="17" height="48" rx="7" fill={body} stroke="#1c1c38" strokeWidth="1.5"/>
        <rect x="83" y="166" width="17" height="48" rx="7" fill={body} stroke="#1c1c38" strokeWidth="1.5"/>
        <rect x="46" y="90" width="64" height="80" rx="12" fill={body} stroke="#1c1c38" strokeWidth="1.5"/>
        <circle cx="74" cy="52" r="31" fill={skin} stroke="#1c1c38" strokeWidth="1.5"/>
        <line x1="50" y1="104" x2="22" y2={aLy} stroke="#1e1a40" strokeWidth="8" strokeLinecap="round"/>
        <line x1="98" y1="104" x2="126" y2={aRy} stroke="#1e1a40" strokeWidth="8" strokeLinecap="round"/>
        <rect x="47" y="91" width="62" height="78" rx="11" fill={body}/>
        <rect x="62" y="91" width="23" height="11" rx="4" fill="#1c1c38"/>
        <ellipse cx="64" cy="48" rx="3.5" ry={eyeRy} fill="#818cf8"/>
        <ellipse cx="84" cy="48" rx="3.5" ry={eyeRy} fill="#818cf8"/>
        <ellipse cx="64" cy="48" rx="1.5" ry={Math.min(1.5,eyeRy)} fill="#080812"/>
        <ellipse cx="84" cy="48" rx="1.5" ry={Math.min(1.5,eyeRy)} fill="#080812"/>
        <path d={mouths[mood]} stroke="#818cf8" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M44 42 Q46 19 74 19 Q102 19 104 42" stroke="#6366f180" strokeWidth="5" fill="none" strokeLinecap="round"/>
        {hasGym&&<g transform="translate(13,93)"><rect x="0" y="5" width="24" height="5" rx="2.5" fill="#9090b8"/><rect x="0" y="2" width="7" height="11" rx="3.5" fill="#818cf8"/><rect x="17" y="2" width="7" height="11" rx="3.5" fill="#818cf8"/></g>}
        {hasHp&&<g><path d="M41 51 Q41 20 74 20 Q107 20 107 51" stroke="#818cf8" strokeWidth="2.5" fill="none" strokeLinecap="round"/><rect x="37" y="48" width="9" height="12" rx="4.5" fill="#6366f1"/><rect x="102" y="48" width="9" height="12" rx="4.5" fill="#6366f1"/></g>}
        {hasCin&&<g transform="translate(104,160)"><rect x="0" y="0" width="27" height="17" rx="4" fill="#fbbf2415" stroke="#fbbf2450" strokeWidth="1"/><circle cx="17" cy="9" r="2.5" fill="#fbbf2460"/></g>}
      </svg>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:clrs[mood],letterSpacing:.5}}>{labels[mood]}</span>
    </div>
  );
}

// ─── CURSOR ───────────────────────────────────────────────────────────────────

function useDotRingCursor() {
  useEffect(() => {
    const dot=document.createElement("div"); dot.style.cssText=`position:fixed;top:0;left:0;width:8px;height:8px;background:#818cf8;border-radius:50%;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);transition:transform 0.1s ease;`;
    const ring=document.createElement("div"); ring.style.cssText=`position:fixed;top:0;left:0;width:36px;height:36px;border:1.5px solid rgba(129,140,248,0.6);border-radius:50%;pointer-events:none;z-index:99998;transform:translate(-50%,-50%);transition:width .2s ease,height .2s ease,border-color .2s ease;`;
    if(window.matchMedia("(hover: none)").matches)return;
    document.body.appendChild(dot); document.body.appendChild(ring); document.body.style.cursor="none";
    let mx=-999,my=-999,rx=-999,ry=-999,raf;
    const onMove=e=>{mx=e.clientX;my=e.clientY;};
    window.addEventListener("mousemove",onMove);
    const tick=()=>{rx+=(mx-rx)*0.12;ry+=(my-ry)*0.12;dot.style.left=mx+"px";dot.style.top=my+"px";ring.style.left=rx+"px";ring.style.top=ry+"px";raf=requestAnimationFrame(tick);};
    raf=requestAnimationFrame(tick);
    const onEnter=()=>{ring.style.width="56px";ring.style.height="56px";ring.style.borderColor="rgba(129,140,248,0.9)";dot.style.transform="translate(-50%,-50%) scale(0)";};
    const onLeave=()=>{ring.style.width="36px";ring.style.height="36px";ring.style.borderColor="rgba(129,140,248,0.6)";dot.style.transform="translate(-50%,-50%) scale(1)";};
    const targets=document.querySelectorAll("a,button,input,[role='button']");
    targets.forEach(el=>{el.style.cursor="none";el.addEventListener("mouseenter",onEnter);el.addEventListener("mouseleave",onLeave);});
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener("mousemove",onMove);document.body.style.cursor="";targets.forEach(el=>{el.style.cursor="";el.removeEventListener("mouseenter",onEnter);el.removeEventListener("mouseleave",onLeave);});document.body.removeChild(dot);document.body.removeChild(ring);};
  },[]);
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  useDotRingCursor();
  const parsed=parseHash();
  const [c1,setC1]=useState(parsed?.c1??"lisbon");
  const [c2,setC2]=useState(parsed?.c2??"london");
  const [s1,setS1]=useState(parsed?.s1??35000);
  const [s2,setS2]=useState(parsed?.s2??55000);
  const [year,setYear]=useState(parsed?.year??1);
  const [housing,setHousing]=useState(parsed?.housing??"room");
  const [zone,setZone]=useState(parsed?.zone??"outside");
  const [ukP,setUkP]=useState(parsed?.ukP??true);
  const [nl30,setNl30]=useState(parsed?.nl30??false);
  const [view,setView]=useState(parsed?.view??"compare");
  const [rSal,setRSal]=useState(parsed?.rSal??45000);
  const [step,setStep]=useState(1);
  const [profile,setProfile]=useState({kcal:2500,cook:3,out:2,sport:0,cinema:0,smoke:0,stream:0,cloth:30,buf:5});
  const updP=useCallback(patch=>setProfile(p=>({...p,...patch})),[]);
  const copyTimer=useRef(null);

  useEffect(()=>{ const hash=buildHash({c1,s1,c2,s2,year,housing,zone,ukP,nl30,view,rSal}); window.history.replaceState(null,"","#"+hash); },[c1,s1,c2,s2,year,housing,zone,ukP,nl30,view,rSal]);

  const pick=useCallback((sc,ss)=>k=>{sc(k);ss(SUG[k]);},[]);
  const opts={housing,zone,ukPension:ukP,nl30,profile:step>=3?profile:null};
  const r1=useMemo(()=>calculate(c1,s1,year,opts),[c1,s1,year,housing,zone,ukP,nl30,step,profile]);
  const r2=useMemo(()=>calculate(c2,s2,year,opts),[c2,s2,year,housing,zone,ukP,nl30,step,profile]);
  const ranks=useMemo(()=>Object.keys(CITIES).map(k=>{const c=CITIES[k];return{key:k,...c,...calculate(k,rSal/(c.fxToEUR||1),year,{housing,zone,ukPension:ukP,nl30,profile:step>=3?profile:null})};}).sort((a,b)=>b.disp-a.disp),[rSal,year,housing,zone,ukP,nl30,step,profile]);
  const maxD=Math.max(1,...ranks.map(r=>Math.max(0,r.disp)));

  const rng=k=>{ const c=CITIES[k].currency; if(c==="SEK")return{min:200000,max:1200000,step:10000}; if(c==="DKK")return{min:200000,max:1000000,step:10000}; if(c==="PLN")return{min:50000,max:500000,step:5000}; if(c==="CZK")return{min:300000,max:2500000,step:10000}; if(c==="CHF")return{min:50000,max:200000,step:1000}; if(c==="GBP")return{min:25000,max:150000,step:1000}; return{min:20000,max:150000,step:1000}; };

  const AP=[
    {accent:C.accent,accentBg:C.accentDim,accentBorder:C.accentBorder},
    {accent:C.blue,  accentBg:C.blueDim,  accentBorder:C.blueBorder  },
  ];
  const cookLbls=["sempre fuori","spesso fuori","mix","spesso in casa","sempre in casa"];

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    ::selection{background:${C.accentDim};color:${C.accentLt};}
    body{background:${C.bg};}
    ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
    input[type="range"]{-webkit-appearance:none;width:100%;height:2px;background:${C.border};border-radius:2px;outline:none;cursor:pointer;}
    input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:${C.accent};border-radius:50%;cursor:pointer;box-shadow:0 0 0 3px ${C.accentDim};}
    input[type="range"]::-moz-range-thumb{width:14px;height:14px;background:${C.accent};border-radius:50%;cursor:pointer;border:none;}
    .tab{padding:8px 20px;border-radius:20px;border:1px solid ${C.border};background:transparent;color:${C.textMid};cursor:pointer;font-size:12px;font-family:'DM Mono',monospace;font-weight:500;letter-spacing:.5px;transition:all .2s;white-space:nowrap;}
    .tab:hover{border-color:${C.borderHi};color:${C.text};}
    .tab.active{background:${C.accent};border-color:${C.accent};color:#fff;box-shadow:0 0 20px ${C.accentBorder};}
    .chip{padding:4px 10px;border:1px solid ${C.border};border-radius:6px;background:transparent;color:${C.textDim};cursor:pointer;font-size:11px;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;}
    .chip:hover{border-color:${C.borderHi};color:${C.textMid};}
    .chip.a1{background:${C.accentDim};border-color:${C.accentBorder};color:${C.accentLt};}
    .chip.a2{background:${C.blueDim};border-color:${C.blueBorder};color:${C.blue};}
    .toggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:11px;color:${C.textMid};font-family:'DM Mono',monospace;user-select:none;}
    .toggle input{accent-color:${C.accent};width:13px;height:13px;cursor:pointer;}
    .card{background:${C.surface};border:1px solid ${C.border};border-radius:14px;padding:18px 20px;}
    .divider{border-left:1px solid ${C.border};height:18px;margin:0 4px;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    .fu{animation:fadeUp .3s ease-out;}
    .badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:9px;font-family:'DM Mono',monospace;font-weight:500;letter-spacing:1px;text-transform:uppercase;}
    .mono{font-family:'DM Mono',monospace;}
  `;

  const StepPill=({i,label})=>{
    const done=step>i+1, active=step===i+1, past=i<step-1;
    return(
      <button onClick={()=>past?setStep(i+1):null} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 14px",borderRadius:20,border:`1px solid ${active?C.accentBorder:C.border}`,background:active?C.accentDim:"transparent",color:active?C.accentLt:done?C.textMid:C.textDim,cursor:past?"pointer":"default",fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:.5}}>
        <span style={{width:16,height:16,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",background:done?C.positive:active?C.accent:C.border}}>{done?"✓":i+1}</span>
        {label}
      </button>
    );
  };

  const FieldRow=({label,value,children})=>(
    <div>
      <div className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
        <span>{label}</span>{value&&<span style={{color:C.accentLt}}>{value}</span>}
      </div>
      {children}
    </div>
  );

  const ToggleGroup=({field,options})=>(
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {options.map((label,i)=>(
        <button key={i} className={`chip ${profile[field]===i?"a1":""}`} onClick={()=>updP({[field]:i})}>{label}</button>
      ))}
    </div>
  );

  const CityPicker=({label,city,pickFn,sal,setSal,pair,idx})=>(
    <div className="card" style={{borderColor:pair.accentBorder}}>
      <p className="mono" style={{fontSize:9,color:pair.accent,letterSpacing:2.5,textTransform:"uppercase",marginBottom:10}}>{label}</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
        {Object.keys(CITIES).map(k=>(
          <button key={k} className={`chip ${city===k?(idx===0?"a1":"a2"):""}`} onClick={()=>pickFn(k)}>
            <span style={{fontSize:12}}>{FL(CITIES[k].flag)}</span>{CITIES[k].name}
          </button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <label className="mono" style={{fontSize:10,color:C.textDim,whiteSpace:"nowrap"}}>Lordo ({CITIES[city].currency})</label>
        <input type="range" {...rng(city)} value={sal} onChange={e=>setSal(Number(e.target.value))} style={{flex:1}}/>
        <span className="mono" style={{fontSize:13,color:pair.accent,minWidth:88,textAlign:"right"}}>{fC(sal,CITIES[city].currency)}</span>
      </div>
    </div>
  );

  const IrsJovemBar=()=>(c1==="lisbon"||c2==="lisbon")?(
    <div className="card" style={{padding:"12px 16px",borderColor:C.accentBorder}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div><span className="mono" style={{fontSize:10,color:C.accentLt,display:"block",marginBottom:2}}>IRS Jovem</span><span style={{fontSize:10,color:C.textDim}}>PT only — early-career income tax exemption</span></div>
        <input type="range" min="1" max="12" step="1" value={year} onChange={e=>setYear(Number(e.target.value))} style={{flex:1}}/>
        <span className="mono" style={{fontSize:12,color:year<=10?C.accentLt:C.textDim,minWidth:108,textAlign:"right"}}>Year {year} {year===1?"(100%)":year<=4?"(75%)":year<=7?"(50%)":year<=10?"(25%)":"(expired)"}</span>
      </div>
    </div>
  ):null;

  const OptionsBar=()=>(
    <div className="card" style={{marginBottom:16,padding:"11px 16px",display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
      <span className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:2,textTransform:"uppercase"}}>Alloggio</span>
      {Object.entries(HL).map(([k,v])=><button key={k} className={`chip ${housing===k?"a1":""}`} onClick={()=>setHousing(k)}>{v}</button>)}
      <div className="divider"/>
      <span className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:2,textTransform:"uppercase"}}>Zona</span>
      {Object.entries(ZL).map(([k,v])=><button key={k} className={`chip ${zone===k?"a1":""}`} onClick={()=>setZone(k)}>{v}</button>)}
      <div className="divider"/>
      <label className="toggle"><input type="checkbox" checked={ukP} onChange={e=>setUkP(e.target.checked)}/>UK pension</label>
      <label className="toggle"><input type="checkbox" checked={nl30} onChange={e=>setNl30(e.target.checked)}/>NL 30% ruling</label>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
      <style>{css}</style>
      <div style={{maxWidth:940,margin:"0 auto",padding:"32px 20px 60px"}}>

        <a href="/" style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:20,fontFamily:"'DM Mono',monospace",fontSize:12,color:C.textMid,textDecoration:"none",transition:"color .15s"}} onMouseEnter={e=>e.target.style.color=C.accentLt} onMouseLeave={e=>e.target.style.color=C.textMid}>← Back to home</a>

        <header style={{marginBottom:28}}>
          <h1 style={{fontSize:30,fontWeight:400,lineHeight:1.25,letterSpacing:-0.8,color:C.text}}>
            What's actually left after{" "}
            <span style={{color:C.accentLt,fontWeight:600,background:`linear-gradient(135deg, ${C.accent}, ${C.accentLt})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>rent and taxes?</span>
          </h1>
          <p style={{fontSize:12.5,color:C.textMid,marginTop:8,maxWidth:580,lineHeight:1.7}}>Compare take-home pay, living costs, and disposable income across 16 European cities. Built for graduates evaluating their first move.</p>
        </header>

        {/* Step indicator */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:24,flexWrap:"wrap"}}>
          <StepPill i={0} label="Scegli le città"/>
          <span style={{color:C.textDim,fontSize:11}}>›</span>
          <StepPill i={1} label="Costruisci il profilo"/>
          <span style={{color:C.textDim,fontSize:11}}>›</span>
          <StepPill i={2} label="Confronto"/>
        </div>

        {/* ═══ STEP 1 ═══ */}
        {step===1&&(
          <div className="fu" style={{display:"flex",flexDirection:"column",gap:14}}>
            <CityPicker label="Città A" city={c1} pickFn={pick(setC1,setS1)} sal={s1} setSal={setS1} pair={AP[0]} idx={0}/>
            <CityPicker label="Città B" city={c2} pickFn={pick(setC2,setS2)} sal={s2} setSal={setS2} pair={AP[1]} idx={1}/>
            <IrsJovemBar/>
            <OptionsBar/>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button className="tab active" onClick={()=>setStep(2)} style={{padding:"10px 28px",borderRadius:10,fontSize:13}}>Continua → costruisci il profilo</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 ═══ */}
        {step===2&&(
          <div className="fu" style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Live city cost preview */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[{ck:c1,pair:AP[0]},{ck:c2,pair:AP[1]}].map(({ck,pair},i)=>{
                const pc=calcPersonaCosts(ck,profile);
                return(
                  <div key={i} className="card" style={{borderColor:pair.accentBorder}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:24}}>{FL(CITIES[ck].flag)}</span>
                      <div><span style={{fontSize:14,fontWeight:600,display:"block"}}>{CITIES[ck].name}</span><span className="mono" style={{fontSize:9,color:C.textDim}}>costo vita / mese</span></div>
                    </div>
                    {pc&&[
                      {l:"Spesa alimentare",v:"€"+fN(pc.grocery)},
                      {l:"Vita sociale",v:"€"+fN(pc.social)},
                      {l:"Sport + svago",v:"€"+fN(pc.gym+pc.smoking+pc.streamC)},
                      {l:"Trasporti",v:pc.transport===0?"Gratuito":"€"+fN(pc.transport)},
                      {l:"Utenze + internet",v:"€"+fN(pc.utils+pc.internet)},
                      {l:"Abbigliamento + varie",v:"€"+fN(pc.cloth+50)},
                    ].map((row,j)=>(
                      <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:11}}>
                        <span style={{color:C.textDim}}>{row.l}</span>
                        <span className="mono" style={{fontSize:11,color:C.negative}}>{row.v}</span>
                      </div>
                    ))}
                    {pc&&<div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,fontWeight:500}}>Totale / mese</span>
                      <span className="mono" style={{fontSize:14,fontWeight:700,color:pair.accent}}>€{fN(pc.total)}</span>
                    </div>}
                  </div>
                );
              })}
            </div>

            {/* Profile fields */}
            <div className="card">
              <p className="mono" style={{fontSize:9,color:C.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Il tuo profilo</p>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <FieldRow label="Fabbisogno calorico" value={`${profile.kcal} kcal/giorno`}>
                  <input type="range" min="1500" max="3500" step="100" value={profile.kcal} onChange={e=>updP({kcal:+e.target.value})} style={{width:"100%"}}/>
                </FieldRow>
                <FieldRow label="Dove mangi di solito?" value={cookLbls[profile.cook-1]}>
                  <input type="range" min="1" max="5" step="1" value={profile.cook} onChange={e=>updP({cook:+e.target.value})} style={{width:"100%"}}/>
                </FieldRow>
                <FieldRow label="Uscite serali / settimana" value={`${profile.out}×`}>
                  <input type="range" min="0" max="7" step="1" value={profile.out} onChange={e=>updP({out:+e.target.value})} style={{width:"100%"}}/>
                </FieldRow>
                <FieldRow label="Cinema">
                  <ToggleGroup field="cinema" options={["Mai","1× al mese","2+× al mese"]}/>
                </FieldRow>
                <FieldRow label="Sport">
                  <ToggleGroup field="sport" options={["Nessuno","Sport outdoor","Palestra"]}/>
                </FieldRow>
                <FieldRow label="Fumo">
                  <ToggleGroup field="smoke" options={["Non fumo","Qualche sigaretta","Fumo regolarmente"]}/>
                </FieldRow>
                <FieldRow label="Streaming">
                  <ToggleGroup field="stream" options={["Nessuno","1 abbonamento","2+ abbonamenti"]}/>
                </FieldRow>
                <FieldRow label="Budget abbigliamento" value={`€${profile.cloth}/mese`}>
                  <input type="range" min="20" max="200" step="10" value={profile.cloth} onChange={e=>updP({cloth:+e.target.value})} style={{width:"100%"}}/>
                </FieldRow>
                <FieldRow label="Buffer imprevisti" value={`${profile.buf}%`}>
                  <input type="range" min="0" max="20" step="1" value={profile.buf} onChange={e=>updP({buf:+e.target.value})} style={{width:"100%"}}/>
                </FieldRow>
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button className="tab" onClick={()=>setStep(1)} style={{fontSize:12}}>← Torna alle città</button>
              <button className="tab active" onClick={()=>setStep(3)} style={{padding:"10px 28px",borderRadius:10,fontSize:13}}>Vedi il confronto →</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3 ═══ */}
        {step===3&&(
          <div className="fu">
            <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
              <button className={`tab ${view==="compare"?"active":""}`} onClick={()=>setView("compare")}>Confronto città</button>
              <button className={`tab ${view==="ranking"?"active":""}`} onClick={()=>setView("ranking")}>Ranking</button>
              <div style={{flex:1}}/>
              <button className="tab" onClick={()=>setStep(2)} style={{fontSize:11,padding:"6px 14px"}}>← Modifica profilo</button>
            </div>

            <OptionsBar/>

            {/* COMPARE */}
            {view==="compare"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <CityPicker label="City A" city={c1} pickFn={pick(setC1,setS1)} sal={s1} setSal={setS1} pair={AP[0]} idx={0}/>
                <CityPicker label="City B" city={c2} pickFn={pick(setC2,setS2)} sal={s2} setSal={setS2} pair={AP[1]} idx={1}/>
                <IrsJovemBar/>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[{r:r1,c:CITIES[c1],pair:AP[0]},{r:r2,c:CITIES[c2],pair:AP[1]}].map(({r,c,pair},i)=>(
                    <div key={i}>
                      <div className="card" style={{borderColor:pair.accentBorder}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"4px 0"}}>
                          <span style={{fontSize:36,lineHeight:1}}>{FL(c.flag)}</span>
                          <div><span style={{fontSize:16,fontWeight:700,color:C.text,display:"block"}}>{c.name}</span><span style={{fontSize:10,color:C.textDim}}>{ZL[zone]}</span></div>
                        </div>

                        <p className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Tax breakdown ({r.currency})</p>
                        <div style={{display:"flex",flexDirection:"column",gap:3,fontSize:12}}>
                          {[
                            {l:"Gross",      v:fC(r.grossLocal,r.currency),cl:C.text},
                            {l:"Social sec.",v:"−"+fC(r.ss,r.currency),   cl:C.negativeDim},
                            {l:"Income tax", v:"−"+fC(r.tax,r.currency),  cl:C.negativeDim},
                            ...(r.pension?[{l:"Pension",v:"−"+fC(r.pension,r.currency),cl:C.negativeDim}]:[]),
                            ...(r.bonus?[  {l:"Bonus",  v:"+"+fC(r.bonus,r.currency),  cl:C.positive}]:[]),
                          ].map((row,j)=>(
                            <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
                              <span style={{color:C.textDim}}>{row.l}</span>
                              <span className="mono" style={{fontSize:11,color:row.cl}}>{row.v}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:10}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                            <span style={{fontSize:11,color:C.textMid}}>Take-home (EUR/mo, annualised)</span>
                            <span className="mono" style={{fontSize:14,fontWeight:600,color:pair.accent}}>€{fN(r.m12)}</span>
                          </div>
                        </div>

                        <div style={{borderTop:`1px solid ${C.border}`,marginTop:10,paddingTop:8}}>
                          <p className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Monthly costs</p>
                          {[
                            {l:HL[housing],v:"€"+fN(r.hCost)},
                            ...(r.persona?[
                              {l:"Spesa alimentare",v:"€"+fN(r.persona.grocery)},
                              {l:"Vita sociale",    v:"€"+fN(r.persona.social)},
                              {l:"Sport + svago",   v:"€"+fN(r.persona.gym+r.persona.smoking+r.persona.streamC)},
                              {l:"Abbigliamento + varie",v:"€"+fN(r.persona.cloth+50)},
                              {l:"Trasporti",       v:r.persona.transport===0?"Free":"€"+fN(r.persona.transport)},
                              {l:"Utenze + internet",v:"€"+fN(r.persona.utils+r.persona.internet)},
                            ]:[
                              {l:"Food + utilities",v:"€"+fN(c.essentials)},
                              {l:"Transport",       v:c.transport===0?"Free":"€"+fN(c.transport)},
                            ]),
                            ...(c.healthIns?[{l:"Health insurance",v:"€"+fN(c.healthIns)}]:[]),
                          ].map((row,j)=>(
                            <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"2px 0",fontSize:11}}>
                              <span style={{color:C.textDim}}>{row.l}</span>
                              <span className="mono" style={{color:C.negative,fontSize:11}}>{row.v}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{marginTop:10,padding:"11px 13px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                            <span style={{fontSize:12,fontWeight:500}}>Left after costs (EUR/mo)</span>
                            <span className="mono" style={{fontSize:16,fontWeight:700,color:r.disp>0?pair.accent:C.negative}}>€{fN(r.disp)}</span>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                            <span style={{fontSize:10,color:C.textDim}}>Savings rate</span>
                            <span className="mono" style={{fontSize:11,color:r.savRate>.15?C.positive:r.savRate>.05?C.warning:C.negative}}>{(r.savRate*100).toFixed(0)}%</span>
                          </div>
                        </div>

                        {r.details?.filter(Boolean).length>0&&(
                          <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>
                            {r.details.filter(Boolean).map((d,j)=>(
                              <span key={j} className="badge" style={{background:pair.accentBg,color:pair.accent,border:`1px solid ${pair.accentBorder}`}}>{d}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Character figure */}
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:12,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                        <CharFigure savRate={r.savRate} profile={profile}/>
                        <div className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:1.5,textTransform:"uppercase",marginTop:8}}>
                          {r.disp>0?`€${fN(r.disp)}/mese di avanzo`:`€${fN(Math.abs(r.disp))}/mese in deficit`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RANKING */}
            {view==="ranking"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div className="card">
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <span className="mono" style={{fontSize:10,color:C.textDim,whiteSpace:"nowrap",minWidth:110}}>Gross (EUR equiv.)</span>
                      <input type="range" min="25000" max="120000" step="5000" value={rSal} onChange={e=>setRSal(Number(e.target.value))} style={{flex:1}}/>
                      <span className="mono" style={{fontSize:13,color:C.accentLt,minWidth:72,textAlign:"right"}}>€{fN(rSal)}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <span className="mono" style={{fontSize:10,color:C.textDim,whiteSpace:"nowrap",minWidth:110}}>Work year</span>
                      <input type="range" min="1" max="12" step="1" value={year} onChange={e=>setYear(Number(e.target.value))} style={{flex:1}}/>
                      <span className="mono" style={{fontSize:13,color:C.textMid,minWidth:72,textAlign:"right"}}>Year {year}</span>
                    </div>
                    <p className="mono" style={{fontSize:10,color:C.textDim,marginTop:-4}}>Work year affects early-career regimes only — mainly PT (IRS Jovem).</p>
                  </div>
                </div>

                <div className="card">
                  <p className="mono" style={{fontSize:9,color:C.accent,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>
                    Disposable income — {HL[housing].toLowerCase()}, {ZL[zone].toLowerCase()} — profilo personalizzato
                  </p>
                  <p style={{fontSize:11.5,color:C.textDim,marginBottom:16,lineHeight:1.6}}>€{fN(rSal)} gross → taxed → minus {HL[housing].toLowerCase()} ({ZL[zone].toLowerCase()}) + costi vita persona.</p>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 0 8px",borderBottom:`1px solid ${C.border}`,marginBottom:6}}>
                    <span style={{minWidth:22}}/><span style={{width:16}}/>
                    <span className="mono" style={{fontSize:9,color:C.textDim,minWidth:92,letterSpacing:1,textTransform:"uppercase"}}>City</span>
                    <span style={{flex:1}}/>
                    <span className="mono" style={{fontSize:9,color:C.textDim,minWidth:80,textAlign:"right",letterSpacing:1,textTransform:"uppercase"}}>Left/mo</span>
                    <span className="mono" style={{fontSize:9,color:C.textDim,minWidth:54,textAlign:"right",letterSpacing:1,textTransform:"uppercase"}}>Tax</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:2}}>
                    {ranks.map((r,i)=>(
                      <div key={r.key} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderRadius:6,background:i===0?C.accentDim:"transparent",paddingLeft:i===0?6:0,paddingRight:i===0?6:0}}>
                        <span className="mono" style={{fontSize:11,color:i===0?C.accentLt:C.textDim,minWidth:22,textAlign:"right"}}>{i+1}</span>
                        <span style={{fontSize:16,lineHeight:1}}>{FL(r.flag)}</span>
                        <span style={{fontSize:12,minWidth:92,color:i===0?C.accentLt:C.textMid,fontWeight:i===0?600:400}}>{r.name}</span>
                        <div style={{flex:1,height:20,position:"relative"}}>
                          <div style={{height:"100%",borderRadius:4,width:`${Math.max(0,(r.disp/maxD)*100)}%`,background:i===0?`linear-gradient(90deg,${C.accent}40,${C.accent}80)`:r.disp<0?`linear-gradient(90deg,${C.negative}20,${C.negative}40)`:`linear-gradient(90deg,${C.border},${C.borderHi})`,transition:"width .5s cubic-bezier(.25,.46,.45,.94)"}}/>
                        </div>
                        <span className="mono" style={{fontSize:12,minWidth:80,textAlign:"right",color:r.disp<0?C.negative:i===0?C.accentLt:C.textMid}}>€{fN(r.disp)}</span>
                        <span className="mono" title="Effective total burden" style={{fontSize:10,color:C.textDim,minWidth:54,textAlign:"right",cursor:"help"}}>{(r.effRate*100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{padding:"14px 18px",borderRadius:12,border:`1px solid ${C.border}`,background:C.surface}}>
                  <p className="mono" style={{fontSize:9,color:C.textDim,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>Methodology & data sources</p>
                  <p style={{fontSize:11,color:C.textDim,lineHeight:1.7}}>Single filer, no dependants. 2026 tax law. Persona living costs: Numbeo Mar 2026 city pages. SE: calibrated interpolation (Stockholm 30.55%). DK: AM-bidrag on gross−ATP. AT: Sonderzahlungen ~6% preferential. CH: BVG 3.5% employee. IE: credits €4,000. UK pension: {ukP?"included (5%)":"opt-out"}. NL 30% ruling: {nl30?"active":"inactive"}.</p>
                  <p style={{fontSize:11,color:C.textDim,marginTop:6,lineHeight:1.7}}>Rents: HousingAnywhere Q4 2025 + Numbeo Mar 2026. Cross-checked with INE Portugal, CBS Netherlands, Mietspiegel Berlin.</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <footer style={{borderTop:`1px solid ${C.border}`,background:C.surface,padding:"28px 24px"}}>
        <div style={{maxWidth:940,margin:"0 auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14,textAlign:"center"}}>
          <div style={{display:"flex",gap:20,alignItems:"center"}}>
            <a href="https://www.linkedin.com/in/eugeniomandala/" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,color:C.textMid,textDecoration:"none",fontSize:12,fontFamily:"'DM Mono',monospace"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>LinkedIn
            </a>
            <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,color:C.textMid,textDecoration:"none",fontSize:12,fontFamily:"'DM Mono',monospace"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>GitHub
            </a>
          </div>
          <div>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.textDim}}>All calculations are indicative and provided without guarantee.</span>
            <div style={{marginTop:5,fontSize:10,color:C.textDim,fontFamily:"'DM Mono',monospace"}}><span style={{color:C.accent}}>↗</span> Currently covering 16 cities — actively working to expand the list.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
