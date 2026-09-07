import { useState, useEffect, useRef, useCallback } from "react";

// ── Custom Cursor ──────────────────────────────────────────────────────────────
function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const hovRef = useRef(false);

  useEffect(() => {
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      hovRef.current = !!t.closest("a,button,.drop-card,.artist-card,.product-card,.stat-block,select");
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    const tick = () => {
      if (cursorRef.current) {
        cursorRef.current.style.left = pos.current.x + "px";
        cursorRef.current.style.top = pos.current.y + "px";
        cursorRef.current.className = `cursor${hovRef.current ? " hovered" : ""}`;
      }
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
        ringRef.current.style.opacity = hovRef.current ? "0" : "0.5";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="cursor" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

// ── Scramble Text ─────────────────────────────────────────────────────────────
function ScrambleText({ text, trigger }: { text: string; trigger: boolean }) {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
  const raf = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!trigger) return;
    let i = 0;
    const run = () => {
      setDisplay(text.split("").map((ch, idx) => ch === " " ? " " : idx < i ? ch : chars[Math.floor(Math.random() * chars.length)]).join(""));
      if (i <= text.length) { i += 0.7; raf.current = setTimeout(run, 24); } else setDisplay(text);
    };
    run();
    return () => { if (raf.current) clearTimeout(raf.current); };
  }, [trigger, text]);
  return <>{display}</>;
}

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(targetMs: number) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetMs - Date.now());
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [targetMs]);
  return t;
}

// ── Intersection reveal ───────────────────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  const triggered = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered.current) { triggered.current = true; setV(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ref, v };
}

// ── Counter ───────────────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, v } = useReveal(0.4);
  useEffect(() => {
    if (!v) return;
    let s = 0; const step = to / 50;
    const id = setInterval(() => { s += step; setVal(Math.min(Math.round(s), to)); if (s >= to) clearInterval(id); }, 28);
    return () => clearInterval(id);
  }, [v, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const PAGES = ["HOME", "DROPS", "SHOP", "ARTISTES", "STORIES", "MARSEILLE", "FOR BUSINESS", "ADMIN"];
const NAV_LINKS = ["DROPS", "SHOP", "ARTISTES", "STORIES", "MARSEILLE", "FOR BUSINESS"];

function Nav({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all"
      style={{
        background: scrolled || menuOpen ? "#08080f" : "transparent",
        borderBottom: scrolled || menuOpen ? "1px solid rgba(240,240,240,0.07)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}>
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between" style={{ height: "60px" }}>
        {/* Logo — compact, single line */}
        <button onClick={() => { setPage("HOME"); setMenuOpen(false); }} style={{ cursor: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="font-display font-black" style={{ fontSize: "1.35rem", letterSpacing: "0.16em", color: "#f0f0f0", lineHeight: 1 }}>
            13°<span style={{ color: "#b8ff00" }}>ART</span>
          </span>
          <span className="label hidden sm:block" style={{ fontSize: "0.55rem", letterSpacing: "0.14em", color: "rgba(240,240,240,0.35)", lineHeight: 1 }}>MRS</span>
        </button>

        {/* Desktop nav — 6 links, compact */}
        <div className="hidden xl:flex items-center gap-5">
          {NAV_LINKS.map((p) => (
            <button key={p} onClick={() => { setPage(p); setMenuOpen(false); }}
              className="nav-link" style={{ fontSize: "0.78rem", color: page === p ? "#b8ff00" : "rgba(240,240,240,0.45)", letterSpacing: "0.12em" }}>{p}</button>
          ))}
        </div>

        {/* Right — DROP LIVE + SHOP + admin + hamburger */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#b8ff00", animation: "blink 2s ease infinite" }} />
            <span className="label" style={{ fontSize: "0.6rem", color: "#b8ff00", letterSpacing: "0.16em" }}>DROP LIVE</span>
          </div>
          <button className="btn-acid" style={{ fontSize: "0.75rem", padding: "0.5rem 1.1rem", letterSpacing: "0.1em" }} onClick={() => setPage("SHOP")}>SHOP →</button>
          <button onClick={() => { setPage("ADMIN"); setMenuOpen(false); }}
            style={{ cursor: "none", border: "1px solid rgba(240,240,240,0.15)", padding: "0.35rem 0.65rem", fontSize: "0.6rem", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(240,240,240,0.35)", background: "transparent", transition: "all 0.2s" }}
            title="Back-office">⚙</button>
          <button className="xl:hidden flex flex-col gap-[5px] p-2" onClick={() => setMenuOpen(!menuOpen)} style={{ cursor: "none" }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="h-px transition-all" style={{ width: i === 1 ? "14px" : "20px", background: "#f0f0f0", transformOrigin: "center", transform: menuOpen && i === 0 ? "rotate(45deg) translateY(6px)" : menuOpen && i === 2 ? "rotate(-45deg) translateY(-6px)" : menuOpen && i === 1 ? "scaleX(0)" : "none" }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="xl:hidden overflow-hidden transition-all duration-400" style={{ maxHeight: menuOpen ? "480px" : "0", background: "#08080f", borderTop: menuOpen ? "1px solid rgba(240,240,240,0.06)" : "none" }}>
        <div className="px-6 py-4 flex flex-col gap-0.5">
          {PAGES.map((p) => (
            <button key={p} onClick={() => { setPage(p); setMenuOpen(false); }}
              className="w-full text-left py-2.5 font-display font-black uppercase"
              style={{ fontSize: "1.5rem", color: page === p ? "#b8ff00" : "rgba(240,240,240,0.65)", cursor: "none", letterSpacing: "0.06em", borderBottom: "1px solid rgba(240,240,240,0.04)" }}>{p}</button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// ── Marquee ────────────────────────────────────────────────────────────────────
function Marquee() {
  const r = (arr: string[]) => [...arr, ...arr];
  const row1 = ["DOMINOS EN BÉTON ◆", "ART × MARSEILLE × OBJET ◆", "SÉRIES LIMITÉES ◆", "100 EXEMPLAIRES ◆", "DROP CULTURE ◆", "NUMÉROTÉ & SIGNÉ ◆", "ÉDITION 001 ◆", "OREL × MRS ◆"];
  const row2 = ["STREET ART CHIC ◆", "JEUX & OBJETS ◆", "FOOT LOCKER POC ◆", "BÉTON & TERRAZZO ◆", "MATIÈRE PREMIÈRE ◆", "COLLECTOR ONLY ◆", "13ème ARRONDISSEMENT ◆", "ART BRUT ◆"];
  return (
    <div className="overflow-hidden marquee-wrap" style={{ borderTop: "1px solid rgba(240,240,240,0.07)", borderBottom: "1px solid rgba(240,240,240,0.07)" }}>
      <div className="py-3" style={{ background: "rgba(184,255,0,0.04)" }}>
        <div className="marquee-fwd flex gap-8 whitespace-nowrap w-max">
          {r(row1).map((t, i) => <span key={i} className="font-display text-xl" style={{ fontWeight: 800, letterSpacing: "0.08em", color: "#b8ff00" }}>{t}</span>)}
        </div>
      </div>
      <div className="py-3" style={{ borderTop: "1px solid rgba(240,240,240,0.05)" }}>
        <div className="marquee-rev flex gap-8 whitespace-nowrap w-max">
          {r(row2).map((t, i) => <span key={i} className="font-display text-base" style={{ fontWeight: 700, letterSpacing: "0.1em", color: "rgba(240,240,240,0.22)" }}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

// ── HOME ───────────────────────────────────────────────────────────────────────

function HeroHome({ setPage }: { setPage: (p: string) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [s1, setS1] = useState(false);
  const [s2, setS2] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const t1 = setTimeout(() => { setLoaded(true); setS1(true); }, 250);
    const t2 = setTimeout(() => setS2(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  useEffect(() => {
    const fn = () => {
      const img = heroRef.current?.querySelector("img") as HTMLImageElement;
      if (img) img.style.transform = `scale(1.06) translateY(${window.scrollY * 0.22}px)`;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1604716053460-3f66248bf8de?w=1800&h=1000&fit=crop&auto=format" alt="Street art Marseille" className="w-full h-full object-cover" style={{ filter: "brightness(0.22) saturate(1.4)", transform: "scale(1.06)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,15,0.55) 0%, rgba(8,8,15,0.05) 30%, rgba(8,8,15,0.7) 75%, #08080f 100%)" }} />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full opacity-10" style={{ background: "#6b2fff", filter: "blur(100px)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: "#b8ff00", filter: "blur(80px)" }} />
      </div>

      {/* Drop badge */}
      <div className="absolute top-16 right-6 md:right-16 text-right" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateX(20px)", transition: "all 0.9s ease 1s" }}>
        <div className="font-display font-black text-xs tracking-widest mb-1" style={{ color: "#b8ff00", letterSpacing: "0.25em" }}>DROP 001</div>
        <div className="tag-pill">100 EXEMPLAIRES NUMÉROTÉS</div>
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 md:px-10 pb-20 pt-28">
        <p className="label mb-6" style={{ color: "#b8ff00", opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease 0.3s" }}>
          Art × Marseille × Objet · Éditions limitées
        </p>

        {/* Main headline */}
        <div className="font-display font-black uppercase" style={{ fontSize: "clamp(3.5rem,12vw,11rem)", lineHeight: 0.88, letterSpacing: "-0.01em" }}>
          <div style={{ color: "#f0f0f0", opacity: loaded ? 1 : 0, transition: "opacity 0.7s ease 0.4s" }}>
            <ScrambleText text="DES OBJETS" trigger={s1} />
          </div>
          <div className="glitch" data-text="QUI NE" style={{ color: "#b8ff00" }}>QUI NE</div>
          <div style={{ color: "#f0f0f0", opacity: loaded ? 1 : 0, transition: "opacity 0.7s ease 0.8s" }}>
            <ScrambleText text="DEVRAIENT" trigger={s2} />
          </div>
          <div style={{ WebkitTextStroke: "1px rgba(240,240,240,0.3)", WebkitTextFillColor: "transparent", opacity: loaded ? 1 : 0, transition: "opacity 0.7s ease 1.1s" }}>
            PAS EXISTER.
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4" style={{ opacity: loaded ? 1 : 0, transform: loaded ? "none" : "translateY(24px)", transition: "all 0.8s ease 1s" }}>
          <button className="btn-acid" onClick={() => setPage("DROPS")}>DÉCOUVRIR LE DROP →</button>
          <button className="btn-outline" onClick={() => setPage("SHOP")}>VOIR LA BOUTIQUE</button>
        </div>

        {/* Stats */}
        <div className="mt-16 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6" style={{ borderTop: "1px solid rgba(240,240,240,0.07)", opacity: loaded ? 1 : 0, transition: "opacity 1s ease 1.3s" }}>
          {[{ n: 13, s: "", l: "Objets en catalogue" }, { n: 100, s: "", l: "Exemplaires / Drop" }, { n: 60, s: "%+", l: "Marge brute cible" }, { n: 1, s: "", l: "Proof of Concept FL" }].map(({ n, s, l }) => (
            <div key={l} className="stat-block">
              <div className="font-display font-black" style={{ fontSize: "clamp(2rem,4vw,3rem)", color: "#b8ff00", lineHeight: 1 }}><Counter to={n} suffix={s} /></div>
              <div className="label mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ animation: "float 2.5s ease infinite" }}>
        <div className="label">SCROLL</div>
        <div className="w-px h-8" style={{ background: "linear-gradient(to bottom, #b8ff00, transparent)" }} />
      </div>
    </section>
  );
}

// ── Drop Actuel (home section) ─────────────────────────────────────────────────
function DropActuel({ setPage }: { setPage: (p: string) => void }) {
  const { ref, v } = useReveal();
  const dropMs = useRef(Date.now() + 2 * 86400000 + 14 * 3600000 + 32 * 60000 + 8000).current;
  const { d, h, m, s } = useCountdown(dropMs);
  const [qty] = useState(87);

  return (
    <section ref={ref} className="py-24 max-w-screen-xl mx-auto px-6 md:px-10">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Image */}
        <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateX(-40px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1)" }}>
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
            <img src="https://images.unsplash.com/photo-1722754997162-f211b7311eee?w=900&h=1125&fit=crop&auto=format" alt="Dominos Marseille Édition 001" className="w-full h-full object-cover" />
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(to right, #b8ff00, #6b2fff, #ff2d6b)" }} />
            <div className="absolute top-5 left-5 font-display font-black text-sm px-3 py-1.5 bg-[#08080f] border" style={{ letterSpacing: "0.18em", color: "#b8ff00", borderColor: "rgba(184,255,0,0.3)" }}>
              DROP 001
            </div>
            <div className="absolute bottom-0 inset-x-0 p-6" style={{ background: "linear-gradient(to top, rgba(8,8,15,0.95), transparent)" }}>
              <div className="label mb-1">Artiste</div>
              <div className="font-display font-black text-2xl uppercase" style={{ color: "#f0f0f0" }}>OREL</div>
              <div className="label" style={{ color: "rgba(240,240,240,0.5)" }}>Street Artist · Marseille</div>
            </div>
          </div>

          {/* Progress + price */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-4" style={{ background: "#0f0f1a", border: "1px solid rgba(184,255,0,0.15)" }}>
              <div className="label mb-1">Prix</div>
              <div className="font-display font-black text-4xl" style={{ color: "#b8ff00" }}>189 €</div>
            </div>
            <div className="p-4" style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.06)" }}>
              <div className="label mb-2">Stock</div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(240,240,240,0.1)" }}>
                <div className="h-full" style={{ width: `${(qty / 100) * 100}%`, background: "linear-gradient(to right, #b8ff00, #6b2fff)" }} />
              </div>
              <div className="label mt-2" style={{ color: qty < 20 ? "#ff2d6b" : "#b8ff00" }}>{qty} / 100 DISPONIBLES</div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateX(40px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.15s" }}>
          <p className="label mb-3" style={{ color: "#b8ff00" }}>DROP ACTUEL</p>
          <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 0.9, letterSpacing: "-0.01em" }}>
            DOMINOS<br />
            <span style={{ color: "#b8ff00" }}>MARSEILLE</span><br />
            ÉDITION 001
          </h2>
          <div className="label mt-3" style={{ color: "#6b2fff" }}>100 EXEMPLAIRES NUMÉROTÉS · BÉTON & TERRAZZO</div>

          <p className="mt-6 text-sm leading-relaxed" style={{ color: "rgba(240,240,240,0.6)", maxWidth: "400px" }}>
            Blocs de résine et fragments de pierre locale. Marquages peints à la bombe/graffiti par Orel.
            Esthétique Art Brut brute et épurée. Intergénérationnel. Chaque pièce porte le numéro d'édition
            gravé et le certificat d'authenticité signé.
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            {["Béton & Terrazzo", "Pierre locale", "Marquage bombe", "Signé Orel", "Certificat inclus"].map(t => (
              <span key={t} className="tag-pill">{t}</span>
            ))}
          </div>

          {/* Countdown */}
          <div className="mt-8 p-5" style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)" }}>
            <div className="label mb-4" style={{ color: "#ff2d6b" }}>NEXT DROP · DOMINOS × OREL · REVEAL</div>
            <div className="grid grid-cols-4 gap-0">
              {[{ v: d, l: "JOURS" }, { v: h, l: "HEURES" }, { v: m, l: "MINUTES" }, { v: s, l: "SECONDES" }].map(({ v: val, l }) => (
                <div key={l} className="text-center py-2" style={{ borderRight: "1px solid rgba(240,240,240,0.06)" }}>
                  <div className="cd-digit">{String(val).padStart(2, "0")}</div>
                  <div className="label" style={{ fontSize: "0.55rem" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="btn-acid flex-1 justify-center">ACHETER LA PIÈCE →</button>
            <button className="btn-outline px-4">ME PRÉVENIR</button>
          </div>
          <div className="label mt-3" style={{ color: "rgba(240,240,240,0.2)" }}>
            Livraison 4–6 semaines · Stripe sécurisé · #001–#100 numérotés
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Concept ────────────────────────────────────────────────────────────────────
function Concept() {
  const { ref, v } = useReveal(0.2);
  return (
    <section ref={ref} className="py-24 relative overflow-hidden" style={{ background: "#0a0a14" }}>
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(107,47,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(107,47,255,0.04) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 md:px-10 text-center">
        <p className="label mb-6" style={{ color: "#b8ff00", opacity: v ? 1 : 0, transition: "opacity 0.7s ease" }}>LE CONCEPT</p>
        <h2 className="font-display font-black uppercase mx-auto" style={{ fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 1.0, maxWidth: "700px", opacity: v ? 1 : 0, transform: v ? "none" : "translateY(32px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.1s" }}>
          Nous transformons des objets<br />
          <span style={{ color: "#b8ff00" }}>familiers</span> en pièces que vous<br />
          n'avez <span className="glitch" data-text="JAMAIS" style={{ color: "#ff2d6b" }}>JAMAIS</span> vues.
        </h2>

        {/* Three pillars */}
        <div className="mt-20 max-w-4xl mx-auto">
          {[
            { word: "ART", sub: ["Street art × Art brut", "Inspiration Marseillaise", "Signature artistique"], color: "#b8ff00" },
            { word: "OBJET", sub: ["Utile au quotidien", "Surface d'expression", "Emblèmes locaux"], color: "#6b2fff" },
            { word: "ÉDITION", sub: ["100 exemplaires max", "Numéroté & certifié", "Boucle collection"], color: "#ff2d6b" },
          ].map(({ word, sub, color }, i) => (
            <div key={word} className="flex items-center gap-8 py-8 md:py-10"
              style={{ borderTop: "1px solid rgba(240,240,240,0.06)", opacity: v ? 1 : 0, transform: v ? "none" : "translateX(-32px)", transition: `all 0.9s cubic-bezier(0.16,1,0.3,1) ${0.3 + i * 0.14}s` }}>
              <div className="font-display font-black shrink-0" style={{ fontSize: "clamp(3.5rem,8vw,7rem)", color, lineHeight: 1, width: "clamp(180px, 30vw, 320px)", textAlign: "left" }}>{word}</div>
              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${color}30, transparent)` }} />
              <div className="text-right shrink-0" style={{ minWidth: "160px" }}>
                {sub.map(s => <div key={s} className="label mb-1" style={{ color: "rgba(240,240,240,0.45)" }}>{s}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Artists Slider ─────────────────────────────────────────────────────────────
const ARTISTS = [
  { name: "OREL", city: "MARSEILLE", discipline: "Street Art · Art Brut", drops: 3, bio: "Fondateur et directeur artistique de 13°ART. Artiste street art marseillais, créateur du jeu d'échecs Foot Locker. Son univers fusionne l'architecture, la culture locale et la sculpture urbaine.", color: "#b8ff00", img: "https://images.unsplash.com/photo-1601913463731-cfba9fd31ed3?w=600&h=750&fit=crop&auto=format" },
  { name: "MARCO S.", city: "BERLIN / MRS", discipline: "Peinture · Huile", drops: 2, bio: "Berlinois installé à Marseille depuis 2019. Peintures à l'huile sur lin révélant une géographie intérieure abstraite aux textures organiques brutes.", color: "#6b2fff", img: "https://images.unsplash.com/photo-1556139930-c23fa4a4f934?w=600&h=750&fit=crop&auto=format" },
  { name: "AMARA D.", city: "DAKAR / MRS", discipline: "Sculpture · Céramique", drops: 1, bio: "Sculptrice formée aux Beaux-Arts de Paris. Travaille avec l'atelier Ravel d'Aubagne pour des pièces en céramique émaillée aux teintes méditerranéennes.", color: "#ff2d6b", img: "https://images.unsplash.com/photo-1784653547575-c57e9bd37db5?w=600&h=750&fit=crop&auto=format" },
  { name: "CHEN W.", city: "PARIS / MRS", discipline: "Sérigraphie · Print", drops: 2, bio: "Maître de la sérigraphie urbaine. Ses tirages mêlent typographie brute et codes visuels du quartier. Chaque édition est imprimée à la main en atelier.", color: "#b8ff00", img: "https://images.unsplash.com/photo-1569521597715-0e0c4e22e0e4?w=600&h=750&fit=crop&auto=format" },
];

function ArtistesSlider({ setPage }: { setPage: (p: string) => void }) {
  const { ref, v } = useReveal();
  const [active, setActive] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollLeft += dir * sliderRef.current.offsetWidth / 2;
  };

  return (
    <section ref={ref} className="py-24">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 mb-10 flex items-end justify-between">
        <div>
          <p className="label mb-3">LA COMMUNAUTÉ CRÉATRICE</p>
          <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 0.9 }}>
            LES <span style={{ color: "#ff2d6b" }}>ARTISTES</span>
          </h2>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline px-4 py-2 text-lg" onClick={() => scroll(-1)}>←</button>
          <button className="btn-outline px-4 py-2 text-lg" onClick={() => scroll(1)}>→</button>
        </div>
      </div>

      {/* Horizontal scroll */}
      <div ref={sliderRef} className="flex gap-4 px-6 md:px-10 overflow-x-auto pb-4" style={{ scrollBehavior: "smooth", scrollbarWidth: "none" }}>
        {ARTISTS.map((a, i) => (
          <div key={a.name} className="artist-card shrink-0" style={{ width: "clamp(280px, 35vw, 380px)", opacity: v ? 1 : 0, transform: v ? "none" : "translateY(32px)", transition: `all 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s` }}
            onMouseEnter={() => setActive(i)}>
            <div className="overflow-hidden" style={{ aspectRatio: "3/4" }}>
              <img src={a.img} alt={a.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: "linear-gradient(to top, rgba(8,8,15,0.95) 0%, rgba(8,8,15,0.35) 50%, transparent 100%)" }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: active === i ? a.color : "transparent", transition: "background 0.4s" }} />
              <div className="tag-pill self-start mb-3" style={{ borderColor: a.color, color: a.color }}>{a.drops} DROP{a.drops > 1 ? "S" : ""} · {a.city}</div>
              <h3 className="font-display font-black text-3xl uppercase" style={{ color: "#f0f0f0", lineHeight: 1 }}>{a.name}</h3>
              <p className="label mt-1">{a.discipline}</p>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: "rgba(240,240,240,0.55)", maxHeight: active === i ? "80px" : "0", overflow: "hidden", transition: "max-height 0.5s ease" }}>{a.bio}</p>
              <button className="btn-outline mt-4 self-start text-sm py-2 px-4" style={{ borderColor: a.color, color: a.color, opacity: active === i ? 1 : 0, transform: active === i ? "translateY(0)" : "translateY(8px)", transition: "all 0.4s" }}
                onClick={() => setPage("ARTISTES")}>DÉCOUVRIR L'ARTISTE →</button>
            </div>
            <div className="color-bar" style={{ background: a.color }} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Marseille Section ──────────────────────────────────────────────────────────
function MarseilleSection({ setPage }: { setPage: (p: string) => void }) {
  const { ref, v } = useReveal(0.15);
  const links = ["La ville", "Les quartiers", "Les inspirations", "Les artistes", "Les matériaux", "Les histoires"];

  return (
    <section ref={ref} className="relative overflow-hidden min-h-[85vh] flex items-end">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1692118451637-a17c0ed62875?w=1800&h=1000&fit=crop&auto=format" alt="Marseille vue sur le port" className="w-full h-full object-cover" style={{ filter: "brightness(0.3) saturate(1.2)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,15,0.3) 0%, rgba(8,8,15,0.85) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,8,15,0.7) 0%, transparent 60%)" }} />
      </div>
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 md:px-10 py-20 w-full">
        <p className="label mb-4" style={{ color: "#b8ff00", opacity: v ? 1 : 0, transition: "opacity 0.7s ease" }}>MARSEILLE</p>
        <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,7vw,7rem)", lineHeight: 0.88, letterSpacing: "-0.01em", opacity: v ? 1 : 0, transform: v ? "none" : "translateY(40px)", transition: "all 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s" }}>
          MARSEILLE<br />EST NOTRE<br /><span style={{ color: "#b8ff00" }}>MATIÈRE</span><br />PREMIÈRE.
        </h2>
        <p className="mt-6 text-sm leading-relaxed" style={{ maxWidth: "480px", color: "rgba(240,240,240,0.6)", opacity: v ? 1 : 0, transition: "opacity 0.9s ease 0.4s" }}>
          Du Panier à la Joliette, du Vieux-Port aux Calanques — chaque matière, chaque texture,
          chaque référence culturelle naît ici. Marseille n'est pas un décor. C'est notre source.
        </p>
        <div className="flex flex-wrap gap-3 mt-8" style={{ opacity: v ? 1 : 0, transition: "opacity 0.9s ease 0.6s" }}>
          {links.map((l) => (
            <button key={l} className="tag-pill transition-all" style={{ cursor: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#b8ff00"; (e.currentTarget as HTMLElement).style.color = "#b8ff00"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; (e.currentTarget as HTMLElement).style.color = ""; }}
              onClick={() => setPage("MARSEILLE")}>{l}</button>
          ))}
        </div>
        <div className="mt-8" style={{ opacity: v ? 1 : 0, transition: "opacity 1s ease 0.8s" }}>
          <button className="btn-acid" onClick={() => setPage("MARSEILLE")}>EXPLORER LA VILLE →</button>
        </div>
      </div>
    </section>
  );
}

// ── Dernières Créations (products grid) ────────────────────────────────────────
const PRODUCTS = [
  { id: "001", name: "DOMINOS MARSEILLE", cat: "JEUX & COMPTOIR", artist: "OREL", edition: "034 / 100", price: "189 €", status: "available", color: "#b8ff00", img: "https://images.unsplash.com/photo-1573027167082-4a567857689b?w=600&h=800&fit=crop&auto=format" },
  { id: "POC", name: "ÉCHECS MARSEILLE", cat: "JEUX · FOOT LOCKER", artist: "OREL", edition: "SOLD OUT", price: "320 €", status: "soldout", color: "#ff2d6b", img: "https://images.unsplash.com/photo-1710131991542-abec46c42b34?w=600&h=800&fit=crop&auto=format" },
  { id: "002", name: "JENGA ARCHITECTURAL", cat: "JEUX & ARCHI", artist: "OREL", edition: "COMING SOON", price: "249 €", status: "soon", color: "#6b2fff", img: "https://images.unsplash.com/photo-1726013869898-0782fa5ef0b1?w=600&h=800&fit=crop&auto=format" },
  { id: "003", name: "DOCK 'LE GACHON'", cat: "TECH & NOSTALGIE", artist: "MARCO S.", edition: "012 / 50", price: "390 €", status: "low", color: "#b8ff00", img: "https://images.unsplash.com/photo-1604012164867-ed735c0c0a5f?w=600&h=800&fit=crop&auto=format" },
  { id: "004", name: "ENCEINTE BÉTON", cat: "TECH & VINTAGE", artist: "AMARA D.", edition: "007 / 30", price: "580 €", status: "low", color: "#ff2d6b", img: "https://images.unsplash.com/photo-1624545481411-b8daf3aa427d?w=600&h=800&fit=crop&auto=format" },
  { id: "005", name: "DIFFUSEUR TOTEM", cat: "QUOTIDIEN", artist: "AMARA D.", edition: "COMING SOON", price: "220 €", status: "soon", color: "#6b2fff", img: "https://images.unsplash.com/photo-1751564360748-3b5652060a7e?w=600&h=800&fit=crop&auto=format" },
];

function DernieresCreations({ setPage }: { setPage: (p: string) => void }) {
  const { ref, v } = useReveal();
  return (
    <section ref={ref} className="py-24 px-6 md:px-10 max-w-screen-xl mx-auto">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="label mb-3">DERNIÈRES CRÉATIONS</p>
          <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 0.9 }}>
            LA <span style={{ color: "#6b2fff" }}>COLLECTION</span>
          </h2>
        </div>
        <button className="btn-outline hidden md:flex" onClick={() => setPage("SHOP")}>VOIR TOUT →</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PRODUCTS.map((p, i) => (
          <div key={p.id} className="product-card drop-card" style={{ aspectRatio: "3/4", opacity: v ? 1 : 0, transform: v ? "none" : "translateY(40px)", transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s` }}>
            <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
            <div className="overlay" />
            <div className="tag" style={{ background: p.status === "soldout" ? "#ff2d6b" : p.status === "soon" ? "#6b2fff" : "#b8ff00", color: "#08080f" }}>
              {p.status === "soldout" ? "SOLD OUT" : p.status === "soon" ? "SOON" : `#${p.id}`}
            </div>
            <div className="info">
              <div className="label mb-1" style={{ color: "rgba(240,240,240,0.5)" }}>{p.cat}</div>
              <h3 className="font-display font-black uppercase text-xl leading-none" style={{ color: "#f0f0f0" }}>{p.name}</h3>
              <p className="label mt-1">{p.artist}</p>
              <div className="reveal-btn mt-3 flex items-center justify-between">
                <span className="label">{p.edition}</span>
                <span className="font-display font-black text-xl" style={{ color: p.color }}>{p.price}</span>
              </div>
            </div>
            <div className="color-bar" style={{ background: p.color }} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Collector Loop ─────────────────────────────────────────────────────────────
function CollectorLoop() {
  const { ref, v } = useReveal(0.2);
  const steps = [
    { label: "DROP", desc: "Édition annoncée", color: "#b8ff00" },
    { label: "ACHAT", desc: "Pièce numérotée", color: "#6b2fff" },
    { label: "COLLECTION", desc: "Compte collector", color: "#ff2d6b" },
    { label: "EARLY ACCESS", desc: "24h avant tout le monde", color: "#b8ff00" },
    { label: "NEXT DROP", desc: "Boucle perpétuelle", color: "#6b2fff" },
  ];
  return (
    <section ref={ref} className="py-24 px-6 md:px-10 overflow-hidden" style={{ background: "#0a0a14" }}>
      <div className="max-w-screen-xl mx-auto text-center">
        <p className="label mb-4" style={{ color: "#b8ff00" }}>LA SIGNATURE DE LA PLATEFORME</p>
        <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9, opacity: v ? 1 : 0, transform: v ? "none" : "translateY(32px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1)" }}>
          THE DROP EXPERIENCE
        </h2>
        <p className="mt-4 text-sm" style={{ color: "rgba(240,240,240,0.5)", opacity: v ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}>
          L'écosystème de collection qui transforme le site en plateforme.
        </p>

        <div className="flex flex-wrap justify-center items-center gap-0 mt-16">
          {steps.map(({ label, desc, color }, i) => (
            <div key={label} className="flex items-center">
              <div className="text-center" style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(32px)", transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto flex items-center justify-center border-2" style={{ borderColor: color, background: "rgba(8,8,15,0.8)" }}>
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                </div>
                <div className="font-display font-black text-sm mt-3 uppercase tracking-wider" style={{ color }}>{label}</div>
                <div className="label mt-1" style={{ color: "rgba(240,240,240,0.4)", fontSize: "0.6rem" }}>{desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 md:w-16 h-px mx-1" style={{ background: `linear-gradient(to right, ${color}, ${steps[i + 1].color})`, opacity: v ? 1 : 0, transition: `opacity 0.6s ease ${0.4 + i * 0.1}s` }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Newsletter ─────────────────────────────────────────────────────────────────
function Newsletter() {
  const { ref, v } = useReveal();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section ref={ref} className="py-24 px-6 md:px-10">
      <div className="max-w-screen-xl mx-auto">
        <div className="relative overflow-hidden p-10 md:p-16" style={{ background: "#0f0f1a", border: "1px solid rgba(107,47,255,0.2)" }}>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(to right, #b8ff00, #6b2fff, #ff2d6b)" }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full" style={{ background: "#b8ff00", opacity: 0.05, filter: "blur(80px)" }} />

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(24px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1)" }}>
              <p className="label mb-3" style={{ color: "#b8ff00" }}>NEWSLETTER</p>
              <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 0.9 }}>
                ENTREZ<br />DANS LE<br /><span style={{ color: "#b8ff00" }}>CERCLE.</span>
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {["Avant-premières", "Invitations", "Nouveaux Drops", "Collaborations", "Événements", "Éditions limitées"].map(b => (
                  <div key={b} className="flex items-center gap-2">
                    <span className="text-[#b8ff00] text-xs">◆</span>
                    <span className="label">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateX(24px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.2s" }}>
              {sent ? (
                <div className="py-12 text-center">
                  <div className="font-display font-black text-6xl uppercase" style={{ color: "#b8ff00" }}>BIENVENUE.</div>
                  <p className="label mt-3" style={{ color: "rgba(240,240,240,0.4)" }}>Vous faites maintenant partie du cercle.</p>
                </div>
              ) : (
                <>
                  <label className="label block mb-3">VOTRE EMAIL</label>
                  <input className="input-field text-lg" type="email" placeholder="collector@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <button className="btn-acid w-full justify-center mt-6 text-base" onClick={() => email && setSent(true)}>
                    REJOINDRE LE CERCLE →
                  </button>
                  <p className="label mt-4" style={{ color: "rgba(240,240,240,0.2)" }}>Zéro spam · RGPD · Désabonnement immédiat</p>
                </>
              )}

              <div className="mt-8 p-5" style={{ background: "rgba(8,8,15,0.6)", borderLeft: "2px solid #6b2fff" }}>
                <p className="label mb-1" style={{ color: "#6b2fff" }}>AVANTAGE COLLECTOR</p>
                <p className="font-display font-black text-xl uppercase" style={{ color: "#f0f0f0" }}>EARLY ACCESS — 24H AVANT LE PUBLIC</p>
                <p className="text-xs mt-2" style={{ color: "rgba(240,240,240,0.5)" }}>Les membres accèdent aux Drops avant l'ouverture générale. Drop 001 : Collectors 18h00 · Public 20h00.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SHOP Page ──────────────────────────────────────────────────────────────────
const SHOP_PRODUCTS = [
  ...PRODUCTS,
  { id: "006", name: "CLAVIER ARTY", cat: "TECH & BUREAU", artist: "OREL", edition: "COMING SOON", price: "450 €", status: "soon", color: "#b8ff00", img: "https://images.unsplash.com/photo-1604926247748-b0726e502253?w=600&h=800&fit=crop&auto=format" },
  { id: "007", name: "DAMES RAP MRS", cat: "JEUX · PLANÈTE RAP", artist: "OREL", edition: "COMING SOON", price: "289 €", status: "soon", color: "#6b2fff", img: "https://images.unsplash.com/photo-1596517335913-66b7be20c921?w=600&h=800&fit=crop&auto=format" },
  { id: "008", name: "MORPION BÉTON", cat: "JEUX · COMPTOIR", artist: "AMARA D.", edition: "COMING SOON", price: "149 €", status: "soon", color: "#ff2d6b", img: "https://images.unsplash.com/photo-1626140321481-437bc23ce772?w=600&h=800&fit=crop&auto=format" },
];

const UNIVERS = ["Tous", "Jeux", "Tech", "Maison", "Collection"];
const DISPOS = ["Tous", "Disponible", "Coming Soon", "Sold Out"];

type CartItem = { id: string; name: string; price: string; edition: string; img: string; color: string; qty: number };

function ShopPage() {
  const [univers, setUnivers] = useState("Tous");
  const [dispo, setDispo] = useState("Tous");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [detail, setDetail] = useState<typeof SHOP_PRODUCTS[0] | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderDone, setOrderDone] = useState(false);
  const [cform, setCform] = useState({ nom: "", email: "", adresse: "", ville: "", cp: "", pays: "France", card: "", exp: "", cvv: "" });

  const total = cart.reduce((s, i) => s + i.qty * Number(i.price.replace(/[^0-9]/g, "")), 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: typeof SHOP_PRODUCTS[0]) => {
    setCart(c => {
      const ex = c.find(i => i.id === p.id);
      if (ex) return c.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { id: p.id, name: p.name, price: p.price, edition: p.edition, img: p.img, color: p.color, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(c => c.filter(i => i.id !== id));
  const toggleWishlist = (id: string) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);

  const filtered = SHOP_PRODUCTS.filter(p => {
    const uMatch = univers === "Tous" || p.cat.toLowerCase().includes(univers.toLowerCase());
    const dMatch = dispo === "Tous" || (dispo === "Disponible" && p.status === "available") || (dispo === "Coming Soon" && p.status === "soon") || (dispo === "Sold Out" && p.status === "soldout");
    return uMatch && dMatch;
  });

  const cartInCart = (id: string) => cart.some(i => i.id === id);

  return (
    <div className="pt-20 min-h-screen">
      {/* Header */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12 flex items-end justify-between">
        <div>
          <p className="label mb-3" style={{ color: "#b8ff00" }}>BOUTIQUE</p>
          <h1 className="font-display font-black uppercase" style={{ fontSize: "clamp(3rem,8vw,7rem)", lineHeight: 0.88 }}>
            SHOP<br /><span style={{ color: "#b8ff00" }}>13°ART</span>
          </h1>
        </div>
        <button onClick={() => setCartOpen(true)} style={{ position: "relative", background: "#0f0f1a", border: "1px solid rgba(184,255,0,0.2)", padding: "0.75rem 1.25rem", cursor: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="font-display font-black text-lg" style={{ color: "#f0f0f0" }}>PANIER</span>
          {cartCount > 0 && <span style={{ background: "#b8ff00", color: "#08080f", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>{cartCount}</span>}
        </button>
      </div>

      {/* Wishlist bar */}
      {wishlist.length > 0 && (
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 mb-4">
          <div style={{ background: "#0f0f1a", border: "1px solid rgba(107,47,255,0.2)", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ color: "#6b2fff", fontSize: "0.7rem", letterSpacing: "0.15em", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>WISHLIST · {wishlist.length} PIÈCE{wishlist.length > 1 ? "S" : ""}</span>
            {SHOP_PRODUCTS.filter(p => wishlist.includes(p.id)).map(p => (
              <span key={p.id} className="font-display font-black text-sm" style={{ color: "rgba(240,240,240,0.6)" }}>{p.name}</span>
            ))}
            <button onClick={() => setWishlist([])} style={{ marginLeft: "auto", cursor: "none", color: "rgba(240,240,240,0.3)", fontSize: "0.75rem", background: "none", border: "none" }}>VIDER</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="sticky top-[60px] z-40 px-6 md:px-10 py-3" style={{ background: "#08080f", borderBottom: "1px solid rgba(240,240,240,0.06)" }}>
        <div className="max-w-screen-xl mx-auto flex flex-wrap gap-6 items-center">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="label mr-1">UNIVERS</span>
            {UNIVERS.map(u => <button key={u} onClick={() => setUnivers(u)} className="tag-pill transition-all" style={{ borderColor: univers === u ? "#b8ff00" : "rgba(240,240,240,0.15)", color: univers === u ? "#b8ff00" : "rgba(240,240,240,0.4)", cursor: "none" }}>{u}</button>)}
          </div>
          <div className="flex flex-wrap gap-2 items-center md:ml-8">
            <span className="label mr-1">DISPO</span>
            {DISPOS.map(d => <button key={d} onClick={() => setDispo(d)} className="tag-pill transition-all" style={{ borderColor: dispo === d ? "#ff2d6b" : "rgba(240,240,240,0.15)", color: dispo === d ? "#ff2d6b" : "rgba(240,240,240,0.4)", cursor: "none" }}>{d}</button>)}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24"><div className="font-display font-black text-4xl uppercase" style={{ color: "rgba(240,240,240,0.15)" }}>Aucun résultat</div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <div key={p.id} className="product-card drop-card" style={{ aspectRatio: "3/4" }}>
                <img src={p.img} alt={p.name} className="w-full h-full object-cover" onClick={() => setDetail(p)} style={{ cursor: "none" }} />
                <div className="overlay" onClick={() => setDetail(p)} style={{ cursor: "none" }} />
                <div className="tag" style={{ background: p.status === "soldout" ? "#ff2d6b" : p.status === "soon" ? "#6b2fff" : "#b8ff00", color: "#08080f" }}>
                  {p.status === "soldout" ? "SOLD OUT" : p.status === "soon" ? "SOON" : `Nº${p.id}`}
                </div>
                {/* Wishlist */}
                <button onClick={() => toggleWishlist(p.id)} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", cursor: "none", background: "rgba(8,8,15,0.7)", border: "none", color: wishlist.includes(p.id) ? "#ff2d6b" : "rgba(240,240,240,0.5)", fontSize: "1rem", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
                  {wishlist.includes(p.id) ? "♥" : "♡"}
                </button>
                <div className="info">
                  <div className="label mb-1" style={{ color: "rgba(240,240,240,0.5)", fontSize: "0.6rem" }}>{p.cat}</div>
                  <h3 className="font-display font-black uppercase text-lg leading-none" style={{ color: "#f0f0f0", cursor: "none" }} onClick={() => setDetail(p)}>{p.name}</h3>
                  <p className="label mt-1">{p.artist}</p>
                  <div className="reveal-btn mt-3 flex items-center justify-between">
                    <span className="label">{p.edition}</span>
                    <span className="font-display font-black text-lg" style={{ color: p.color }}>{p.price}</span>
                  </div>
                  {p.status === "available" && (
                    <button className="btn-acid w-full justify-center mt-3 text-xs py-2" onClick={() => addToCart(p)}>
                      {cartInCart(p.id) ? "✓ DANS LE PANIER" : "ACQUÉRIR →"}
                    </button>
                  )}
                  {p.status === "soon" && (
                    <button className="btn-outline w-full justify-center mt-3 text-xs py-2">ME PRÉVENIR</button>
                  )}
                </div>
                <div className="color-bar" style={{ background: p.color }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ""} wide>
        {detail && (
          <div className="grid md:grid-cols-2 gap-8">
            <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
              <img src={detail.img} alt={detail.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="label mb-2" style={{ color: detail.color }}>{detail.cat}</div>
              <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 0.9, color: "#f0f0f0" }}>{detail.name}</h2>
              <p className="label mt-2 mb-6">{detail.artist} · {detail.edition}</p>
              <div className="font-display font-black text-5xl mb-6" style={{ color: detail.color }}>{detail.price}</div>
              <div className="flex flex-wrap gap-2 mb-6">
                {["Béton & Terrazzo", "Numéroté", "Signé", "Certificat inclus"].map(t => <span key={t} className="tag-pill">{t}</span>)}
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,240,240,0.6)" }}>
                Pièce d'art en édition limitée, numérotée et signée par l'artiste. Chaque exemplaire est unique et accompagné de son certificat d'authenticité.
              </p>
              {detail.status === "available" ? (
                <div className="flex gap-3">
                  <button className="btn-acid flex-1 justify-center" onClick={() => { addToCart(detail); setDetail(null); }}>AJOUTER AU PANIER →</button>
                  <button onClick={() => toggleWishlist(detail.id)} className="btn-outline px-4" style={{ color: wishlist.includes(detail.id) ? "#ff2d6b" : undefined, borderColor: wishlist.includes(detail.id) ? "#ff2d6b" : undefined }}>
                    {wishlist.includes(detail.id) ? "♥" : "♡"}
                  </button>
                </div>
              ) : detail.status === "soon" ? (
                <button className="btn-outline w-full justify-center">ME PRÉVENIR À L'OUVERTURE</button>
              ) : (
                <div style={{ border: "1px solid rgba(255,45,107,0.3)", padding: "1rem", textAlign: "center" }}>
                  <span className="font-display font-black" style={{ color: "#ff2d6b" }}>SOLD OUT</span>
                  <p className="label mt-1">Rejoindre la waitlist pour un retour en stock</p>
                  <button className="btn-outline w-full justify-center mt-3 text-sm">REJOINDRE LA WAITLIST</button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9980 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(460px, 100vw)", background: "#0d0d1c", borderLeft: "1px solid rgba(184,255,0,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(240,240,240,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="font-display font-black text-xl" style={{ letterSpacing: "0.1em" }}>PANIER · {cartCount}</span>
              <button onClick={() => setCartOpen(false)} style={{ cursor: "none", background: "none", border: "none", color: "rgba(240,240,240,0.4)", fontSize: "1.2rem" }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="font-display font-black text-2xl" style={{ color: "rgba(240,240,240,0.2)" }}>VOTRE PANIER EST VIDE</div>
                  <p className="label mt-3">Découvrez nos éditions limitées</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid rgba(240,240,240,0.06)" }}>
                  <img src={item.img} alt={item.name} style={{ width: 72, height: 90, objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="font-display font-black text-base uppercase" style={{ color: "#f0f0f0", lineHeight: 1 }}>{item.name}</div>
                    <div className="label mt-1">{item.edition}</div>
                    <div className="font-display font-black text-lg mt-2" style={{ color: item.color }}>{item.price}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => setCart(c => c.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))} style={{ cursor: "none", background: "rgba(240,240,240,0.1)", border: "none", color: "#f0f0f0", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span className="font-mono text-sm">{item.qty}</span>
                      <button onClick={() => setCart(c => c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))} style={{ cursor: "none", background: "rgba(240,240,240,0.1)", border: "none", color: "#f0f0f0", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ cursor: "none", marginLeft: "auto", background: "none", border: "none", color: "rgba(255,45,107,0.6)", fontSize: "0.75rem", letterSpacing: "0.1em" }}>RETIRER</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid rgba(240,240,240,0.07)" }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="label">TOTAL</span>
                  <span className="font-display font-black text-2xl" style={{ color: "#b8ff00" }}>{total} €</span>
                </div>
                <p className="label mb-4" style={{ color: "rgba(240,240,240,0.25)", fontSize: "0.55rem" }}>Livraison 4–6 semaines · Stripe sécurisé · Éditions numérotées</p>
                <button className="btn-acid w-full justify-center" onClick={() => { setCartOpen(false); setCheckout(true); setCheckoutStep(1); }}>COMMANDER →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      <Modal open={checkout && !orderDone} onClose={() => setCheckout(false)} title={`CHECKOUT — ÉTAPE ${checkoutStep}/3`} wide>
        {checkoutStep === 1 && (
          <div>
            <div className="label mb-6" style={{ color: "#b8ff00" }}>01 · VOS INFORMATIONS</div>
            <div className="grid md:grid-cols-2 gap-x-6">
              <Field label="NOM COMPLET" value={cform.nom} onChange={v => setCform(f => ({ ...f, nom: v }))} />
              <Field label="EMAIL" value={cform.email} onChange={v => setCform(f => ({ ...f, email: v }))} type="email" />
              <Field label="ADRESSE" value={cform.adresse} onChange={v => setCform(f => ({ ...f, adresse: v }))} />
              <Field label="VILLE" value={cform.ville} onChange={v => setCform(f => ({ ...f, ville: v }))} />
              <Field label="CODE POSTAL" value={cform.cp} onChange={v => setCform(f => ({ ...f, cp: v }))} />
              <Field label="PAYS" value={cform.pays} onChange={v => setCform(f => ({ ...f, pays: v }))} options={["France", "Belgique", "Suisse", "Luxembourg", "Autre"]} />
            </div>
            <button className="btn-acid w-full justify-center mt-4" onClick={() => setCheckoutStep(2)}>LIVRAISON →</button>
          </div>
        )}
        {checkoutStep === 2 && (
          <div>
            <div className="label mb-6" style={{ color: "#b8ff00" }}>02 · LIVRAISON</div>
            {[{ l: "Standard 4–6 semaines", p: "Gratuit", d: "Colissimo suivi" }, { l: "Express 2–3 semaines", p: "29 €", d: "DHL Express" }, { l: "Click & Collect Marseille", p: "Gratuit", d: "Retrait sur RDV" }].map(opt => (
              <div key={opt.l} style={{ border: "1px solid rgba(240,240,240,0.1)", padding: "1rem", marginBottom: "0.75rem", cursor: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => {}}>
                <div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{opt.l}</div>
                  <div className="label mt-0.5">{opt.d}</div>
                </div>
                <div className="font-display font-black text-lg" style={{ color: "#b8ff00" }}>{opt.p}</div>
              </div>
            ))}
            <div className="flex gap-3 mt-6">
              <button className="btn-outline flex-1 justify-center" onClick={() => setCheckoutStep(1)}>← RETOUR</button>
              <button className="btn-acid flex-1 justify-center" onClick={() => setCheckoutStep(3)}>PAIEMENT →</button>
            </div>
          </div>
        )}
        {checkoutStep === 3 && (
          <div>
            <div className="label mb-6" style={{ color: "#b8ff00" }}>03 · PAIEMENT</div>
            <div className="flex gap-3 mb-6">
              {["Carte", "Apple Pay", "Google Pay"].map(m => (
                <div key={m} style={{ flex: 1, border: "1px solid rgba(184,255,0,0.2)", padding: "0.75rem", textAlign: "center", cursor: "none" }}>
                  <span className="font-mono text-xs" style={{ color: "#b8ff00" }}>{m}</span>
                </div>
              ))}
            </div>
            <Field label="NUMÉRO DE CARTE" value={cform.card} onChange={v => setCform(f => ({ ...f, card: v }))} placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="DATE D'EXPIRATION" value={cform.exp} onChange={v => setCform(f => ({ ...f, exp: v }))} placeholder="MM/AA" />
              <Field label="CVV" value={cform.cvv} onChange={v => setCform(f => ({ ...f, cvv: v }))} />
            </div>
            <div style={{ background: "#0a0a14", border: "1px solid rgba(240,240,240,0.07)", padding: "1rem", marginBottom: "1.5rem" }}>
              <div className="flex justify-between mb-2">
                <span className="label">SOUS-TOTAL</span>
                <span className="font-mono text-sm">{total} €</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="label">LIVRAISON</span>
                <span className="font-mono text-sm">Gratuit</span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: "1px solid rgba(240,240,240,0.07)" }}>
                <span className="font-display font-black text-lg">TOTAL</span>
                <span className="font-display font-black text-xl" style={{ color: "#b8ff00" }}>{total} €</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1 justify-center" onClick={() => setCheckoutStep(2)}>← RETOUR</button>
              <button className="btn-acid flex-1 justify-center" onClick={() => { setOrderDone(true); setCart([]); }}>CONFIRMER L'ACHAT →</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Confirmation */}
      <Modal open={orderDone} onClose={() => { setOrderDone(false); setCheckout(false); }} title="COMMANDE CONFIRMÉE">
        <div className="text-center py-8">
          <div className="font-display font-black" style={{ fontSize: "clamp(2.5rem,6vw,4rem)", color: "#b8ff00", lineHeight: 1 }}>YOU GOT IT.</div>
          <div className="font-display font-black text-2xl uppercase mt-4" style={{ color: "#f0f0f0" }}>BIENVENUE DANS LA COLLECTION.</div>
          <div className="font-mono text-5xl mt-6" style={{ color: "#6b2fff" }}>#034 / 100</div>
          <p className="label mt-4" style={{ color: "rgba(240,240,240,0.4)" }}>Votre numéro d'édition vous sera attribué sous 24h · Certificat digital envoyé par email</p>
          <div className="flex flex-col gap-3 mt-8">
            <button className="btn-acid w-full justify-center">MON CERTIFICAT DIGITAL →</button>
            <button className="btn-outline w-full justify-center">VOIR MA COLLECTION</button>
            <button className="btn-outline w-full justify-center">PARTAGER · I OWN #034/100</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── FOR BUSINESS Page ──────────────────────────────────────────────────────────
function ForBusinessPage() {
  const { ref: h1ref, v: hv } = useReveal();
  const { ref: pocRef, v: pocV } = useReveal();
  const { ref: formRef, v: formV } = useReveal();
  const [form, setForm] = useState({ nom: "", secteur: "", site: "", type: "", quantite: "", budget: "", date: "", desc: "" });
  const [sent, setSent] = useState(false);

  const parcours = ["DEMANDE", "QUALIFICATION", "DIRECTION ARTISTIQUE", "PROPOSITION", "MAQUETTE / PROTOTYPE", "VALIDATION", "PRODUCTION", "LIVRAISON"];

  return (
    <div className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-end" ref={h1ref}>
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1670234025697-84080c3fdb08?w=1800&h=1000&fit=crop&auto=format" alt="Jeu d'échecs Marseille" className="w-full h-full object-cover" style={{ filter: "brightness(0.25) saturate(1.2)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,15,0.4) 0%, rgba(8,8,15,0.9) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto px-6 md:px-10 py-20 w-full">
          <p className="label mb-6" style={{ color: "#b8ff00", opacity: hv ? 1 : 0, transition: "opacity 0.7s ease" }}>FOR BUSINESS · B2B</p>
          <h1 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,7vw,6.5rem)", lineHeight: 0.88, letterSpacing: "-0.01em", opacity: hv ? 1 : 0, transform: hv ? "none" : "translateY(40px)", transition: "all 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s" }}>
            VOTRE PROCHAIN<br />
            CADEAU D'ENTREPRISE<br />
            NE DEVRAIT PAS<br />
            <span style={{ color: "#b8ff00" }}>ÊTRE UN CADEAU</span><br />
            D'ENTREPRISE.
          </h1>
          <p className="mt-8 text-base leading-relaxed" style={{ maxWidth: "560px", color: "rgba(240,240,240,0.65)", opacity: hv ? 1 : 0, transition: "opacity 0.9s ease 0.6s" }}>
            Nous créons des objets d'art en séries limitées pour les marques, entreprises et institutions.
            Chaque pièce est une œuvre utile et haut de gamme conçue par un artiste marseillais — en rupture totale
            avec les cadeaux corporate standardisés.
          </p>
          <div className="flex flex-wrap gap-4 mt-8" style={{ opacity: hv ? 1 : 0, transition: "opacity 1s ease 0.8s" }}>
            <a href="#b2b-form" className="btn-acid">DEMANDER UN DEVIS →</a>
            <a href="#poc" className="btn-outline">VOIR NOS RÉALISATIONS</a>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-16 pt-8" style={{ borderTop: "1px solid rgba(240,240,240,0.07)", opacity: hv ? 1 : 0, transition: "opacity 1s ease 1s" }}>
            {[["5★", "Hôtels partenaires"], ["+12", "Promoteurs"], ["B2B", "Foot Locker POC"]].map(([n, l]) => (
              <div key={l} className="stat-block"><div className="font-display font-black text-4xl" style={{ color: "#ff2d6b" }}>{n}</div><div className="label mt-1">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof of Concept FOOT LOCKER */}
      <section id="poc" className="py-24 px-6 md:px-10" style={{ background: "#0a0a14" }} ref={pocRef}>
        <div className="max-w-screen-xl mx-auto">
          <p className="label mb-4" style={{ color: "#ff2d6b" }}>PROOF OF CONCEPT · VALIDATION DE MARCHÉ</p>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div style={{ opacity: pocV ? 1 : 0, transform: pocV ? "none" : "translateY(32px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1)" }}>
              <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 0.9 }}>
                <span style={{ color: "#ff2d6b" }}>FOOT</span><br />LOCKER<br />
                <span style={{ color: "rgba(240,240,240,0.2)", fontSize: "0.6em" }}>PROJECT</span>
              </h2>
              <div className="mt-8 space-y-0">
                {[["OBJECT", "Jeu d'échecs Marseille — pièces sculptées en résine"], ["ARTIST", "OREL — Street Artist Marseillais"], ["QUANTITY", "Série limitée numérotée"], ["YEAR", "2026"], ["RÉSULTAT", "Validation totale du concept Drop Culture B2B"]].map(([k, val]) => (
                  <div key={k} className="flex gap-8 py-4" style={{ borderTop: "1px solid rgba(240,240,240,0.06)" }}>
                    <div className="label w-24 shrink-0" style={{ color: "#ff2d6b" }}>{k}</div>
                    <div className="text-sm" style={{ color: "rgba(240,240,240,0.7)" }}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-5" style={{ background: "rgba(255,45,107,0.06)", borderLeft: "2px solid #ff2d6b" }}>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(240,240,240,0.7)" }}>
                  "Le succès du jeu d'échecs Marseille réalisé pour Foot Locker constitue la validation
                  de marché du concept. La puissance de la drop culture, de la nostalgie générationnelle
                  et de la forte demande pour le design de niche est confirmée."
                </p>
                <p className="label mt-3" style={{ color: "#ff2d6b" }}>— Dossier Stratégique 2027</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3" style={{ opacity: pocV ? 1 : 0, transform: pocV ? "none" : "translateX(32px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1) 0.15s" }}>
              {[
                "https://images.unsplash.com/photo-1670234025697-84080c3fdb08?w=500&h=600&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1710131991542-abec46c42b34?w=500&h=600&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1656517046824-dbdd07d05a08?w=500&h=600&fit=crop&auto=format",
                "https://images.unsplash.com/photo-1720299767514-5f021b57eaca?w=500&h=600&fit=crop&auto=format",
              ].map((src, i) => (
                <div key={i} className="overflow-hidden" style={{ aspectRatio: "5/6" }}>
                  <img src={src} alt={`Foot Locker project ${i + 1}`} className="w-full h-full object-cover" style={{ filter: "brightness(0.8) saturate(0.9)", transition: "transform 0.7s ease", cursor: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* B2B Cibles */}
      <section className="py-20 px-6 md:px-10 max-w-screen-xl mx-auto">
        <p className="label mb-10 text-center" style={{ color: "#b8ff00" }}>CIBLES PRIORITAIRES</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🏨", title: "Hôtels & Spa", sub: "Série exclusive, identité d'espace", color: "#b8ff00" },
            { icon: "🏗️", title: "Promoteurs Immo", sub: "Signature de chantier, cadeaux fin de contrat", color: "#6b2fff" },
            { icon: "🏛️", title: "Institutions", sub: "CEPAC, CMA CGM, collectivités", color: "#ff2d6b" },
            { icon: "👔", title: "Grandes Entreprises", sub: "Cadeau VIP, événement, campagne", color: "#b8ff00" },
          ].map(({ icon, title, sub, color }) => (
            <div key={title} className="p-6 text-center" style={{ background: "#0f0f1a", border: `1px solid ${color}20` }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = color + "60")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = color + "20")}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{icon}</div>
              <div className="font-display font-black text-lg uppercase" style={{ color }}>{title}</div>
              <div className="label mt-2" style={{ color: "rgba(240,240,240,0.45)", fontSize: "0.6rem" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Parcours B2B */}
      <section className="py-20 px-6 md:px-10" style={{ background: "#0a0a14" }}>
        <div className="max-w-screen-xl mx-auto">
          <p className="label mb-4" style={{ color: "#b8ff00" }}>LE PARCOURS</p>
          <h2 className="font-display font-black uppercase mb-12" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>
            DE LA DEMANDE À L'<span style={{ color: "#b8ff00" }}>OBJET</span>
          </h2>
          <div className="flex flex-wrap gap-0">
            {parcours.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center py-4 px-4">
                  <div className="w-10 h-10 flex items-center justify-center font-display font-black text-sm border-2" style={{ borderColor: i % 3 === 0 ? "#b8ff00" : i % 3 === 1 ? "#6b2fff" : "#ff2d6b", color: i % 3 === 0 ? "#b8ff00" : i % 3 === 1 ? "#6b2fff" : "#ff2d6b" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="label mt-2 text-center" style={{ fontSize: "0.6rem", maxWidth: "80px" }}>{step}</div>
                </div>
                {i < parcours.length - 1 && <div className="text-[#b8ff00] font-black text-lg">↓</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="b2b-form" className="py-24 px-6 md:px-10" ref={formRef}>
        <div className="max-w-3xl mx-auto">
          <div className="p-10 md:p-14" style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)" }}>
            <div className="h-1 -mx-10 md:-mx-14 -mt-10 md:-mt-14 mb-10" style={{ background: "linear-gradient(to right, #b8ff00, #6b2fff, #ff2d6b)" }} />
            <p className="label mb-3" style={{ color: "#b8ff00" }}>DEMANDE DE PROJET</p>
            <h2 className="font-display font-black uppercase mb-2" style={{ fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 0.9 }}>
              PARLEZ-NOUS DE<br /><span style={{ color: "#b8ff00" }}>VOTRE PROJET</span>
            </h2>
            <p className="label mb-10" style={{ color: "rgba(240,240,240,0.3)" }}>Réponse sous 48h ouvrées</p>

            {sent ? (
              <div className="text-center py-16">
                <div className="font-display font-black text-6xl uppercase" style={{ color: "#b8ff00" }}>REÇU.</div>
                <p className="label mt-3" style={{ color: "rgba(240,240,240,0.4)" }}>Notre équipe vous contacte sous 48h.</p>
              </div>
            ) : (
              <div className="space-y-0">
                <p className="label pt-2 pb-6" style={{ color: "#6b2fff", borderBottom: "1px solid rgba(240,240,240,0.05)" }}>VOTRE ENTREPRISE</p>
                <div className="grid md:grid-cols-2 gap-6 pt-6">
                  {[["Nom / Structure", "nom"], ["Secteur d'activité", "secteur"], ["Site web", "site"]].map(([label, key]) => (
                    <div key={key}>
                      <label className="label block mb-2">{label}</label>
                      <input className="input-field" placeholder={label} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <p className="label pt-8 pb-6 mt-6" style={{ color: "#6b2fff", borderTop: "1px solid rgba(240,240,240,0.05)", borderBottom: "1px solid rgba(240,240,240,0.05)" }}>VOTRE PROJET</p>

                <div className="grid md:grid-cols-2 gap-6 pt-6">
                  <div>
                    <label className="label block mb-2">TYPE DE PROJET</label>
                    <select className="input-field" style={{ appearance: "none" }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="" style={{ background: "#08080f" }}>Sélectionner...</option>
                      {["Cadeau VIP", "Événement", "Campagne", "Objet corporate", "Édition limitée", "Collaboration artistique"].map(o => (
                        <option key={o} style={{ background: "#08080f" }}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label block mb-2">QUANTITÉ</label>
                    <select className="input-field" style={{ appearance: "none" }} value={form.quantite} onChange={e => setForm({ ...form, quantite: e.target.value })}>
                      <option value="" style={{ background: "#08080f" }}>Sélectionner...</option>
                      {["10", "50", "100", "500", "1000+"].map(o => (
                        <option key={o} style={{ background: "#08080f" }}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label block mb-2">BUDGET INDICATIF</label>
                    <select className="input-field" style={{ appearance: "none" }} value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}>
                      <option value="" style={{ background: "#08080f" }}>Sélectionner...</option>
                      {["< 5 000 €", "5 000 – 20 000 €", "20 000 – 50 000 €", "50 000 € +"].map(o => (
                        <option key={o} style={{ background: "#08080f" }}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label block mb-2">DATE SOUHAITÉE</label>
                    <input className="input-field" type="text" placeholder="Ex: Mars 2027" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="label block mb-2">DESCRIPTION DU PROJET</label>
                  <textarea className="input-field" rows={4} placeholder="Décrivez votre vision, vos contraintes, vos inspirations..." value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} style={{ resize: "none" }} />
                </div>

                <div className="mt-8 p-4" style={{ background: "rgba(184,255,0,0.04)", border: "1px dashed rgba(184,255,0,0.2)" }}>
                  <p className="label text-center" style={{ color: "#b8ff00" }}>📎 UPLOAD BRIEF — Joindre un document (PDF, présentation...)</p>
                </div>

                <button className="btn-pink w-full justify-center mt-8 text-lg" onClick={() => form.nom && setSent(true)}>
                  ENVOYER LA DEMANDE →
                </button>
              </div>
            )}
          </div>

          {/* Modèle artistique */}
          <div className="mt-8 p-8" style={{ background: "#0a0a14", border: "1px solid rgba(107,47,255,0.2)" }}>
            <p className="label mb-4" style={{ color: "#6b2fff" }}>MODÈLE DE RÉMUNÉRATION DES ARTISTES</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { n: "01", title: "Flat Fee création", desc: "500 € – 1 500 € selon notoriété" },
                { n: "02", title: "Royalties ventes", desc: "5 % – 10 % du prix de vente HT" },
                { n: "03", title: "Échange visibilité", desc: "Production de série en contrepartie d'exclusivité" },
              ].map(({ n, title, desc }) => (
                <div key={n}>
                  <div className="font-display font-black text-4xl" style={{ color: "rgba(107,47,255,0.2)" }}>{n}</div>
                  <div className="font-display font-black text-lg uppercase mt-1" style={{ color: "#f0f0f0" }}>{title}</div>
                  <div className="label mt-1" style={{ color: "rgba(240,240,240,0.45)", fontSize: "0.6rem" }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Collector / Compte Page ────────────────────────────────────────────────────
function CollectorPage() {
  const [tab, setTab] = useState<"collection" | "wishlist" | "level">("collection");

  const LEVELS = [
    { n: 1, name: "CURIOUS", desc: "Bienvenue dans l'univers", color: "#6b2fff", req: "1 commande" },
    { n: 2, name: "INSIDER", desc: "Accès newsletter early", color: "#b8ff00", req: "3 commandes" },
    { n: 3, name: "COLLECTOR", desc: "Early Access +2h", color: "#b8ff00", req: "5 commandes" },
    { n: 4, name: "PATRON", desc: "Accès vernissages privés", color: "#ff2d6b", req: "10 commandes" },
    { n: 5, name: "LEGEND", desc: "Accès +24h · Badge exclusif", color: "#ff2d6b", req: "20 commandes" },
  ];

  const BADGES = [["First Drop", "#b8ff00"], ["Marseille", "#6b2fff"], ["3 Pieces", "#ff2d6b"], ["Artist Collector", "#b8ff00"], ["Early Access", "#6b2fff"], ["Founding Collector", "#ff2d6b"]];

  const myPieces = [
    { name: "DOMINOS MARSEILLE", num: "034 / 100", drop: "DROP 001", artist: "OREL", img: "https://images.unsplash.com/photo-1573027167082-4a567857689b?w=400&h=500&fit=crop&auto=format" },
    { name: "ÉCHECS MARSEILLE", num: "017 / 50", drop: "POC FL", artist: "OREL", img: "https://images.unsplash.com/photo-1710131991542-abec46c42b34?w=400&h=500&fit=crop&auto=format" },
  ];

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12">
        {/* Profile header */}
        <div className="flex items-start gap-8 mb-12 pb-12" style={{ borderBottom: "1px solid rgba(240,240,240,0.07)" }}>
          <div className="w-20 h-20 flex items-center justify-center font-display font-black text-3xl shrink-0" style={{ background: "#b8ff00", color: "#08080f" }}>M</div>
          <div>
            <div className="label mb-1" style={{ color: "#b8ff00" }}>COMPTE COLLECTOR</div>
            <div className="font-display font-black text-4xl uppercase" style={{ color: "#f0f0f0" }}>MERIEM</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="tag-pill" style={{ borderColor: "#b8ff00", color: "#b8ff00" }}>LEVEL 02 · INSIDER</div>
              <div className="tag-pill">2 PIÈCES</div>
              <div className="tag-pill" style={{ borderColor: "#6b2fff", color: "#6b2fff" }}>EARLY ACCESS</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-10" style={{ borderBottom: "1px solid rgba(240,240,240,0.07)" }}>
          {(["collection", "wishlist", "level"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="font-display font-black uppercase px-6 py-3 text-base transition-all"
              style={{ color: tab === t ? "#b8ff00" : "rgba(240,240,240,0.3)", borderBottom: tab === t ? "2px solid #b8ff00" : "2px solid transparent", cursor: "none" }}>
              {t === "collection" ? "MA COLLECTION" : t === "wishlist" ? "WISHLIST" : "COLLECTOR LEVEL"}
            </button>
          ))}
        </div>

        {/* Collection */}
        {tab === "collection" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {myPieces.map((p) => (
                <div key={p.num} className="product-card drop-card" style={{ aspectRatio: "3/4" }}>
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  <div className="overlay" />
                  <div className="tag" style={{ background: "#b8ff00", color: "#08080f" }}>#{p.num}</div>
                  <div className="info">
                    <div className="label mb-1" style={{ color: "#b8ff00" }}>{p.drop} · {p.artist}</div>
                    <h3 className="font-display font-black uppercase text-xl leading-none" style={{ color: "#f0f0f0" }}>{p.name}</h3>
                    <div className="reveal-btn mt-3 flex gap-2">
                      <button className="btn-outline text-xs py-1.5 px-3">CERTIFICAT</button>
                      <button className="btn-outline text-xs py-1.5 px-3">PARTAGER</button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add slot */}
              <div className="flex items-center justify-center" style={{ aspectRatio: "3/4", border: "1px dashed rgba(240,240,240,0.1)" }}>
                <div className="text-center">
                  <div className="font-display font-black text-4xl" style={{ color: "rgba(240,240,240,0.1)" }}>+</div>
                  <div className="label mt-2" style={{ color: "rgba(240,240,240,0.2)" }}>PROCHAINE PIÈCE</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist */}
        {tab === "wishlist" && (
          <div className="text-center py-20">
            <div className="font-display font-black text-5xl uppercase" style={{ color: "rgba(240,240,240,0.1)" }}>♡</div>
            <p className="font-display font-black text-2xl uppercase mt-4" style={{ color: "rgba(240,240,240,0.3)" }}>MA WISHLIST</p>
            <p className="label mt-3" style={{ color: "rgba(240,240,240,0.2)" }}>Sauvegardez les pièces qui vous font rêver.</p>
            <p className="mt-6 text-sm" style={{ color: "rgba(240,240,240,0.4)" }}>Notification automatique : "La pièce que vous suiviez est presque épuisée."</p>
          </div>
        )}

        {/* Level */}
        {tab === "level" && (
          <div>
            <div className="mb-10">
              <p className="label mb-6" style={{ color: "#b8ff00" }}>COLLECTOR LEVELS</p>
              <div className="space-y-3">
                {LEVELS.map((l) => (
                  <div key={l.n} className="flex items-center gap-6 p-5" style={{ background: l.n === 2 ? "rgba(184,255,0,0.06)" : "#0f0f1a", border: `1px solid ${l.n === 2 ? l.color + "40" : "rgba(240,240,240,0.06)"}` }}>
                    <div className="font-display font-black text-3xl w-12 shrink-0" style={{ color: l.color }}>L{l.n}</div>
                    <div className="flex-1">
                      <div className="font-display font-black text-xl uppercase" style={{ color: l.n === 2 ? l.color : "#f0f0f0" }}>{l.name} {l.n === 2 && <span className="label ml-2" style={{ color: "#b8ff00" }}>← VOTRE NIVEAU</span>}</div>
                      <div className="label mt-1">{l.desc}</div>
                    </div>
                    <div className="tag-pill shrink-0">{l.req}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="label mb-6" style={{ color: "#6b2fff" }}>BADGES</p>
              <div className="flex flex-wrap gap-3">
                {BADGES.map(([name, color]) => (
                  <div key={name} className="flex items-center gap-2 px-4 py-2" style={{ border: `1px solid ${color}30`, background: `${color}08` }}>
                    <span className="text-sm" style={{ color }}>◆</span>
                    <span className="label" style={{ color: "rgba(240,240,240,0.6)" }}>{name}</span>
                  </div>
                ))}
              </div>
              <p className="label mt-4" style={{ color: "rgba(240,240,240,0.2)" }}>Premium, pas gamification enfantine. Chaque badge représente une relation réelle à l'art.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DROPS Page ────────────────────────────────────────────────────────────────
function DropsPage({ setPage }: { setPage: (p: string) => void }) {
  const { ref: h, v: hv } = useReveal();
  const { ref: next, v: nv } = useReveal();
  const { ref: arch, v: av } = useReveal();
  const dropMs = useRef(Date.now() + 2 * 86400000 + 14 * 3600000 + 32 * 60000 + 8000).current;
  const { d, h: hr, m, s } = useCountdown(dropMs);
  const [waitlist, setWaitlist] = useState("");
  const [wSent, setWSent] = useState(false);

  const NEXT_DROPS = [
    { id: "002", name: "JENGA ARCHITECTURAL", artist: "OREL", date: "MARS 2027", desc: "Jeu de la tour infernale en bois/résine. Chaque bloc reprend une texture de Marseille — Mucem, Cité Radieuse, Vieux-Port.", img: "https://images.unsplash.com/photo-1726013869898-0782fa5ef0b1?w=700&h=875&fit=crop&auto=format", color: "#6b2fff", qty: 75 },
    { id: "003", name: "DAMES RAP MRS", artist: "OREL × ARTISTE RAP", date: "JUIN 2027", desc: "Plateau vinyle/résine noire. Pions mini-sculptures représentant les figures du rap marseillais. Deux esthétiques : années 90 bronze vs 2020 chrome/néon.", img: "https://images.unsplash.com/photo-1596517335913-66b7be20c921?w=700&h=875&fit=crop&auto=format", color: "#ff2d6b", qty: 100 },
    { id: "004", name: "MORPION BÉTON", artist: "AMARA D.", date: "SEPT 2027", desc: "Dalle de béton brut ciré gravée de lignes géométriques. Pions en mini-figurines : Tour CMA CGM vs Bonne Mère version Art Brut.", img: "https://images.unsplash.com/photo-1626140321481-437bc23ce772?w=700&h=875&fit=crop&auto=format", color: "#b8ff00", qty: 50 },
  ];

  const PAST_DROPS = [
    { id: "POC", name: "ÉCHECS MARSEILLE", artist: "OREL", date: "2026", edition: "SOLD OUT", price: "320 €", note: "Foot Locker × 13°ART — Proof of Concept", img: "https://images.unsplash.com/photo-1710131991542-abec46c42b34?w=600&h=750&fit=crop&auto=format", color: "#ff2d6b" },
  ];

  return (
    <div className="pt-20 min-h-screen">
      {/* Header */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12" ref={h}>
        <p className="label mb-3" style={{ color: "#b8ff00" }}>DROPS</p>
        <h1 className="font-display font-black uppercase" style={{ fontSize: "clamp(3rem,9vw,8rem)", lineHeight: 0.88, opacity: hv ? 1 : 0, transform: hv ? "none" : "translateY(32px)", transition: "all 1s cubic-bezier(0.16,1,0.3,1)" }}>
          DROP<br /><span style={{ color: "#b8ff00" }}>001</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(240,240,240,0.5)", maxWidth: "500px", opacity: hv ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}>
          Chaque Drop est un événement. Un objet, un artiste, un nombre limité. Une fois épuisé, il ne revient pas.
        </p>
      </div>

      {/* Drop actuel — hero */}
      <section className="py-6 px-6 md:px-10 max-w-screen-xl mx-auto">
        <div className="relative overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid rgba(184,255,0,0.15)" }}>
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(to right, #b8ff00, #6b2fff, #ff2d6b)" }} />
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <img src="https://images.unsplash.com/photo-1722754997162-f211b7311eee?w=900&h=675&fit=crop&auto=format" alt="Dominos Marseille 001" className="w-full h-full object-cover" style={{ filter: "brightness(0.85)" }} />
              <div className="absolute top-5 left-5 font-display font-black text-sm px-3 py-1.5" style={{ background: "#b8ff00", color: "#08080f", letterSpacing: "0.18em" }}>LIVE NOW</div>
              <div className="absolute top-5 right-5">
                <span className="w-2 h-2 rounded-full inline-block bg-[#b8ff00] mr-2" style={{ animation: "blink 1.5s ease infinite" }} />
                <span className="label" style={{ color: "#b8ff00" }}>87 / 100</span>
              </div>
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="label mb-3" style={{ color: "#b8ff00" }}>DROP ACTUEL · ÉDITION 001</div>
              <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>
                DOMINOS<br />MARSEILLE
              </h2>
              <p className="label mt-2">par OREL · Béton & Terrazzo</p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(240,240,240,0.6)" }}>
                Blocs moulés en résine et fragments de pierre locale. Marquages peints à la bombe/graffiti.
                100 exemplaires, numérotés et signés. Certificat d'authenticité inclus.
              </p>
              <div className="mt-6 grid grid-cols-4 gap-0" style={{ border: "1px solid rgba(240,240,240,0.07)" }}>
                {[{ v: d, l: "J" }, { v: hr, l: "H" }, { v: m, l: "M" }, { v: s, l: "S" }].map(({ v: val, l }) => (
                  <div key={l} className="text-center py-3" style={{ borderRight: "1px solid rgba(240,240,240,0.06)" }}>
                    <div className="cd-digit" style={{ fontSize: "clamp(1.5rem,4vw,3rem)" }}>{String(val).padStart(2, "0")}</div>
                    <div className="label" style={{ fontSize: "0.55rem" }}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-acid flex-1 justify-center">ACHETER · 189 € →</button>
                <button className="btn-outline px-4">♡</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prochains drops */}
      <section className="py-20 px-6 md:px-10 max-w-screen-xl mx-auto" ref={next}>
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="label mb-3" style={{ color: "#6b2fff" }}>PROCHAINS DROPS</p>
            <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>À VENIR</h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {NEXT_DROPS.map((drop, i) => (
            <div key={drop.id} className="drop-card" style={{ aspectRatio: "4/5", opacity: nv ? 1 : 0, transform: nv ? "none" : "translateY(40px)", transition: `all 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s` }}>
              <img src={drop.img} alt={drop.name} className="w-full h-full object-cover" style={{ filter: "brightness(0.5) grayscale(30%)" }} />
              <div className="overlay" />
              {/* Locked overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background: "rgba(8,8,15,0.4)" }}>
                <div className="text-center">
                  <div className="font-display font-black text-6xl" style={{ color: "rgba(240,240,240,0.08)" }}>?</div>
                </div>
              </div>
              <div className="tag" style={{ background: drop.color, color: "#08080f" }}>COMING SOON</div>
              <div className="info" style={{ zIndex: 20 }}>
                <div className="label mb-1" style={{ color: drop.color }}>{drop.date} · {drop.qty} EXEMPLAIRES</div>
                <h3 className="font-display font-black uppercase text-2xl leading-none" style={{ color: "#f0f0f0" }}>{drop.name}</h3>
                <p className="label mt-1">par {drop.artist}</p>
                <p className="mt-2 text-xs leading-relaxed reveal-btn" style={{ color: "rgba(240,240,240,0.55)", maxWidth: "260px" }}>{drop.desc}</p>
              </div>
              <div className="color-bar" style={{ background: drop.color }} />
            </div>
          ))}
        </div>

        {/* Waitlist */}
        <div className="mt-12 p-8 md:p-10" style={{ background: "#0f0f1a", border: "1px solid rgba(107,47,255,0.2)" }}>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="label mb-2" style={{ color: "#6b2fff" }}>WAITLIST</p>
              <h3 className="font-display font-black uppercase text-3xl" style={{ lineHeight: 0.9 }}>ME PRÉVENIR<br /><span style={{ color: "#6b2fff" }}>EN PREMIER</span></h3>
              <p className="mt-3 text-sm" style={{ color: "rgba(240,240,240,0.5)" }}>Accès 24h avant le public. Collectors uniquement.</p>
            </div>
            <div>
              {wSent ? (
                <div className="text-center py-6">
                  <div className="font-display font-black text-4xl uppercase" style={{ color: "#6b2fff" }}>INSCRIT.</div>
                  <p className="label mt-2" style={{ color: "rgba(240,240,240,0.4)" }}>Vous serez prévenu en premier.</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input className="input-field" type="email" placeholder="votre@email.com" value={waitlist} onChange={e => setWaitlist(e.target.value)} />
                  <button className="btn-acid shrink-0" onClick={() => waitlist && setWSent(true)}>OK →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Drops terminés */}
      <section className="py-20 px-6 md:px-10 max-w-screen-xl mx-auto" ref={arch} style={{ borderTop: "1px solid rgba(240,240,240,0.06)" }}>
        <p className="label mb-3" style={{ color: "#ff2d6b" }}>DROPS TERMINÉS</p>
        <h2 className="font-display font-black uppercase mb-10" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>
          ARCHIVES
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PAST_DROPS.map((d, i) => (
            <div key={d.id} className="drop-card" style={{ aspectRatio: "3/4", opacity: av ? 1 : 0, transform: av ? "none" : "translateY(32px)", transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s` }}>
              <img src={d.img} alt={d.name} className="w-full h-full object-cover" style={{ filter: "grayscale(60%) brightness(0.7)" }} />
              <div className="overlay" />
              <div className="tag" style={{ background: "#ff2d6b", color: "#fff" }}>SOLD OUT</div>
              <div className="info">
                <div className="label mb-1" style={{ color: "rgba(240,240,240,0.4)", fontSize: "0.6rem" }}>{d.note}</div>
                <h3 className="font-display font-black uppercase text-2xl leading-none" style={{ color: "#f0f0f0" }}>{d.name}</h3>
                <p className="label mt-1">{d.artist} · {d.date}</p>
                <div className="reveal-btn mt-3 flex items-center justify-between">
                  <span className="label">{d.edition}</span>
                  <span className="font-display font-black text-xl" style={{ color: d.color }}>{d.price}</span>
                </div>
              </div>
              <div className="color-bar" style={{ background: d.color }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── ARTISTES Page ─────────────────────────────────────────────────────────────
function ArtistesPage() {
  const { ref, v } = useReveal();
  const [selected, setSelected] = useState<number | null>(null);

  const ALL_ARTISTS = [
    { name: "OREL", city: "MARSEILLE", discipline: "Street Art · Art Brut · Direction Artistique", drops: 3, status: "Fondateur", color: "#b8ff00", royalty: "7%", fee: "Fondateur", bio: "Directeur artistique de 13°ART et créateur de la ligne Jeux de Société Déco. Son univers fusionne l'architecture urbaine, la culture locale marseillaise et la sculpture Art Brut. Créateur du jeu d'échecs Foot Locker — le Proof of Concept qui valide toute la démarche.", inspirations: ["Le Mucem", "Les Calanques", "La Bonne Mère", "Rap marseillais", "Art brut", "Béton architectural"], img: "https://images.unsplash.com/photo-1601913463731-cfba9fd31ed3?w=800&h=1000&fit=crop&auto=format" },
    { name: "MARCO S.", city: "BERLIN / MARSEILLE", discipline: "Peinture · Huile sur lin", drops: 2, status: "Artiste partenaire", color: "#6b2fff", royalty: "6%", fee: "800 €", bio: "Berlinois installé à Marseille depuis 2019. Ses peintures à l'huile sur lin explorent les tensions entre géographie intérieure et paysage urbain. Son travail mêle la rigueur technique allemande et la sensualité méditerranéenne.", inspirations: ["Architectures portuaires", "Lumière du sud", "Texture des façades", "Mer Méditerranée"], img: "https://images.unsplash.com/photo-1556139930-c23fa4a4f934?w=800&h=1000&fit=crop&auto=format" },
    { name: "AMARA D.", city: "DAKAR / MARSEILLE", discipline: "Sculpture · Céramique Ravel", drops: 1, status: "Artiste partenaire", color: "#ff2d6b", royalty: "8%", fee: "1 000 €", bio: "Formée aux Beaux-Arts de Paris. Collabore avec l'atelier Ravel d'Aubagne pour des pièces en céramique émaillée mate — teintes ocre, terracotta, bleu profond de Méditerranée. Ses pions sont des sculptures miniatures uniques.", inspirations: ["Céramique Aubagne", "Afrique & Méditerranée", "Formes épurées", "Couleurs de garrigue"], img: "https://images.unsplash.com/photo-1784653547575-c57e9bd37db5?w=800&h=1000&fit=crop&auto=format" },
    { name: "CHEN W.", city: "PARIS / MARSEILLE", discipline: "Sérigraphie · Print Art", drops: 2, status: "Artiste partenaire", color: "#b8ff00", royalty: "5%", fee: "600 €", bio: "Maître de la sérigraphie urbaine. Chaque tirage est imprimé à la main en atelier, en édition strictement limitée. Sa typographie brute et ses codes visuels du quartier créent un style immédiatement reconnaissable.", inspirations: ["Typographie urbaine", "Quartiers nord", "Culture hip-hop", "Affiches vintage MRS"], img: "https://images.unsplash.com/photo-1569521597715-0e0c4e22e0e4?w=800&h=1000&fit=crop&auto=format" },
  ];

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12">
        <p className="label mb-3" style={{ color: "#b8ff00" }}>LES ARTISTES</p>
        <h1 className="font-display font-black uppercase mb-4" style={{ fontSize: "clamp(3rem,8vw,7rem)", lineHeight: 0.88 }}>
          LA <span style={{ color: "#ff2d6b" }}>FAMILLE</span>
        </h1>
        <p className="text-sm leading-relaxed mb-16" style={{ color: "rgba(240,240,240,0.5)", maxWidth: "480px" }}>
          Artistes marseillais et résidents de la scène locale. Chaque collaboration repose sur un contrat de cession de droits : Flat Fee création + royalties 5–10 % sur chaque vente.
        </p>

        <div ref={ref} className="space-y-2">
          {ALL_ARTISTS.map((a, i) => (
            <div key={a.name}>
              <div className="flex items-center gap-6 py-6 cursor-pointer group" style={{ borderTop: "1px solid rgba(240,240,240,0.07)", cursor: "none" }}
                onClick={() => setSelected(selected === i ? null : i)}>
                {/* Number */}
                <div className="font-display font-black text-4xl w-14 shrink-0 opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: a.color }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                {/* Thumb */}
                <div className="w-14 h-14 shrink-0 overflow-hidden">
                  <img src={a.img} alt={a.name} className="w-full h-full object-cover" style={{ filter: "grayscale(40%)", transition: "filter 0.4s" }}
                    onMouseEnter={e => (e.currentTarget.style.filter = "grayscale(0%)")}
                    onMouseLeave={e => (e.currentTarget.style.filter = "grayscale(40%)")} />
                </div>
                {/* Name */}
                <div className="flex-1">
                  <h3 className="font-display font-black uppercase" style={{ fontSize: "clamp(1.5rem,3vw,2.5rem)", lineHeight: 1, color: "#f0f0f0", transition: "color 0.3s" }}>{a.name}</h3>
                  <p className="label mt-1">{a.city} · {a.discipline}</p>
                </div>
                {/* Meta */}
                <div className="hidden md:flex items-center gap-6 shrink-0">
                  <div className="tag-pill" style={{ borderColor: a.color, color: a.color }}>{a.drops} DROP{a.drops > 1 ? "S" : ""}</div>
                  <div className="tag-pill">{a.status}</div>
                  <div className="font-display font-black text-2xl transition-transform" style={{ color: "rgba(240,240,240,0.3)", transform: selected === i ? "rotate(45deg)" : "none" }}>+</div>
                </div>
              </div>

              {/* Expanded */}
              <div style={{ maxHeight: selected === i ? "600px" : "0", overflow: "hidden", transition: "max-height 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
                <div className="grid md:grid-cols-3 gap-8 pb-8 pl-14 md:pl-20">
                  {/* Photo */}
                  <div className="overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <img src={a.img} alt={a.name} className="w-full h-full object-cover" />
                  </div>
                  {/* Bio + Vision */}
                  <div className="md:col-span-2">
                    <div className="h-0.5 mb-6" style={{ background: `linear-gradient(to right, ${a.color}, transparent)` }} />
                    <p className="label mb-2" style={{ color: a.color }}>BIO</p>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,240,240,0.65)" }}>{a.bio}</p>

                    <p className="label mb-3" style={{ color: a.color }}>INSPIRATIONS</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {a.inspirations.map(ins => (
                        <span key={ins} className="tag-pill" style={{ borderColor: a.color + "40", color: "rgba(240,240,240,0.5)" }}>{ins}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: "1px solid rgba(240,240,240,0.06)" }}>
                      {[["ROYALTIES", a.royalty], ["FLAT FEE", a.fee], ["STATUT", a.status]].map(([k, val]) => (
                        <div key={k}>
                          <div className="label mb-1" style={{ color: a.color, fontSize: "0.6rem" }}>{k}</div>
                          <div className="font-display font-black text-xl uppercase" style={{ color: "#f0f0f0" }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    <button className="btn-outline mt-6 text-sm">VOIR SES CRÉATIONS →</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA rejoindre */}
        <div className="mt-16 p-8 text-center" style={{ background: "#0f0f1a", border: "1px solid rgba(184,255,0,0.15)" }}>
          <p className="label mb-3" style={{ color: "#b8ff00" }}>VOUS ÊTES ARTISTE ?</p>
          <h3 className="font-display font-black uppercase text-3xl mb-4" style={{ lineHeight: 0.9 }}>REJOINDRE LA FAMILLE<br /><span style={{ color: "#b8ff00" }}>13°ART</span></h3>
          <p className="text-sm mb-6" style={{ color: "rgba(240,240,240,0.5)" }}>Flat Fee création 500–1 500 € + Royalties 5–10 % sur chaque vente. Production financée. Visibilité assurée.</p>
          <button className="btn-acid">PROPOSER MA COLLABORATION →</button>
        </div>
      </div>
    </div>
  );
}

// ── STORIES Page ──────────────────────────────────────────────────────────────
function StoriesPage() {
  const { ref, v } = useReveal();
  const [activeTag, setActiveTag] = useState("Tous");
  const TAGS = ["Tous", "Artists", "Making Of", "Marseille", "Design", "Behind The Drop", "Culture"];

  const ARTICLES = [
    { tag: "Behind The Drop", title: "Comment les Dominos sont nés d'une partie de boules à l'Estaque", author: "Orel", date: "12 Jan 2027", read: "6 min", color: "#b8ff00", img: "https://images.unsplash.com/photo-1573027167082-4a567857689b?w=800&h=500&fit=crop&auto=format", excerpt: "Retour sur la genèse du Drop 001 — de l'idée au moulage, en passant par 3 semaines d'essais béton à l'atelier." },
    { tag: "Making Of", title: "Le Gachon : 47 prototypes avant le produit final", author: "Rédaction 13°ART", date: "5 Jan 2027", read: "4 min", color: "#6b2fff", img: "https://images.unsplash.com/photo-1604012164867-ed735c0c0a5f?w=800&h=500&fit=crop&auto=format", excerpt: "Chronique de la création du dock MagSafe en béton. De la texture, du poids, du son quand on le pose sur un bureau." },
    { tag: "Artists", title: "Amara D. : l'argile comme langage politique", author: "Chen W.", date: "28 Déc 2026", read: "8 min", color: "#ff2d6b", img: "https://images.unsplash.com/photo-1784653547575-c57e9bd37db5?w=800&h=500&fit=crop&auto=format", excerpt: "Rencontre avec Amara Diallo dans son atelier d'Aubagne. La céramique comme acte de résistance culturelle." },
    { tag: "Marseille", title: "Le Panier → objet : cartographie d'une inspiration", author: "Orel", date: "20 Déc 2026", read: "5 min", color: "#b8ff00", img: "https://images.unsplash.com/photo-1628025493547-2d87d6915fbb?w=800&h=500&fit=crop&auto=format", excerpt: "Comment les ruelles du Panier, ses couleurs et ses textures nourrissent chaque pièce de la collection." },
    { tag: "Design", title: "La règle d'or : le core standardisé, la coque artistique", author: "Rédaction 13°ART", date: "10 Déc 2026", read: "3 min", color: "#6b2fff", img: "https://images.unsplash.com/photo-1624545481411-b8daf3aa427d?w=800&h=500&fit=crop&auto=format", excerpt: "Notre philosophie industrielle : composants certifiés CE à l'intérieur, design et matières brutes à l'extérieur." },
    { tag: "Culture", title: "Foot Locker × 13°ART : comment tout a commencé", author: "Orel", date: "1 Déc 2026", read: "7 min", color: "#ff2d6b", img: "https://images.unsplash.com/photo-1670234025697-84080c3fdb08?w=800&h=500&fit=crop&auto=format", excerpt: "Le jeu d'échecs Marseille pour Foot Locker. La commande qui a tout validé — et pourquoi on recommence en grand." },
  ];

  const filtered = activeTag === "Tous" ? ARTICLES : ARTICLES.filter(a => a.tag === activeTag);

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12">
        <p className="label mb-3" style={{ color: "#b8ff00" }}>STORIES</p>
        <h1 className="font-display font-black uppercase mb-8" style={{ fontSize: "clamp(3rem,8vw,7rem)", lineHeight: 0.88 }}>
          LE <span style={{ color: "#6b2fff" }}>MAGAZINE</span>
        </h1>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {TAGS.map(t => (
            <button key={t} onClick={() => setActiveTag(t)} className="tag-pill transition-all"
              style={{ borderColor: activeTag === t ? "#b8ff00" : "rgba(240,240,240,0.12)", color: activeTag === t ? "#b8ff00" : "rgba(240,240,240,0.4)", cursor: "none" }}>{t}</button>
          ))}
        </div>

        {/* Featured article */}
        {filtered[0] && (
          <div ref={ref} className="relative overflow-hidden mb-6 group" style={{ cursor: "none" }}>
            <div className="relative overflow-hidden" style={{ aspectRatio: "21/9" }}>
              <img src={filtered[0].img} alt={filtered[0].title} className="w-full h-full object-cover" style={{ transition: "transform 0.8s ease", transform: "scale(1)" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,8,15,0.92) 0%, rgba(8,8,15,0.3) 50%, transparent 100%)" }} />
            </div>
            <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-2xl">
              <div className="tag-pill mb-4" style={{ borderColor: filtered[0].color, color: filtered[0].color }}>{filtered[0].tag}</div>
              <h2 className="font-display font-black uppercase" style={{ fontSize: "clamp(1.8rem,4vw,3rem)", lineHeight: 0.95, color: "#f0f0f0" }}>{filtered[0].title}</h2>
              <p className="mt-3 text-sm" style={{ color: "rgba(240,240,240,0.6)" }}>{filtered[0].excerpt}</p>
              <div className="flex items-center gap-4 mt-4">
                <span className="label">{filtered[0].author}</span>
                <span className="label" style={{ color: "rgba(240,240,240,0.3)" }}>·</span>
                <span className="label">{filtered[0].date}</span>
                <span className="label" style={{ color: "rgba(240,240,240,0.3)" }}>·</span>
                <span className="label" style={{ color: filtered[0].color }}>{filtered[0].read} de lecture</span>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.slice(1).map((a, i) => (
            <div key={a.title} className="group overflow-hidden" style={{ background: "#0f0f1a", cursor: "none" }}>
              <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
                <img src={a.img} alt={a.title} className="w-full h-full object-cover" style={{ transition: "transform 0.7s ease, filter 0.4s", filter: "brightness(0.8)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.filter = "brightness(1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(0.8)"; }} />
              </div>
              <div className="p-5">
                <div className="tag-pill mb-3" style={{ borderColor: a.color, color: a.color }}>{a.tag}</div>
                <h3 className="font-display font-black uppercase text-lg leading-none" style={{ color: "#f0f0f0" }}>{a.title}</h3>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(240,240,240,0.5)" }}>{a.excerpt}</p>
                <div className="flex items-center gap-3 mt-4" style={{ borderTop: "1px solid rgba(240,240,240,0.06)", paddingTop: "0.75rem" }}>
                  <span className="label" style={{ fontSize: "0.6rem" }}>{a.author} · {a.date}</span>
                  <span className="label ml-auto" style={{ color: a.color, fontSize: "0.6rem" }}>{a.read}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MARSEILLE Page ────────────────────────────────────────────────────────────
function MarseillePage() {
  const { ref: h, v: hv } = useReveal();
  const { ref: m, v: mv } = useReveal();
  const [activeSpot, setActiveSpot] = useState<number | null>(null);

  const SPOTS = [
    { name: "Le Panier", type: "Quartier", desc: "Ruelles ocre et bleues. Textures des façades. Point de départ de chaque pièce.", color: "#b8ff00", top: "35%", left: "42%" },
    { name: "Vieux-Port", type: "Inspiration", desc: "Reflets, lumière changeante, matières marines. Le sel dans la pierre.", color: "#6b2fff", top: "55%", left: "38%" },
    { name: "Le Mucem", type: "Architecture", desc: "Béton dentelle de Rudy Ricciotti. L'architecture comme art brut monumental.", color: "#ff2d6b", top: "48%", left: "28%" },
    { name: "Les Calanques", type: "Matière", desc: "Calcaire blanc, eau turquoise. Les couleurs de la géographie locale.", color: "#b8ff00", top: "72%", left: "60%" },
    { name: "La Bonne Mère", type: "Icône · Domaine public", desc: "Notre-Dame de la Garde. Silhouette libre de droits. Figure emblématique inscrite dans nos créations.", color: "#6b2fff", top: "25%", left: "48%" },
  ];

  const MATERIAUX = [
    { name: "BÉTON MARSEILLAIS", desc: "Granulats locaux, teinte naturelle. Acoustique naturelle pour les enceintes.", color: "#b8ff00" },
    { name: "PIERRE DE CASSIS", desc: "Calcaire local extrait des Calanques. Gravure laser par l'artiste.", color: "#6b2fff" },
    { name: "CÉRAMIQUE AUBAGNE", desc: "Atelier Ravel. Tradition céramiste de la région. Teintes méditerranéennes.", color: "#ff2d6b" },
    { name: "RÉSINE & TERRAZZO", desc: "Fragments de pierre locale incorporés. Esthétique Art Brut brute et épurée.", color: "#b8ff00" },
    { name: "BOIS RÉGIONAL", desc: "Pin et chêne de Provence. Texture naturelle pour les jeux de plateau.", color: "#6b2fff" },
  ];

  return (
    <div className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-end overflow-hidden" ref={h}>
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1692118451637-a17c0ed62875?w=1800&h=1000&fit=crop&auto=format" alt="Marseille port" className="w-full h-full object-cover" style={{ filter: "brightness(0.25) saturate(1.4)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,15,0.3) 0%, rgba(8,8,15,0.85) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-screen-xl mx-auto px-6 md:px-10 py-16 w-full">
          <p className="label mb-4" style={{ color: "#b8ff00", opacity: hv ? 1 : 0, transition: "opacity 0.7s ease" }}>13° NORD · 5° EST</p>
          <h1 className="font-display font-black uppercase" style={{ fontSize: "clamp(3rem,10vw,9rem)", lineHeight: 0.88, opacity: hv ? 1 : 0, transform: hv ? "none" : "translateY(40px)", transition: "all 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s" }}>
            MARSEILLE<br />EST NOTRE<br /><span style={{ color: "#b8ff00" }}>MATIÈRE</span><br />PREMIÈRE.
          </h1>
        </div>
      </section>

      {/* Carte interactive */}
      <section className="py-20 px-6 md:px-10 max-w-screen-xl mx-auto" ref={m}>
        <p className="label mb-3" style={{ color: "#6b2fff" }}>CARTOGRAPHIE</p>
        <h2 className="font-display font-black uppercase mb-10" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>
          LES LIEUX QUI <span style={{ color: "#6b2fff" }}>NOURRISSENT</span> L'ŒUVRE
        </h2>

        {/* Map-like layout */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/9", background: "#0a0a14", border: "1px solid rgba(240,240,240,0.07)" }}>
          <img src="https://images.unsplash.com/photo-1650725938471-cb6902466b02?w=1400&h=788&fit=crop&auto=format" alt="Marseille carte" className="w-full h-full object-cover" style={{ opacity: 0.15 }} />
          {SPOTS.map((s, i) => (
            <div key={s.name} className="absolute" style={{ top: s.top, left: s.left, transform: "translate(-50%, -50%)", cursor: "none" }}
              onMouseEnter={() => setActiveSpot(i)} onMouseLeave={() => setActiveSpot(null)}>
              <div className="relative">
                <div className="w-4 h-4 rounded-full border-2 transition-all" style={{ borderColor: s.color, background: activeSpot === i ? s.color : "rgba(8,8,15,0.8)", transform: activeSpot === i ? "scale(1.5)" : "scale(1)", transition: "all 0.3s" }} />
                <div className="absolute top-6 left-0" style={{ opacity: activeSpot === i ? 1 : 0, transform: activeSpot === i ? "translateY(0)" : "translateY(6px)", transition: "all 0.3s", pointerEvents: "none", minWidth: "160px", zIndex: 10 }}>
                  <div className="p-3" style={{ background: "rgba(8,8,15,0.95)", border: `1px solid ${s.color}50` }}>
                    <div className="label mb-1" style={{ color: s.color, fontSize: "0.55rem" }}>{s.type}</div>
                    <div className="font-display font-black text-base uppercase" style={{ color: "#f0f0f0" }}>{s.name}</div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(240,240,240,0.55)" }}>{s.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="absolute bottom-4 left-4">
            <div className="label" style={{ color: "rgba(240,240,240,0.3)" }}>→ Survol pour explorer</div>
          </div>
        </div>

        {/* Spots list */}
        <div className="grid md:grid-cols-5 gap-3 mt-6">
          {SPOTS.map((s) => (
            <div key={s.name} className="p-4" style={{ background: "#0f0f1a", border: `1px solid ${s.color}18`, cursor: "none" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = s.color + "50")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = s.color + "18")}>
              <div className="label mb-1" style={{ color: s.color, fontSize: "0.55rem" }}>{s.type}</div>
              <div className="font-display font-black uppercase text-lg leading-none" style={{ color: "#f0f0f0" }}>{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Matières */}
      <section className="py-20 px-6 md:px-10" style={{ background: "#0a0a14" }}>
        <div className="max-w-screen-xl mx-auto">
          <p className="label mb-3" style={{ color: "#ff2d6b" }}>LES MATIÈRES</p>
          <h2 className="font-display font-black uppercase mb-10" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>
            CE QUI <span style={{ color: "#ff2d6b" }}>COMPOSE</span> NOS OBJETS
          </h2>
          <div className="space-y-0">
            {MATERIAUX.map((mat, i) => (
              <div key={mat.name} className="flex items-center gap-8 py-6 group" style={{ borderTop: "1px solid rgba(240,240,240,0.06)", cursor: "none" }}>
                <div className="font-display font-black text-4xl shrink-0 w-10" style={{ color: mat.color + "30" }}>{String(i + 1).padStart(2, "0")}</div>
                <div className="flex-1">
                  <div className="font-display font-black text-2xl uppercase" style={{ color: "#f0f0f0" }}>{mat.name}</div>
                  <div className="label mt-1" style={{ color: "rgba(240,240,240,0.45)" }}>{mat.desc}</div>
                </div>
                <div className="w-8 h-8 rounded-full shrink-0" style={{ background: mat.color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Espace phygital */}
      <section className="py-20 px-6 md:px-10 max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="label mb-3" style={{ color: "#b8ff00" }}>HORIZON 2027+</p>
            <h2 className="font-display font-black uppercase mb-6" style={{ fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 0.9 }}>
              L'ESPACE<br /><span style={{ color: "#b8ff00" }}>PHYGITAL</span>
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(240,240,240,0.6)" }}>
              À terme, un espace hybride à Marseille : boutique, galerie d'art contemporaine, café de spécialité.
              Chaque sortie d'objet majeur donnera lieu à un vernissage VIP et communautaire.
            </p>
            <div className="space-y-3">
              {[["BOUTIQUE", "Vente en direct, expérience produit"], ["GALERIE", "Exposition des œuvres originales (40–50 % commission)"], ["CAFÉ", "Lieu de vie et de rencontre de la communauté"], ["VERNISSAGES", "Événements VIP autour de chaque Drop"]].map(([k, v]) => (
                <div key={k} className="flex gap-4" style={{ borderLeft: "2px solid rgba(184,255,0,0.2)", paddingLeft: "1rem" }}>
                  <div className="label shrink-0" style={{ color: "#b8ff00" }}>{k}</div>
                  <div className="text-xs" style={{ color: "rgba(240,240,240,0.5)" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
            <img src="https://images.unsplash.com/photo-1728914055739-bf9b21457fc8?w=800&h=1000&fit=crop&auto=format" alt="Rue Marseille" className="w-full h-full object-cover" style={{ filter: "brightness(0.6) saturate(1.2)" }} />
            <div className="absolute inset-0 flex items-end p-8" style={{ background: "linear-gradient(to top, rgba(8,8,15,0.8), transparent 50%)" }}>
              <div>
                <div className="tag-pill mb-3" style={{ borderColor: "#b8ff00", color: "#b8ff00" }}>BIENTÔT · MARSEILLE</div>
                <div className="font-display font-black uppercase text-2xl" style={{ color: "#f0f0f0" }}>L'ADRESSE 13°ART</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer({ setPage }: { setPage: (p: string) => void }) {
  return (
    <footer className="py-16 px-6 md:px-10" style={{ borderTop: "1px solid rgba(240,240,240,0.05)", background: "#06060d" }}>
      <div className="max-w-screen-xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="font-display font-black text-3xl mb-1" style={{ letterSpacing: "0.15em", color: "#f0f0f0" }}>13°<span style={{ color: "#b8ff00" }}>ART</span></div>
            <p className="label mb-4">MARSEILLE · OBJET · ÉDITION</p>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(240,240,240,0.35)", maxWidth: "200px" }}>
              Agence hybride spécialisée dans la création et la vente d'œuvres d'art en mini-séries. Marseille, France. Horizon 2027.
            </p>
          </div>
          {[
            { title: "BOUTIQUE", links: ["Drops", "Shop", "Artistes", "Stories", "Marseille"] },
            { title: "ENTREPRISES", links: ["For Business", "Réalisations", "Foot Locker POC", "Demander un devis"] },
            { title: "COLLECTOR", links: ["Mon compte", "Ma collection", "Wishlist", "Certificats", "Early Access"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="label mb-5" style={{ color: "#b8ff00" }}>{title}</p>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l}>
                    <button className="text-xs" style={{ color: "rgba(240,240,240,0.38)", letterSpacing: "0.06em", cursor: "none", transition: "color 0.25s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#b8ff00")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,240,240,0.38)")}
                      onClick={() => setPage(l.includes("Business") ? "FOR BUSINESS" : l.includes("Shop") || l.includes("Drops") ? "SHOP" : l.includes("Marseille") ? "MARSEILLE" : l.includes("Artiste") ? "ARTISTES" : "HOME")}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(240,240,240,0.05)" }}>
          <p className="label" style={{ color: "rgba(240,240,240,0.2)" }}>© 2027 13°ART. Tous droits réservés. Dessins & modèles déposés INPI.</p>
          <div className="flex gap-8">
            {["Instagram", "TikTok", "LinkedIn"].map(s => (
              <button key={s} className="nav-link text-xs" style={{ cursor: "none" }}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Home assembled ─────────────────────────────────────────────────────────────
function HomePage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <>
      <HeroHome setPage={setPage} />
      <Marquee />
      <DropActuel setPage={setPage} />
      <Concept />
      <ArtistesSlider setPage={setPage} />
      <MarseilleSection setPage={setPage} />
      <DernieresCreations setPage={setPage} />
      <CollectorLoop />
      <Newsletter />
      <Footer setPage={setPage} />
    </>
  );
}

// ── Shared Modal + Field ──────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) { document.addEventListener("keydown", esc); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9990, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#0d0d1c", border: "1px solid rgba(184,255,0,0.2)", width: wide ? "860px" : "560px", maxWidth: "95vw", maxHeight: "88vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(240,240,240,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#0d0d1c", zIndex: 1 }}>
          <span className="font-display font-black text-lg" style={{ letterSpacing: "0.1em", color: "#f0f0f0" }}>{title}</span>
          <button onClick={onClose} style={{ cursor: "none", color: "rgba(240,240,240,0.4)", background: "none", border: "none", fontSize: "1.1rem" }}>✕</button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void; }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9995, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "#0d0d1c", border: "1px solid rgba(255,45,107,0.3)", padding: "2rem", maxWidth: "400px", width: "100%" }}>
        <div className="font-display font-black text-xl mb-3" style={{ color: "#ff2d6b" }}>CONFIRMER LA SUPPRESSION</div>
        <p className="text-sm mb-6" style={{ color: "rgba(240,240,240,0.6)", lineHeight: 1.6 }}>{message}</p>
        <div className="flex gap-3">
          <button className="btn-pink flex-1 justify-center text-sm" onClick={onConfirm}>SUPPRIMER</button>
          <button className="btn-outline flex-1 justify-center text-sm" onClick={onCancel}>ANNULER</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", options, textarea, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; options?: string[]; textarea?: boolean; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <div className="label mb-1" style={{ color: "rgba(240,240,240,0.4)", fontSize: "0.58rem" }}>{label}</div>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="input-field" style={{ background: "#080810", cursor: "none" }}>
          {options.map(o => <option key={o} value={o} style={{ background: "#080810" }}>{o}</option>)}
        </select>
      ) : textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className="input-field" rows={3} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input-field" placeholder={placeholder} />
      )}
    </div>
  );
}

// ── ADMIN Back-Office ─────────────────────────────────────────────────────────
const ADMIN_SECTIONS = ["OVERVIEW", "DROPS", "PRODUITS", "STOCK", "COMMANDES", "CLIENTS", "ARTISTES", "ROYALTIES", "B2B CRM", "ANALYTICS", "CMS"];
type DropItem = { id: string; name: string; artist: string; reveal: string; release: string; qty: number; price: string; status: string; desc: string };
type ProdItem = { id: string; name: string; cat: string; artist: string; prix: string; tva: string; stock: string; seo: string; status: string };
type ArtistItem = { id: string; name: string; city: string; drops: number; sales: string; royalty: number; due: string; status: string; bio: string; insta: string };
type OrderItem = { id: string; client: string; product: string; edition: string; total: string; status: string; date: string; email: string; address: string };
type ClientItem = { id: string; name: string; email: string; orders: number; ltv: string; level: string; segment: string; drops: number; join: string; note: string };
type LeadItem = { id: string; co: string; contact: string; project: string; value: string; stage: string; date: string; email: string; desc: string };

const INIT_DROPS: DropItem[] = [
  { id: "001", name: "DOMINOS MARSEILLE", artist: "OREL", reveal: "01/09/2027", release: "15/09/2027", qty: 100, price: "189 €", status: "LIVE", desc: "Blocs en résine, fragments de pierre locale, marquages graffiti." },
  { id: "002", name: "JENGA ARCHITECTURAL", artist: "OREL", reveal: "01/03/2027", release: "15/03/2027", qty: 75, price: "245 €", status: "COMING SOON", desc: "Jeu de la tour en bois/résine, textures de Marseille." },
  { id: "003", name: "DAMES RAP MRS", artist: "OREL × ARTISTE", reveal: "01/06/2027", release: "15/06/2027", qty: 100, price: "289 €", status: "DRAFT", desc: "Plateau vinyle/résine noire, pions mini-sculptures rap marseillais." },
  { id: "004", name: "MORPION BÉTON", artist: "AMARA D.", reveal: "01/09/2027", release: "15/09/2027", qty: 50, price: "220 €", status: "DRAFT", desc: "Dalle béton brut, pions Tour CMA CGM vs Bonne Mère." },
  { id: "POC", name: "ÉCHECS MARSEILLE", artist: "OREL", reveal: "—", release: "Juin 2026", qty: 100, price: "320 €", status: "SOLD OUT", desc: "Proof of Concept Foot Locker × 13°ART." },
];
const INIT_PRODS: ProdItem[] = [
  { id: "001", name: "Dominos Marseille Éd. 001", cat: "Jeux", artist: "OREL", prix: "157,50 €", tva: "20%", stock: "87", seo: "✓", status: "Publié" },
  { id: "002", name: "Échecs Marseille (POC)", cat: "Jeux", artist: "OREL", prix: "266,67 €", tva: "20%", stock: "0", seo: "✓", status: "Sold Out" },
  { id: "003", name: "Dock Marseillais", cat: "Tech", artist: "CHEN W.", prix: "124,17 €", tva: "20%", stock: "—", seo: "✗", status: "Draft" },
  { id: "004", name: "Enceinte Calanques", cat: "Tech", artist: "OREL", prix: "207,50 €", tva: "20%", stock: "—", seo: "✗", status: "Draft" },
  { id: "005", name: "Carafe Vieux-Port", cat: "Maison", artist: "AMARA D.", prix: "99,17 €", tva: "20%", stock: "—", seo: "✗", status: "Draft" },
];
const INIT_ARTISTS: ArtistItem[] = [
  { id: "1", name: "OREL", city: "Marseille", drops: 3, sales: "18 450 €", royalty: 7, due: "1 292 €", status: "Actif", bio: "Fondateur et directeur artistique de 13°ART. Street artist marseillais.", insta: "@orel_art" },
  { id: "2", name: "MARCO S.", city: "Berlin/MRS", drops: 2, sales: "6 200 €", royalty: 8, due: "496 €", status: "Actif", bio: "Peintures à l'huile sur lin révélant une géographie intérieure abstraite.", insta: "@marco_studio" },
  { id: "3", name: "AMARA D.", city: "Dakar/MRS", drops: 1, sales: "2 835 €", royalty: 6, due: "170 €", status: "Actif", bio: "Sculptrice formée aux Beaux-Arts de Paris. Céramique émaillée.", insta: "@amara_ceramics" },
  { id: "4", name: "CHEN W.", city: "Paris/MRS", drops: 2, sales: "7 560 €", royalty: 7, due: "529 €", status: "En contrat", bio: "Maître de la sérigraphie urbaine. Tirages imprimés à la main.", insta: "@chenw_print" },
];
const INIT_ORDERS: OrderItem[] = [
  { id: "#1024", client: "Sofia M.", product: "DOMINOS #034", edition: "034/100", total: "189 €", status: "Delivered", date: "12 Août 2027", email: "sofia@mail.com", address: "12 rue de la Paix, 75001 Paris" },
  { id: "#1023", client: "Antoine R.", product: "DOMINOS #033", edition: "033/100", total: "189 €", status: "Shipped", date: "11 Août 2027", email: "antoine@mail.com", address: "4 bd Michelet, 13008 Marseille" },
  { id: "#1022", client: "Karim B.", product: "DOMINOS #032", edition: "032/100", total: "189 €", status: "Processing", date: "11 Août 2027", email: "karim@mail.com", address: "8 rue des Lilas, 69001 Lyon" },
  { id: "#1021", client: "Emma L.", product: "DOMINOS #031", edition: "031/100", total: "189 €", status: "Paid", date: "10 Août 2027", email: "emma@mail.com", address: "22 av Foch, 33000 Bordeaux" },
  { id: "#1020", client: "Romain T.", product: "DOMINOS #030", edition: "030/100", total: "189 €", status: "Production", date: "10 Août 2027", email: "romain@mail.com", address: "5 rue Beaubien, 75003 Paris" },
  { id: "#1019", client: "Yasmine O.", product: "ÉCHECS #004", edition: "004/100", total: "320 €", status: "Delivered", date: "08 Août 2027", email: "yasmine@mail.com", address: "11 bd Baille, 13005 Marseille" },
];
const INIT_CLIENTS: ClientItem[] = [
  { id: "1", name: "Sofia M.", email: "sofia@mail.com", orders: 3, ltv: "567 €", level: "COLLECTOR", segment: "VIP", drops: 2, join: "Jan 2027", note: "" },
  { id: "2", name: "Antoine R.", email: "antoine@mail.com", orders: 1, ltv: "189 €", level: "CURIOUS", segment: "Nouveau", drops: 1, join: "Août 2027", note: "" },
  { id: "3", name: "Karim B.", email: "karim@mail.com", orders: 5, ltv: "1 245 €", level: "PATRON", segment: "Collector", drops: 4, join: "Déc 2026", note: "Collector VIP depuis le lancement" },
  { id: "4", name: "Emma L.", email: "emma@mail.com", orders: 2, ltv: "378 €", level: "INSIDER", segment: "Collector", drops: 2, join: "Mars 2027", note: "" },
  { id: "5", name: "Foot Locker FR", email: "b2b@footlocker.fr", orders: 1, ltv: "24 000 €", level: "—", segment: "B2B", drops: 0, join: "Juin 2026", note: "Client B2B fondateur. Renouvellement prévu 2027." },
];
const INIT_LEADS: LeadItem[] = [
  { id: "1", co: "Foot Locker FR", contact: "Sophie D.", project: "Jeu d'échecs MRS", value: "24 000 €", stage: "WON", date: "Juin 2026", email: "sophie@footlocker.fr", desc: "Réalisé. Renouvellement à prévoir pour 2027." },
  { id: "2", co: "Hôtel Intercontinental", contact: "Marc F.", project: "Dominos Art Brut", value: "8 500 €", stage: "PROPOSAL", date: "Sept 2027", email: "marc@intercont.fr", desc: "Proposition envoyée. En attente de retour direction." },
  { id: "3", co: "Marseille Promotion", contact: "Julie R.", project: "Objet souvenir éditorial", value: "15 000 €", stage: "BRIEF", date: "Oct 2027", email: "julie@mpromotion.fr", desc: "Brief reçu. Direction artistique en cours." },
  { id: "4", co: "Hermès France", contact: "Camille N.", project: "Collab packaging premium", value: "45 000 €", stage: "CONTACTED", date: "Nov 2027", email: "camille@hermes.fr", desc: "Premier contact établi. RDV à caler." },
  { id: "5", co: "Air France", contact: "Luc P.", project: "Kit bienvenue Business", value: "120 000 €", stage: "LEAD", date: "Déc 2027", email: "luc@airfrance.fr", desc: "Lead entrant. À qualifier." },
];

const MOCK_ORDERS = [
  { id: "#1024", client: "Sofia M.", product: "DOMINOS #034", edition: "034/100", total: "189 €", status: "Delivered", date: "12 Août 2027" },
  { id: "#1023", client: "Antoine R.", product: "DOMINOS #033", edition: "033/100", total: "189 €", status: "Shipped", date: "11 Août 2027" },
  { id: "#1022", client: "Karim B.", product: "DOMINOS #032", edition: "032/100", total: "189 €", status: "Processing", date: "11 Août 2027" },
  { id: "#1021", client: "Emma L.", product: "DOMINOS #031", edition: "031/100", total: "189 €", status: "Paid", date: "10 Août 2027" },
  { id: "#1020", client: "Romain T.", product: "DOMINOS #030", edition: "030/100", total: "189 €", status: "Production", date: "10 Août 2027" },
  { id: "#1019", client: "Yasmine O.", product: "ÉCHECS #004", edition: "004/100", total: "320 €", status: "Delivered", date: "08 Août 2027" },
];

const MOCK_CLIENTS = [
  { name: "Sofia M.", email: "sofia@mail.com", orders: 3, ltv: "567 €", level: "COLLECTOR", segment: "VIP", drops: 2, join: "Jan 2027" },
  { name: "Antoine R.", email: "antoine@mail.com", orders: 1, ltv: "189 €", level: "CURIOUS", segment: "Nouveau", drops: 1, join: "Août 2027" },
  { name: "Karim B.", email: "karim@mail.com", orders: 5, ltv: "1 245 €", level: "PATRON", segment: "Collector", drops: 4, join: "Déc 2026" },
  { name: "Emma L.", email: "emma@mail.com", orders: 2, ltv: "378 €", level: "INSIDER", segment: "Collector", drops: 2, join: "Mars 2027" },
  { name: "Foot Locker FR", email: "b2b@footlocker.fr", orders: 1, ltv: "24 000 €", level: "—", segment: "B2B", drops: 0, join: "Juin 2026" },
];

const MOCK_ARTISTS = [
  { name: "OREL", city: "Marseille", drops: 3, sales: "18 450 €", royalty: 7, due: "1 292 €", status: "Actif" },
  { name: "MARCO S.", city: "Berlin/MRS", drops: 2, sales: "6 200 €", royalty: 8, due: "496 €", status: "Actif" },
  { name: "AMARA D.", city: "Dakar/MRS", drops: 1, sales: "2 835 €", royalty: 6, due: "170 €", status: "Actif" },
  { name: "CHEN W.", city: "Paris/MRS", drops: 2, sales: "7 560 €", royalty: 7, due: "529 €", status: "En contrat" },
];

const B2B_LEADS = [
  { co: "Foot Locker FR", contact: "Sophie D.", project: "Jeu d'échecs MRS", value: "24 000 €", stage: "WON", date: "Juin 2026" },
  { co: "Hôtel Intercontinental", contact: "Marc F.", project: "Dominos Art Brut", value: "8 500 €", stage: "PROPOSAL", date: "Sept 2027" },
  { co: "Marseille Promotion", contact: "Julie R.", project: "Objet souvenir", value: "15 000 €", stage: "BRIEF", date: "Oct 2027" },
  { co: "Hermès France", contact: "Camille N.", project: "Collab packaging", value: "45 000 €", stage: "CONTACTED", date: "Nov 2027" },
  { co: "Air France", contact: "Luc P.", project: "Kit bienvenue", value: "120 000 €", stage: "LEAD", date: "Déc 2027" },
];

const STAGE_COLOR: Record<string, string> = { LEAD: "#6b2fff", CONTACTED: "#b8ff00", QUALIFIED: "#b8ff00", BRIEF: "#b8ff00", PROPOSAL: "#ff2d6b", PROTOTYPE: "#ff2d6b", NEGOTIATION: "#ff8c00", WON: "#00ff88", PRODUCTION: "#00ff88" };
const STATUS_COLOR: Record<string, string> = { Paid: "#b8ff00", Processing: "#6b2fff", Production: "#ff8c00", Shipped: "#b8ff00", Delivered: "#00ff88", Returned: "#ff2d6b", Refunded: "#ff2d6b" };

function AdminPage() {
  const [section, setSection] = useState("OVERVIEW");
  const [dropFilter, setDropFilter] = useState("ALL");

  // ── State data
  const [drops, setDrops] = useState<DropItem[]>(INIT_DROPS);
  const [prods, setProds] = useState<ProdItem[]>(INIT_PRODS);
  const [artists, setArtists] = useState<ArtistItem[]>(INIT_ARTISTS);
  const [orders, setOrders] = useState<OrderItem[]>(INIT_ORDERS);
  const [clients, setClients] = useState<ClientItem[]>(INIT_CLIENTS);
  const [leads, setLeads] = useState<LeadItem[]>(INIT_LEADS);
  const [stockState, setStockState] = useState<Record<number, string>>({});
  const getSlot = (n: number) => stockState[n] || (n <= 13 ? "sold" : n <= 15 ? "reserved" : "available");
  const cycleSlot = (n: number) => {
    const cur = getSlot(n);
    const next = cur === "available" ? "sold" : cur === "sold" ? "reserved" : "available";
    setStockState(s => ({ ...s, [n]: next }));
  };

  // ── Modal state
  type ModalType = "drop" | "prod" | "artist" | "order" | "client" | "lead";
  type ModalMode = "add" | "edit" | "view";
  const [modal, setModal] = useState<{ type: ModalType; mode: ModalMode; item?: Record<string, unknown> } | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [confirm, setConfirm] = useState<{ section: ModalType; id: string; name: string } | null>(null);
  const ff = (k: string) => String(formData[k] ?? "");
  const sf = (k: string) => (v: string) => setFormData(d => ({ ...d, [k]: v }));
  const openModal = (type: ModalType, mode: ModalMode, item?: Record<string, unknown>) => {
    setFormData(item ? { ...item } as Record<string, string | number> : {});
    setModal({ type, mode, item });
  };

  // ── CRUD helpers
  const saveItem = () => {
    if (!modal) return;
    const id = String(formData.id || Date.now());
    const data = { ...formData, id };
    if (modal.type === "drop") setDrops(d => modal.mode === "add" ? [...d, data as unknown as DropItem] : d.map(x => x.id === id ? data as unknown as DropItem : x));
    if (modal.type === "prod") setProds(d => modal.mode === "add" ? [...d, data as unknown as ProdItem] : d.map(x => x.id === id ? data as unknown as ProdItem : x));
    if (modal.type === "artist") setArtists(d => modal.mode === "add" ? [...d, data as unknown as ArtistItem] : d.map(x => x.id === id ? data as unknown as ArtistItem : x));
    if (modal.type === "client") setClients(d => modal.mode === "add" ? [...d, data as unknown as ClientItem] : d.map(x => x.id === id ? data as unknown as ClientItem : x));
    if (modal.type === "lead") setLeads(d => modal.mode === "add" ? [...d, data as unknown as LeadItem] : d.map(x => x.id === id ? data as unknown as LeadItem : x));
    if (modal.type === "order") setOrders(d => d.map(x => x.id === id ? data as unknown as OrderItem : x));
    setModal(null);
  };
  const deleteItem = () => {
    if (!confirm) return;
    if (confirm.section === "drop") setDrops(d => d.filter(x => x.id !== confirm.id));
    if (confirm.section === "prod") setProds(d => d.filter(x => x.id !== confirm.id));
    if (confirm.section === "artist") setArtists(d => d.filter(x => x.id !== confirm.id));
    if (confirm.section === "client") setClients(d => d.filter(x => x.id !== confirm.id));
    if (confirm.section === "lead") setLeads(d => d.filter(x => x.id !== confirm.id));
    if (confirm.section === "order") setOrders(d => d.filter(x => x.id !== confirm.id));
    setConfirm(null);
  };

  const sidebarItem = (label: string) => (
    <button key={label} onClick={() => setSection(label)}
      className="w-full text-left px-4 py-2.5 text-sm font-mono transition-all"
      style={{ background: section === label ? "rgba(184,255,0,0.1)" : "transparent", color: section === label ? "#b8ff00" : "rgba(240,240,240,0.45)", borderLeft: `2px solid ${section === label ? "#b8ff00" : "transparent"}`, letterSpacing: "0.1em" }}>
      {label}
    </button>
  );

  return (
    <div style={{ background: "#08080f", minHeight: "100vh", display: "flex", paddingTop: "60px" }}>
      {/* Sidebar */}
      <aside style={{ width: "220px", flexShrink: 0, background: "#090912", borderRight: "1px solid rgba(240,240,240,0.07)", paddingTop: "2rem", display: "flex", flexDirection: "column" }}>
        <div className="px-4 mb-6">
          <div className="font-display font-black text-xl" style={{ color: "#b8ff00", letterSpacing: "0.15em" }}>13°ART</div>
          <div className="text-xs font-mono mt-1" style={{ color: "rgba(240,240,240,0.3)", letterSpacing: "0.12em" }}>BACK-OFFICE</div>
        </div>
        <div className="flex flex-col gap-0.5">
          {ADMIN_SECTIONS.map(sidebarItem)}
        </div>
        <div className="mt-auto px-4 pb-6">
          <div className="text-xs font-mono" style={{ color: "rgba(240,240,240,0.2)", letterSpacing: "0.08em" }}>v1.0 · MVP</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>

        {/* OVERVIEW */}
        {section === "OVERVIEW" && (
          <div>
            <h1 className="font-display font-black text-3xl mb-8" style={{ letterSpacing: "0.1em" }}>OVERVIEW</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "CA TOTAL", value: "27 045 €", sub: "+12% ce mois", color: "#b8ff00" },
                { label: "COMMANDES", value: "143", sub: "6 en cours", color: "#6b2fff" },
                { label: "CLIENTS", value: "89", sub: "5 VIP · 12 collectors", color: "#ff2d6b" },
                { label: "DROPS ACTIFS", value: "1", sub: "DROP 001 · 87/100", color: "#b8ff00" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{ background: "#0f0f1a", border: `1px solid ${color}20`, padding: "1.25rem" }}>
                  <div className="label mb-1" style={{ color: "rgba(240,240,240,0.4)" }}>{label}</div>
                  <div className="font-display font-black text-3xl" style={{ color, lineHeight: 1 }}>{value}</div>
                  <div className="text-xs mt-2" style={{ color: "rgba(240,240,240,0.35)" }}>{sub}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
                <div className="label mb-4" style={{ color: "#b8ff00" }}>DROPS STATUS</div>
                {[
                  { name: "DOMINOS 001", status: "LIVE", sold: 13, total: 100, color: "#b8ff00" },
                  { name: "JENGA 002", status: "COMING SOON", sold: 0, total: 75, color: "#6b2fff" },
                  { name: "DAMES RAP 003", status: "DRAFT", sold: 0, total: 100, color: "rgba(240,240,240,0.3)" },
                ].map(d => (
                  <div key={d.name} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(240,240,240,0.05)" }}>
                    <div>
                      <div className="font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{d.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(240,240,240,0.35)" }}>{d.sold}/{d.total} vendus</div>
                    </div>
                    <span className="font-mono text-xs px-2 py-1" style={{ background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40` }}>{d.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
                <div className="label mb-4" style={{ color: "#ff2d6b" }}>DERNIÈRES COMMANDES</div>
                {MOCK_ORDERS.slice(0, 4).map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(240,240,240,0.05)" }}>
                    <div>
                      <div className="font-mono text-sm" style={{ color: "#f0f0f0" }}>{o.id} · {o.client}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(240,240,240,0.35)" }}>{o.product}</div>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5" style={{ background: `${STATUS_COLOR[o.status] || "#b8ff00"}18`, color: STATUS_COLOR[o.status] || "#b8ff00" }}>{o.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
              <div className="label mb-4" style={{ color: "#6b2fff" }}>ROYALTIES EN ATTENTE</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MOCK_ARTISTS.map(a => (
                  <div key={a.name} style={{ background: "#0a0a14", padding: "1rem", border: "1px solid rgba(240,240,240,0.05)" }}>
                    <div className="font-display font-black text-lg" style={{ color: "#f0f0f0" }}>{a.name}</div>
                    <div className="font-mono text-xl mt-1" style={{ color: "#b8ff00" }}>{a.due}</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(240,240,240,0.35)" }}>{a.royalty}% · {a.sales}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DROPS */}
        {section === "DROPS" && (() => {
          const filtered = drops.filter(d => dropFilter === "ALL" || d.status === dropFilter);
          const SC: Record<string, string> = { LIVE: "#b8ff00", "COMING SOON": "#6b2fff", DRAFT: "rgba(240,240,240,0.3)", "SOLD OUT": "#ff2d6b", ARCHIVED: "rgba(240,240,240,0.2)" };
          return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display font-black text-3xl" style={{ letterSpacing: "0.1em" }}>DROPS</h1>
              <button className="btn-acid text-sm py-2 px-4" onClick={() => openModal("drop", "add")}>+ NOUVEAU DROP</button>
            </div>
            <div className="flex gap-2 mb-6 flex-wrap">
              {["ALL", "DRAFT", "COMING SOON", "LIVE", "SOLD OUT", "ARCHIVED"].map(f => (
                <button key={f} onClick={() => setDropFilter(f)} className="font-mono text-xs px-3 py-1.5 transition-all"
                  style={{ background: dropFilter === f ? "#b8ff00" : "transparent", color: dropFilter === f ? "#08080f" : "rgba(240,240,240,0.45)", border: "1px solid rgba(240,240,240,0.12)", cursor: "none" }}>{f}</button>
              ))}
            </div>
            <div style={{ border: "1px solid rgba(240,240,240,0.07)", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["ID", "NOM", "ARTISTE", "REVEAL", "RELEASE", "QTÉ", "PRIX", "STATUS", "ACTIONS"].map(h => (
                      <th key={h} className="font-mono text-left px-4 py-3 text-xs" style={{ color: "rgba(240,240,240,0.35)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(240,240,240,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const c = SC[d.status] || "#b8ff00";
                    return (
                      <tr key={d.id} style={{ borderBottom: "1px solid rgba(240,240,240,0.04)" }}>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: "#b8ff00" }}>#{d.id}</td>
                        <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{d.name}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "rgba(240,240,240,0.6)" }}>{d.artist}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.5)" }}>{d.reveal}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.5)" }}>{d.release}</td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: "#f0f0f0" }}>{d.qty}</td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: "#f0f0f0" }}>{d.price}</td>
                        <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5" style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>{d.status}</span></td>
                        <td className="px-4 py-3"><div className="flex gap-1.5">
                          <button onClick={() => openModal("drop", "view", d as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(184,255,0,0.3)", color: "#b8ff00", cursor: "none" }}>VOIR</button>
                          <button onClick={() => openModal("drop", "edit", d as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(240,240,240,0.15)", color: "rgba(240,240,240,0.5)", cursor: "none" }}>ÉDITER</button>
                          <button onClick={() => setConfirm({ section: "drop", id: d.id, name: d.name })} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(255,45,107,0.3)", color: "#ff2d6b", cursor: "none" }}>✕</button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* PRODUITS */}
        {section === "PRODUITS" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display font-black text-3xl" style={{ letterSpacing: "0.1em" }}>PRODUITS</h1>
              <button className="btn-acid text-sm py-2 px-4" onClick={() => openModal("prod", "add")}>+ NOUVEAU PRODUIT</button>
            </div>
            <div style={{ border: "1px solid rgba(240,240,240,0.07)", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["NOM", "CAT", "ARTISTE", "PRIX HT", "TVA", "STOCK", "SEO", "STATUT", "ACTIONS"].map(h => (
                      <th key={h} className="font-mono text-left px-4 py-3 text-xs" style={{ color: "rgba(240,240,240,0.35)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(240,240,240,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prods.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(240,240,240,0.04)" }}>
                      <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{p.name}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "rgba(240,240,240,0.5)" }}>{p.cat}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#b8ff00" }}>{p.artist}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: "#f0f0f0" }}>{p.prix}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.45)" }}>{p.tva}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: p.stock === "0" ? "#ff2d6b" : "#b8ff00" }}>{p.stock}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: p.seo === "✓" ? "#b8ff00" : "#ff2d6b" }}>{p.seo}</td>
                      <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5" style={{ background: p.status === "Publié" ? "#b8ff0015" : p.status === "Sold Out" ? "#ff2d6b15" : "rgba(255,255,255,0.05)", color: p.status === "Publié" ? "#b8ff00" : p.status === "Sold Out" ? "#ff2d6b" : "rgba(240,240,240,0.4)" }}>{p.status}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1.5">
                        <button onClick={() => openModal("prod", "view", p as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(184,255,0,0.3)", color: "#b8ff00", cursor: "none" }}>VOIR</button>
                        <button onClick={() => openModal("prod", "edit", p as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(240,240,240,0.15)", color: "rgba(240,240,240,0.5)", cursor: "none" }}>ÉDITER</button>
                        <button onClick={() => setConfirm({ section: "prod", id: p.id, name: p.name })} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(255,45,107,0.3)", color: "#ff2d6b", cursor: "none" }}>✕</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STOCK */}
        {section === "STOCK" && (
          <div>
            <h1 className="font-display font-black text-3xl mb-2" style={{ letterSpacing: "0.1em" }}>STOCK</h1>
            <div className="label mb-6" style={{ color: "#b8ff00" }}>DOMINOS MARSEILLE · ÉDITION 001 · 100 PIÈCES</div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[{ l: "TOTAL", v: "100", c: "#f0f0f0" }, { l: "VENDUS", v: "13", c: "#b8ff00" }, { l: "DISPONIBLES", v: "87", c: "#b8ff00" }, { l: "RÉSERVÉS", v: "0", c: "#ff8c00" }].map(({ l, v, c }) => (
                <div key={l} style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1rem" }}>
                  <div className="label mb-1">{l}</div>
                  <div className="font-display font-black text-3xl" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
              <div className="label mb-4">NUMÉROS INDIVIDUELS</div>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 100 }, (_, i) => {
                  const n = i + 1;
                  const sold = n <= 13;
                  const reserved = n === 14 || n === 15;
                  return (
                    <div key={n} className="text-center py-2 font-mono text-xs rounded-sm transition-all"
                      style={{ background: sold ? "#b8ff0020" : reserved ? "#ff8c0020" : "#0a0a14", color: sold ? "#b8ff00" : reserved ? "#ff8c00" : "rgba(240,240,240,0.25)", border: `1px solid ${sold ? "#b8ff0040" : reserved ? "#ff8c0040" : "rgba(240,240,240,0.06)"}`, cursor: "none" }}>
                      {String(n).padStart(3, "0")}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-6 mt-4">
                {[{ c: "#b8ff00", l: "SOLD (13)" }, { c: "#ff8c00", l: "RÉSERVÉ (2)" }, { c: "rgba(240,240,240,0.25)", l: "DISPONIBLE (85)" }].map(({ c, l }) => (
                  <div key={l} className="flex items-center gap-2"><div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} /><span className="font-mono text-xs" style={{ color: "rgba(240,240,240,0.5)" }}>{l}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COMMANDES */}
        {section === "COMMANDES" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display font-black text-3xl" style={{ letterSpacing: "0.1em" }}>COMMANDES</h1>
              <button className="btn-acid text-sm py-2 px-4" onClick={() => openModal("order", "add")}>+ NOUVELLE COMMANDE</button>
            </div>
            <div style={{ border: "1px solid rgba(240,240,240,0.07)", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["ORDER", "CLIENT", "PRODUIT", "ÉDITION", "TOTAL", "DATE", "STATUS", "ACTIONS"].map(h => (
                      <th key={h} className="font-mono text-left px-4 py-3 text-xs" style={{ color: "rgba(240,240,240,0.35)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(240,240,240,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: "1px solid rgba(240,240,240,0.04)" }}>
                      <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: "#b8ff00" }}>{o.id}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: "#f0f0f0" }}>{o.client}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "rgba(240,240,240,0.7)" }}>{o.product}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.5)" }}>#{o.edition}</td>
                      <td className="px-4 py-3 font-mono text-sm" style={{ color: "#f0f0f0" }}>{o.total}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.45)" }}>{o.date}</td>
                      <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5" style={{ background: `${STATUS_COLOR[o.status] || "#b8ff00"}15`, color: STATUS_COLOR[o.status] || "#b8ff00" }}>{o.status}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1.5">
                        <button onClick={() => openModal("order", "view", o as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(184,255,0,0.3)", color: "#b8ff00", cursor: "none" }}>VOIR</button>
                        <button onClick={() => openModal("order", "edit", o as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(240,240,240,0.15)", color: "rgba(240,240,240,0.5)", cursor: "none" }}>ÉDITER</button>
                        <button onClick={() => setConfirm({ section: "order", id: o.id, name: o.id })} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(255,45,107,0.3)", color: "#ff2d6b", cursor: "none" }}>✕</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CLIENTS */}
        {section === "CLIENTS" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display font-black text-3xl" style={{ letterSpacing: "0.1em" }}>CLIENTS</h1>
              <button className="btn-acid text-sm py-2 px-4" onClick={() => openModal("client", "add")}>+ NOUVEAU CLIENT</button>
            </div>
            <div style={{ border: "1px solid rgba(240,240,240,0.07)", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["CLIENT", "EMAIL", "COMMANDES", "LTV", "LEVEL", "SEGMENT", "DROPS", "INSCRIPTION", "ACTIONS"].map(h => (
                      <th key={h} className="font-mono text-left px-4 py-3 text-xs" style={{ color: "rgba(240,240,240,0.35)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(240,240,240,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => {
                    const segColor = { VIP: "#ff2d6b", Collector: "#b8ff00", Nouveau: "#6b2fff", B2B: "#ff8c00" }[c.segment] || "#f0f0f0";
                    return (
                      <tr key={c.id} style={{ borderBottom: "1px solid rgba(240,240,240,0.04)" }}>
                        <td className="px-4 py-3 font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{c.name}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.45)" }}>{c.email}</td>
                        <td className="px-4 py-3 font-mono text-sm text-center" style={{ color: "#f0f0f0" }}>{c.orders}</td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: "#b8ff00" }}>{c.ltv}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.6)" }}>{c.level}</td>
                        <td className="px-4 py-3"><span className="font-mono text-xs px-2 py-0.5" style={{ background: `${segColor}15`, color: segColor, border: `1px solid ${segColor}30` }}>{c.segment}</span></td>
                        <td className="px-4 py-3 font-mono text-sm text-center" style={{ color: "rgba(240,240,240,0.6)" }}>{c.drops}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(240,240,240,0.35)" }}>{c.join}</td>
                        <td className="px-4 py-3"><div className="flex gap-1.5">
                          <button onClick={() => openModal("client", "view", c as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(184,255,0,0.3)", color: "#b8ff00", cursor: "none" }}>VOIR</button>
                          <button onClick={() => openModal("client", "edit", c as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(240,240,240,0.15)", color: "rgba(240,240,240,0.5)", cursor: "none" }}>ÉDITER</button>
                          <button onClick={() => setConfirm({ section: "client", id: c.id, name: c.name })} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(255,45,107,0.3)", color: "#ff2d6b", cursor: "none" }}>✕</button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ARTISTES */}
        {section === "ARTISTES" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-display font-black text-3xl" style={{ letterSpacing: "0.1em" }}>ARTISTES</h1>
              <button className="btn-acid text-sm py-2 px-4" onClick={() => openModal("artist", "add")}>+ AJOUTER ARTISTE</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {artists.map(a => (
                <div key={a.id} style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-display font-black text-2xl" style={{ color: "#f0f0f0" }}>{a.name}</div>
                      <div className="label mt-1">{a.city} · {a.drops} DROPS</div>
                    </div>
                    <span className="font-mono text-xs px-2 py-1" style={{ background: "#b8ff0015", color: "#b8ff00", border: "1px solid #b8ff0030" }}>{a.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div style={{ background: "#0a0a14", padding: "0.75rem" }}>
                      <div className="label text-xs mb-1">VENTES HT</div>
                      <div className="font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{a.sales}</div>
                    </div>
                    <div style={{ background: "#0a0a14", padding: "0.75rem" }}>
                      <div className="label text-xs mb-1">ROYALTY</div>
                      <div className="font-mono text-sm font-bold" style={{ color: "#6b2fff" }}>{a.royalty} %</div>
                    </div>
                    <div style={{ background: "#0a0a14", padding: "0.75rem" }}>
                      <div className="label text-xs mb-1">DÛ</div>
                      <div className="font-mono text-sm font-bold" style={{ color: "#b8ff00" }}>{a.due}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openModal("artist", "view", a as unknown as Record<string, unknown>)} className="btn-outline text-xs py-1.5 px-3">PROFIL</button>
                    <button onClick={() => openModal("artist", "edit", a as unknown as Record<string, unknown>)} className="btn-outline text-xs py-1.5 px-3">ÉDITER</button>
                    <button onClick={() => setConfirm({ section: "artist", id: a.id, name: a.name })} className="font-mono text-xs py-1.5 px-3" style={{ border: "1px solid rgba(255,45,107,0.3)", color: "#ff2d6b", cursor: "none" }}>SUPPRIMER</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROYALTIES */}
        {section === "ROYALTIES" && (
          <div>
            <h1 className="font-display font-black text-3xl mb-8" style={{ letterSpacing: "0.1em" }}>ROYALTIES</h1>
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[{ l: "VENTES HT TOTALES", v: "34 045 €", c: "#f0f0f0" }, { l: "ROYALTIES DUES", v: "2 487 €", c: "#b8ff00" }, { l: "ROYALTIES VERSÉES", v: "1 292 €", c: "#6b2fff" }].map(({ l, v, c }) => (
                <div key={l} style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.25rem" }}>
                  <div className="label mb-1">{l}</div>
                  <div className="font-display font-black text-3xl" style={{ color: c }}>{v}</div>
                </div>
              ))}
            </div>
            {artists.map(a => (
              <div key={a.id} style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem", marginBottom: "1rem" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="font-display font-black text-xl" style={{ color: "#f0f0f0" }}>{a.name}</div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setArtists(prev => prev.map(x => x.id === a.id ? { ...x, due: "0 €" } : x));
                    }} className="font-mono text-xs px-3 py-1.5" style={{ border: "1px solid #6b2fff40", color: "#6b2fff", cursor: "none" }}>MARQUER PAYÉ</button>
                    <button className="font-mono text-xs px-3 py-1.5" style={{ border: "1px solid #b8ff0040", color: "#b8ff00", cursor: "none" }}>EXPORT COMPTABLE</button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div><div className="label text-xs mb-1">VENTES HT</div><div className="font-mono text-lg" style={{ color: "#f0f0f0" }}>{a.sales}</div></div>
                  <div><div className="label text-xs mb-1">ROYALTY %</div><div className="font-mono text-lg" style={{ color: "#6b2fff" }}>× {a.royalty} %</div></div>
                  <div style={{ borderLeft: "2px solid #b8ff00", paddingLeft: "1rem" }}>
                    <div className="label text-xs mb-1">DÛ À L'ARTISTE</div>
                    <div className="font-mono text-2xl font-bold" style={{ color: "#b8ff00" }}>= {a.due}</div>
                  </div>
                  <div><div className="label text-xs mb-1">STATUS</div><span className="font-mono text-xs px-2 py-1" style={{ background: a.due === "0 €" ? "#6b2fff15" : "#b8ff0015", color: a.due === "0 €" ? "#6b2fff" : "#b8ff00", border: `1px solid ${a.due === "0 €" ? "#6b2fff30" : "#b8ff0030"}` }}>{a.due === "0 €" ? "VERSÉ" : "EN ATTENTE"}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* B2B CRM */}
        {section === "B2B CRM" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="font-display font-black text-3xl" style={{ letterSpacing: "0.1em" }}>B2B CRM · PIPELINE</h1>
              <button className="btn-acid text-sm py-2 px-4" onClick={() => openModal("lead", "add")}>+ NOUVEAU LEAD</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {["LEAD", "CONTACTED", "QUALIFIED", "BRIEF", "PROPOSAL", "PROTOTYPE", "NEGOTIATION", "WON"].map(stage => (
                <div key={stage} style={{ minWidth: "200px", flexShrink: 0 }}>
                  <div className="font-mono text-xs mb-3 px-1" style={{ color: STAGE_COLOR[stage] || "#f0f0f0", letterSpacing: "0.12em" }}>{stage}</div>
                  <div className="flex flex-col gap-2">
                    {leads.filter(l => l.stage === stage).map(lead => (
                      <div key={lead.id} style={{ background: "#0f0f1a", border: `1px solid ${STAGE_COLOR[stage] || "#f0f0f0"}20`, padding: "0.75rem", cursor: "none" }}
                        onClick={() => openModal("lead", "view", lead as unknown as Record<string, unknown>)}>
                        <div className="font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{lead.co}</div>
                        <div className="text-xs mt-1" style={{ color: "rgba(240,240,240,0.45)" }}>{lead.contact}</div>
                        <div className="text-xs mt-1" style={{ color: "rgba(240,240,240,0.6)" }}>{lead.project}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="font-mono text-sm" style={{ color: STAGE_COLOR[stage] || "#b8ff00" }}>{lead.value}</div>
                          <button onClick={e => { e.stopPropagation(); openModal("lead", "edit", lead as unknown as Record<string, unknown>); }} className="font-mono text-xs px-1.5 py-0.5" style={{ border: "1px solid rgba(240,240,240,0.15)", color: "rgba(240,240,240,0.4)", cursor: "none" }}>✎</button>
                        </div>
                      </div>
                    ))}
                    {leads.filter(l => l.stage === stage).length === 0 && (
                      <div style={{ background: "#0a0a14", border: "1px dashed rgba(240,240,240,0.08)", padding: "1.5rem", textAlign: "center" }}>
                        <div className="font-mono text-xs" style={{ color: "rgba(240,240,240,0.2)" }}>—</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8" style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
              <div className="label mb-4">TOUS LES LEADS</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0a0a14" }}>
                    {["ENTREPRISE", "CONTACT", "PROJET", "VALEUR", "STAGE", "DATE", "ACTIONS"].map(h => (
                      <th key={h} className="font-mono text-left px-4 py-2 text-xs" style={{ color: "rgba(240,240,240,0.3)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(240,240,240,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} style={{ borderBottom: "1px solid rgba(240,240,240,0.04)" }}>
                      <td className="px-4 py-2.5 font-mono text-sm font-bold" style={{ color: "#f0f0f0" }}>{l.co}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: "rgba(240,240,240,0.55)" }}>{l.contact}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: "rgba(240,240,240,0.7)" }}>{l.project}</td>
                      <td className="px-4 py-2.5 font-mono text-sm" style={{ color: "#b8ff00" }}>{l.value}</td>
                      <td className="px-4 py-2.5"><span className="font-mono text-xs px-2 py-0.5" style={{ background: `${STAGE_COLOR[l.stage] || "#f0f0f0"}15`, color: STAGE_COLOR[l.stage] || "#f0f0f0" }}>{l.stage}</span></td>
                      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "rgba(240,240,240,0.35)" }}>{l.date}</td>
                      <td className="px-4 py-2.5"><div className="flex gap-1.5">
                        <button onClick={() => openModal("lead", "edit", l as unknown as Record<string, unknown>)} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(240,240,240,0.15)", color: "rgba(240,240,240,0.5)", cursor: "none" }}>ÉDITER</button>
                        <button onClick={() => setConfirm({ section: "lead", id: l.id, name: l.co })} className="font-mono text-xs px-2 py-1" style={{ border: "1px solid rgba(255,45,107,0.3)", color: "#ff2d6b", cursor: "none" }}>✕</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {section === "ANALYTICS" && (
          <div>
            <h1 className="font-display font-black text-3xl mb-8" style={{ letterSpacing: "0.1em" }}>ANALYTICS</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { l: "CA CE MOIS", v: "3 402 €", sub: "+18% vs mois préc.", c: "#b8ff00" },
                { l: "PANIER MOYEN", v: "189 €", sub: "Stable", c: "#6b2fff" },
                { l: "TAUX CONV.", v: "4,2 %", sub: "+0.8pt", c: "#b8ff00" },
                { l: "MARGE BRUTE", v: "62 %", sub: "Objectif 60%+", c: "#00ff88" },
                { l: "VISITEURS", v: "1 247", sub: "Ce mois", c: "#f0f0f0" },
                { l: "NOUVEAUX", v: "834", sub: "67%", c: "#f0f0f0" },
                { l: "RÉACHAT", v: "28 %", sub: "Collectors", c: "#ff2d6b" },
                { l: "LTV MOY.", v: "312 €", sub: "Collectors: 789 €", c: "#b8ff00" },
              ].map(({ l, v, sub, c }) => (
                <div key={l} style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1rem" }}>
                  <div className="label mb-1" style={{ color: "rgba(240,240,240,0.35)" }}>{l}</div>
                  <div className="font-display font-black text-2xl" style={{ color: c }}>{v}</div>
                  <div className="text-xs mt-1" style={{ color: "rgba(240,240,240,0.3)" }}>{sub}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
                <div className="label mb-4" style={{ color: "#b8ff00" }}>DROP 001 · PERFORMANCE</div>
                {[
                  { l: "Visiteurs page", v: "4 218", bar: 100 },
                  { l: "Waitlist inscrits", v: "312", bar: 74 },
                  { l: "Conversions", v: "13", bar: 31 },
                  { l: "Panier abandonné", v: "89", bar: 21 },
                  { l: "Stock restant", v: "87/100", bar: 87 },
                ].map(({ l, v, bar }) => (
                  <div key={l} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "rgba(240,240,240,0.55)" }}>{l}</span>
                      <span className="font-mono" style={{ color: "#f0f0f0" }}>{v}</span>
                    </div>
                    <div className="w-full h-1" style={{ background: "rgba(240,240,240,0.08)" }}>
                      <div style={{ width: `${bar}%`, height: "100%", background: "linear-gradient(to right, #b8ff00, #6b2fff)" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.5rem" }}>
                <div className="label mb-4" style={{ color: "#6b2fff" }}>CLIENTS · SEGMENTATION</div>
                {[
                  { seg: "LEGEND", count: 1, pct: 1, c: "#b8ff00" },
                  { seg: "PATRON", count: 3, pct: 3, c: "#6b2fff" },
                  { seg: "COLLECTOR", count: 12, pct: 13, c: "#ff2d6b" },
                  { seg: "INSIDER", count: 18, pct: 20, c: "#ff8c00" },
                  { seg: "CURIOUS", count: 55, pct: 62, c: "rgba(240,240,240,0.45)" },
                ].map(({ seg, count, pct, c }) => (
                  <div key={seg} className="flex items-center gap-3 mb-3">
                    <div className="font-mono text-xs w-20" style={{ color: c }}>{seg}</div>
                    <div className="flex-1 h-1.5" style={{ background: "rgba(240,240,240,0.08)" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: c }} />
                    </div>
                    <div className="font-mono text-xs w-12 text-right" style={{ color: "rgba(240,240,240,0.5)" }}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CMS */}
        {section === "CMS" && (
          <div>
            <h1 className="font-display font-black text-3xl mb-8" style={{ letterSpacing: "0.1em" }}>CMS · CONTENU</h1>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { section: "HOME", items: ["Hero banner", "Drop actuel", "Concept", "Newsletter CTA"], status: "Publié" },
                { section: "STORIES", items: ["7 articles", "5 catégories", "Making-of Dominos", "Behind the Drop"], status: "2 brouillons" },
                { section: "ARTISTES", items: ["4 profils", "Bios", "Portfolios", "Inspirations"], status: "Publié" },
                { section: "MARSEILLE", items: ["Carte interactive", "5 spots", "Matières", "Espace phygital"], status: "Publié" },
                { section: "FOR BUSINESS", items: ["Hero copy", "Foot Locker POC", "Formulaire", "Parcours B2B"], status: "Publié" },
                { section: "PAGES", items: ["CGV", "Mentions légales", "RGPD", "FAQ", "About"], status: "3 manquants" },
                { section: "MENUS", items: ["Nav principale", "Footer", "Mobile", "Breadcrumbs"], status: "Publié" },
                { section: "SEO", items: ["Titles", "Meta desc", "OG images", "Structured data"], status: "À compléter" },
                { section: "FAQ", items: ["Livraison", "Retours", "Certificat", "Éditions", "B2B"], status: "5 Q&A" },
              ].map(({ section: sec, items, status }) => (
                <div key={sec} style={{ background: "#0f0f1a", border: "1px solid rgba(240,240,240,0.07)", padding: "1.25rem" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-display font-black text-lg" style={{ color: "#f0f0f0", letterSpacing: "0.08em" }}>{sec}</div>
                    <span className="font-mono text-xs px-2 py-0.5" style={{ background: status === "Publié" ? "#b8ff0015" : "#ff2d6b15", color: status === "Publié" ? "#b8ff00" : "#ff2d6b" }}>{status}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {items.map(it => (
                      <div key={it} className="text-xs flex items-center gap-2" style={{ color: "rgba(240,240,240,0.45)" }}>
                        <span style={{ color: "#b8ff00" }}>·</span> {it}
                      </div>
                    ))}
                  </div>
                  <button className="btn-outline w-full mt-4 text-xs py-1.5 justify-center">GÉRER</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── ADMIN MODALS ── */}
      {modal && (
        <Modal open={true} onClose={() => setModal(null)} wide={["drop","prod","order"].includes(modal.type)}
          title={`${modal.mode === "add" ? "NOUVEAU" : modal.mode === "edit" ? "ÉDITER" : "DÉTAIL"} · ${modal.type.toUpperCase()}`}>
          <div className="flex flex-col gap-4">
            {/* DROP form */}
            {modal.type === "drop" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NOM DU DROP" value={ff("name")} onChange={sf("name")} />
                  <Field label="ARTISTE" value={ff("artist")} onChange={sf("artist")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="DATE REVEAL" value={ff("reveal")} onChange={sf("reveal")} type="date" />
                  <Field label="DATE RELEASE" value={ff("release")} onChange={sf("release")} type="date" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="QUANTITÉ" value={ff("qty")} onChange={sf("qty")} type="number" />
                  <Field label="PRIX (€)" value={ff("price")} onChange={sf("price")} />
                  <Field label="STATUT" value={ff("status")} onChange={sf("status")} options={["DRAFT", "COMING SOON", "LIVE", "SOLD OUT", "ARCHIVED"]} />
                </div>
                <Field label="DESCRIPTION" value={ff("desc")} onChange={sf("desc")} textarea />
              </>
            )}
            {/* PROD form */}
            {modal.type === "prod" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NOM PRODUIT" value={ff("name")} onChange={sf("name")} />
                  <Field label="ARTISTE" value={ff("artist")} onChange={sf("artist")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="CATÉGORIE" value={ff("cat")} onChange={sf("cat")} options={["Jeux", "Tech", "Maison", "Art", "Mode"]} />
                  <Field label="PRIX HT (€)" value={ff("prix")} onChange={sf("prix")} />
                  <Field label="TVA" value={ff("tva")} onChange={sf("tva")} options={["5.5%", "10%", "20%"]} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="STOCK" value={ff("stock")} onChange={sf("stock")} type="number" />
                  <Field label="SEO" value={ff("seo")} onChange={sf("seo")} options={["✓", "✗"]} />
                  <Field label="STATUT" value={ff("status")} onChange={sf("status")} options={["Draft", "Publié", "Sold Out", "Archivé"]} />
                </div>
              </>
            )}
            {/* ARTIST form */}
            {modal.type === "artist" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NOM ARTISTE" value={ff("name")} onChange={sf("name")} />
                  <Field label="VILLE" value={ff("city")} onChange={sf("city")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="DROPS" value={ff("drops")} onChange={sf("drops")} type="number" />
                  <Field label="ROYALTY %" value={ff("royalty")} onChange={sf("royalty")} />
                  <Field label="STATUT" value={ff("status")} onChange={sf("status")} options={["Actif", "Inactif", "En attente"]} />
                </div>
                <Field label="BIO" value={ff("bio")} onChange={sf("bio")} textarea />
                <Field label="INSTAGRAM" value={ff("insta")} onChange={sf("insta")} />
              </>
            )}
            {/* ORDER form */}
            {modal.type === "order" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ID COMMANDE" value={ff("id")} onChange={sf("id")} />
                  <Field label="CLIENT" value={ff("client")} onChange={sf("client")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="PRODUIT" value={ff("product")} onChange={sf("product")} />
                  <Field label="ÉDITION #" value={ff("edition")} onChange={sf("edition")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="TOTAL (€)" value={ff("total")} onChange={sf("total")} />
                  <Field label="DATE" value={ff("date")} onChange={sf("date")} type="date" />
                  <Field label="STATUT" value={ff("status")} onChange={sf("status")} options={["Confirmée", "En transit", "Livrée", "Remboursée", "Annulée"]} />
                </div>
                {modal.mode !== "add" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="EMAIL CLIENT" value={ff("email")} onChange={sf("email")} />
                    <Field label="ADRESSE" value={ff("address")} onChange={sf("address")} />
                  </div>
                )}
              </>
            )}
            {/* CLIENT form */}
            {modal.type === "client" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="NOM" value={ff("name")} onChange={sf("name")} />
                  <Field label="EMAIL" value={ff("email")} onChange={sf("email")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="COMMANDES" value={ff("orders")} onChange={sf("orders")} type="number" />
                  <Field label="LTV (€)" value={ff("ltv")} onChange={sf("ltv")} />
                  <Field label="LEVEL" value={ff("level")} onChange={sf("level")} options={["CURIOUS", "INSIDER", "COLLECTOR", "PATRON", "LEGEND"]} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SEGMENT" value={ff("segment")} onChange={sf("segment")} options={["VIP", "Collector", "Nouveau", "B2B"]} />
                  <Field label="DROPS ACHETÉS" value={ff("drops")} onChange={sf("drops")} type="number" />
                </div>
                <Field label="NOTE INTERNE" value={ff("note")} onChange={sf("note")} textarea />
              </>
            )}
            {/* LEAD form */}
            {modal.type === "lead" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="ENTREPRISE" value={ff("co")} onChange={sf("co")} />
                  <Field label="CONTACT" value={ff("contact")} onChange={sf("contact")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="EMAIL" value={ff("email")} onChange={sf("email")} />
                  <Field label="VALEUR ESTIMÉE" value={ff("value")} onChange={sf("value")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="PROJET" value={ff("project")} onChange={sf("project")} />
                  <Field label="STAGE" value={ff("stage")} onChange={sf("stage")} options={["LEAD", "CONTACTED", "QUALIFIED", "BRIEF", "PROPOSAL", "PROTOTYPE", "NEGOTIATION", "WON"]} />
                </div>
                <Field label="DATE" value={ff("date")} onChange={sf("date")} type="date" />
                <Field label="DESCRIPTION" value={ff("desc")} onChange={sf("desc")} textarea />
              </>
            )}
            {modal.mode !== "view" && (
              <div className="flex gap-3 justify-end mt-2">
                <button onClick={() => setModal(null)} className="btn-outline text-sm py-2 px-5">ANNULER</button>
                <button onClick={saveItem} className="btn-acid text-sm py-2 px-6">ENREGISTRER</button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal
          message={`Supprimer "${confirm.name}" ?`}
          onConfirm={deleteItem}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("HOME");

  const changePage = useCallback((p: string) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="grain" style={{ background: "#08080f", color: "#f0f0f0", minHeight: "100vh" }}>
      <Cursor />
      <Nav page={page} setPage={changePage} />

      {page === "HOME" && <HomePage setPage={changePage} />}
      {page === "DROPS" && <><DropsPage setPage={changePage} /><Footer setPage={changePage} /></>}
      {page === "SHOP" && <><ShopPage /><Footer setPage={changePage} /></>}
      {page === "ARTISTES" && <><ArtistesPage /><Footer setPage={changePage} /></>}
      {page === "STORIES" && <><StoriesPage /><Footer setPage={changePage} /></>}
      {page === "MARSEILLE" && <><MarseillePage /><Footer setPage={changePage} /></>}
      {page === "FOR BUSINESS" && <><ForBusinessPage /><Footer setPage={changePage} /></>}
      {page === "COMPTE" && <><CollectorPage /><Footer setPage={changePage} /></>}
      {page === "ADMIN" && <AdminPage />}
    </div>
  );
}
