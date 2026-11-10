import { useEffect, useState } from "react";

export function Dock({ items }: { items: string[][] }) {
  const [show, setShow] = useState(false);
  const [cur, setCur] = useState("");
  useEffect(() => {
    const on = () => setShow(true);
    addEventListener("swarm:done", on);
    if (!document.documentElement.dataset["swarm"]) setShow(true);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)), { rootMargin: "-45% 0px -50% 0px" });
    items.forEach(([id]) => { const el = id && document.getElementById(id); if (el) io.observe(el); });
    return () => { removeEventListener("swarm:done", on); io.disconnect(); };
  }, [items]);
  if (!show) return null;
  return (
    <nav className="animate-rise fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border bg-card/80 p-1.5 backdrop-blur">
      {items.map(([id, l]) => (
        <a key={id} href={`#${id}`} className={`label-mono rounded-full px-3 py-2 transition-colors ${cur === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</a>
      ))}
    </nav>
  );
}
