import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

const C = {
  bg:       "#080812",
  surface:  "#0e0e1c",
  border:   "#1c1c38",
  borderHi: "#2a2a50",
  accent:   "#6366f1",
  accentLt: "#818cf8",
  text:     "#f0f0ff",
  textMid:  "#9090b8",
  textDim:  "#3a3a60",
};

const CITIES = [
  "Lisbon","London","Paris","Berlin","Amsterdam",
  "Luxembourg","Dublin","Madrid","Milan","Zurich",
  "Vienna","Brussels","Stockholm","Copenhagen","Warsaw","Prague",
];

const STEPS = [
  { n:"01", title:"Choose your cities",  body:"Pick any two of 16 European cities. Set your gross salary in local currency — we handle the rest." },
  { n:"02", title:"Build your profile",  body:"Tell us how you actually live: eating habits, sport, nights out. Costs adjust city by city." },
  { n:"03", title:"See what's left",     body:"Take-home pay minus rent, food, transport. Real disposable income, side by side." },
];

function CityTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % CITIES.length); setVisible(true); }, 300);
    }, 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{
      display: "inline-block", minWidth: 110,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(6px)",
      transition: "opacity .3s, transform .3s",
      color: "#818cf8", fontStyle: "italic",
    }}>{CITIES[idx]}</span>
  );
}

export default function Home() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", overflowX: "hidden", fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,200;0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,800;0,9..40,900;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #6366f130; color: #818cf8; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }

        .fu0 { animation: fadeUp .8s cubic-bezier(.16,1,.3,1) both; }
        .fu1 { animation: fadeUp .9s .05s cubic-bezier(.16,1,.3,1) both; }
        .fu2 { animation: fadeUp .9s .15s cubic-bezier(.16,1,.3,1) both; }
        .fu3 { animation: fadeUp .8s .28s cubic-bezier(.16,1,.3,1) both; }
        .fu4 { animation: fadeUp .8s .42s cubic-bezier(.16,1,.3,1) both; }
        .fu5 { animation: fadeIn 1s .8s both; }

        .hero-title {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(68px, 13vw, 196px);
          line-height: .90; letter-spacing: -0.035em;
          user-select: none;
        }
        .step-row {
          display: grid; grid-template-columns: 72px 1fr;
          border-top: 1px solid #1c1c38; padding: 32px 0;
          transition: border-color .2s;
        }
        .step-row:hover { border-color: #2a2a50; }
        .strip-track { display:flex; animation: scroll 38s linear infinite; width:max-content; }
        .strip-item {
          padding: 0 36px; border-right: 1px solid #1c1c38;
          font-family:'DM Mono',monospace; font-size:10px; letter-spacing:1.5px;
          color:#3a3a60; white-space:nowrap; line-height:48px; text-transform:uppercase;
          transition: color .2s;
        }
        .strip-item:hover { color: #9090b8; }
        .cta-primary {
          display:inline-flex; align-items:center; gap:8px;
          font-family:'DM Mono',monospace; font-size:12px; letter-spacing:.5px;
          color:#fff; background:#6366f1; text-decoration:none;
          border-radius:3px; padding:11px 20px; transition:background .2s;
          border: 1px solid transparent;
        }
        .cta-primary:hover { background:#818cf8; }
        .cta-ghost {
          display:inline-flex; align-items:center; gap:8px;
          font-family:'DM Mono',monospace; font-size:12px; letter-spacing:.5px;
          color:#9090b8; text-decoration:none;
          border-radius:3px; padding:11px 20px; transition:all .2s;
          border: 1px solid #1c1c38;
        }
        .cta-ghost:hover { color:#f0f0ff; border-color:#2a2a50; }
        .stat-cell {
          padding: 36px 0; border-right: 1px solid #1c1c38;
        }
        .stat-cell:first-child { padding-left: 0; }
        .stat-cell:last-child { border-right: none; }
        .social-lnk {
          font-family:'DM Mono',monospace; font-size:11px; color:#3a3a60;
          text-decoration:none; transition:color .15s; letter-spacing:.5px;
        }
        .social-lnk:hover { color:#818cf8; }
        @media (max-width:640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid .stat-cell:nth-child(2) { border-right: none; }
          .stats-grid .stat-cell:nth-child(3) { grid-column: span 2; border-right: none; border-top: 1px solid #1c1c38; }
          .hero-bottom-row { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* ────────────────────── HERO ────────────────────────────────────── */}
      <section style={{
        minHeight: "100svh",
        padding: "clamp(80px,10vh,130px) clamp(24px,6vw,88px) clamp(40px,6vh,80px)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative",
      }}>

        {/* Top meta */}
        <div className="fu0" style={{
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
          fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.textDim,
          letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          <span>wheretolive<span style={{ color: C.accent }}>.</span></span>
          <span style={{ width:3,height:3,borderRadius:"50%",background:C.borderHi,flexShrink:0,display:"inline-block" }}/>
          <span>16 European cities</span>
          <span style={{ width:3,height:3,borderRadius:"50%",background:C.borderHi,flexShrink:0,display:"inline-block" }}/>
          <span>2026 tax data</span>
        </div>

        {/* Title */}
        <div style={{ padding: "32px 0" }}>
          <h1 className="hero-title">
            <span className="fu1" style={{ fontWeight: 200, color: C.text, display: "block" }}>WHERE</span>
            <span className="fu2" style={{ fontWeight: 900, color: C.text, display: "block" }}>
              TO LIVE<span style={{ color: C.accent }}>.</span>
            </span>
          </h1>
          <p className="fu3" style={{
            fontWeight: 300, fontSize: "clamp(15px,1.6vw,19px)",
            color: C.textMid, lineHeight: 1.65,
            maxWidth: 480, marginTop: 32,
          }}>
            From gross salary to real disposable income.
            Taxes, rent, food, transport — all deducted.
            Compare two cities side by side.
          </p>
          <div className="fu4" style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
            <Link to="/calculator" className="cta-primary">Try the calculator ↗</Link>
            <Link to="/how-it-works" className="cta-ghost">How it works</Link>
          </div>
        </div>

        {/* Bottom ticker row */}
        <div className="fu5">
          <div style={{ width: "100%", height: 1, background: C.border, marginBottom: 20 }}/>
          <div className="hero-bottom-row" style={{
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            fontFamily: "'DM Mono',monospace", fontSize: 11, color: C.textDim,
          }}>
            <span>Currently comparing</span>
            <CityTicker />
            <span style={{ width:3,height:3,borderRadius:"50%",background:C.borderHi,flexShrink:0,display:"inline-block" }}/>
            <span>and 15 other cities</span>
          </div>
        </div>

        {/* ":/" mark — artefakt-style Easter egg */}
        <span className="fu5" style={{
          position: "absolute", bottom: "clamp(40px,6vh,80px)",
          right: "clamp(24px,6vw,88px)",
          fontFamily: "'DM Mono',monospace", fontSize: 11,
          color: C.textDim, letterSpacing: 2, userSelect: "none",
        }}>:/</span>
      </section>

      {/* ────────────────────── CITY STRIP ──────────────────────────────── */}
      <div style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, overflow:"hidden", height:48 }}>
        <div style={{ maskImage:"linear-gradient(90deg, transparent, black 6%, black 94%, transparent)", WebkitMaskImage:"linear-gradient(90deg, transparent, black 6%, black 94%, transparent)" }}>
          <div className="strip-track">
            {[...CITIES,...CITIES,...CITIES].map((c,i) => <span key={i} className="strip-item">{c}</span>)}
          </div>
        </div>
      </div>

      {/* ────────────────────── STATS ───────────────────────────────────── */}
      <section style={{ borderBottom:`1px solid ${C.border}` }}>
        <div className="stats-grid" style={{
          maxWidth: 1080, margin:"0 auto",
          padding: "0 clamp(24px,6vw,88px)",
          display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        }}>
          {[
            { n:"16",   sub:"European cities" },
            { n:"2026", sub:"Tax law in force" },
            { n:"€0",   sub:"Free to use" },
          ].map((s,i) => (
            <div key={i} className="stat-cell" style={{ paddingLeft: i > 0 ? 40 : 0, paddingRight: 40 }}>
              <div style={{
                fontFamily:"'DM Sans',sans-serif", fontWeight:900,
                fontSize:"clamp(44px,6vw,80px)", letterSpacing:-3,
                color:C.text, lineHeight:1, marginBottom:8,
              }}>{s.n}</div>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:1.5, textTransform:"uppercase" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────── HOW IT WORKS ────────────────────────────── */}
      <section style={{ padding:"72px clamp(24px,6vw,88px)", maxWidth:1080, margin:"0 auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:0 }}>
          <h2 style={{
            fontFamily:"'DM Sans',sans-serif", fontWeight:900,
            fontSize:"clamp(36px,5vw,64px)", letterSpacing:-2, lineHeight:.9,
          }}>
            THREE<br/><span style={{ fontWeight:200 }}>STEPS.</span>
          </h2>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:2, textTransform:"uppercase", paddingBottom:6 }}>
            How it works
          </span>
        </div>

        <div style={{ marginTop:40 }}>
          {STEPS.map((s,i) => (
            <div key={i} className="step-row">
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:2, paddingTop:3 }}>{s.n}</span>
              <div>
                <div style={{ fontWeight:600, fontSize:"clamp(17px,1.8vw,22px)", marginBottom:8, letterSpacing:-.3 }}>{s.title}</div>
                <div style={{ fontWeight:300, fontSize:14, color:C.textMid, lineHeight:1.7, maxWidth:520 }}>{s.body}</div>
              </div>
            </div>
          ))}
          <div style={{ height:1, background:C.border }}/>
        </div>
      </section>

      {/* ────────────────────── BOTTOM CTA ──────────────────────────────── */}
      <section style={{
        borderTop:`1px solid ${C.border}`,
        padding:"72px clamp(24px,6vw,88px)",
        display:"flex", justifyContent:"space-between", alignItems:"flex-end",
        flexWrap:"wrap", gap:32, maxWidth:1080, margin:"0 auto",
      }}>
        <div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:2, textTransform:"uppercase", marginBottom:20 }}>
            Ready to compare?
          </div>
          <p style={{
            fontFamily:"'DM Sans',sans-serif", fontWeight:900,
            fontSize:"clamp(32px,4.5vw,60px)", letterSpacing:-2, lineHeight:.9,
          }}>
            SEE WHERE YOUR<br/>
            <span style={{ fontWeight:200 }}>MONEY GOES.</span>
          </p>
        </div>
        <Link to="/calculator" className="cta-primary" style={{ fontSize:13, padding:"13px 24px" }}>
          Open the calculator ↗
        </Link>
      </section>

      {/* ────────────────────── FOOTER ──────────────────────────────────── */}
      <footer style={{
        borderTop:`1px solid ${C.border}`,
        padding:"24px clamp(24px,6vw,88px)",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
      }}>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:.5 }}>
          wheretolive<span style={{ color:C.accent }}>.</span> — indicative only, no guarantees
        </span>
        <div style={{ display:"flex", gap:24 }}>
          <a href="https://www.linkedin.com/in/eugeniomandala/" target="_blank" rel="noopener noreferrer" className="social-lnk">LinkedIn</a>
          <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer" className="social-lnk">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
