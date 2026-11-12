import { useEffect, useRef, useState } from "react";

/*
 * "Agents build the page": a design-tool style takeover written for this site.
 * Named multiplayer cursors draw a selection box over each [data-build] block,
 * label its size, then reveal it; rulers and guides frame the work. Scrolling
 * (or the auto Tour) moves the build frontier down the page.
 */

const NAMES = ["Fei-Fei", "Yann", "Geoff", "Andrew", "Ilya", "Demis", "Daphne", "Judea", "Cynthia", "Yoshua", "Ian", "Oriol", "Pieter", "Chelsea"];
const COLORS = ["#FF7A1A", "#22C55E", "#38BDF8", "#A78BFA", "#F472B6", "#FACC15", "#FB7185", "#2DD4BF"];
const RULER = 20;
const CURSOR_SCALE = 0.65;

type Rect = { x: number; y: number; w: number; h: number };
type Phase = "idle" | "travel" | "draw" | "hold";
type Agent = {
  name: string; color: string;
  x: number; y: number; // document coordinates
  fx: number; fy: number; tx: number; ty: number;
  t0: number; dur: number; phase: Phase;
  block?: HTMLElement; rect?: Rect; typing?: boolean;
};
type Ghost = Rect & { color: string; t0: number };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function docRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function drawCursor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, name: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(CURSOR_SCALE, CURSOR_SCALE);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.6, 12.8); ctx.lineTo(11.6, 12.4); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 1.3; ctx.strokeStyle = "#fff"; ctx.stroke();
  ctx.font = "600 11px 'Plus Jakarta Sans', system-ui, sans-serif";
  const tw = ctx.measureText(name).width;
  roundRect(ctx, 10, 17, tw + 10, 18, 5);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = "#0b0b0d"; ctx.fillText(name, 15, 30);
  ctx.restore();
}

function drawSelection(ctx: CanvasRenderingContext2D, r: Rect, color: string, alpha: number, label: boolean) {
  if (r.w < 1 || r.h < 1) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.fillStyle = color + "14";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = "#fff";
  for (const [hx, hy] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]] as const) {
    ctx.fillRect(hx - 3.5, hy - 3.5, 7, 7); ctx.strokeRect(hx - 3.5, hy - 3.5, 7, 7);
  }
  if (label) {
    const text = `${Math.round(r.w)} × ${Math.round(r.h)}`;
    ctx.font = "600 10.5px 'JetBrains Mono', ui-monospace, monospace";
    const tw = ctx.measureText(text).width;
    const lx = r.x + r.w / 2 - tw / 2 - 6, ly = r.y + r.h + 8;
    roundRect(ctx, lx, ly, tw + 12, 17, 4);
    ctx.fillStyle = color; ctx.fill();
    ctx.fillStyle = "#0b0b0d"; ctx.fillText(text, lx + 6, ly + 12.5);
  }
  ctx.restore();
}

function drawRulers(ctx: CanvasRenderingContext2D, w: number, h: number, bands: { r: Rect; color: string }[]) {
  ctx.save();
  ctx.fillStyle = "rgba(14,14,17,0.94)";
  ctx.fillRect(0, 0, w, RULER); ctx.fillRect(0, 0, RULER, h);
  for (const b of bands) {
    ctx.fillStyle = b.color + "40";
    ctx.fillRect(Math.max(RULER, b.r.x - scrollX), 0, b.r.w, RULER);
    ctx.fillRect(0, Math.max(RULER, b.r.y - scrollY), RULER, b.r.h);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "9px 'JetBrains Mono', ui-monospace, monospace"; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let d = Math.ceil((scrollX + RULER) / 10) * 10; d < scrollX + w; d += 10) {
    const vx = Math.round(d - scrollX) + 0.5;
    const len = d % 100 === 0 ? 10 : d % 50 === 0 ? 6 : 3;
    ctx.moveTo(vx, RULER); ctx.lineTo(vx, RULER - len);
    if (d % 100 === 0) ctx.fillText(String(d), vx + 3, 9);
  }
  for (let d = Math.ceil((scrollY + RULER) / 10) * 10; d < scrollY + h; d += 10) {
    const vy = Math.round(d - scrollY) + 0.5;
    const len = d % 100 === 0 ? 10 : d % 50 === 0 ? 6 : 3;
    ctx.moveTo(RULER, vy); ctx.lineTo(RULER - len, vy);
    if (d % 100 === 0) { ctx.save(); ctx.translate(9, vy - 3); ctx.rotate(-Math.PI / 2); ctx.fillText(String(d), 0, 0); ctx.restore(); }
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath(); ctx.moveTo(0, RULER + 0.5); ctx.lineTo(w, RULER + 0.5); ctx.moveTo(RULER + 0.5, 0); ctx.lineTo(RULER + 0.5, h); ctx.stroke();
  ctx.fillStyle = "rgba(14,14,17,1)"; ctx.fillRect(0, 0, RULER, RULER);
  ctx.restore();
}

export function Swarm() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [built, setBuilt] = useState(0);
  const [total, setTotal] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sound, setSound] = useState(false);
  const [tour, setTour] = useState(false);
  const [status, setStatus] = useState("Building");
  const speedRef = useRef(1);
  const tourRef = useRef(false);
  const soundRef = useRef<AudioContext | null>(null);
  const finish = useRef<() => void>(() => {});

  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { tourRef.current = tour; }, [tour]);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.dataset["swarm"]) { window.dispatchEvent(new Event("swarm:done")); return; }
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    setActive(true);

    const blocks = Array.from(document.querySelectorAll<HTMLElement>("[data-build]"))
      .map((el) => ({ el, top: docRect(el).y }))
      .sort((a, b) => a.top - b.top)
      .map((b) => b.el);
    setTotal(blocks.length);

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const agents: Agent[] = NAMES.slice(0, w < 640 ? 8 : 14).map((name, k) => ({
      name, color: COLORS[k % COLORS.length]!,
      x: scrollX + rand(RULER + 20, w - 40), y: scrollY + rand(h * 0.2, h * 0.9), fx: 0, fy: 0, tx: 0, ty: 0,
      t0: 0, dur: 0, phase: "idle" as Phase,
    }));
    const ghosts: Ghost[] = [];

    const blip = (freq: number, len: number, vol: number) => {
      const ac = soundRef.current;
      if (!ac || ac.state !== "running") return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "triangle"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + len);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + len + 0.02);
    };

    let next = 0, done = false, raf = 0, last = performance.now(), builtCount = 0, lastWander = 0;
    let tourStarted = false, ending = false, reported = 0;

    const end = () => {
      if (done) return;
      done = true;
      blocks.forEach((b) => b.setAttribute("data-built", ""));
      setBuilt(blocks.length);
      setStatus("Live");
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
      const dt = Math.min(64, t - last); last = t;
      const sp = speedRef.current;
      ctx.clearRect(0, 0, w, h);
      {
        if (!tourStarted) { tourStarted = true; setTour(true); }
        const busy = agents.filter((a) => a.phase !== "idle").length;
        const maxActive = Math.min(agents.length, 3 + sp * 2);
        // Hand the next blocks in view to idle agents.
        for (const a of agents) {
          if (next >= blocks.length || busy >= maxActive) break;
          if (a.phase !== "idle") continue;
          const el = blocks[next]!;
          const r = docRect(el);
          if (r.y > scrollY + h * 0.92) break;
          next++;
          a.block = el; a.rect = r; a.phase = "travel"; a.t0 = t;
          a.fx = a.x; a.fy = a.y; a.tx = r.x; a.ty = r.y;
          a.dur = clamp(Math.hypot(r.x - a.x, r.y - a.y) * 0.9, 220, 700) / sp;
          if (r.w < 2 || r.h < 2) { el.setAttribute("data-built", ""); builtCount++; a.phase = "idle"; }
        }

        const bands: { r: Rect; color: string }[] = [];
        for (const a of agents) {
          const p = a.dur ? clamp((t - a.t0) / a.dur, 0, 1) : 1;
          if (a.phase === "travel" && a.rect) {
            const e = easeInOut(p);
            a.x = a.fx + (a.tx - a.fx) * e; a.y = a.fy + (a.ty - a.fy) * e;
            if (p >= 1) {
              a.rect = docRect(a.block!);
              a.x = a.rect.x; a.y = a.rect.y;
              a.phase = "draw"; a.t0 = t; a.dur = clamp(260 + Math.sqrt(a.rect.w * a.rect.h) * 0.9, 300, 900) / sp;
              blip(880 + Math.random() * 300, 0.05, 0.025);
            }
          } else if (a.phase === "draw" && a.rect) {
            const e = easeInOut(p), r = a.rect;
            const cur = { x: r.x, y: r.y, w: r.w * e, h: r.h * e };
            a.x = r.x + cur.w; a.y = r.y + cur.h;
            const v = { ...cur, x: cur.x - scrollX, y: cur.y - scrollY };
            // Guides from the rulers to the box edges, like a pen tool snapping.
            ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = a.color + "88"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(v.x + 0.5, RULER); ctx.lineTo(v.x + 0.5, h); ctx.moveTo(RULER, v.y + 0.5); ctx.lineTo(w, v.y + 0.5); ctx.stroke(); ctx.restore();
            drawSelection(ctx, v, a.color, 1, true);
            bands.push({ r: cur, color: a.color });
            if (p >= 1) {
              a.block!.setAttribute("data-built", "");
              builtCount++;
              blip(420 + Math.random() * 200, 0.09, 0.05);
              a.phase = "hold"; a.t0 = t; a.dur = 380 / sp;
              a.typing = r.h < 90 && r.w > 60;
            }
          } else if (a.phase === "hold" && a.rect) {
            const r = a.rect;
            const v = { ...r, x: r.x - scrollX, y: r.y - scrollY };
            drawSelection(ctx, v, a.color, 1, true);
            bands.push({ r, color: a.color });
            if (a.typing) {
              // The cursor sweeps the line as if typing it in, with a caret.
              a.x = r.x + Math.min(r.w, 40 + r.w * p); a.y = r.y + r.h * 0.55;
              if (Math.floor(t / 260) % 2) { ctx.fillStyle = a.color; ctx.fillRect(a.x - scrollX - 1, r.y - scrollY + 4, 2, Math.max(10, r.h - 8)); }
            }
            if (p >= 1) { ghosts.push({ ...r, color: a.color, t0: t }); a.phase = "idle"; a.block = undefined; a.rect = undefined; a.t0 = t; a.dur = 0; }
          } else {
            // Idle agents drift around the build frontier.
            if (t - lastWander > 900 || a.tx === 0) {
              a.tx = scrollX + rand(RULER + 20, w - 40); a.ty = scrollY + rand(h * 0.25, h * 0.95);
            }
            a.x += (a.tx - a.x) * clamp(dt * 0.0022 * sp, 0, 1);
            a.y += (a.ty - a.y) * clamp(dt * 0.0022 * sp, 0, 1);
          }
        }
        if (t - lastWander > 900) lastWander = t;

        for (let i = ghosts.length - 1; i >= 0; i--) {
          const g = ghosts[i]!, p = (t - g.t0) / 420;
          if (p >= 1) { ghosts.splice(i, 1); continue; }
          drawSelection(ctx, { ...g, x: g.x - scrollX, y: g.y - scrollY }, g.color, 1 - p, false);
        }
        drawRulers(ctx, w, h, bands);

        // Tour: scroll on its own once everything in view is handed out.
        if (tourRef.current) {
          const waiting = next < blocks.length && docRect(blocks[next]!).y <= scrollY + h * 0.92;
          const atEnd = scrollY + h >= document.documentElement.scrollHeight - 2;
          if (!waiting && !atEnd) window.scrollBy({ top: (dt / 16) * 2.4 * sp, behavior: "instant" });
          if (atEnd && next >= blocks.length) setTour(false);
        }

        if (builtCount !== reported) { reported = builtCount; setBuilt(builtCount); }
        if (!ending && next >= blocks.length && agents.every((a) => a.phase === "idle")) {
          ending = true;
          setStatus("Going live");
          setTimeout(end, 700);
        }
      }

      for (const a of agents) drawCursor(ctx, a.x - scrollX, a.y - scrollY, a.color, a.name);
      if (!done) raf = requestAnimationFrame(loop);
    };
    // Start once webfonts are in (labels and the badge use them), but never wait more than 0.6 s.
    void Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 600))]).then(() => {
      if (!done) { last = performance.now(); raf = requestAnimationFrame(loop); }
    });

    // Any manual scroll stops the Tour so it never fights the visitor.
    const stopTour = () => setTour(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      else if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key)) stopTour();
    };
    addEventListener("resize", resize);
    addEventListener("wheel", stopTour, { passive: true });
    addEventListener("touchstart", stopTour, { passive: true });
    addEventListener("keydown", onKey);
    const safety = setTimeout(end, 90000);
    return () => {
      cancelAnimationFrame(raf); clearTimeout(safety);
      removeEventListener("resize", resize); removeEventListener("wheel", stopTour);
      removeEventListener("touchstart", stopTour); removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSound = () => {
    if (!soundRef.current) soundRef.current = new AudioContext();
    if (sound) void soundRef.current.suspend(); else void soundRef.current.resume();
    setSound(!sound);
  };

  const pct = total ? (built / total) * 100 : 0;
  return (
    <>
      <canvas ref={ref} aria-hidden className={`pointer-events-none fixed inset-0 z-[90] h-full w-full transition-opacity duration-500 ${active ? "" : "hidden"}`} />
      {active && (
        <div className="fixed bottom-5 left-1/2 z-[95] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-white/10 bg-[#141417]/95 px-3 py-2 font-mono text-[0.7rem] whitespace-nowrap text-muted-foreground shadow-2xl backdrop-blur">
          <span className="hidden -space-x-1.5 sm:flex" aria-hidden>
            {NAMES.slice(0, 5).map((n, i) => (
              <span key={n} className="grid h-5 w-5 place-items-center rounded-full text-[0.55rem] font-bold text-[#0b0b0d] ring-2 ring-[#141417]" style={{ background: COLORS[i] }}>{n[0]}</span>
            ))}
          </span>
          <span className="hidden md:inline"><b className="text-foreground">{NAMES.length}</b> agents</span>
          <span><b className="text-foreground">{built}</b> / {total} layers</span>
          <span className="hidden h-1 w-20 overflow-hidden rounded bg-white/10 sm:block"><span className="block h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></span>
          <span className="hidden lg:inline">{status}</span>
          <button onClick={() => setTour(!tour)} className={`rounded-md px-2 py-1 ${tour ? "bg-primary/20 text-primary ring-1 ring-primary/50" : "bg-white/10 text-foreground"}`}>{tour ? "Touring" : "Tour"}</button>
          <button onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)} className="rounded-md bg-white/10 px-2 py-1 text-foreground">{speed}x</button>
          <button onClick={toggleSound} className="rounded-md bg-white/10 px-2 py-1 text-foreground">{sound ? "Sound on" : "Tap for sound"}</button>
          <button onClick={() => finish.current()} className="rounded-md bg-primary px-3 py-1 font-bold text-primary-foreground">Go live</button>
          <button onClick={() => finish.current()} aria-label="Skip the build animation" className="px-1 text-foreground">✕</button>
        </div>
      )}
    </>
  );
}
