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

const FOR_WHOM = [
  {
    icon: "🎓",
    title: "Master's students",
    body: "Deciding where to pursue your master's degree? See how far a student job salary goes in each city after rent and taxes.",
  },
  {
    icon: "🌍",
    title: "Students choosing a country",
    body: "Comparing study destinations across Europe? Get a clear picture of living costs before committing to a city.",
  },
  {
    icon: "💼",
    title: "Graduates entering the job market",
    body: "Got multiple offers in different countries? Cut through the gross salary numbers and see what you'd actually take home.",
  },
  {
    icon: "🔍",
    title: "Anyone curious",
    body: "Just want to know how European tax systems compare? WhereToLive is free, instant, and requires no sign-up.",
  },
];

const PRIVACY = [
  { icon: "🛡", text: "No ads, no cookies, no tracking." },
  { icon: "🔒", text: "No personal data stored. All calculations happen in real time in your browser." },
  { icon: "📖", text: "Open methodology. See exactly how the numbers are calculated." },
];

const FAQS = [
  {
    q: "Is WhereToLive free?",
    a: "Yes, 100% free. No subscription, no hidden fees, no sign-up required.",
  },
  {
    q: "How accurate are the estimates?",
    a: "WhereToLive uses 2026 official tax brackets and real rental data. It is a comparative tool with explicit assumptions — not a precision tax calculator. Individual results may vary based on contract type, residency status, and personal circumstances.",
  },
  {
    q: "Do you store my data?",
    a: "No. Everything is calculated locally in your browser. No salary figures, no city selections, no personal information is ever sent to a server or stored.",
  },
  {
    q: "Who built this?",
    a: "WhereToLive was built by an economics graduate. This is an independent personal project with no affiliation to any government, tax authority, or company — built to help people in the same situation: trying to figure out where to go after graduation.",
  },
  {
    q: "Can I report an error or suggest a city?",
    a: "Absolutely. If you spot a mistake in the calculations or want to suggest a new city, reach out via the contact page or open an issue on GitHub. Feedback is always welcome.",
  },
];

// ─── FAQ ITEM (accordion) ─────────────────────────────────────────────────────
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: C.surface, border: `1px solid ${open ? C.accentBorder : C.border}`,
        borderRadius: 12, overflow: "hidden", transition: "border-color .2s",
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left", padding: "18px 20px",
          background: "transparent", border: "none", cursor: "none",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{q}</span>
        <span style={{
          fontSize: 18, color: C.accentLt, flexShrink: 0,
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform .2s",
        }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 18px", fontSize: 13.5, color: C.textMid, lineHeight: 1.75 }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function About() {
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

        .for-card {
          background: ${C.surface}; border: 1px solid ${C.border};
          border-radius: 14px; padding: 24px 20px;
          transition: border-color .2s, transform .2s;
        }
        .for-card:hover { border-color: ${C.accentBorder}; transform: translateY(-2px); }

        .cta-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 12px;
          background: ${C.accent}; border: none; color: #fff;
          font-size: 15px; font-weight: 600; cursor: none;
          font-family: 'DM Sans', sans-serif; transition: all .2s;
          box-shadow: 0 0 32px ${C.accent}40; text-decoration: none;
        }
        .cta-btn:hover { background: ${C.accentLt}; transform: translateY(-2px); box-shadow: 0 0 48px ${C.accent}60; }

        .ghost-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 10px;
          background: transparent; border: 1px solid ${C.border}; color: ${C.textMid};
          font-size: 13px; font-weight: 500; cursor: none;
          font-family: 'DM Mono', monospace; transition: all .2s; text-decoration: none;
        }
        .ghost-btn:hover { border-color: ${C.borderHi}; color: ${C.text}; }

        .contact-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 20px; border-radius: 10px;
          background: transparent; border: 1px solid ${C.border}; color: ${C.textMid};
          font-size: 13px; cursor: none; font-family: 'DM Sans', sans-serif;
          transition: all .2s; text-decoration: none;
        }
        .contact-btn:hover { border-color: ${C.accentBorder}; color: ${C.accentLt}; }

        .disclaimer {
          border-top: 1px solid ${C.border};
          padding: 20px 24px;
          background: ${C.surface};
          font-size: 12px; color: ${C.textDim};
          font-family: 'DM Mono', monospace;
          line-height: 1.6;
        }

        .social-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: ${C.textMid}; text-decoration: none; font-size: 12px;
          transition: color .15s; font-family: 'DM Mono', monospace;
        }
        .social-link:hover { color: ${C.accentLt}; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "60px 24px 0" }}>

        {/* ── BACK LINK ── */}
        <a href="/" className="social-link" style={{ marginBottom: 32, display: "inline-flex" }}>
          ← Back to home
        </a>

        {/* ── PAGE HEADER ── */}
        <div className="fu" style={{ marginBottom: 40, marginTop: 20 }}>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, letterSpacing: -1, marginBottom: 14 }}>
            About WhereToLive
          </h1>
          <p style={{ fontSize: 16, color: C.textMid, lineHeight: 1.75, maxWidth: 600 }}>
            A free tool to compare real disposable income across 16 European cities —
            built for graduates, students, and anyone figuring out where to go next.
          </p>
        </div>

        {/* ── WHAT IS IT ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "28px 28px", marginBottom: 48,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>What is WhereToLive?</h2>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 14 }}>
            WhereToLive is a free salary comparator that shows you what's actually left in your pocket
            after taxes, social contributions, rent, food, and transport — across 16 major European cities.
          </p>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 14 }}>
            Gross salary numbers are misleading. A €50,000 offer in Berlin and a €50,000 offer in Amsterdam
            leave very different amounts at the end of the month. WhereToLive does the math so you don't have to.
          </p>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8 }}>
            The tool is 100% free, requires no sign-up, and stores no personal data.
            All calculations happen in real time using 2026 official tax rates and verified rental data.
          </p>
        </div>

        {/* ── WHO IS IT FOR ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Who is it for?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {FOR_WHOM.map((item, i) => (
              <div key={i} className="for-card">
                <div style={{ fontSize: 26, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: C.text }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRIVACY & TRUST ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "28px 28px", marginBottom: 48,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Privacy & trust</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
            {PRIVACY.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7 }}>{p.text}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            WhereToLive uses 2026 official tax law for all calculations. Results are comparative estimates —
            not official tax documents. Always consult a local advisor for precise figures.
          </p>
        </div>

        {/* ── OPEN SOURCE ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "28px 28px", marginBottom: 48,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Open source</h2>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 20 }}>
            The entire codebase — tax engine and frontend — is publicly available on GitHub.
            Bug reports, corrections, and city suggestions are very welcome.
          </p>
          <a href="https://github.com/emandala03" target="_blank" rel="noopener noreferrer" className="ghost-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
            GitHub →
          </a>
        </div>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Frequently asked questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── CONTACT ── */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "28px 28px", marginBottom: 56,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Contact</h2>
          <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.8, marginBottom: 20 }}>
            Have questions, feedback, or spotted an error? Reach out via the contact page
            or connect on LinkedIn.
          </p>
          <a href="/contact" className="contact-btn">
            ✉ Contact page →
          </a>
        </div>

      </div>

      {/* ── CTA FINALE ── */}
      <div style={{ textAlign: "center", padding: "0 24px 64px" }}>
        <p style={{ fontSize: 14, color: C.textDim, marginBottom: 16 }}>Ready to see your real numbers?</p>
        <a href="/calculator" className="cta-btn">
          Open the calculator →
        </a>
      </div>

      {/* ── DISCLAIMER ── */}
      <div className="disclaimer">
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <span>
            This is a personal project built in spare time. I strive for accuracy but take no responsibility for the results.
            If you spot an error or have a suggestion, use the{" "}
            <a href="/contact" style={{ color: C.accentLt, textDecoration: "none" }}>contact page</a>.
          </span>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: "28px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
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
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.textDim }}>
              All calculations are indicative and provided without guarantee.
            </span>
            <div style={{ marginTop: 6, fontSize: 11, color: C.textDim, fontFamily: "'DM Mono',monospace" }}>
              <span style={{ color: C.accent }}>↗</span> Currently covering 16 cities — actively working to expand the list.
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
