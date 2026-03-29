import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// ─── DESIGN TOKENS (same as calculator) ───────────────────────────────────────
const C = {
  bg:           "#080812",
  surface:      "#0e0e1c",
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
};

const CITIES = [
  { name:"Lisbon",     flag:"PT" },
  { name:"London",     flag:"GB" },
  { name:"Paris",      flag:"FR" },
  { name:"Berlin",     flag:"DE" },
  { name:"Amsterdam",  flag:"NL" },
  { name:"Luxembourg", flag:"LU" },
  { name:"Dublin",     flag:"IE" },
  { name:"Madrid",     flag:"ES" },
  { name:"Milan",      flag:"IT" },
  { name:"Zurich",     flag:"CH" },
  { name:"Vienna",     flag:"AT" },
  { name:"Brussels",   flag:"BE" },
  { name:"Stockholm",  flag:"SE" },
  { name:"Copenhagen", flag:"DK" },
  { name:"Warsaw",     flag:"PL" },
  { name:"Prague",     flag:"CZ" },
];

const emojiFlag = c => [...c.toUpperCase()].map(ch => String.fromCodePoint(0x1F1E6 - 65 + ch.charCodeAt(0))).join("");

const FEATURES = [
  {
    icon: "💶",
    title: "Real take-home pay",
    body: "We apply each country's actual 2026 tax brackets, social security rates, and deductions — not rough estimates.",
  },
  {
    icon: "🏙️",
    title: "16 European cities",
    body: "From Lisbon to Warsaw, covering Western, Northern, and Central Europe — wherever your first job might take you.",
  },
  {
    icon: "🏠",
    title: "Cost of living included",
    body: "Rent, food, transport, and health insurance all factored in. You see disposable income, not just net salary.",
  },
];

const STEPS = [
  { n:"01", title:"Enter your gross", body:"Set your gross salary in your local currency. The tool converts everything to EUR for a fair comparison." },
  { n:"02", title:"Pick two cities",  body:"Choose any two cities side by side, or switch to Ranking to see all 16 at once ordered by what's left." },
  { n:"03", title:"See what's left",  body:"Take-home pay, monthly costs, disposable income, and savings rate — all in one view." },
];

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function useDotRingCursor() {
  useEffect(() => {
    // Create dot
    const dot = document.createElement("div");
    dot.style.cssText = `
      position: fixed; top: 0; left: 0; width: 8px; height: 8px;
      background: #818cf8; border-radius: 50%;
      pointer-events: none; z-index: 99999;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease, background 0.2s;
    `;

    // Create ring
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed; top: 0; left: 0; width: 36px; height: 36px;
      border: 1.5px solid rgba(129,140,248,0.6); border-radius: 50%;
      pointer-events: none; z-index: 99998;
      transform: translate(-50%, -50%);
      transition: width 0.2s ease, height 0.2s ease, border-color 0.2s ease;
    `;

    if (window.matchMedia("(hover: none)").matches) return;
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    // Hide default cursor on body
    document.body.style.cursor = "none";

    let mx = -999, my = -999;
    let rx = -999, ry = -999;
    let raf;

    const onMove = e => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMove);

    // Ring follows with lerp inertia
    const tick = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;

      dot.style.left  = mx + "px";
      dot.style.top   = my + "px";
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Scale up ring on hoverable elements
    const onEnter = () => {
      ring.style.width  = "56px";
      ring.style.height = "56px";
      ring.style.borderColor = "rgba(129,140,248,0.9)";
      dot.style.transform = "translate(-50%,-50%) scale(0)";
    };
    const onLeave = () => {
      ring.style.width  = "36px";
      ring.style.height = "36px";
      ring.style.borderColor = "rgba(129,140,248,0.6)";
      dot.style.transform = "translate(-50%,-50%) scale(1)";
    };

    const targets = document.querySelectorAll("a, button, input, [role='button']");
    targets.forEach(el => {
      el.style.cursor = "none";
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.body.style.cursor = "";
      targets.forEach(el => {
        el.style.cursor = "";
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      document.body.removeChild(dot);
      document.body.removeChild(ring);
    };
  }, []);
}

export default function Home() {
  useDotRingCursor();
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Subtle grid background */
        .hero-grid {
          background-image:
            linear-gradient(${C.border} 1px, transparent 1px),
            linear-gradient(90deg, ${C.border} 1px, transparent 1px);
          background-size: 48px 48px;
          background-position: center center;
        }

        /* Fade-up animation with stagger */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu0 { animation: fadeUp .6s ease-out both; }
        .fu1 { animation: fadeUp .6s .12s ease-out both; }
        .fu2 { animation: fadeUp .6s .22s ease-out both; }
        .fu3 { animation: fadeUp .6s .32s ease-out both; }

        /* Glow pulse on hero badge */
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${C.accent}30; }
          50%       { box-shadow: 0 0 0 8px ${C.accent}00; }
        }
        .pulse { animation: pulse 2.5s ease-in-out infinite; }

        /* City chip hover */
        .city-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px;
          border: 1px solid ${C.border}; background: ${C.surface};
          color: ${C.textMid}; font-size: 12px;
          font-family: 'DM Sans', sans-serif;
          transition: all .2s; cursor: default;
          white-space: nowrap;
        }
        .city-chip:hover {
          border-color: ${C.accentBorder}; color: ${C.text};
          background: ${C.accentDim};
          transform: translateY(-2px);
        }

        /* Feature card hover */
        .feat-card {
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 16px; padding: 28px 24px;
          transition: border-color .2s, transform .2s;
        }
        .feat-card:hover {
          border-color: ${C.accentBorder};
          transform: translateY(-3px);
        }

        /* Step card */
        .step-card {
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 16px; padding: 28px 24px;
          position: relative; overflow: hidden;
        }
        .step-card::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 3px; height: 100%;
          background: linear-gradient(180deg, ${C.accent}, transparent);
        }

        /* CTA button */
        .cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 12px;
          background: ${C.accent}; border: none; color: #fff;
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .2s;
          box-shadow: 0 0 32px ${C.accent}40;
          text-decoration: none;
        }
        .cta-btn:hover {
          background: ${C.accentLt};
          transform: translateY(-2px);
          box-shadow: 0 0 48px ${C.accent}60;
        }

        .cta-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 12px;
          background: transparent; border: 1px solid ${C.border}; color: ${C.textMid};
          font-size: 15px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .2s; text-decoration: none;
        }
        .cta-btn-ghost:hover { border-color: ${C.borderHi}; color: ${C.text}; }

        /* Disclaimer banner */
        .disclaimer {
          border-top: 1px solid ${C.border};
          padding: 16px 24px;
          background: ${C.surface};
          font-size: 12px; color: ${C.textDim};
          font-family: 'DM Mono', monospace;
          line-height: 1.6; text-align: center;
        }

        /* Social link */
        .social-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: ${C.textMid}; text-decoration: none; font-size: 12px;
          transition: color .15s;
          font-family: 'DM Mono', monospace;
        }
        .social-link:hover { color: ${C.accentLt}; }

        /* Scrolling city strip */
        @keyframes scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .strip-track {
          display: flex; gap: 10px;
          animation: scroll 28s linear infinite;
          width: max-content;
        }
        .strip-track:hover { animation-play-state: paused; }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="hero-grid" style={{ position:"relative", padding:"100px 24px 90px", overflow:"hidden" }}>
        {/* Radial glow */}
        <div style={{
          position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          width:700, height:400, borderRadius:"50%",
          background:`radial-gradient(ellipse at center, ${C.accent}18 0%, transparent 70%)`,
          pointerEvents:"none",
        }}/>

        <div style={{ maxWidth:760, margin:"0 auto", textAlign:"center", position:"relative" }}>

          {/* Badge */}
          <div className="fu0" style={{ marginBottom:24 }}>
            <span className="pulse" style={{
              display:"inline-flex", alignItems:"center", gap:7,
              padding:"5px 14px", borderRadius:20,
              border:`1px solid ${C.accentBorder}`, background:C.accentDim,
              fontSize:11, fontFamily:"'DM Mono',monospace",
              color:C.accentLt, letterSpacing:1.5, textTransform:"uppercase",
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:C.positive, display:"inline-block" }}/>
              16 European cities · 2026 tax data
            </span>
          </div>

          {/* Headline */}
          <h1 className="fu1" style={{
            fontSize:"clamp(32px, 5.5vw, 58px)", fontWeight:700,
            lineHeight:1.12, letterSpacing:-1.5, marginBottom:20, color:C.text,
          }}>
            From gross salary to{" "}
            <span style={{
              background:`linear-gradient(135deg, ${C.accentLt} 0%, #a78bfa 100%)`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>
              what you actually take home.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="fu2" style={{
            fontSize:17, color:C.textMid, lineHeight:1.7,
            maxWidth:560, margin:"0 auto 36px",
          }}>
            Taxes, rent, food, transport — all deducted.
            See your real disposable income across Europe's top cities, side by side.
          </p>

          {/* CTAs */}
          <div className="fu3" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/calculator" className="cta-btn">
              Try the calculator →
            </Link>
            <Link to="/how-it-works" className="cta-btn-ghost">
              How it works
            </Link>
          </div>

        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section style={{ padding:"80px 24px", maxWidth:940, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.accent, letterSpacing:2.5, textTransform:"uppercase", marginBottom:10 }}>
            Why WhereToLive
          </p>
          <h2 style={{ fontSize:"clamp(22px,3.5vw,32px)", fontWeight:600, letterSpacing:-0.5 }}>
            Not just net salary. The full picture.
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px,1fr))", gap:16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="feat-card">
              <div style={{ fontSize:28, marginBottom:16 }}>{f.icon}</div>
              <h3 style={{ fontSize:16, fontWeight:600, marginBottom:8, color:C.text }}>{f.title}</h3>
              <p style={{ fontSize:13.5, color:C.textMid, lineHeight:1.7 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CITIES STRIP ────────────────────────────────────────── */}
      <section style={{ borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"32px 0", overflow:"hidden" }}>
        <div style={{ overflow:"hidden", maskImage:"linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
          <div className="strip-track">
            {[...CITIES, ...CITIES].map((c, i) => (
              <div key={i} className="city-chip">
                <span style={{ fontSize:16 }}>{emojiFlag(c.flag)}</span>
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS TEASER ─────────────────────────────────── */}
      <section style={{ padding:"80px 24px", maxWidth:940, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <p style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:C.accent, letterSpacing:2.5, textTransform:"uppercase", marginBottom:10 }}>
            Simple by design
          </p>
          <h2 style={{ fontSize:"clamp(22px,3.5vw,32px)", fontWeight:600, letterSpacing:-0.5 }}>
            Three steps to clarity
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16, marginBottom:40 }}>
          {STEPS.map((s, i) => (
            <div key={i} className="step-card">
              <div style={{
                fontFamily:"'DM Mono',monospace", fontSize:11, color:C.accent,
                letterSpacing:2, marginBottom:14,
              }}>{s.n}</div>
              <h3 style={{ fontSize:15, fontWeight:600, marginBottom:8, color:C.text }}>{s.title}</h3>
              <p style={{ fontSize:13, color:C.textMid, lineHeight:1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign:"center" }}>
          <Link to="/how-it-works" style={{ color:C.accentLt, fontSize:13, fontFamily:"'DM Mono',monospace", textDecoration:"none" }}>
            Read the full methodology →
          </Link>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ────────────────────────────────────── */}
      <section style={{ padding:"0 24px 80px" }}>
        <div style={{
          maxWidth:940, margin:"0 auto",
          background:`linear-gradient(135deg, ${C.accent}18, ${C.surface})`,
          border:`1px solid ${C.accentBorder}`,
          borderRadius:20, padding:"56px 40px",
          textAlign:"center", position:"relative", overflow:"hidden",
        }}>
          <div style={{
            position:"absolute", top:-60, right:-60, width:200, height:200,
            borderRadius:"50%", background:`radial-gradient(circle, ${C.accent}20, transparent 70%)`,
            pointerEvents:"none",
          }}/>
          <h2 style={{ fontSize:"clamp(22px,3.5vw,34px)", fontWeight:700, letterSpacing:-0.5, marginBottom:14 }}>
            Ready to see your real numbers?
          </h2>
          <p style={{ fontSize:15, color:C.textMid, maxWidth:480, margin:"0 auto 32px", lineHeight:1.7 }}>
            Pick two cities, set your salary, and find out where your money actually goes furthest.
          </p>
          <Link to="/calculator" className="cta-btn" style={{ fontSize:16, padding:"16px 36px" }}>
            Open the calculator →
          </Link>
        </div>
      </section>

      {/* ── DISCLAIMER BANNER ───────────────────────────────────── */}
      <div className="disclaimer">
        This is a personal project built in spare time. I strive for accuracy but take no responsibility for the results.
        If you spot an error or have a suggestion, use the <a href="/contact" style={{ color:C.accentLt, textDecoration:"none" }}>contact page</a>.
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{
        borderTop:`1px solid ${C.border}`, background:C.surface,
        padding:"28px 24px",
      }}>
        <div style={{
          maxWidth:940, margin:"0 auto",
          display:"flex", flexDirection:"column", alignItems:"center",
          gap:16, textAlign:"center",
        }}>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            <a href="https://www.linkedin.com/in/eugeniomandala/" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              </svg>
              LinkedIn
            </a>
            <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
              </svg>
              GitHub
            </a>
          </div>
          <div>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color:C.textDim }}>
              All calculations are indicative and provided without guarantee.
            </span>
            <div style={{ marginTop:6, fontSize:11, color:C.textDim, fontFamily:"'DM Mono',monospace" }}>
              <span style={{ color:C.accent }}>↗</span> Currently covering 16 cities — actively working to expand the list.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
