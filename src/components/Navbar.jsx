import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const C = {
  bg:          "#0e0e1c",
  border:      "#1c1c38",
  accent:      "#6366f1",
  accentLt:    "#818cf8",
  accentDim:   "#6366f115",
  accentBorder:"#6366f130",
  text:        "#f0f0ff",
  textMid:     "#9090b8",
};

const LINKS = [
  { label: "Home",         href: "/" },
  { label: "Calculator",   href: "/calculator" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About",        href: "/about" },
  { label: "Contact",      href: "/contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  // On home, become opaque only after scrolling past the hero
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // On non-home pages always opaque; on home transparent until scrolled
  const opaque = !isHome || scrolled;

  return (
    <>
      <nav style={{
        borderBottom:  opaque ? `1px solid ${C.border}` : "1px solid transparent",
        background:    opaque ? C.bg : "transparent",
        padding:       "0 20px",
        position:      "fixed",
        top:           0,
        left:          0,
        right:         0,
        zIndex:        200,
        transition:    "background .3s ease, border-color .3s ease",
      }}>
        <div style={{
          maxWidth: 940, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", height: 52,
        }}>
          {/* Logo */}
          <Link to="/" style={{
            fontFamily:     "'DM Mono',monospace",
            fontSize:        13,
            fontWeight:      500,
            color:           C.text,
            textDecoration:  "none",
            letterSpacing:   .5,
          }}>
            wheretolive<span style={{ color: C.accent }}>.</span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}
               className="nav-desktop">
            {LINKS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link key={href} to={href} style={{
                  padding:        "6px 12px",
                  borderRadius:   8,
                  fontSize:       12,
                  fontFamily:     "'DM Mono',monospace",
                  color:           active ? C.accentLt : C.textMid,
                  textDecoration:  "none",
                  transition:      "color .15s",
                  background:      active ? C.accentDim : "transparent",
                  whiteSpace:      "nowrap",
                }}>
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            onClick={() => setOpen(o => !o)}
            style={{
              background: "transparent", border: "none",
              color: C.textMid, fontSize: 22, cursor: "pointer",
              padding: "4px 8px", lineHeight: 1,
            }}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div className="nav-mobile-menu" style={{
          position: "fixed", top: 52, left: 0, right: 0, zIndex: 199,
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", padding: "8px 0",
        }}>
          {LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href} to={href}
                onClick={() => setOpen(false)}
                style={{
                  padding:        "14px 24px",
                  fontSize:        14,
                  fontFamily:      "'DM Mono',monospace",
                  color:           active ? C.accentLt : C.textMid,
                  textDecoration:  "none",
                  background:      active ? C.accentDim : "transparent",
                  borderLeft:      active ? `3px solid ${C.accent}` : "3px solid transparent",
                  transition:      "all .15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
        .nav-hamburger { display: none; }
        @media (max-width: 640px) {
          .nav-desktop        { display: none !important; }
          .nav-hamburger      { display: block !important; }
        }
      `}</style>
    </>
  );
}
