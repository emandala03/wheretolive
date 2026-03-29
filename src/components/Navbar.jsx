import { Link, useLocation } from "react-router-dom";

const C = {
  bg:           "#080812",
  surface:      "#0e0e1c",
  border:       "#1c1c38",
  accent:       "#6366f1",
  accentLt:     "#818cf8",
  accentDim:    "#6366f115",
  accentBorder: "#6366f130",
  text:         "#f0f0ff",
  textMid:      "#9090b8",
};

const LINKS = [
  { label: "Home",          href: "/" },
  { label: "Calculator",    href: "/calculator" },
  { label: "How it works",  href: "/how-it-works" },
  { label: "About",         href: "/about" },
  { label: "Contact",       href: "/contact" },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      borderBottom: `1px solid ${C.border}`,
      background: C.surface,
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 940, margin: "0 auto",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 52,
      }}>
        <Link to="/" style={{
          fontFamily: "'DM Mono',monospace", fontSize: 13,
          fontWeight: 500, color: C.text, textDecoration: "none", letterSpacing: .5,
        }}>
          wheretolive<span style={{ color: C.accent }}>.</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link key={href} to={href} style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                fontFamily: "'DM Mono',monospace",
                color: active ? C.accentLt : C.textMid,
                textDecoration: "none", transition: "color .15s",
                background: active ? C.accentDim : "transparent",
              }}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
