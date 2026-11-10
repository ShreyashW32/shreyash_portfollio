import { useEffect, useRef } from "react";

/** Ambient op-art: drifting concentric rings + flow lines in deep orange that ease toward the mouse. */
export function OpArt() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const col = getComputedStyle(document.documentElement).getPropertyValue("--primary") || "orange";
    let w = 0, h = 0, raf = 0, t = 0, visible = true;
    const m = { x: 0.7, y: 0.4, tx: 0.7, ty: 0.4 };
    const resize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
    resize();
    const onMove = (e: MouseEvent) => { m.tx = e.clientX / innerWidth; m.ty = e.clientY / innerHeight; };
    const io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting; if (visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } });
    io.observe(c);
    function draw() {
      if (!visible || !ctx) return;
      t += 0.004;
      m.x += (m.tx - m.x) * 0.04; m.y += (m.ty - m.y) * 0.04;
      ctx.clearRect(0, 0, w, h);
      const cx = w * (0.55 + m.x * 0.25), cy = h * (0.25 + m.y * 0.35);
      ctx.strokeStyle = col; ctx.lineWidth = 1;
      for (let r = 0; r < 26; r++) {
        const rad = 40 + r * 28 + Math.sin(t * 3 + r * 0.4) * 10;
        ctx.globalAlpha = 0.22 * (1 - r / 26);
        ctx.beginPath(); ctx.ellipse(cx, cy, rad * 1.15, rad, t + r * 0.03, 0, Math.PI * 2); ctx.stroke();
      }
      for (let l = 0; l < 22; l++) {
        ctx.globalAlpha = 0.07;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 24) {
          const y = (h / 22) * l + Math.sin(x * 0.006 + t * 4 + l * 0.5) * 18 + (cy - h / 2) * 0.08;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    addEventListener("resize", resize); addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", resize); removeEventListener("mousemove", onMove); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
