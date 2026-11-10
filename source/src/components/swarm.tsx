import { useEffect, useRef, useState } from "react";

type Agent = { x: number; y: number; tx: number; ty: number; a: number; col: string };

/** saai.pro-style takeover: arrow agents "paint" each [data-build] block top-down; scroll advances the frontier. */
export function Swarm() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [built, setBuilt] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sound, setSound] = useState(false);
  const speedRef = useRef(1);
  const soundRef = useRef<AudioContext | null>(null);
  const finish = useRef<() => void>(() => {});

  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset["swarm"]) { window.dispatchEvent(new Event("swarm:done")); return; }
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    setActive(true);
    const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-build]"))
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    setTotal(blocks.length);
    const css = getComputedStyle(root);
    const cols = ["--primary", "--signal", "--foreground"].map((v) => css.getPropertyValue(v) || "white");
    let w = 0, h = 0;
    const resize = () => { w = c.width = innerWidth; h = c.height = innerHeight; };
    resize();
    const agents: Agent[] = Array.from({ length: 18 }, (_, k) => {
      const x = Math.random() * w, y = h + 40 + Math.random() * 200;
      return { x, y, tx: x, ty: h * Math.random(), a: -Math.PI / 2, col: cols[k % 3] ?? "white" };
    });
    let i = 0, busyUntil = 0, raf = 0, done = false;

    const tickSound = () => {
      const ac = soundRef.current;
      if (!ac) return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.frequency.value = 600 + Math.random() * 600; o.type = "triangle";
      g.gain.setValueAtTime(0.04, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.09);
    };

    const end = () => {
      if (done) return;
      done = true;
      blocks.forEach((b) => b.setAttribute("data-built", ""));
      setBuilt(blocks.length);
      c.style.opacity = "0";
      setTimeout(() => {
        delete root.dataset["swarm"];
        cancelAnimationFrame(raf);
        setActive(false);
        window.dispatchEvent(new Event("swarm:done"));
      }, 600);
    };
    finish.current = end;

    const loop = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const block = blocks[i];
      if (block && t > busyUntil) {
        const r = block.getBoundingClientRect();
        if (r.top < h * 0.95) {
          // dispatch a squad to sweep the block
          const squad = agents.slice((i * 3) % 18, ((i * 3) % 18) + 4);
          squad.forEach((a, k) => { a.tx = r.left + (r.width * (k + 0.5)) / squad.length; a.ty = r.top + r.height / 2; });
          block.setAttribute("data-built", "");
          tickSound();
          i++;
          setBuilt(i);
          busyUntil = t + 260 / speedRef.current;
          if (i >= blocks.length) setTimeout(end, 900);
        }
      }
      for (const a of agents) {
        if (Math.hypot(a.tx - a.x, a.ty - a.y) < 30) { a.tx = Math.random() * w; a.ty = Math.random() * h; }
        const target = Math.atan2(a.ty - a.y, a.tx - a.x);
        let d = target - a.a; d = Math.atan2(Math.sin(d), Math.cos(d));
        a.a += d * 0.15;
        const sp = 7 * speedRef.current;
        a.x += Math.cos(a.a) * sp; a.y += Math.sin(a.a) * sp;
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.a);
        ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-7, -7); ctx.lineTo(-3, 0); ctx.lineTo(-7, 7); ctx.closePath();
        ctx.fillStyle = a.col; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    addEventListener("resize", resize);
    const safety = setTimeout(end, 60000);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); clearTimeout(safety); };
  }, []);

  const toggleSound = () => {
    if (!soundRef.current) soundRef.current = new AudioContext();
    if (sound) { void soundRef.current.suspend(); } else { void soundRef.current.resume(); }
    setSound(!sound);
  };

  return (
    <>
      <canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-0 z-[90] h-full w-full transition-opacity duration-500 ${active ? "" : "hidden"}`} />
      {active && (
        <div className="label-mono fixed bottom-6 left-1/2 z-[95] flex whitespace-nowrap -translate-x-1/2 items-center gap-3 rounded-xl border bg-card/90 px-4 py-2 text-muted-foreground backdrop-blur">
          <span><b className="text-foreground">{built}</b> / {total} built</span>
          <span className="hidden h-1 w-24 overflow-hidden rounded bg-muted sm:block"><span className="block h-full bg-primary transition-all" style={{ width: `${total ? (built / total) * 100 : 0}%` }} /></span>
          <span className="hidden sm:inline">Scroll to build</span>
          <button onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)} className="rounded-md bg-secondary px-2 py-1 text-foreground">{speed}x</button>
          <button onClick={toggleSound} className="rounded-md bg-secondary px-2 py-1 text-foreground">{sound ? "Sound on" : "Tap for sound"}</button>
          <button onClick={() => finish.current()} className="rounded-md bg-primary px-3 py-1 font-bold text-primary-foreground">Go live</button>
          <button onClick={() => finish.current()} aria-label="Close" className="px-1 text-foreground">✕</button>
        </div>
      )}
    </>
  );
}
