import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const C = {
  bg:      "#09090f",
  text:    "#e8e8f0",
  dim:     "#2a2a42",
  dimMid:  "#4a4a6a",
  accent:  "#6366f1",
};

// ── ASCII ART ENGINE ──────────────────────────────────────────────────────────
// Samples letter shapes on a small canvas, fills "lit" cells with random
// chars from the brand charset, flickers 4% per tick at ~120ms.
function ASCIIHero() {
  const preRef  = useRef(null);
  const dataRef = useRef({ rows: 0, cols: 0, grid: [], lit: [] });

  const CHARSET = 'WHERETOLIVE34@T#R=+%-*WTLWHR43T';

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const FONT_SIZE = 11;  // px — display font size
    const LINE_H   = 13;  // px — line height

    // Measure actual monospace char width after font load
    const measure = () => {
      const c = document.createElement('canvas');
      const cx = c.getContext('2d');
      cx.font = `${FONT_SIZE}px "DM Mono", monospace`;
      return cx.measureText('M').width;
    };

    const build = () => {
      const parent = pre.parentElement;
      if (!parent) return;

      const W = parent.clientWidth;
      const H = parent.clientHeight;
      const CHAR_W = measure();

      const cols = Math.floor(W / CHAR_W);
      const rows = Math.floor(H / LINE_H);
      if (cols < 10 || rows < 5) return;

      // ── Shape detection canvas ──────────────────────────────────────────
      const sc = document.createElement('canvas');
      sc.width = cols; sc.height = rows;
      const scx = sc.getContext('2d');
      scx.fillStyle = '#000';
      scx.fillRect(0, 0, cols, rows);
      scx.fillStyle = '#fff';

      // Fit the two text lines to ~90% width, centered vertically
      let fs = rows * 0.40;
      scx.font = `900 ${fs}px sans-serif`;
      const scale = (cols * 0.91) / Math.max(
        scx.measureText('WHERE').width,
        scx.measureText('TO LIVE.').width
      );
      fs = Math.floor(fs * scale);
      scx.font = `900 ${fs}px sans-serif`;

      const lineGap = fs * 1.08;
      const totalH  = lineGap * 2;
      const baseY   = (rows - totalH) / 2 + fs * 0.88;

      scx.fillText('WHERE',
        Math.floor((cols - scx.measureText('WHERE').width) / 2),
        Math.floor(baseY));
      scx.fillText('TO LIVE.',
        Math.floor((cols - scx.measureText('TO LIVE.').width) / 2),
        Math.floor(baseY + lineGap));

      // ── Build lit positions ─────────────────────────────────────────────
      const px = scx.getImageData(0, 0, cols, rows).data;
      const lit = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (px[(r * cols + c) * 4] > 18) lit.push(r * cols + c);
        }
      }

      // ── Init grid ────────────────────────────────────────────────────────
      const grid = new Array(rows * cols).fill(' ');
      for (const pos of lit) {
        grid[pos] = CHARSET[Math.floor(Math.random() * CHARSET.length)];
      }

      dataRef.current = { rows, cols, grid, lit };
      render();
    };

    const render = () => {
      const { rows, cols, grid } = dataRef.current;
      if (!rows || !pre) return;
      const lines = [];
      for (let r = 0; r < rows; r++) {
        lines.push(grid.slice(r * cols, (r + 1) * cols).join(''));
      }
      pre.textContent = lines.join('\n');
    };

    // Flicker: replace ~4% of lit chars per tick
    let timer;
    const flicker = () => {
      const { grid, lit } = dataRef.current;
      if (lit.length > 0) {
        const n = Math.max(1, Math.floor(lit.length * 0.04));
        for (let i = 0; i < n; i++) {
          const pos = lit[Math.floor(Math.random() * lit.length)];
          grid[pos] = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        }
        render();
      }
      timer = setTimeout(flicker, 120);
    };

    // Wait for DM Mono to load
    document.fonts.ready.then(() => {
      build();
      timer = setTimeout(flicker, 600);
    });

    const ro = new ResizeObserver(() => build());
    ro.observe(pre.parentElement);

    return () => { clearTimeout(timer); ro.disconnect(); };
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <pre ref={preRef} style={{
        position:   'absolute', inset: 0,
        fontFamily: '"DM Mono", "Courier New", monospace',
        fontSize:   '11px', lineHeight: '13px',
        color:      C.text, margin: 0, padding: 0,
        userSelect: 'none', pointerEvents: 'none',
        overflow:   'hidden', whiteSpace: 'pre',
      }}/>
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: '100vh', overflowX: 'hidden',
      fontFamily: '"DM Mono", monospace',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #6366f120; color: #818cf8; }

        body { cursor: crosshair; }

        /* Dot grid background */
        .dot-bg {
          background-image: radial-gradient(circle, #ffffff0a 1px, transparent 1px);
          background-size: 22px 22px;
        }

        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .nav-lnk {
          color: ${C.dimMid}; text-decoration: none; font-size: 11px;
          letter-spacing: 1.5px; text-transform: uppercase;
          transition: color .15s;
        }
        .nav-lnk:hover { color: ${C.text}; }

        .corner-meta {
          font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase;
          color: ${C.dimMid}; line-height: 1.7;
        }

        .cta-btn {
          display: inline-flex; align-items: center;
          font-family: "DM Mono", monospace;
          font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
          color: ${C.text}; text-decoration: none;
          border: 1px solid ${C.dim}; padding: 10px 20px;
          transition: all .2s;
        }
        .cta-btn:hover { border-color: ${C.dimMid}; color: ${C.text}; background: #ffffff06; }
        .cta-btn-filled {
          display: inline-flex; align-items: center;
          font-family: "DM Mono", monospace;
          font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; text-decoration: none;
          background: ${C.accent}; border: 1px solid transparent;
          padding: 10px 20px; transition: background .2s;
        }
        .cta-btn-filled:hover { background: #818cf8; }

        .section-rule {
          border: none; border-top: 1px solid ${C.dim}; margin: 0;
        }

        .step-row {
          display: grid; grid-template-columns: 64px 1fr;
          border-top: 1px solid ${C.dim}; padding: 28px 0;
          transition: border-color .2s;
        }
        .step-row:hover { border-color: ${C.dimMid}; }

        .stat-cell {
          padding: 32px 0 32px 0;
          border-right: 1px solid ${C.dim};
        }
        .stat-cell:last-child { border-right: none; }

        .strip-track { display:flex; animation: scrollX 40s linear infinite; width:max-content; }
        .strip-item {
          padding: 0 32px; border-right: 1px solid ${C.dim};
          font-size: 10px; letter-spacing: 2px; color: ${C.dimMid};
          white-space: nowrap; line-height: 44px; text-transform: uppercase;
          transition: color .2s;
        }
        .strip-item:hover { color: ${C.text}; }
        @keyframes scrollX { from { transform:translateX(0); } to { transform:translateX(-33.33%); } }

        .footer-lnk {
          color: ${C.dimMid}; text-decoration: none; font-size: 10px;
          letter-spacing: 1px; text-transform: uppercase; transition: color .15s;
        }
        .footer-lnk:hover { color: ${C.text}; }

        @media (max-width: 640px) {
          .hero-corner-tr, .hero-corner-br { display: none !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════ HERO — FULL VIEWPORT ═══════════════════════ */}
      <section className="dot-bg" style={{
        position: 'relative', height: '100svh', overflow: 'hidden',
      }}>
        {/* ASCII art fills entire hero */}
        <ASCIIHero />

        {/* ── TOP LEFT: logo ─────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 28, left: 32,
          animation: 'fadeIn .6s .2s both',
          zIndex: 10,
        }}>
          <Link to="/" style={{
            color: C.text, textDecoration: 'none',
            fontSize: 13, letterSpacing: 1, fontWeight: 500,
          }}>
            wheretolive<span style={{ color: C.accent }}>.</span>
          </Link>
        </div>

        {/* ── TOP CENTER: nav ────────────────────────────────────────────── */}
        <div style={{
          position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 28, animation: 'fadeIn .6s .3s both',
          zIndex: 10,
        }}>
          <Link to="/calculator"    className="nav-lnk">Calculator</Link>
          <Link to="/how-it-works"  className="nav-lnk">How it works</Link>
          <Link to="/about"         className="nav-lnk">About</Link>
        </div>

        {/* ── TOP RIGHT: meta ────────────────────────────────────────────── */}
        <div className="hero-corner-tr corner-meta" style={{
          position: 'absolute', top: 28, right: 32,
          textAlign: 'right', animation: 'fadeIn .6s .3s both',
          zIndex: 10,
        }}>
          <div>Built for graduates</div>
          <div>Europe · 2026</div>
        </div>

        {/* ── BOTTOM LEFT: tagline ───────────────────────────────────────── */}
        <div style={{
          position: 'absolute', bottom: 32, left: 32,
          animation: 'fadeIn .8s .8s both', zIndex: 10,
        }}>
          <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', lineHeight: 1.6 }}>
            From gross salary.<br/>Every euro counted.
          </div>
        </div>

        {/* ── BOTTOM RIGHT: description ──────────────────────────────────── */}
        <div className="hero-corner-br corner-meta" style={{
          position: 'absolute', bottom: 32, right: 32,
          textAlign: 'right', maxWidth: 360,
          animation: 'fadeIn .8s .8s both', zIndex: 10,
        }}>
          <div>Compare take-home pay and disposable</div>
          <div>income across 16 European cities.</div>
        </div>

        {/* ── BOTTOM CENTER: scroll hint ─────────────────────────────────── */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, letterSpacing: 2, color: C.dimMid, textTransform: 'uppercase',
          animation: 'fadeIn 1s 1.2s both', zIndex: 10,
        }}>
          Scroll ↓
        </div>
      </section>

      {/* ══════════════════════ CITY STRIP ═════════════════════════════════ */}
      <div style={{
        borderTop: `1px solid ${C.dim}`, borderBottom: `1px solid ${C.dim}`,
        overflow: 'hidden', height: 44,
      }}>
        <div style={{
          maskImage: 'linear-gradient(90deg,transparent,black 5%,black 95%,transparent)',
          WebkitMaskImage: 'linear-gradient(90deg,transparent,black 5%,black 95%,transparent)',
        }}>
          <div className="strip-track">
            {(['Lisbon','London','Paris','Berlin','Amsterdam','Luxembourg','Dublin',
               'Madrid','Milan','Zurich','Vienna','Brussels','Stockholm','Copenhagen',
               'Warsaw','Prague']).concat(
              ['Lisbon','London','Paris','Berlin','Amsterdam','Luxembourg','Dublin',
               'Madrid','Milan','Zurich','Vienna','Brussels','Stockholm','Copenhagen',
               'Warsaw','Prague']).concat(
              ['Lisbon','London','Paris','Berlin','Amsterdam','Luxembourg','Dublin',
               'Madrid','Milan','Zurich','Vienna','Brussels','Stockholm','Copenhagen',
               'Warsaw','Prague'])
            .map((c,i) => <span key={i} className="strip-item">{c}</span>)}
          </div>
        </div>
      </div>

      {/* ══════════════════════ STATS ══════════════════════════════════════ */}
      <section style={{ borderBottom: `1px solid ${C.dim}` }}>
        <div className="stats-grid" style={{
          maxWidth: 1080, margin: '0 auto',
          padding: '0 clamp(24px,6vw,80px)',
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        }}>
          {[
            { n: '16',   label: 'European cities' },
            { n: '2026', label: 'Tax law in force' },
            { n: '€0',   label: 'Free to use' },
          ].map((s,i) => (
            <div key={i} className="stat-cell" style={{ paddingLeft: i > 0 ? 40 : 0, paddingRight: 40 }}>
              <div style={{
                fontFamily: '"DM Mono", monospace',
                fontSize: 'clamp(40px,6vw,80px)',
                letterSpacing: -2, color: C.text, lineHeight: 1,
                fontWeight: 500, marginBottom: 8,
              }}>{s.n}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ═══════════════════════════════ */}
      <section style={{
        maxWidth: 1080, margin: '0 auto',
        padding: '64px clamp(24px,6vw,80px)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, textTransform: 'uppercase', marginBottom: 16 }}>
              How it works
            </div>
            <h2 style={{
              fontSize: 'clamp(32px,5vw,60px)', letterSpacing: -2,
              lineHeight: .9, fontWeight: 500,
            }}>
              THREE<br/>
              <span style={{ color: C.dimMid }}>STEPS.</span>
            </h2>
          </div>
          <Link to="/calculator" className="cta-btn-filled">
            Try it ↗
          </Link>
        </div>

        <div style={{ marginTop: 40 }}>
          {[
            { n:'01', title:'Choose your cities', body:'Pick any two of 16 European cities. Set your gross salary — we handle currency conversion.' },
            { n:'02', title:'Build your profile', body:'Eating habits, sport, nights out. Costs are calculated city by city using real Numbeo data.' },
            { n:'03', title:'See what\'s left',   body:'Take-home pay minus rent, food, transport. Real disposable income, side by side.' },
          ].map((s,i) => (
            <div key={i} className="step-row">
              <span style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, paddingTop: 3 }}>{s.n}</span>
              <div>
                <div style={{ fontSize: 'clamp(15px,1.6vw,19px)', marginBottom: 8, letterSpacing: -.3, fontFamily: '"DM Mono", monospace' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: C.dimMid, lineHeight: 1.7, maxWidth: 480, letterSpacing: .3 }}>{s.body}</div>
              </div>
            </div>
          ))}
          <hr className="section-rule"/>
        </div>
      </section>

      {/* ══════════════════════ BOTTOM CTA ═════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${C.dim}`,
        maxWidth: 1080, margin: '0 auto',
        padding: '64px clamp(24px,6vw,80px)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: 32,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.dimMid, textTransform: 'uppercase', marginBottom: 16 }}>
            Ready?
          </div>
          <p style={{
            fontSize: 'clamp(28px,4vw,52px)', letterSpacing: -2,
            lineHeight: .9, fontWeight: 500,
          }}>
            SEE WHERE YOUR<br/>
            <span style={{ color: C.dimMid }}>MONEY GOES.</span>
          </p>
        </div>
        <Link to="/calculator" className="cta-btn-filled" style={{ fontSize: 12, padding: '12px 24px' }}>
          Open the calculator ↗
        </Link>
      </section>

      {/* ══════════════════════ FOOTER ═════════════════════════════════════ */}
      <footer style={{
        borderTop: `1px solid ${C.dim}`,
        padding: '20px clamp(24px,6vw,80px)',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <span style={{ fontSize: 10, letterSpacing: 1, color: C.dimMid, textTransform: 'uppercase' }}>
          wheretolive<span style={{ color: C.accent }}>.</span> — indicative only
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="https://www.linkedin.com/in/eugeniomandala/" target="_blank" rel="noopener noreferrer" className="footer-lnk">LinkedIn</a>
          <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer" className="footer-lnk">GitHub</a>
        </div>
      </footer>
    </div>
  );
}
