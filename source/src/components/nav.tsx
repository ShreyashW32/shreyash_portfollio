import { useEffect, useState } from "react";

/** Floating glass navigation pill at the top; the link for the section in view lights up. */
export function NavDock({ items, cv }: { items: (readonly [string, string])[]; cv: string }) {
  const [cur, setCur] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    items.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    // Above the first section (the hero), no link is current.
    const first = document.getElementById(items[0]?.[0] ?? "");
    const onScroll = () => { if (first && first.getBoundingClientRect().top > innerHeight * 0.5) setCur(""); };
    addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); removeEventListener("scroll", onScroll); };
  }, [items]);

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <nav data-build="" aria-label="Main" className="flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-background/75 py-1.5 pr-1.5 pl-2 shadow-2xl backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2 pr-2" aria-label="Shreyash Wetal, back to top">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary font-mono text-[0.7rem] font-bold text-primary-foreground">SW</span>
          <span className="hidden font-mono text-[0.7rem] tracking-[0.2em] sm:inline">SHREYASH<span className="text-primary">.</span></span>
        </a>
        <div className="hidden items-center lg:flex">
          {items.map(([id, label]) => (
            <a key={id} href={`#${id}`}
              className={`rounded-full px-3 py-1.5 text-[0.8rem] transition-colors ${cur === id ? "bg-primary/15 font-semibold text-foreground ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"}`}>
              {label}
            </a>
          ))}
        </div>
        <span className="mx-2 hidden items-center gap-1.5 font-mono text-[0.62rem] text-muted-foreground md:flex" title="Open to AI engineering roles">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-signal" /> Available
        </span>
        <a href={cv} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-3.5 py-1.5 font-mono text-[0.68rem] font-bold tracking-wider text-primary-foreground transition-opacity hover:opacity-90">
          RÉSUMÉ →
        </a>
      </nav>
    </header>
  );
}
