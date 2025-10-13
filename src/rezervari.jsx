import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
/***********
 * ZEN — Rezervări 2D (Iarnă, variantă simplă)
 * Flow: selectezi masă → completezi date → te duce direct pe WhatsApp cu mesaj precompletat.
 * Nicio blocare locală. Fără backend. Doar sâmbăta (22:00–05:00).
 ***********/

/** BRAND */
const BRAND = { p: "#d946ef", s: "#22c55e", a: "#0ea5e9", bg: "#07080c", fg: "#f8fafc" };

/** CONFIG */
const CONFIG = {
  party: { open: "22:00", close: "05:00" },
  phoneE164: "40745093730", // 0745093730 în E.164 (fără +)
};

/** UTILS */
function todayPlusDaysISO(d = 0) { const x = new Date(); x.setHours(0,0,0,0); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); }
function weekdayISO(date){return new Date(date+"T00:00:00").getDay(); }
function isSaturday(dateISO){ return weekdayISO(dateISO)===6; }
function nextSaturdayISO(){ const d=new Date(); const diff=((6-d.getDay()+7)%7)||7; d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function fmtDate(iso){ const d=new Date(iso+"T00:00:00"); try{ const s=d.toLocaleDateString('ro-RO',{weekday:'long',day:'2-digit',month:'long'}); return s.replace(/^./,c=>c.toUpperCase()); }catch{ return iso; } }

// WhatsApp helpers
const WA = {
  web: (txt)=>`https://api.whatsapp.com/send?phone=${CONFIG.phoneE164}&text=${txt}`,
  scheme: (txt)=>`whatsapp://send?phone=${CONFIG.phoneE164}&text=${txt}`,
};
function isMobile(){ if (typeof navigator==='undefined') return false; const ua=(navigator).userAgent||''; return /android|iphone|ipad|ipod/i.test(ua); }
function primaryWa(txt){ return isMobile()? WA.scheme(txt) : WA.web(txt); }

/** TYPES & FLOOR */
const FLOOR_W=1000, FLOOR_H=600;
const TABLES = [
  { id:"t1", n:1, x:160, y:120, r:26, cap:6, tier:"VIP", zone:"VIP STAGE" },
  { id:"t2", n:2, x:300, y:120, r:26, cap:6, tier:"VIP", zone:"VIP STAGE" },
  { id:"t3", n:3, x:440, y:120, r:26, cap:6, tier:"VIP", zone:"VIP STAGE" },
  { id:"t4", n:4, x:580, y:120, r:26, cap:6, tier:"VIP", zone:"VIP STAGE" },
  { id:"t5", n:5, x:720, y:120, r:26, cap:6, tier:"VIP", zone:"VIP STAGE" },
  { id:"t6", n:6, x:220, y:260, r:24, cap:5, tier:"PREMIUM", zone:"MAIN FLOOR" },
  { id:"t7", n:7, x:340, y:260, r:24, cap:5, tier:"PREMIUM", zone:"MAIN FLOOR" },
  { id:"t8", n:8, x:460, y:260, r:24, cap:5, tier:"PREMIUM", zone:"MAIN FLOOR" },
  { id:"t9", n:9, x:580, y:260, r:24, cap:5, tier:"PREMIUM", zone:"MAIN FLOOR" },
  { id:"t10", n:10, x:700, y:260, r:24, cap:5, tier:"PREMIUM", zone:"MAIN FLOOR" },
  { id:"t11", n:11, x:840, y:210, r:22, cap:4, tier:"STANDARD", zone:"BAR" },
  { id:"t12", n:12, x:840, y:300, r:22, cap:4, tier:"STANDARD", zone:"BAR" },
  { id:"t13", n:13, x:840, y:390, r:22, cap:4, tier:"STANDARD", zone:"BAR" },
  { id:"t14", n:14, x:240, y:470, r:24, cap:5, tier:"STANDARD", zone:"LOUNGE" },
  { id:"t15", n:15, x:360, y:470, r:24, cap:5, tier:"STANDARD", zone:"LOUNGE" },
  { id:"t16", n:16, x:480, y:470, r:24, cap:5, tier:"STANDARD", zone:"LOUNGE" },
  { id:"t17", n:17, x:600, y:470, r:24, cap:5, tier:"STANDARD", zone:"LOUNGE" },
  { id:"t18", n:18, x:720, y:470, r:24, cap:5, tier:"STANDARD", zone:"LOUNGE" },
];

/** PAGE */
export default function Rezervari(){
  const [date, setDate] = useState(()=> nextSaturdayISO());
  const [selected, setSelected] = useState(null);
  const [guests, setGuests] = useState(4);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState("ALL");
  const selTable = TABLES.find(t=>t.id===selected) || null;
  const capacityOK = selTable ? guests <= selTable.cap : false;

  // corectează persoane dacă depășește masa
  useEffect(()=>{ if(selTable && guests>selTable.cap) setGuests(selTable.cap); }, [selected]);

  // Mesaj WA
  const waText = useMemo(()=>{
    const base = selTable? `Masa #${selTable.n} (${selTable.zone}, ${selTable.tier})` : '(fără masă)';
    const rows = [
      `Rezervare ZEN Lounge`,
      `Data: ${fmtDate(date)} (${date})`,
      `Interval: Toată seara (${CONFIG.party.open}–${CONFIG.party.close})`,
      `Detalii masă: ${base}`,
      `Persoane: ${guests}`,
      `Nume: ${name.trim()}`,
      `Telefon: ${phone.trim()}`,
      note.trim()? `Notă: ${note.trim()}` : null,
    ].filter(Boolean);
    return encodeURIComponent(rows.join('\n'));
  },[selTable,date,guests,name,phone,note]);

  function canSubmit(){
    return !!(selTable && isSaturday(date) && capacityOK && name.trim().length>=2 && /^\+?\d{9,15}$/.test(phone.replace(/\s|-/g,'')));
  }
  
  function onWhatsApp(e){ 
    e.preventDefault();
    if(!canSubmit()) return;
    
    // Încearcă schema whatsapp:// pentru mobil, apoi web API
    const waUrl = primaryWa(waText);
    
    // Deschide direct în tab nou
    const opened = window.open(waUrl, '_blank');
    
    // Fallback: dacă pop-up blocat, încearcă location.href
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      window.location.href = waUrl;
    }
  }

  return (
    <div className="page">
      <Header />
      <div className="container layout">
        <div className="left">
          <Controls date={date} setDate={setDate} filter={filter} setFilter={setFilter} />
          <Floor tables={TABLES} selectedId={selected} onSelect={setSelected} filter={filter} />
          <Legend />
        </div>
        <div className="right">
          <Sidebar table={selTable} capacityOK={capacityOK} guests={guests} setGuests={setGuests}
                   name={name} setName={setName} phone={phone} setPhone={setPhone}
                   note={note} setNote={setNote} date={date} />
          <div className="cta">
            <button className={`btn-primary ${!canSubmit()? 'disabled':''}`} onClick={onWhatsApp} disabled={!canSubmit()}>
              Finalizează pe WhatsApp
            </button>
            <p className="muted tiny">Rezervările se fac doar sâmbăta ({CONFIG.party.open}–{CONFIG.party.close}).</p>
          </div>
        </div>
      </div>
      <GlobalStyles />
    </div>
  );
}

/** UI */
function Header(){ return (
  <header className="header">
    <div className="container row between center">
      <div className="row center"><div className="logo-dot"/><strong className="brand">ZEN Lounge — Rezervări</strong></div>
      <nav className="nav">
        <Link className="navlink" to="/">Acasă</Link>
      </nav>
    </div>
  </header>
);}

function Controls({date,setDate,filter,setFilter}){
  const days=7; const nextDays=[...Array(days)].map((_,i)=> todayPlusDaysISO(i));
  return (
    <div className="card controls">
      <div className="row wrap">
        <div className="col">
          <label>Data</label>
          <select value={date} onChange={e=>setDate(e.target.value)}>
            {nextDays.map(d=> (
              <option key={d} value={d} disabled={!isSaturday(d)}>
                {fmtDate(d)}{!isSaturday(d)?' • blocat':''}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <label>Interval</label>
          <div className="chiprow"><span className="chip on">Toată seara ({CONFIG.party.open}–{CONFIG.party.close})</span></div>
        </div>
        <div className="col">
          <label>Filtru</label>
          <div className="chiprow">
            {["ALL","VIP","PREMIUM","STANDARD"].map(v=> (
              <button key={v} className={`chip ${filter===v?'on':''}`} onClick={()=>setFilter(v)}>{v}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Floor({tables,selectedId,onSelect,filter}){
  const svgRef = useRef(null); usePanZoom(svgRef);
  return (
    <div className="card floor">
      <svg ref={svgRef} viewBox={`0 0 ${FLOOR_W} ${FLOOR_H}`} role="img" aria-label="Plan club 2D">
        <rect x={80} y={40} width={840} height={50} className="stage" rx={10} />
        <text x={500} y={72} textAnchor="middle" className="label">STAGE</text>
        <rect x={800} y={160} width={140} height={320} className="bar" rx={12} />
        <text x={870} y={330} textAnchor="middle" className="label">BAR</text>
        <rect x={120} y={200} width={640} height={240} className="dance" rx={20} />
        <text x={440} y={320} textAnchor="middle" className="label">MAIN FLOOR</text>
        {tables.filter(t=> filter==="ALL" || t.tier===filter).map(t=>{
          const isSel = selectedId===t.id;
          return (
            <g key={t.id} className={`table ${isSel? 'sel':''}`} onClick={()=>onSelect(t.id)} tabIndex={0}>
              <circle cx={t.x} cy={t.y} r={t.r+6} className={`halo tier-${t.tier.toLowerCase()}`} />
              <circle cx={t.x} cy={t.y} r={t.r} className="disc" />
              <text x={t.x} y={t.y+4} textAnchor="middle" className="tno">{t.n}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend(){ return (
  <div className="legend row wrap">
    <div className="pill vip">VIP</div>
    <div className="pill premium">PREMIUM</div>
    <div className="pill standard">STANDARD</div>
  </div>
);} 

function Sidebar({table,capacityOK,guests,setGuests,name,setName,phone,setPhone,note,setNote,date}){
  return (
    <div className="card side">
      <h3 className="h3">Detalii rezervare</h3>
      <div className="kv"><span>Data</span><b>{fmtDate(date)}</b></div>
      <div className="kv"><span>Fereastră</span><b>{CONFIG.party.open} – {CONFIG.party.close}</b></div>
      {table? <>
        <div className="kv"><span>Masa</span><b>#{table.n} • {table.zone} • {table.tier}</b></div>
        <div className="kv"><span>Capacitate</span><b>{table.cap} pers</b></div>
      </> : <p className="muted tiny">Selectează o masă din plan.</p>}

      <div className="form">
        <label>Persoane</label>
        <input type="number" min={1} max={table?table.cap:12} value={guests} onChange={e=>setGuests(parseInt(e.target.value||'0'))} />
        {table && !capacityOK && <p className="warn">⚠️ Masa aleasă are maxim {table.cap} locuri.</p>}

        <label>Nume și prenume</label>
        <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Andrei Pop" />

        <label>Telefon</label>
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ex: +40 7xx xxx xxx" />

        <label>Observații (opțional)</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex: aniversare, preferințe" />
      </div>
    </div>
  );
}

/** HOOK */
function usePanZoom(ref){
  useEffect(()=>{
    const svg=ref.current; if(!svg) return; let pan={x:0,y:0}; let scale=1; let panning=false; let last={x:0,y:0};
    function apply(){ svg.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`; }
    function onWheel(e){ e.preventDefault(); const d=Math.sign(e.deltaY)*-0.1; scale=Math.min(2.2, Math.max(0.7, scale+d)); apply(); }
    function onDown(e){ panning=true; last={x:e.clientX,y:e.clientY}; }
    function onMove(e){ if(!panning) return; pan.x+=e.clientX-last.x; pan.y+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; apply(); }
    function onUp(){ panning=false; }
    svg.addEventListener('wheel', onWheel, {passive:false});
    svg.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return ()=>{ svg.removeEventListener('wheel', onWheel); svg.removeEventListener('mousedown', onDown); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  },[]);
}

/** STYLES */
function GlobalStyles(){ return (
  <style jsx global>{`
    :root{ --p:${BRAND.p}; --s:${BRAND.s}; --a:${BRAND.a}; --bg:${BRAND.bg}; --fg:${BRAND.fg}; }
    html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto}
    .container{max-width:1140px;margin:0 auto;padding:0 16px}
    .row{display:flex;gap:12px}
    .col{display:flex;flex-direction:column;gap:8px}
    .between{justify-content:space-between}
    .center{align-items:center}
    .wrap{flex-wrap:wrap}
    .muted{color:#cbd5e1}
    .tiny{font-size:12px}
    .h3{font-size:18px;margin:0 0 8px;font-weight:800}

    .header{position:sticky;top:0;z-index:10;background:rgba(7,8,12,.7);backdrop-filter:blur(8px);border-bottom:1px solid #1f2937;padding:12px 0}
    .brand{letter-spacing:.02em}
    .logo-dot{width:18px;height:18px;border-radius:50%;background:var(--p);box-shadow:0 0 20px var(--p);margin-right:8px}
    .nav{display:flex;gap:16px}
    .navlink{color:var(--fg);text-decoration:none;opacity:.9}

    .layout{display:grid;grid-template-columns: 1.2fr .8fr; gap:16px; padding:18px 0 28px}
    @media (max-width:980px){ .layout{ grid-template-columns:1fr; } }
    .left{display:flex;flex-direction:column;gap:16px}
    .right{display:flex;flex-direction:column;gap:16px}

    .card{background:#0b0b0b;border:1px solid #1f2937;border-radius:16px;padding:16px;position:relative}
    .btn-primary{background:var(--s);color:#06281f;border:1px solid #0f766e;padding:10px 14px;border-radius:999px;font-weight:800;text-decoration:none;display:inline-block;box-shadow:0 6px 24px rgba(16,185,129,.25);cursor:pointer;font-size:15px;width:100%}
    .btn-primary.disabled{opacity:.5;pointer-events:none;cursor:not-allowed}
    .cta{display:flex;flex-direction:column;gap:8px}

    .controls label{font-size:12px;color:#94a3b8;font-weight:700}
    .controls select{background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:10px;padding:8px 10px}
    .chiprow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .chip{background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:999px;padding:8px 12px;font-weight:700;cursor:pointer;font-size:13px}
    .chip.on{background:linear-gradient(120deg,rgba(217,70,239,.18),rgba(14,165,233,.18));border-color:#475569;box-shadow:0 0 18px rgba(168,85,247,.25)}

    .floor{overflow:hidden}
    .floor svg{width:100%;height:520px;display:block;background:
      radial-gradient(900px 500px at 15% 15%, rgba(168,85,247,.08), transparent 60%),
      radial-gradient(900px 500px at 85% 25%, rgba(217,70,239,.08), transparent 60%),
      linear-gradient(#0a0a0a,#0a0a0a)}
    .stage{fill:#0f172a;stroke:#334155;stroke-width:2}
    .bar{fill:#0f172a;stroke:#334155;stroke-width:2}
    .dance{fill:rgba(14,165,233,.06);stroke:#1f2937;stroke-width:2}
    .label{fill:#94a3b8;font-size:14px;font-weight:700;letter-spacing:.06em}
    .table{cursor:pointer}
    .disc{fill:#111827;stroke:#374151;stroke-width:2}
    .halo{fill:transparent}
    .tier-vip{stroke:${BRAND.p}; stroke-width:3; filter: drop-shadow(0 0 12px ${BRAND.p}55)}
    .tier-premium{stroke:${BRAND.a}; stroke-width:3; filter: drop-shadow(0 0 12px ${BRAND.a}55)}
    .tier-standard{stroke:${BRAND.s}; stroke-width:3; filter: drop-shadow(0 0 12px ${BRAND.s}55)}
    .tno{fill:#e2e8f0;font-size:14px;font-weight:900}
    .table.sel .disc{fill:#0b1325;stroke:#60a5fa}

    .kv{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1f2937}
    .kv span{color:#94a3b8;font-size:13px}
    .kv b{color:#e5e7eb;font-size:13px}

    .form{display:flex;flex-direction:column;gap:12px;margin-top:12px}
    .form label{display:block;font-size:12px;color:#94a3b8;font-weight:700;margin-bottom:4px}
    .form input,.form textarea{width:100%;background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:10px;padding:10px 12px;box-sizing:border-box}
    .form input::placeholder,.form textarea::placeholder{color:#64748b}
    .form textarea{min-height:96px;resize:vertical}
    .warn{color:#fbbf24;font-size:12px;margin:2px 0 0}

    .legend{display:flex;gap:12px;padding:12px}
    .pill{padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700}
    .pill.vip{background:rgba(217,70,239,.15);color:${BRAND.p};border:1px solid ${BRAND.p}55}
    .pill.premium{background:rgba(14,165,233,.15);color:${BRAND.a};border:1px solid ${BRAND.a}55}
    .pill.standard{background:rgba(34,197,94,.15);color:${BRAND.s};border:1px solid ${BRAND.s}55}
  `}</style>
); }