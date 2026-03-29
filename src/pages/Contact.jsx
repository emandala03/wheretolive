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
  negative:     "#f87171",
};

// ─── Replace with your Formspree endpoint after signing up at formspree.io
// 1. Go to https://formspree.io → create a free account
// 2. Create a new form → copy the endpoint URL
// 3. Paste it here replacing YOUR_FORM_ID
const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

const TYPES = [
  { id: "bug",     icon: "🐛", label: "Bug / incorrect result" },
  { id: "feature", icon: "💡", label: "Feature suggestion" },
  { id: "city",    icon: "🏙️", label: "New city request" },
  { id: "general", icon: "💬", label: "General comment" },
];

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
    const targets = document.querySelectorAll("a,button,input,textarea,[role='button']");
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function Contact() {
  useDotRingCursor();

  const [type, setType]       = useState("general");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState("idle"); // idle | sending | success | error

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ type, name, email, message }),
      });
      if (res.ok) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: C.surfaceHi, border: `1px solid ${C.border}`,
    borderRadius: 10, color: C.text, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    transition: "border-color .2s",
  };

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

        input:focus, textarea:focus {
          border-color: ${C.accentBorder} !important;
          box-shadow: 0 0 0 3px ${C.accentDim};
        }
        input::placeholder, textarea::placeholder { color: ${C.textDim}; }

        .type-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 13px 16px; border-radius: 10px;
          border: 1px solid ${C.border}; background: ${C.surfaceHi};
          color: ${C.textMid}; font-size: 13px; cursor: none;
          font-family: 'DM Sans', sans-serif; transition: all .15s;
          text-align: left; width: 100%;
        }
        .type-btn:hover { border-color: ${C.borderHi}; color: ${C.text}; }
        .type-btn.selected {
          border-color: ${C.accent}; background: ${C.accentDim};
          color: ${C.accentLt};
        }

        .send-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 10px;
          background: ${C.accent}; border: none; color: #fff;
          font-size: 14px; font-weight: 600; cursor: none;
          font-family: 'DM Sans', sans-serif; transition: all .2s;
          box-shadow: 0 0 24px ${C.accent}40;
        }
        .send-btn:hover:not(:disabled) { background: ${C.accentLt}; transform: translateY(-1px); }
        .send-btn:disabled { opacity: .5; }

        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: ${C.textMid}; text-decoration: none; font-size: 13px;
          font-family: 'DM Mono', monospace; transition: color .15s;
          margin-bottom: 32px;
        }
        .back-link:hover { color: ${C.accentLt}; }

        .social-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: ${C.textMid}; text-decoration: none; font-size: 12px;
          transition: color .15s; font-family: 'DM Mono', monospace;
        }
        .social-link:hover { color: ${C.accentLt}; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px 100px" }}>

        {/* ── BACK ── */}
        <a href="/" className="back-link">← Back to home</a>

        {/* ── HEADER ── */}
        <div className="fu" style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, letterSpacing: -1, marginBottom: 12 }}>
            Contact
          </h1>
          <p style={{ fontSize: 15, color: C.textMid, lineHeight: 1.75 }}>
            Help improve WhereToLive — report errors, suggest a new city, or just share your thoughts.
          </p>
        </div>

        {status === "success" ? (
          /* ── SUCCESS STATE ── */
          <div style={{
            background: C.surface, border: `1px solid ${C.positive}40`,
            borderRadius: 16, padding: "48px 32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 10, color: C.positive }}>Message sent!</h2>
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, marginBottom: 24 }}>
              Thanks for reaching out. I'll get back to you as soon as possible.
            </p>
            <button
              onClick={() => { setStatus("idle"); setName(""); setEmail(""); setMessage(""); setType("general"); }}
              style={{
                background: "transparent", border: `1px solid ${C.border}`, color: C.textMid,
                borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "none",
                fontFamily: "'DM Mono',monospace", transition: "all .2s",
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* ── FEEDBACK TYPE ── */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "24px 24px 28px", marginBottom: 2,
              borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
            }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: C.textMid, display: "block", marginBottom: 14 }}>
                What kind of feedback? <span style={{ color: C.negative }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TYPES.map(t => (
                  <button
                    key={t.id} type="button"
                    className={`type-btn ${type === t.id ? "selected" : ""}`}
                    onClick={() => setType(t.id)}
                  >
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── NAME + EMAIL ── */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderTop: "none", padding: "24px 24px",
              marginBottom: 2,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.textDim, fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 8 }}>
                    Your name
                  </label>
                  <input
                    type="text" placeholder="Jane Smith"
                    value={name} onChange={e => setName(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.textDim, fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 8 }}>
                    Your email <span style={{ color: C.negative }}>*</span>
                  </label>
                  <input
                    type="email" placeholder="jane@example.com" required
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* ── MESSAGE ── */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderTop: "none", padding: "24px 24px",
              marginBottom: 2, borderTopLeftRadius: 0, borderTopRightRadius: 0,
            }}>
              <label style={{ fontSize: 12, color: C.textDim, fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 8 }}>
                Your message <span style={{ color: C.negative }}>*</span>
              </label>
              <textarea
                required rows={6} placeholder="Describe the issue, suggestion, or comment..."
                value={message} onChange={e => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: "vertical", minHeight: 140, lineHeight: 1.6 }}
              />
            </div>

            {/* ── SUBMIT ── */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderTop: "none", padding: "20px 24px",
              display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16,
              borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
            }}>
              {status === "error" && (
                <span style={{ fontSize: 12, color: C.negative, fontFamily: "'DM Mono',monospace" }}>
                  Something went wrong — try again or email directly.
                </span>
              )}
              <button type="submit" className="send-btn" disabled={status === "sending"}>
                <span>✈</span>
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
            </div>

          </form>
        )}

        {/* ── DIRECT EMAIL NOTE ── */}
        <p style={{ marginTop: 28, fontSize: 12, color: C.textDim, fontFamily: "'DM Mono',monospace", textAlign: "center" }}>
          You can also reach out via the form above — I read every message.
        </p>

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface, padding: "28px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
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
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: C.textDim }}>
            All calculations are indicative and provided without guarantee.
          </span>
        </div>
      </footer>

    </div>
  );
}
