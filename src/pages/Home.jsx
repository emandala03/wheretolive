import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const C = {
  bg:     "#09090f",
  text:   "#d8d8e8",
  dim:    "#1e1e30",
  dimMid: "#3a3a58",
  accent: "#6366f1",
};

const CHARSET = "WHERETOLIVE34@T#R=+%-*WTL";
const CITIES = [
  "Lisbon","London","Paris","Berlin","Amsterdam","Luxembourg",
  "Dublin","Madrid","Milan","Zurich","Vienna","Brussels",
  "Stockholm","Copenhagen","Warsaw","Prague",
];

// ── ASCII ENGINE ──────────────────────────────────────────────────────────────
function ASCIIHero() {
  const containerRef = useRef(null);
  const preRef       = useRef(null);
  const stateRef     = useRef({ grid: [], litIdx: [], cols: 0, rows: 0 });
  const timerRef     = useRef(null);
  const mouseRef     = useRef({ x: -9999, y: -9999, charW: 7.2, lineH: 14 });

  const randChar = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

  useEffect(() => {
    const container = containerRef.current;
    const pre       = preRef.current;
    if (!container || !pre) return;

    let CHAR_W = 7.2;
    const LINE_H = 14;

    const measureChar = () => {
      const c = document.createElement("canvas");
      const cx = c.getContext("2d");
      cx.font = '11px "DM Mono", monospace';
      CHAR_W = cx.measureText("M").width;
      mouseRef.current.charW = CHAR_W;
      mouseRef.current.lineH = LINE_H;
    };

    const build = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;
      if (W < 100 || H < 100) return;

      measureChar();

      const cols = Math.floor(W / CHAR_W);
      const rows = Math.floor(H / LINE_H);

      const sc = document.createElement("canvas");
      sc.width  = W;
      sc.height = H;
      const scx = sc.getContext("2d");

      scx.fillStyle = "#000";
      scx.fillRect(0, 0, W, H);
      scx.fillStyle = "#fff";

      let fs = 120;
      const tryFit = () => {
        scx.font = `900 ${fs}px "Arial Black", "Arial", sans-serif`;
        const w1 = scx.measureText("WHERE").width;
        const w2 = scx.measureText("TO LIVE.").width;
        return Math.max(w1, w2);
      };
      let lo = 20, hi = 800;
      for (let i = 0; i < 20; i++) {
        fs = (lo + hi) / 2;
        const maxW = tryFit();
        if (maxW < W * 0.90) lo = fs; else hi = fs;
      }
      fs = Math.floor(lo);
      scx.font = `900 ${fs}px "Arial Black", "Arial", sans-serif`;

      const lineGap = fs * 1.02;
      const totalH  = lineGap * 2;
      const startY  = (H - totalH) / 2 + fs * 0.82;

      const cx1 = (W - scx.measureText("WHERE").width)    / 2;
      const cx2 = (W - scx.measureText("TO LIVE.").width) / 2;

      scx.fillText("WHERE",    cx1, startY);
      scx.fillText("TO LIVE.", cx2, startY + lineGap);

      const imgData = scx.getImageData(0, 0, W, H).data;
      const grid    = new Array(rows * cols).fill(" ");
      const litIdx  = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = Math.floor(c * CHAR_W + CHAR_W / 2);
          const py = Math.floor(r * LINE_H + LINE_H / 2);
          const i  = (py * W + px) * 4;
          if (imgData[i] > 20) {
            const pos = r * cols + c;
            grid[pos] = randChar();
            litIdx.push(pos);
          }
        }
      }

      stateRef.current = { grid, litIdx, cols, rows };
      renderGrid();
    };

    const renderGrid = () => {
      const { grid, cols, rows } = stateRef.current;
      if (!rows || !pre) return;
      const lines = [];
      for (let r = 0; r < rows; r++) {
        lines.push(grid.slice(r * cols, (r + 1) * cols).join(""));
      }
      pre.textContent = lines.join("\n");
    };

    // Background flicker — 3% of lit chars per tick
    const flicker = () => {
      const { grid, litIdx } = stateRef.current;
      if (litIdx.length > 0) {
        const n = Math.max(1, Math.floor(litIdx.length * 0.03));
        for (let i = 0; i < n; i++) {
          const pos = litIdx[Math.floor(Math.random() * litIdx.length)];
          grid[pos] = randChar();
        }
        renderGrid();
      }
      timerRef.current = setTimeout(flicker, 110);
    };

    // Mouse distortion — blast chars within radius on every move
    const RADIUS = 80; // px
    const onMouseMove = (e) => {
      const { grid, litIdx, cols } = stateRef.current;
      if (!litIdx.length) return;
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current.x = mx;
      mouseRef.current.y = my;

      const cw = mouseRef.current.charW;
      const lh = mouseRef.current.lineH;

      // Column/row range to check (bounding box of radius)
      const c0 = Math.max(0, Math.floor((mx - RADIUS) / cw));
      const c1 = Math.min(cols - 1, Math.ceil((mx + RADIUS) / cw));
      const r0 = Math.max(0, Math.floor((my - RADIUS) / lh));
      const r1 = Math.ceil((my + RADIUS) / lh);
      const rows = stateRef.current.rows;

      let changed = false;
      for (let r = r0; r <= Math.min(rows - 1, r1); r++) {
        for (let c = c0; c <= c1; c++) {
          const pos = r * cols + c;
          if (grid[pos] !== " ") {
            // Distance in pixels from cell center to cursor
            const cx = c * cw + cw / 2;
            const cy = r * lh + lh / 2;
            const dist = Math.hypot(cx - mx, cy - my);
            // Probability of replacing scales inversely with distance
            if (dist < RADIUS && Math.random() < (1 - dist / RADIUS) * 0.9) {
              grid[pos] = randChar();
              changed = true;
            }
          }
        }
      }
      if (changed) renderGrid();
    };

    const onMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    document.fonts.ready.then(() => {
      build();
      timerRef.current = setTimeout(flicker, 800);
    });

    const ro = new ResizeObserver(() => {
      clearTimeout(timerRef.current);
      build();
      timerRef.current = setTimeout(flicker, 800);
    });
    ro.observe(container);

    return () => {
      clearTimeout(timerRef.current);
      ro.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", cursor: "crosshair" }}>
      <pre
        ref={preRef}
        style={{
          position: "absolute", inset: 0,
          fontFamily: '"DM Mono", "Courier New", monospace',
          fontSize: "11px", lineHeight: "14px",
          color: C.text, margin: 0, padding: 0,
          userSelect: "none", pointerEvents: "none",
          overflow: "hidden", whiteSpace: "pre",
        }}
      />
    </div>
  );
}

// ── CITY TICKER ───────────────────────────────────────────────────────────────
function CityTicker() {
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % CITIES.length); setVisible(true); }, 280);
    }, 1700);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{
      display: "inline-block", minWidth: 110,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(5px)",
      transition: "opacity .28s, transform .28s",
      color: C.accent,
    }}>{CITIES[idx]}</span>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: "100vh", overflowX: "hidden",
      fontFamily: '"DM Mono", monospace',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #6366f120; color: #818cf8; }
        html { cursor: crosshair; }

        .dot-bg {
          background-image: radial-gradient(circle, #ffffff09 1px, transparent 1px);
          background-size: 20px 20px;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fi0 { animation: fadeIn .5s .1s both; }
        .fi1 { animation: fadeIn .5s .2s both; }
        .fi2 { animation: fadeIn .5s .3s both; }
        .fi3 { animation: fadeIn .7s .9s both; }

        .nav-lnk {
          color: ${C.dimMid}; text-decoration: none;
          font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
          transition: color .15s;
        }
        .nav-lnk:hover { color: ${C.text}; }

        .corner { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: ${C.dimMid}; line-height: 1.8; }

        @keyframes scrollX { from { transform: translateX(0); } to { transform: translateX(-33.333%); } }
        .strip-track { display: flex; animation: scrollX 42s linear infinite; width: max-content; }
        .strip-item {
          padding: 0 32px; border-right: 1px solid ${C.dim};
          font-size: 10px; letter-spacing: 2px; color: ${C.dimMid};
          white-space: nowrap; line-height: 44px; text-transform: uppercase;
          transition: color .2s;
        }
        .strip-item:hover { color: ${C.text}; }

        .step-row {
          display: grid; grid-template-columns: 60px 1fr;
          border-top: 1px solid ${C.dim}; padding: 28px 0;
          transition: border-color .2s;
        }
        .step-row:hover { border-color: ${C.dimMid}; }

        .stat-cell {
          padding: 32px 0; border-right: 1px solid ${C.dim};
        }
        .stat-cell:last-child { border-right: none; }

        .cta-fill {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "DM Mono", monospace; font-size: 10px;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; background: ${C.accent};
          text-decoration: none; padding: 11px 22px;
          border: 1px solid transparent; transition: background .2s;
        }
        .cta-fill:hover { background: #818cf8; }

        .cta-outline {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: "DM Mono", monospace; font-size: 10px;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: ${C.dimMid}; background: transparent;
          text-decoration: none; padding: 10px 22px;
          border: 1px solid ${C.dim}; transition: all .2s;
        }
        .cta-outline:hover { color: ${C.text}; border-color: ${C.dimMid}; }

        .footer-lnk {
          color: ${C.dimMid}; text-decoration: none;
          font-size: 10px; letter-spacing: 1px; text-transform: uppercase;
          transition: color .15s;
        }
        .footer-lnk:hover { color: ${C.text}; }

        @media (max-width: 640px) {
          .hero-tr, .hero-br { display: none !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid .stat-cell:nth-child(3) {
            grid-column: span 2; border-right: none;
            border-top: 1px solid ${C.dim};
          }
        }
      `}</style>

      {/* ══════════════════ HERO ══════════════════════════════════════════ */}
      <section className="dot-bg" style={{
        position: "relative", height: "100svh", overflow: "hidden",
      }}>
        {/* ASCII fills the hero */}
        <ASCIIHero />

        {/* Soft vignette so corners don't compete with text */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 40%, #09090fcc 100%)",
        }}/>

        {/* TOP LEFT — logo */}
        <div className="fi0" style={{ position: "absolute", top: 28, left: 32, zIndex: 10 }}>
          <Link to="/" style={{
            color: C.text, textDecoration: "none",
            fontSize: 13, letterSpacing: .5, fontWeight: 500,
          }}>
            wheretolive<span style={{ color: C.accent }}>.</span>
          </Link>
        </div>

        {/* TOP CENTER — nav */}
        <div className="fi1" style={{
          position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 28, zIndex: 10,
        }}>
          <Link to="/calculator"   className="nav-lnk">Calculator</Link>
          <Link to="/how-it-works" className="nav-lnk">How it works</Link>
          <Link to="/about"        className="nav-lnk">About</Link>
        </div>

        {/* TOP RIGHT — meta */}
        <div className="fi1 hero-tr corner" style={{
          position: "absolute", top: 28, right: 32,
          textAlign: "right", zIndex: 10,
        }}>
          <div>Built for graduates</div>
          <div>Europe · 2026</div>
        </div>

        {/* BOTTOM LEFT — tagline */}
        <div className="fi3" style={{
          position: "absolute", bottom: 32, left: 32, zIndex: 10,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", lineHeight: 1.7, color: C.dimMid }}>
            From gross salary.<br/>Every euro counted.
          </div>
        </div>

        {/* BOTTOM CENTER — scroll + CTA */}
        <div className="fi3" style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          zIndex: 10,
        }}>
          <Link to="/calculator" className="cta-fill">Try the calculator ↗</Link>
          <span style={{ fontSize: 9, letterSpacing: 2, color: C.dimMid, textTransform: "uppercase" }}>Scroll ↓</span>
        </div>

        {/* BOTTOM RIGHT — description */}
        <div className="fi3 hero-br corner" style={{
          position: "absolute", bottom: 32, right: 32,
          textAlign: "right", maxWidth: 340, zIndex: 10,
        }}>
          <div>Compare take-home pay and disposable</div>
          <div>income across 16 European cities.</div>
        </div>

        {/* ":/" mark */}
        <span className="fi3" style={{
          position: "absolute", top: 28, right: 32,
          display: "none",  /* hidden when hero-tr is visible */
          fontFamily: '"DM Mono", monospace', fontSize: 10,
          color: C.dimMid, letterSpacing: 2, userSelect: "none", zIndex: 10,
        }}>:/</span>
      </section>

      {/* ══════════════════ CITY STRIP ════════════════════════════════════ */}
      <div style={{
        borderTop: `1px solid ${C.dim}`, borderBottom: `1px solid ${C.dim}`,
        overflow: "hidden", height: 44,
      }}>
        <div style={{
          maskImage: "linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
          WebkitMaskImage: "linear-gradient(90deg,transparent,black 5%,black 95%,transparent)",
        }}>
          <div className="strip-track">
            {[...CITIES, ...CITIES, ...CITIES].map((c, i) => (
              <span key={i} className="strip-item">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ STATS ═════════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${C.dim}` }}>
        <div className="stats-grid" style={{
          maxWidth: 1080, margin: "0 auto",
          padding: "0 clamp(24px,6vw,80px)",
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
        }}>
          {[
            { n: "16",   label: "European cities" },
            { n: "2026", label: "Tax law in force" },
            { n: "€0",   label: "Free to use" },
          ].map((s, i) => (
            <div key={i} className="stat-cell" style={{ paddingLeft: i > 0 ? 40 : 0, paddingRight: 40 }}>
              <div style={{
                fontSize: "clamp(44px,6vw,80px)",
                letterSpacing: -2, color: C.text,
                lineHeight: 1, fontWeight: 500, marginBottom: 8,
              }}>{s.n}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ HOW IT WORKS ══════════════════════════════════ */}
      <section style={{
        maxWidth: 1080, margin: "0 auto",
        padding: "64px clamp(24px,6vw,80px)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-end", marginBottom: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, textTransform: "uppercase", marginBottom: 16 }}>How it works</div>
            <h2 style={{ fontSize: "clamp(32px,5vw,60px)", letterSpacing: -2, lineHeight: .9, fontWeight: 500 }}>
              THREE<br/><span style={{ color: C.dimMid }}>STEPS.</span>
            </h2>
          </div>
          <Link to="/calculator" className="cta-fill">Try it ↗</Link>
        </div>

        <div style={{ marginTop: 40 }}>
          {[
            { n: "01", title: "Choose your cities",  body: "Pick any two of 16 European cities. Set your gross salary in local currency — we handle conversion." },
            { n: "02", title: "Build your profile",  body: "Eating habits, sport, nights out. Living costs are calculated city by city from real Numbeo data." },
            { n: "03", title: "See what's left",     body: "Take-home pay minus rent, food, transport. Real disposable income, side by side." },
          ].map((s, i) => (
            <div key={i} className="step-row">
              <span style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, paddingTop: 3 }}>{s.n}</span>
              <div>
                <div style={{ fontSize: "clamp(14px,1.5vw,18px)", marginBottom: 8, letterSpacing: -.3 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: C.dimMid, lineHeight: 1.8, maxWidth: 480, letterSpacing: .3 }}>{s.body}</div>
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: C.dim }}/>
        </div>
      </section>

      {/* ══════════════════ BOTTOM CTA ════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${C.dim}`,
        maxWidth: 1080, margin: "0 auto",
        padding: "64px clamp(24px,6vw,80px)",
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-end", flexWrap: "wrap", gap: 32,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, textTransform: "uppercase", marginBottom: 16 }}>Ready?</div>
          <p style={{ fontSize: "clamp(28px,4vw,52px)", letterSpacing: -2, lineHeight: .9, fontWeight: 500 }}>
            SEE WHERE YOUR<br/><span style={{ color: C.dimMid }}>MONEY GOES.</span>
          </p>
        </div>
        <Link to="/calculator" className="cta-fill" style={{ padding: "12px 24px" }}>
          Open the calculator ↗
        </Link>
      </section>

      {/* ══════════════════ FOOTER ════════════════════════════════════════ */}
      <footer style={{
        borderTop: `1px solid ${C.dim}`,
        padding: "20px clamp(24px,6vw,80px)",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1, color: C.dimMid, textTransform: "uppercase" }}>
          wheretolive<span style={{ color: C.accent }}>.</span> — indicative only
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="https://www.linkedin.com/in/eugeniomandala/" target="_blank" rel="noopener noreferrer" className="footer-lnk">LinkedIn</a>
          <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer" className="footer-lnk">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
