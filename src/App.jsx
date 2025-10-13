"use client"; 
import { useEffect, useRef, useState } from "react";

/** ================= BRAND ================= */
const BRAND = {
  p: "#d946ef", // magenta neon
  s: "#22c55e", // verde neon (butoane)
  a: "#0ea5e9", // albastru neon
  bg: "#07080c", // fundal
  fg: "#f8fafc", // text
};

const FB_LINK = "https://www.facebook.com/profile.php?id=61575863491352";

/** ============== UTILS ============== */
// Next Saturday 23:00 (local time)
function getNextSaturday2300() {
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay(); // 0=Sun
  const add = (6 - day + 7) % 7 || (now.getHours() >= 23 ? 7 : 0);
  d.setDate(d.getDate() + add);
  d.setHours(23, 0, 0, 0);
  return d;
}
function useCountdown(targetDate) {
  const [left, setLeft] = useState(targetDate - new Date());
  useEffect(() => {
    const t = setInterval(() => setLeft(targetDate - new Date()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  const total = Math.max(left, 0);
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hrs: Math.floor(total / (1000 * 60 * 60)) % 24,
    min: Math.floor(total / (1000 * 60)) % 60,
    sec: Math.floor(total / 1000) % 60,
  };
}
function cx(...classes){return classes.filter(Boolean).join(" ");}

/** ============ PARTICLES (canvas – vechi, doar pentru Hero) ============ */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c.getContext("2d");
    let w, h, raf;
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const particles = Array.from({ length: 80 }).map(() => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      r: 0.6 + Math.random() * 1.4
    }));
    function resize(){
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * DPR; c.height = h * DPR;
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    function step(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>1) p.vx*=-1;
        if(p.y<0||p.y>1) p.vy*=-1;
        const x = p.x*w; const y = p.y*h;
        ctx.beginPath();
        ctx.arc(x,y,p.r,0,Math.PI*2);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    }
    const ro = new ResizeObserver(resize); ro.observe(c);
    resize(); step();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="particles" aria-hidden />;
}

/** ============ PARTICULE GLOBALE (peste toată pagina) ============ */
function ParticlesFull(){
  const ref = useRef(null);
  useEffect(()=>{
    const c = ref.current;
    const ctx = c.getContext('2d');
    let w, h, raf, DPR;
    let particles = [];
    const COLORS = [
      'rgba(168,85,247,0.18)', // violet
      'rgba(217,70,239,0.16)', // fuchsia
      'rgba(147,51,234,0.20)'  // mov închis
    ];

    function makeParticles(){
      const COUNT = Math.min(260, Math.max(140, Math.round((w*h)/50000))); // densitate
      particles = Array.from({length: COUNT}).map(()=>({
        x: Math.random()*w,
        y: Math.random()*h,
        vx: (Math.random()-0.5)*0.22,
        vy: (Math.random()-0.5)*0.22,
        r: 0.8 + Math.random()*2.2,
        color: COLORS[(Math.random()*COLORS.length)|0]
      }));
    }
    function resize(){
      DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
      w = window.innerWidth; h = window.innerHeight;
      c.width = w*DPR; c.height = h*DPR;
      c.style.width = w+'px'; c.style.height = h+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      makeParticles();
    }
    function step(){
      ctx.clearRect(0,0,w,h);
      ctx.globalCompositeOperation = 'lighter';
      for(const p of particles){
        p.x += p.vx; p.y += p.vy;
        if(p.x < -10 || p.x > w+10) p.vx *= -1;
        if(p.y < -10 || p.y > h+10) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(step);
    }
    resize(); step();
    window.addEventListener('resize', resize);
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  },[]);
  return <canvas ref={ref} className="particles-full" aria-hidden />;
}

/** ============ SCROLL REVEAL HOOK ============ */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add("reveal-in"); });
    }, { threshold: 0.15 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** ============ MAGNETIC BUTTON HOOK ============ */
function useMagnetic(ref) {
  useEffect(() => {
    const el = ref.current; if(!el) return;
    function onMove(e){
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top + r.height/2);
      el.style.transform = `translate(${x*0.08}px, ${y*0.08}px)`;
    }
    function reset(){ el.style.transform = "translate(0,0)"; }
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", reset); };
  }, [ref]);
}

/** ============ SCROLL PROGRESS BAR ============ */
function ScrollProgress(){
  const [w, setW] = useState(0);
  useEffect(()=>{
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const cur = h.scrollTop;
      setW(max ? (cur / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="scroll-progress" aria-hidden>
      <div style={{ width: `${w}%` }} />
    </div>
  );
}

/** =================== PAGE =================== */
export default function Home() {
  useReveal();
  const target = getNextSaturday2300();
  const { days, hrs, min, sec } = useCountdown(target);

  return (
    <div className="page">
      <BgNeon />
      <ParticlesFull />   {/* particule mov pe toată pagina */}
      <Noise />
      <Header />
      <ScrollProgress />
      <Hero />
      <CountdownBar days={days} hrs={hrs} min={min} sec={sec} />
      <Marquee />
      <Highlights />
      <Events />
      <Gallery />
      <Testimonials />
      <FAQ />
      <Contact />
      <BottomCTA />
      <Footer />
      <GlobalStyles />
    </div>
  );
}

/** ================== SECTIONS ================== */
function Header(){
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null); useMagnetic(btnRef);
  return (
    <header className="header">
      <div className="container row between center">
        <div className="row center">
          {/* LOGO: pune fisierul in /public/zenlogo.png */}
          <img
            src="/zenlogo.png"
            alt="ZEN"
            className="logo-img"
            onError={(e)=>{ e.currentTarget.outerHTML='<div class="logo-dot"></div>'; }}
          />
          <strong className="brand">ZEN Lounge — Târgu-Mureș</strong>
        </div>
        <nav className="nav hide-sm">
          <a className="navlink" href="#events">Evenimente</a>
          <a className="navlink" href="#gallery">Galerie</a>
          <a className="navlink" href="#contact">Contact</a>
          <a className="btn-primary" href="/rezervari.html">Rezervă</a>
        </nav>
        <button className="btn-outline show-sm" onClick={()=>setOpen(!open)}>{open ? "Închide" : "Meniu"}</button>
      </div>
      {open && (
        <div className="container col mobile-menu">
          <a className="navlink" href="#events" onClick={()=>setOpen(false)}>Evenimente</a>
          <a className="navlink" href="#gallery" onClick={()=>setOpen(false)}>Galerie</a>
          <a className="navlink" href="#contact" onClick={()=>setOpen(false)}>Contact</a>
          <a className="btn-primary" href="/rezervari.html">Rezervă</a>
        </div>
      )}
    </header>
  );
}

function Hero(){
  return (
    <section className="hero" id="home">
      {/* fundalul: cocktail + overlay + glow (setat în CSS) */}
      <div className="container hero-content">
        <h1 className="title neon" data-reveal>Zen Lounge</h1>

        {/* subtitlu cu efect frunze */}
        <p className="subtitle jungle" data-reveal>
          <span className="leaf-text">Welcome to the Jungle</span>
        </p>

        <div className="row hero-actions" data-reveal>
          <a className="btn-primary" href="/rezervari.html">Rezervă</a>
          <a className="btn-ghost" href="#events">Vezi evenimente</a>
        </div>
        <div className="hero-badges" data-reveal>
          <span className="badge">Sound System Pro</span>
          <span className="badge">VIP Lounge</span>
          <span className="badge">Bottle Service</span>
        </div>
      </div>
      <div className="hero-border" />
    </section>
  );
}

function CountdownBar({days, hrs, min, sec}){
  return (
    <div className="countdown">
      <div className="container row between center">
        <div className="row center" style={{gap:10}}>
          <span className="muted">Next Party:</span>
          <strong>Sâmbătă, 23:00</strong>
        </div>
        <div className="timer">
          <Block n={days} l="zile" />
          <Block n={hrs} l="ore" />
          <Block n={min} l="min" />
          <Block n={sec} l="sec" />
        </div>
      </div>
    </div>
  );
  function Block({n,l}){return <span className="tblock"><b>{String(n).padStart(2,"0")}</b><i>{l}</i></span>;}
}

function Marquee(){
  return (
    <div className="marquee">
      <div className="track">
        {Array.from({length:8}).map((_,i)=>(
          <span key={i}>ZEN • VIP • BOTTLE SERVICE • DANCE • LIGHTS • {i%2?"ENERGY":"NEON"} • </span>
        ))}
      </div>
    </div>
  );
}

function Highlights(){
  const items = [
    {t:"Main Stage", d:"Headlineri, live acts & DJ sets."},
    {t:"VIP Lounge", d:"Mese premium aproape de scenă."},
    {t:"Cocktail Bar", d:"Signature drinks cu vibe tropical."},
  ];
  return (
    <section className="section">
      <div className="container grid-3">
        {items.map((x,i)=>(
          <div className="card glow-border" key={i} data-reveal>
            <h3 className="h3">{x.t}</h3>
            <p className="muted">{x.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Events(){
  const data = [
    {time:"VINERI • 23:00", title:"House / Dance", desc:"Resident DJs • Club Anthems"},
    {time:"SÂMBĂTĂ • 23:00", title:"Saturday Club Night", desc:"Guest DJs • Live Performances"},
    {time:"DUMINICĂ • 22:00", title:"Sunday Chill", desc:"R&B • Hip-Hop • Afrobeats"},
  ];
  return (
    <section id="events" className="section">
      <div className="container">
        <div className="row between center" style={{marginBottom:16}}>
          <h2 className="h2" data-reveal>Evenimente</h2>
          <a className="btn-outline" href="/rezervari.html">Rezervă o masă</a>
        </div>
        <div className="grid-3">
          {data.map((e,i)=>(
            <div className="card event" key={i} data-reveal>
              <div className="corner" />
              <div className="event-time">{e.time}</div>
              <h3 className="h3" style={{marginTop:6}}>{e.title}</h3>
              <p className="muted">{e.desc}</p>
              <a className="btn-chip" href="/rezervari.html">Rezervă aici</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery(){
  const [open, setOpen] = useState(null);
  const pics = [
    "/galerie/zen2.jpg",
    "/galerie/zen3.jpg",
    "/galerie/zen4.jpg",
    "/galerie/zen5.jpg",
    "/galerie/zen6.jpg",
    "/galerie/zen.jpg",
  ];
  useEffect(()=>{
    function onKey(e){ if(e.key==="Escape") setOpen(null); if(open!==null && (e.key==="ArrowRight"||e.key==="ArrowLeft")) {
      const i = pics.indexOf(open);
      const ni = e.key==="ArrowRight" ? (i+1)%pics.length : (i-1+pics.length)%pics.length;
      setOpen(pics[ni]);
    }}
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <section id="gallery" className="section">
      <div className="container">
        <h2 className="h2" data-reveal>Galerie</h2>
        <div className="grid-3" style={{marginTop:12}}>
          {pics.map((src,i)=>(
            <div className="gitem" key={i} onClick={()=>setOpen(src)} data-reveal>
              <img src={src} alt={`img-${i}`} loading="lazy" decoding="async"/>
              <div className="gmask">Vezi mare</div>
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="lightbox" onClick={()=>setOpen(null)}>
          <img src={open} alt="zoom" />
        </div>
      )}
    </section>
  );
}

function Testimonials(){
  const items = [
    {n:"Andrei", t:"Cele mai bombă party-uri din Târgu Mureș."},
    {n:"Maria", t:"VIP lounge fix cum trebuie. Staff super profi."},
    {n:"Radu",  t:"Mixuri tari, vibe de capitală. Revin cu gașca!"},
  ];
  return (
    <section className="section">
      <div className="container">
        <h2 className="h2" data-reveal>Ce zic oamenii</h2>
        <div className="ticker">
          <div className="row ticker-track">
            {items.concat(items).map((x,i)=>(
              <div className="tcard" key={i}>
                <div className="stars">★★★★★</div>
                <p>{x.t}</p>
                <span className="muted">— {x.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ(){
  const data = [
    {q:"Trebuie rezervare?", a:"Recomandat pentru weekend. Fără rezervare, intri pe principiul primul venit."},
    {q:"Există dress code?", a:"Smart-casual. Ne rezervăm dreptul de a refuza accesul."},
    {q:"Ce vârstă minimă?", a:"18+ la evenimentele de seară. Act de identitate obligatoriu."},
  ];
  const [idx, setIdx] = useState(null);
  return (
    <section className="section">
      <div className="container">
        <h2 className="h2" data-reveal>Întrebări frecvente</h2>
        <div className="col" style={{ marginTop:10 }}>
          {data.map((x,i)=>(
            <div className="faq" key={i} onClick={()=>setIdx(idx===i?null:i)} data-reveal>
              <div className="row between center">
                <strong>{x.q}</strong><span>{idx===i ? "−" : "+"}</span>
              </div>
              {idx===i && <p className="muted" style={{marginTop:8, lineHeight:1.55}}>{x.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact(){
  return (
    <section id="contact" className="section">
      <div className="container grid-2">
        <div data-reveal>
          <h2 className="h2">Contact</h2>
          <div className="list">
            <div><strong>Adresă:</strong> Târgu-Mureș, România</div>
            <div><strong>Telefon:</strong> <a className="navlink" href="tel:+40700000000">+40 700 000 000</a></div>
            <div><strong>Email:</strong> <a className="navlink" href="mailto:booking@zenclub.ro">booking@zenclub.ro</a></div>
          </div>
          <div className="row" style={{ marginTop:12 }}>
            <a className="btn-chip" href="/rezervari.html">Rezervă</a>
            <a className="btn-chip" href="#" target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
        <div data-reveal>
          <div className="map">Harta Google (opțional)</div>
        </div>
      </div>
    </section>
  );
}

function BottomCTA(){
  return (
    <div className="bottomcta">
      <div className="container row between center">
        <span>Pregătit pentru seara ta la ZEN?</span>
        <a className="btn-primary" href="/rezervari.html">Rezervă</a>
      </div>
    </div>
  );
}

function Footer(){
  return (
    <footer className="footer">
      <div className="container row between center">
        <div className="row center" style={{gap:10}}>
          <div className="logo-dot sm" />
          <span className="muted">© {new Date().getFullYear()} ZEN Lounge</span>
        </div>
        <a className="navlink" href="#home">Sus ↑</a>
      </div>
    </footer>
  );
}

function Noise(){ return <div className="noise" aria-hidden />; }

/** ====== FUNDAL NEON (mov/fuchsia) ====== */
function BgNeon(){ return <div className="bg-neon" aria-hidden />; }

/** ================== STYLES ================== */
function GlobalStyles(){
  return (
    <style jsx global>{`
      :root{
        --p:${BRAND.p}; --s:${BRAND.s}; --a:${BRAND.a}; --bg:${BRAND.bg}; --fg:${BRAND.fg};
      }
      *{box-sizing:border-box}
      html,body,#__next{height:100%}
      body{margin:0;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; scroll-behavior:smooth;}

      /* ===== LAYOUT BASICS ===== */
      .container{max-width:1140px;margin:0 auto;padding:0 16px}
      .row{display:flex; gap:12px;}
      .col{display:flex;flex-direction:column; gap:12px;}
      .between{justify-content:space-between}
      .center{align-items:center}
      .nav{display:flex; gap:24px; align-items:center;}
      .navlink{color:var(--fg);text-decoration:none;opacity:.9}
      .navlink:hover{opacity:1}
      .muted{color:#cbd5e1}
      .h2{font-size:28px;line-height:1.25;margin:0 0 16px;font-weight:800}
      .h3{font-size:18px;margin:0 0 8px;font-weight:700}
      .section{padding:56px 0}
      .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
      .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px}

      .btn-primary{background:var(--s);color:#06281f;border:1px solid #0f766e;padding:10px 14px;border-radius:999px;
        font-weight:800;text-decoration:none;display:inline-block;box-shadow:0 6px 24px rgba(16,185,129,.25);transition:transform .15s}
      .btn-primary:hover{transform:translateY(-2px)}
      .btn-ghost{background:transparent;color:var(--fg);border:1px solid #334155;padding:10px 14px;border-radius:999px;font-weight:800;text-decoration:none}
      .btn-outline{background:transparent;color:var(--fg);border:1px solid #334155;padding:8px 12px;border-radius:999px;font-weight:700}
      .btn-chip{background:#111827;color:#e5e7eb;border:1px solid #374151;padding:8px 12px;border-radius:999px;text-decoration:none; display:inline-block; margin-top:6px;}

      .badge{display:inline-block;background:rgba(255,255,255,.05);border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:999px;font-weight:700;font-size:12px;margin-right:8px}
      .card{position:relative;background:#0b0b0b;border:1px solid #1f2937;border-radius:16px;padding:20px;overflow:hidden}
      .glow-border{background:linear-gradient(#0b0b0b,#0b0b0b) padding-box, 
        linear-gradient(120deg,var(--p),var(--a),var(--s)) border-box; border:1px solid transparent}

      /* ===== HEADER + SPACING ===== */
      .header{position:sticky;top:0;z-index:60;background:rgba(7,8,12,.6);backdrop-filter:blur(10px);border-bottom:1px solid #1f2937}
      .brand{letter-spacing:.02em}
      .logo-dot{width:32px;height:32px;border-radius:50%;background:var(--p);box-shadow:0 0 20px var(--p)}
      .logo-dot.sm{width:18px;height:18px}
      .logo-img{height:32px;width:auto;filter:drop-shadow(0 0 14px var(--p))}
      .logo-img.sm{height:18px}
      .hide-sm{display:block}
      .show-sm{display:none}
      .mobile-menu{gap:12px;padding-bottom:16px}
      .mobile-menu .navlink{display:block; padding:8px 0;}
      .header .container { padding-top: 10px; padding-bottom: 10px; }
      .header .container.row { gap: 24px; }
      .header .row.center { gap: 16px; }
      .nav { display:flex !important; align-items:center; gap: 28px; }
      .btn-primary.hide-sm { margin-left: 12px; }

      /* ===== SCROLL BAR TOP ===== */
      .scroll-progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:70;pointer-events:none}
      .scroll-progress>div{height:100%;background:linear-gradient(90deg,var(--p),var(--a),var(--s));box-shadow:0 0 12px rgba(124,58,237,.45)}

      /* ===== HERO (foto cocktail + overlay + glow) ===== */
      .hero{position:relative;min-height:78vh;border-bottom:1px solid #1f2937;overflow:hidden;display:grid;place-items:center;text-align:center}
      .hero::before{
        content:""; position:absolute; inset:-20%;
        background:
          linear-gradient(180deg, rgba(7,8,12,.55), rgba(7,8,12,.85)),
          url('/galerie/zen7.jpeg'),
          radial-gradient(circle at 50% 20%, rgba(217,70,239,0.25), transparent 60%);
        background-size: cover;
        background-position: center;
        z-index: -1;
        filter: brightness(0.85) contrast(1.1);
      }
      .hero::after{
        content:""; position:absolute; inset:0;
        background:
          repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 36px),
          repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 36px);
        opacity:.06; mix-blend-mode:soft-light;
      }
      @keyframes floatBg{
        0%{ transform: translate3d(0,0,0) scale(1); }
        100%{ transform: translate3d(-2%,1.5%,0) scale(1.05); }
      }
      /* titlul puțin mai sus (padding top mai mic) */
      .hero-content{position:relative;z-index:2;max-width:1140px;margin:0 auto;padding:90px 16px 64px}
      .title{font-size:56px;line-height:1.06;margin:0 0 12px;font-weight:1000;letter-spacing:.02em}
      .neon{background:linear-gradient(90deg, var(--p), #a855f7);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 18px rgba(168,85,247,.55))}
      .subtitle{font-size:18px;color:#e5e7eb;max-width:720px;margin:0 auto}
      /* „Welcome to the Jungle” cu frunze în text */
      .jungle { margin-top: 6px; }
      .leaf-text{
        display:inline-block;
        font-weight:1000;
        font-size:36px;
        line-height:1.1;
        background-image:url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop'); /* frunze */
        background-size:cover;
        background-position:center;
        -webkit-background-clip:text;
        background-clip:text;
        -webkit-text-fill-color:transparent;
        filter: drop-shadow(0 0 10px rgba(0,0,0,.35));
      }
      @media (max-width:640px){
        .leaf-text{ font-size:28px; }
      }

      .hero-actions{gap:10px;flex-wrap:wrap;margin-top:14px}
      .hero-badges{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
      .hero-border{position:absolute;inset:auto 0 0 0;height:2px;background:linear-gradient(90deg, transparent,var(--p),#a855f7,transparent)}
      .particles{position:absolute;inset:0;width:100%;height:100%;opacity:.5;pointer-events:none}

      /* ===== COUNTDOWN ===== */
      .countdown{border-bottom:1px solid #1f2937;background:#0b0b0b}
      .timer{display:flex;gap:10px;align-items:center}
      .tblock{display:inline-flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #1f2937;border-radius:10px;padding:6px 10px}
      .tblock b{font-size:16px} .tblock i{font-style:normal;color:#94a3b8}

      /* ===== MARQUEE ===== */
      .marquee{border-bottom:1px solid #1f2937;background:linear-gradient(90deg, rgba(217,70,239,.12), rgba(168,85,247,.12))}
      .track{white-space:nowrap;overflow:hidden}
      .track span{display:inline-block;padding:10px 16px;font-weight:800;letter-spacing:.08em;opacity:.9;animation:mar 18s linear infinite}
      @keyframes mar{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

      /* ===== EVENTS ===== */
      .event{background:linear-gradient(135deg, rgba(217,70,239,.12), rgba(168,85,247,.12))}
      .event .corner{position:absolute;inset:-1px;border-radius:16px;background:
        radial-gradient(600px 220px at 10% -10%, rgba(217,70,239,.35), transparent),
        radial-gradient(400px 160px at 110% 10%, rgba(168,85,247,.25), transparent);
        filter:blur(10px);opacity:.55;pointer-events:none}
      .event-time{color:#c4b5fd;font-weight:800;letter-spacing:.06em;display:block;margin-bottom:6px}

      /* ===== TICKER ===== */
      .ticker{overflow:hidden;border:1px solid #1f2937;border-radius:16px;background:#0b0b0b;margin-top:12px}
      .ticker-track{gap:12px;animation:tix 22s linear infinite}
      .tcard{min-width:320px;background:#0f0f10;border:1px solid #1f2937;border-radius:12px;padding:14px}
      .stars{color:#fbbf24;margin-bottom:6px}
      @keyframes tix{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

      /* ===== GALLERY ===== */
      .gitem{position:relative;border:1px solid #1f2937;border-radius:12px;overflow:hidden;background:#0b0b0b;cursor:zoom-in}
      .gitem img{width:100%;height:220px;object-fit:cover;display:block;transition:transform .35s}
      .gitem:hover img{transform:scale(1.05)}
      .gmask{position:absolute;inset:auto 8px 8px auto;background:#111827;border:1px solid #374151;color:#e5e7eb;padding:6px 10px;border-radius:999px;font-size:12px}
      .lightbox{position:fixed;inset:0;background:rgba(0,0,0,.9);display:grid;place-items:center;z-index:70}
      .lightbox img{max-width:92vw;max-height:92vh;border-radius:12px;border:1px solid #334155}

      /* ===== FAQ / CONTACT / MAP ===== */
      .faq{background:#0b0b0b;border:1px solid #1f2937;border-radius:12px;padding:14px;cursor:pointer}
      .map{border-radius:12px;overflow:hidden;border:1px solid #1f2937;height:260px;background:#0b0b0b;display:grid;place-items:center;color:#94a3b8}

      /* ===== BOTTOM & FOOTER ===== */
      .bottomcta{position:sticky;bottom:0;z-index:55;background:rgba(7,8,12,.9);backdrop-filter:blur(8px);border-top:1px solid #1f2937;padding:10px 0}
      .footer{border-top:1px solid #1f2937;padding:18px 0;background:#0b0b0b;margin-top:8px}

      /* ===== NOISE OVERLAY ===== */
      .noise{position:fixed;inset:0;pointer-events:none;opacity:.05;
        background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>');mix-blend-mode:overlay}

      /* ===== FUNDAL GLOBAL NEON ===== */
      .bg-neon{
        position:fixed; inset:0; z-index:-1; pointer-events:none;
        background:
          radial-gradient(900px 500px at 15% 15%, rgba(168,85,247,.18), transparent 60%),
          radial-gradient(900px 500px at 85% 25%, rgba(217,70,239,.16), transparent 60%),
          radial-gradient(1200px 700px at 50% 85%, rgba(124,58,237,.12), transparent 60%),
          linear-gradient(#07080c, #07080c);
      }

      /* ===== PARTICULE FULL-PAGE ===== */
      .particles-full{
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: .6;     /* fă .75 dacă vrei și mai vizibile */
        z-index: 2;      /* peste bg-neon, sub conținut (header are 60, lightbox 70) */
      }

      /* Reveal on scroll */
      [data-reveal]{opacity:0;transform:translateY(16px);transition:opacity .6s ease, transform .6s ease}
      .reveal-in{opacity:1;transform:translateY(0)}

      @media (max-width: 900px){
        .grid-3{grid-template-columns:1fr 1fr}
        .grid-2{grid-template-columns:1fr}
        .title{font-size:44px}
      }
      @media (max-width: 640px){
        .grid-3{grid-template-columns:1fr}
        .hide-sm{display:none}
        .show-sm{display:block}
      }
    `}</style>
  );
}