import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} data-build="" className={`reveal ${shown ? "reveal-in" : ""} ${className}`}>{children}</div>;
}

export function Typer({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(words[0]?.length ?? 0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const w = words[i] ?? "";
    const t = setTimeout(() => {
      if (!del && n === w.length) setDel(true);
      else if (del && n === 0) { setDel(false); setI((i + 1) % words.length); }
      else setN(n + (del ? -1 : 1));
    }, !del && n === w.length ? 1800 : del ? 35 : 70);
    return () => clearTimeout(t);
  }, [n, del, i, words]);
  return <span className="caret pr-1">{(words[i] ?? "").slice(0, n)}</span>;
}

/** Drifting arrow "agents" that steer gently toward the cursor, inspired by saai.pro. */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const css = getComputedStyle(document.documentElement);
    const colors = [css.getPropertyValue("--primary"), css.getPropertyValue("--signal"), css.getPropertyValue("--foreground")];
    let w = 0, h = 0, raf = 0;
    const mouse = { x: -9999, y: -9999 };
    const resize = () => { w = c.width = c.offsetWidth; h = c.height = c.offsetHeight; };
    resize();
    const agents = Array.from({ length: 22 }, (_, k) => ({
      x: Math.random() * w, y: Math.random() * h,
      a: Math.random() * Math.PI * 2, s: 0.4 + Math.random() * 0.8, col: colors[k % 3],
    }));
    const onMove = (e: MouseEvent) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of agents) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
        const target = d < 260 ? Math.atan2(dy, dx) : p.a + (Math.random() - 0.5) * 0.3;
        let diff = target - p.a; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        p.a += diff * (d < 260 ? 0.06 : 0.02);
        p.x += Math.cos(p.a) * p.s; p.y += Math.sin(p.a) * p.s;
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-2, 0); ctx.lineTo(-4, 4); ctx.closePath();
        ctx.fillStyle = p.col ?? "white"; ctx.globalAlpha = 0.75; ctx.fill(); ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) tick();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
