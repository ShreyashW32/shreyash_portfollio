import { useEffect, useState, type ReactNode } from "react";
import portrait from "@/assets/shreyash_portrait.jpg.asset.json";
import { Reveal, Typer } from "@/components/motion";
import { Swarm } from "@/components/swarm";
import { OpArt } from "@/components/opart";
import { NavDock } from "@/components/nav";
import { certs, eva, experience, flagships, impact, links, matrixFilters, projects, publications, skills } from "@/data/profile";

const nav = [["about", "About"], ["flagships", "Flagships"], ["matrix", "Matrix"], ["experience", "Experience"], ["impact", "Impact"], ["skills", "Skills"], ["contact", "Contact"]] as const;

const heroCards = [
  ["01", "Production", "Eva Voice Agent", "AI phone agent for Australian trades, live at heareva.com."],
  ["02", "Research", "Medical Imaging AI", "USyd research: segmentation models, +12% Dice score."],
  ["03", "Industry", "Ex-NVIDIA", "Enterprise prompt frameworks, +22% LLM precision."],
] as const;

const principles = [
  ["Research-grade rigour", "Published work, cross-validated metrics and benchmarks before any claim."],
  ["End-to-end ownership", "From dataset and model to API, interface and deployment, one person accountable."],
  ["Honest AI", "Systems that say what they are, stay inside their brief and leave a record you can check."],
] as const;

function Divider({ n, id }: { n: number; id: string }) {
  return (
    <div data-build="" className="mx-auto flex max-w-7xl items-center gap-4 px-4 font-mono text-[0.62rem] tracking-[0.18em] text-muted-foreground sm:px-6" aria-hidden>
      <span className="whitespace-nowrap">// 0{n}.00 SEC_{id.toUpperCase()}</span>
      <span className="h-px flex-1 bg-white/10" />
      <span className="whitespace-nowrap">INDEX [0{n} / 0{nav.length}]</span>
    </div>
  );
}

function Section({ id, tag, title, sub, children }: { id: string; tag: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-24">
      <div className="mx-auto max-w-7xl">
        <p data-build="" className="section-tag">{tag}</p>
        <Reveal><h2 className="mt-3 text-4xl font-extrabold tracking-tight md:text-6xl">{title}</h2></Reveal>
        {sub && <p data-build="" className="mt-4 max-w-2xl text-muted-foreground md:text-lg">{sub}</p>}
        <Reveal className="mt-12">{children}</Reveal>
      </div>
    </section>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs font-semibold tracking-wider text-foreground transition-colors hover:text-primary">{children} ↗</a>;
}

function EvaCard() {
  const [layer, setLayer] = useState(0);
  const l = eva.layers[layer] ?? eva.layers[0]!;
  return (
    <article data-build="" className="glass relative overflow-hidden p-6 md:p-10">
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span className="badge"><span className="pulse-dot">●</span> {eva.badge}</span>
        <span className="font-mono text-[0.68rem] text-muted-foreground">{eva.meta}</span>
      </div>
      <h3 className="relative mt-6 text-3xl font-extrabold tracking-tight md:text-5xl">{eva.title}</h3>
      <p className="relative mt-4 max-w-3xl text-muted-foreground md:text-lg">{eva.desc}</p>

      <div className="relative mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {eva.metrics.map((m) => (
          <div key={m.l} className="rounded-lg border border-white/10 bg-black/25 p-4 text-center">
            <div className="font-mono text-2xl font-bold text-primary">{m.v}</div>
            <div className="mt-1 text-xs text-muted-foreground">{m.l}</div>
          </div>
        ))}
      </div>

      <div className="relative mt-10 border-t border-white/10 pt-8">
        <p className="font-mono text-xs font-bold tracking-[0.14em]">7-LAYER CALL STACK</p>
        <p className="mt-1 text-xs text-muted-foreground">Click a layer to inspect how it works</p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Eva's call stack">
          {eva.layers.map((x, i) => (
            <button key={x.k} role="tab" aria-selected={i === layer} onClick={() => setLayer(i)}
              className={`rounded-md border px-2.5 py-1.5 font-mono text-[0.68rem] transition-colors ${i === layer ? "border-primary bg-primary text-primary-foreground" : "border-white/12 text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}>
              L{i + 1}: {x.k}
            </button>
          ))}
        </div>
        <div key={layer} role="tabpanel" className="animate-rise mt-4 rounded-xl border border-white/10 bg-black/30 p-5 md:p-6">
          <p className="font-mono text-[0.68rem] tracking-[0.14em] text-primary">LAYER 0{layer + 1} // {l.k.toUpperCase()}</p>
          <h4 className="mt-2 text-xl font-bold">{l.title}</h4>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{l.desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">{l.tags.map((t) => <span key={t} className="chip">{t}</span>)}</div>
        </div>
      </div>

      <div className="relative mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">{eva.stack.map((s) => <span key={s} className="chip text-muted-foreground">{s}</span>)}</div>
        <div className="flex gap-3">
          {eva.links.map((x) => (
            <a key={x.href} href={x.href} target="_blank" rel="noreferrer" className="rounded-md border border-primary/60 px-4 py-2 font-mono text-xs font-bold tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{x.label} ↗</a>
          ))}
        </div>
      </div>
    </article>
  );
}

export function Home() {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = document.documentElement;
    const on = (e: MouseEvent) => { r.style.setProperty("--mx", String(e.clientX / innerWidth - 0.5)); r.style.setProperty("--my", String(e.clientY / innerHeight - 0.5)); };
    addEventListener("mousemove", on);
    return () => removeEventListener("mousemove", on);
  }, []);

  const copyEmail = () => {
    void navigator.clipboard?.writeText(links.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shown = projects.filter((p) => filter === "all" || p.cat === filter);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Swarm />
      <NavDock items={[...nav]} cv={links.cv} />

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-24">
          <div className="swarm-hide absolute inset-0" aria-hidden>
            <div className="grid-bg absolute inset-0 opacity-60" />
            <div className="hero-glow absolute inset-0 animate-glow" />
            <OpArt />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <svg data-build="" className="wordmark block w-full select-none" viewBox="0 0 1000 196" preserveAspectRatio="xMidYMid meet" aria-hidden>
              <text x="0" y="188" fontSize="258" textLength="1000" lengthAdjust="spacingAndGlyphs">PORTFOLIO</text>
            </svg>

            <div className="relative mt-2 grid gap-12 lg:grid-cols-[1.15fr_0.9fr_1fr] lg:items-start">
              <div className="relative z-10 md:-mt-8 lg:-mt-12">
                <p data-build="" className="font-script text-4xl md:text-5xl">Hello, I'm</p>
                <h1 data-build="" className="mt-2 inline-block bg-primary px-3 pt-2 pb-0.5 font-display text-7xl leading-[0.85] text-primary-foreground sm:text-8xl">
                  SHREYASH<span className="text-foreground">.</span>
                </h1>
                <p data-build="" className="mt-6 inline-flex items-center gap-2 border border-white/15 bg-white/[0.03] px-3 py-2 font-mono text-[0.68rem] font-semibold tracking-[0.14em] uppercase">
                  <span className="pulse-dot text-primary">●</span>
                  <Typer words={["AI Engineer // Sydney, AU", "LLM & RAG Systems", "Real-time Voice AI", "Computer Vision Research", "Ex-NVIDIA Prompt Engineer"]} />
                </p>
                <p data-build="" className="mt-6 max-w-xl text-muted-foreground md:text-lg">
                  Building <strong className="text-foreground">LLM & RAG systems</strong>, <strong className="text-foreground">real-time voice agents</strong> and <strong className="text-foreground">computer vision</strong>, from published research to production.
                </p>
                <div data-build="" className="mt-8 flex flex-wrap gap-3">
                  <a href="#contact" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-mono text-xs font-bold tracking-wider text-primary-foreground transition-opacity hover:opacity-90">GET IN TOUCH →</a>
                  <a href="#flagships" className="rounded-md border border-white/15 bg-white/[0.04] px-5 py-3 font-mono text-xs font-bold tracking-wider backdrop-blur transition-colors hover:border-primary hover:text-primary">EXPLORE FLAGSHIPS</a>
                </div>
                <div data-build="" className="mt-10 grid max-w-md grid-cols-3 divide-x divide-white/10 border-y border-white/10">
                  {[["2+", "Years in AI"], ["3", "Papers"], ["941", "Eva tests"]].map(([v, l]) => (
                    <div key={l} className="px-4 py-3 first:pl-0">
                      <div className="font-display text-4xl leading-none text-primary">{v}</div>
                      <div className="mt-1 font-mono text-[0.62rem] tracking-wider text-muted-foreground uppercase">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div data-build="" className="depth-2 relative mx-auto w-full max-w-[21rem] lg:mt-10">
                <div className="relative aspect-[4/5] border border-white/10 bg-card/40 p-4 backdrop-blur-sm">
                  <div className="absolute top-4 right-4 h-[78%] w-[80%] bg-primary" />
                  <img src={portrait.url} alt="Shreyash Wetal" fetchPriority="high"
                    className="fade-bottom relative mt-8 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-cover object-[60%_20%] grayscale contrast-110 transition duration-700 hover:grayscale-0" />
                </div>
                <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 border border-primary/50 bg-background px-3 py-1.5 font-mono text-[0.62rem] font-semibold tracking-[0.14em] whitespace-nowrap uppercase">
                  <span className="pulse-dot text-primary">●</span> Building Eva · Open to roles
                </div>
              </div>

              <div className="relative z-10 space-y-3">
                {heroCards.map(([n, tag, title, desc]) => (
                  <div key={n} data-build="" className="glass glass-hover depth-1 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{n}.</span>
                      <span className="border border-white/15 px-1.5 py-0.5 font-mono text-[0.58rem] tracking-[0.16em] uppercase">{tag}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                ))}
                <div data-build="" className="flex flex-wrap gap-2 pt-1">
                  {["Python", "PyTorch", "TensorFlow", "OpenCV", "FastAPI", "LangChain", "Twilio"].map((t) => <span key={t} className="chip">{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <Divider n={1} id="about" />
        <Section id="about" tag="Engineer profile" title="Background & Philosophy">
          <div className="glass grid gap-10 p-6 md:p-10 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-5 leading-relaxed text-muted-foreground">
              <p>I'm Shreyash Wetal, an AI engineer in Sydney. I'm studying a <strong className="text-foreground">Master of Computer Science (AI & Data Science)</strong> at the University of Sydney, after a <strong className="text-foreground">B.Tech in Information Technology</strong> from PCCOE, Pune.</p>
              <p>I build AI systems for real-world automation, anomaly detection and natural language, from research prototype to production API. My work is research-led, with published papers on non-invasive biometric identification, drone surveillance and traffic control, and I like owning the whole pipeline: <strong className="text-foreground">GenAI workflows, RAG systems, medical-imaging models and real-time voice agents</strong> that people actually use.</p>
              <blockquote className="border-l-2 border-primary pl-5 text-lg text-foreground italic">
                "I build AI that leaves the lab: measured like research, shipped like a product, and honest about what it is."
              </blockquote>
            </div>
            <div>
              <ol className="space-y-6">
                {principles.map(([t, d], i) => (
                  <li key={t} className="flex gap-4">
                    <span className="font-mono text-xs font-bold text-primary">0{i + 1}</span>
                    <div><h3 className="font-bold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
                  </li>
                ))}
              </ol>
              <p className="section-tag mt-10">Education</p>
              <ul className="mt-3 divide-y divide-white/10 border-y border-white/10 text-sm">
                <li className="flex justify-between gap-4 py-3"><span>MCS (AI & Data Science), University of Sydney</span><span className="font-mono text-xs whitespace-nowrap text-muted-foreground">2025-27 · WAM 76.5</span></li>
                <li className="flex justify-between gap-4 py-3"><span>B.Tech Information Technology, PCCOE</span><span className="font-mono text-xs whitespace-nowrap text-muted-foreground">2020-24 · 8.57/10</span></li>
              </ul>
            </div>
          </div>
        </Section>

        <Divider n={2} id="flagships" />
        <Section id="flagships" tag="Architectural showcase" title="Flagship Deployments" sub="Production systems and published research, from live phone calls to satellite imagery.">
          <EvaCard />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {flagships.map((p) => (
              <article key={p.title} data-build="" className="glass glass-hover group flex flex-col overflow-hidden">
                <div className="relative h-40 overflow-hidden border-b border-white/10 bg-muted">
                  <img src={p.img} alt="" loading="lazy" className="h-full w-full object-cover object-left-top opacity-80 grayscale transition duration-700 group-hover:scale-105 group-hover:opacity-100 group-hover:grayscale-0" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span className="badge self-start">{p.badge}</span>
                  <h3 className="mt-4 text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                  <ul className="mt-4 space-y-1.5 text-sm">
                    {p.points.map((pt) => <li key={pt} className="flex gap-2"><span className="text-primary">•</span>{pt}</li>)}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">{p.tags.map((t) => <span key={t} className="chip text-muted-foreground">{t}</span>)}</div>
                  <div className="mt-auto flex gap-4 pt-6">{p.links.map((x) => <ExtLink key={x.href} href={x.href}>{x.label}</ExtLink>)}</div>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Divider n={3} id="matrix" />
        <Section id="matrix" tag="Engineering index" title="The Systems Matrix" sub="Everything else I've built: deep learning, computer vision, research prototypes and tools people use.">
          <div className="mb-8 flex flex-wrap gap-2">
            {matrixFilters.map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`rounded-md border px-3 py-1.5 font-mono text-[0.7rem] transition-colors ${filter === k ? "border-primary bg-primary font-bold text-primary-foreground" : "border-white/12 bg-white/[0.03] text-muted-foreground hover:border-primary/60 hover:text-foreground"}`}>
                {label}{k === "all" ? ` (${projects.length})` : ""}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => {
              const n = String(projects.indexOf(p) + 1).padStart(2, "0");
              return (
                <a key={filter + p.title} href={p.href} target="_blank" rel="noreferrer" className="glass glass-hover animate-rise flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge">{p.tag}</span>
                    <span className="font-mono text-[0.62rem] text-muted-foreground">#SYS-{n} ↗</span>
                  </div>
                  <h3 className="mt-4 text-lg leading-snug font-bold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                  <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4">
                    {p.stack.map((s) => <span key={s} className="chip">{s}</span>)}
                  </div>
                </a>
              );
            })}
          </div>
        </Section>

        <Divider n={4} id="experience" />
        <Section id="experience" tag="Career track" title="Work Experience">
          <div className="space-y-4">
            {experience.map((e) => (
              <div key={e.role} data-build="" className="glass glass-hover grid gap-4 p-6 md:grid-cols-[220px_1fr] md:p-8">
                <div>
                  <p className="font-mono text-xs font-bold text-primary">{e.date}</p>
                  <p className="mt-2 font-bold">{e.org}</p>
                  <p className="text-sm text-muted-foreground">{e.place}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold md:text-2xl">{e.role}</h3>
                  <ul className="mt-3 space-y-2 text-muted-foreground">{e.points.map((pt) => <li key={pt} className="flex gap-3"><span className="text-primary">→</span>{pt}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Divider n={5} id="impact" />
        <Section id="impact" tag="Quantified outcomes" title="Engineering Impact">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {impact.map((i) => (
              <div key={i.l} data-build="" className="glass glass-hover p-6">
                <div className="font-display text-5xl leading-none text-primary">{i.v}</div>
                <h3 className="mt-3 font-bold">{i.l}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{i.d}</p>
              </div>
            ))}
          </div>
          <p className="section-tag mt-16">Publications</p>
          <ul className="glass mt-4 divide-y divide-white/10 px-6">
            {publications.map((p) => (
              <li key={p.title}>
                <a href={p.href} target="_blank" rel="noreferrer" className="flex flex-col justify-between gap-2 py-5 transition-colors hover:text-primary md:flex-row md:items-center">
                  <span className="font-medium md:text-lg">{p.title}</span><span className="font-mono text-xs whitespace-nowrap text-muted-foreground">{p.venue} ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Divider n={6} id="skills" />
        <Section id="skills" tag="Stack" title="Technical Expertise">
          <div className="grid gap-4 md:grid-cols-2">
            {skills.map((s) => (
              <div key={s.group} data-build="" className="glass p-6">
                <h3 className="section-tag">{s.group}</h3>
                <div className="mt-4 flex flex-wrap gap-2">{s.items.map((i) => <span key={i} className="chip px-3 py-1.5 text-[0.75rem]">{i}</span>)}</div>
              </div>
            ))}
          </div>
          <p className="section-tag mt-12">Certifications</p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2">{certs.map((c) => <li key={c} className="flex gap-3 text-muted-foreground"><span className="text-signal">✓</span>{c}</li>)}</ul>
        </Section>

        <Divider n={7} id="contact" />
        <section id="contact" className="scroll-mt-24 px-4 py-20 sm:px-6 md:py-28">
          <div data-build="" className="glass relative mx-auto max-w-3xl overflow-hidden p-8 text-center md:p-14">
            <div className="contact-glow pointer-events-none absolute inset-0" />
            <p className="section-tag relative">Direct connect</p>
            <h2 className="relative mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">Let's Build Something That Ships.</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-muted-foreground">Open to AI engineering roles, research collaborations and voice-AI projects in Australia and remotely.</p>
            <div className="relative mt-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/30 p-1.5 sm:pl-4">
              <span className="font-mono text-sm font-semibold break-all">{links.email}</span>
              <button onClick={copyEmail} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">
                {copied ? "Copied ✓" : "Copy Email Address"}
              </button>
            </div>
            <p className="relative mt-3 font-mono text-xs text-muted-foreground">{links.phone}</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-2">
              {[["github.com/ShreyashW32", links.github], ["LinkedIn", links.linkedin], ["Download CV", links.cv], ["heareva.com", links.eva]].map(([l, h]) => (
                <a key={l} href={h} target="_blank" rel="noreferrer" className="rounded-md border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">{l} ↗</a>
              ))}
            </div>
            <div className="relative mt-12 border-t border-white/10 pt-6 text-xs text-muted-foreground">
              <p>© 2026 Shreyash Wetal · Sydney, AU</p>
              <p className="mt-1">Built with React, Tailwind and hand-drawn canvas effects.</p>
            </div>
          </div>
        </section>
      </main>
      {copied && <div role="status" className="animate-pop fixed bottom-8 left-1/2 z-[80] rounded-lg border border-primary bg-card px-4 py-3 font-mono text-xs text-primary">✓ Email copied to clipboard</div>}
    </div>
  );
}
