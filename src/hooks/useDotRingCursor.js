import { useEffect } from "react";

export function useDotRingCursor() {
  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(hover: none)").matches) return;

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
      if (document.body.contains(dot)) document.body.removeChild(dot);
      if (document.body.contains(ring)) document.body.removeChild(ring);
    };
  }, []);
}
