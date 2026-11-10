import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import portrait from "@/assets/shreyash_portrait.jpg.asset.json";
import { Particles, Reveal, Typer } from "@/components/motion";
import { Swarm } from "@/components/swarm";
import { OpArt } from "@/components/opart";
import { Dock } from "@/components/dock";
import { certs, experience, impact, links, projects, publications, skills } from "@/data/profile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shreyash Wetal | AI & Computer Vision Engineer" },
      { name: "description", content: "AI engineer in Sydney building LLM, RAG and computer vision systems. Ex-NVIDIA prompt engineer, USyd researcher, 3 published papers." },
      { property: "og:title", content: "Shreyash Wetal | AI & Computer Vision Engineer" },
      { property: "og:description", content: "LLMs, RAG pipelines and real-time computer vision, from research to production." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const nav = [["about", "About"], ["work", "Projects"], ["experience", "Experience"], ["impact", "Impact"], ["skills", "Skills"], ["contact", "Contact"]];

function Section({ id, n, kicker, title, children }: { id: string; n: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 border-t px-6 py-24">
      <div data-build="" className="label-mono flex justify-between text-muted-foreground">
        <span>// {n}.00 SEC_{id.toUpperCase()}</span>
        <span>INDEX [{n} / 06]</span>
      </div>
      <p data-build="" className="label-mono mt-10 text-primary">{kicker}</p>
      <Reveal><h2 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">{title}</h2></Reveal>
      <Reveal className="mt-12">{children}</Reveal>
    </section>
  );
}

function Index() {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = document.documentElement;
    const on = (e: MouseEvent) => { r.style.setProperty("--mx", String(e.clientX / innerWidth - 0.5)); r.style.setProperty("--my", String(e.clientY / innerHeight - 0.5)); };
    addEventListener("mousemove", on);
    return () => removeEventListener("mousemove", on);
  }, []);
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Swarm />
      <Dock items={nav} />
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#top" className="font-mono text-sm font-bold">SW<span className="text-primary">.</span></a>
          <nav className="hidden gap-7 md:flex">
            {nav.map(([id, l]) => <a key={id} href={`#${id}`} className="label-mono text-muted-foreground transition-colors hover:text-foreground">{l}</a>)}
          </nav>
          <a href={links.cv} target="_blank" rel="noreferrer" className="label-mono rounded-md border px-3 py-2 transition-colors hover:border-primary hover:text-primary">Résumé</a>
        </div>
      </header>

      <main id="top">
        <section className="relative">
          <div className="grid-bg absolute inset-0" />
          <div className="hero-glow absolute inset-0 animate-glow" />
          <OpArt />
          <Particles />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-32 pb-20 md:min-h-[85vh] md:grid-cols-[1.3fr_1fr]">
            <div>
              <p data-build="" className="label-mono text-muted-foreground">Portfolio</p>
              <p data-build="" className="mt-6 text-xl text-muted-foreground">Hello, I'm</p>
              <h1 data-build="" className="animate-rise text-6xl font-bold leading-none tracking-tighter sm:text-8xl lg:text-9xl">SHREYASH<span className="text-primary">.</span></h1>
              <p data-build="" className="label-mono mt-6 flex items-center gap-2 text-signal"><span className="pulse-dot">●</span> <Typer words={["AI Engineer // Sydney, AU", "LLM & RAG Systems", "Computer Vision Research", "Ex-NVIDIA Prompt Engineer"]} /></p>
              <p data-build="" className="mt-6 max-w-xl text-lg text-muted-foreground">
                Building <strong className="text-foreground">LLM & RAG systems</strong> and <strong className="text-foreground">real-time computer vision</strong>, from published research to production APIs.
              </p>
              <div data-build="" className="mt-8 flex flex-wrap gap-3">
                <a href="#contact" className="label-mono rounded-md bg-primary px-5 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90">Get in touch</a>
                <a href="#work" className="label-mono rounded-md border px-5 py-3 transition-colors hover:border-primary hover:text-primary">Explore projects</a>
              </div>
              <div data-build="" className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t pt-6">
                {[["2+", "Years AI"], ["3", "Papers"], ["99%", "Blink acc."]].map(([v, l]) => (
                  <div key={l}><div className="text-3xl font-bold">{v}</div><div className="label-mono mt-1 text-muted-foreground">{l}</div></div>
                ))}
              </div>
            </div>
            <div data-build="" className="depth-2 relative mx-auto w-full max-w-sm">
              <div className="scan-line relative aspect-[4/5] overflow-hidden rounded-xl border bg-card animate-float">
                <img src={portrait.url} alt="Shreyash Wetal" className="h-full w-full object-cover object-[60%_20%] grayscale transition duration-700 hover:grayscale-0 hover:scale-105" />
              </div>
              <div className="label-mono absolute -bottom-4 left-4 flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-signal"><span className="pulse-dot">●</span> Open to roles</div>
            </div>
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-px border-y bg-border px-0 md:grid-cols-3">
            {[["01", "Research", "USyd AI Researcher", "Medical imaging models, +12% Dice score."], ["02", "Industry", "Ex-NVIDIA", "Prompt frameworks, +22% LLM precision."], ["03", "Production", "AI Team Lead", "RAG systems, +30% retrieval accuracy."]].map(([n, k, t, d]) => (
              <div key={n} data-build="" className="bg-background p-6"><div className="depth-1">
                <p className="label-mono text-primary">{n}. {k}</p>
                <h3 className="mt-2 text-lg font-bold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div></div>
            ))}
          </div>
<div data-build="" className="relative overflow-hidden border-b py-4">
            <div className="animate-marquee flex w-max gap-10">
              {[...Array(2)].flatMap((_, k) => ["PYTHON", "TENSORFLOW", "LANGCHAIN", "YOLOv8", "OPENCV", "RAG", "LLMs", "ROS", "FASTAPI", "GCP", "FIREBASE", "TRANSFORMERS"].map((t) => (
                <span key={t + k} className="label-mono text-muted-foreground"><span className="text-primary">◆</span> {t}</span>
              )))}
            </div>
          </div>
        </section>

        <Section id="about" n="01" kicker="Engineer profile" title="Background & Philosophy">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-5 text-lg text-muted-foreground">
              <p>I build AI systems for real-world automation, anomaly detection and natural language processing, from research prototype to production API.</p>
              <p>My approach is research-oriented, with published work on non-invasive biometric identification and auto-traffic control. I love designing end-to-end pipelines (GenAI ideation workflows, RAG systems, medical-imaging models) and turning them into products people use.</p>
            </div>
            <ol className="space-y-4">
              {[["Master of Computer Science (AI & Data Science)", "University of Sydney · 2025 - 2027", "Coursework plus AI research in medical imaging. WAM 76.5."], ["B.Tech, Information Technology", "Pimpri Chinchwad College of Engineering · 2020 - 2024", "CGPA 8.57 / 10."]].map(([t, s, d], i) => (
                <li key={t} className="flex gap-5 rounded-lg border bg-card p-5">
                  <span className="font-mono text-primary">0{i + 1}</span>
                  <div><h3 className="font-bold">{t}</h3><p className="label-mono mt-1 text-muted-foreground">{s}</p><p className="mt-2 text-sm text-muted-foreground">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        <Section id="work" n="02" kicker="Architectural showcase" title="Flagship Projects">
          <div className="mb-8 flex flex-wrap gap-2">
            {[["all", "All"], ["llm", "AI / LLM"], ["vision", "Vision"], ["research", "Research"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k ?? "all")} className={`label-mono rounded-full border px-4 py-2 transition-colors ${filter === k ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-primary hover:text-foreground"}`}>{l}</button>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {projects.filter((p) => filter === "all" || p.cat === filter).map((p) => (
              <article key={filter + p.title} className={`animate-rise group flex flex-col overflow-hidden rounded-xl border bg-card transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-glow ${p.flagship ? "md:col-span-2 md:flex-row" : ""}`}>
                <div className={`relative aspect-video shrink-0 overflow-hidden bg-muted ${p.flagship ? "md:aspect-auto md:min-h-80 md:w-1/2" : ""}`}>
                  <img src={p.img} alt={p.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-left-top transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="label-mono text-primary">● {p.tag}</p>
                  <h3 className="mt-3 text-2xl font-bold">{p.title}</h3>
                  <p className="mt-3 text-muted-foreground">{p.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.stack.map((s) => <span key={s} className="rounded border px-2 py-1 font-mono text-xs text-muted-foreground">{s}</span>)}
                  </div>
                  <div className="mt-auto flex gap-4 pt-6">
                    {p.links.length ? p.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="label-mono text-foreground hover:text-primary">{l.label} ↗</a>) : <span className="label-mono text-muted-foreground">Case study on request</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="experience" n="03" kicker="Career track" title="Work Experience">
          <div className="divide-y border-y">
            {experience.map((e) => (
              <div key={e.role} className="grid gap-4 py-8 md:grid-cols-[1fr_2fr]">
                <div><p className="label-mono text-primary">{e.date}</p><p className="mt-2 font-bold">{e.org}</p><p className="text-sm text-muted-foreground">{e.place}</p></div>
                <div><h3 className="text-2xl font-bold">{e.role}</h3>
                  <ul className="mt-3 space-y-2 text-muted-foreground">{e.points.map((pt) => <li key={pt} className="flex gap-3"><span className="text-primary">→</span>{pt}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="impact" n="04" kicker="Quantified outcomes" title="Engineering Impact">
          <div className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {impact.map((i) => (
              <div key={i.l} className="bg-card p-8">
                <div className="text-5xl font-bold text-primary">{i.v}</div>
                <h3 className="mt-3 font-bold">{i.l}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{i.d}</p>
              </div>
            ))}
          </div>
          <h3 className="label-mono mt-16 text-muted-foreground">Publications</h3>
          <ul className="mt-4 divide-y border-y">
            {publications.map((p) => (
              <li key={p.title}><a href={p.href} target="_blank" rel="noreferrer" className="flex flex-col justify-between gap-2 py-5 transition-colors hover:text-primary md:flex-row md:items-center">
                <span className="text-lg font-medium">{p.title}</span><span className="label-mono text-muted-foreground">{p.venue} ↗</span>
              </a></li>
            ))}
          </ul>
        </Section>

        <Section id="skills" n="05" kicker="Stack" title="Technical Expertise">
          <div className="grid gap-6 md:grid-cols-2">
            {skills.map((s) => (
              <div key={s.group} className="rounded-xl border bg-card p-6">
                <h3 className="label-mono text-primary">{s.group}</h3>
                <div className="mt-4 flex flex-wrap gap-2">{s.items.map((i) => <span key={i} className="rounded-md bg-secondary px-3 py-1.5 text-sm">{i}</span>)}</div>
              </div>
            ))}
          </div>
          <h3 className="label-mono mt-12 text-muted-foreground">Certifications</h3>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">{certs.map((c) => <li key={c} className="flex gap-3 text-muted-foreground"><span className="text-signal">✓</span>{c}</li>)}</ul>
        </Section>

        <Section id="contact" n="06" kicker="Initiate dispatch" title="Let's Work Together">
          <p className="max-w-2xl text-lg text-muted-foreground">Always open to cutting-edge AI deployments, research collaborations, or full-time ML engineering roles.</p>
          <button onClick={() => { navigator.clipboard.writeText(links.email); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="mt-10 block break-all text-left text-3xl font-bold tracking-tight transition-colors hover:text-primary md:text-5xl">
            {links.email}
          </button>
          <p className="label-mono mt-3 text-muted-foreground">Click to copy · {links.phone}</p>
          {copied && <div className="animate-pop label-mono fixed bottom-24 left-1/2 z-[80] rounded-lg border border-primary bg-card px-4 py-3 text-primary">✓ Email copied to clipboard</div>}
          <div className="mt-10 flex flex-wrap gap-3">
            {[["GitHub", links.github], ["LinkedIn", links.linkedin], ["Download CV", links.cv]].map(([l, h]) => (
              <a key={l} href={h} target="_blank" rel="noreferrer" className="label-mono rounded-md border px-5 py-3 transition-colors hover:border-primary hover:text-primary">{l} ↗</a>
            ))}
          </div>
        </Section>
      </main>
      <footer className="label-mono border-t px-6 py-8 text-center text-muted-foreground">© Shreyash Wetal · Sydney, AU</footer>
    </div>
  );
}
