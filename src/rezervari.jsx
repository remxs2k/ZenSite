import { useEffect, useMemo, useRef, useState } from "react";

/***********
 * ZEN — Rezervări 2D (Enhanced v3)
 * + Google Sheets Integration (Real-time)
 * + Prețuri pe categorii
 * + 3D Hover effects
 * + Live availability
 ***********/

/** BRAND */
const BRAND = { p: "#d946ef", s: "#22c55e", a: "#0ea5e9", bg: "#07080c", fg: "#f8fafc" };

/** CONFIG */
const CONFIG = {
  party: { open: "22:00", close: "05:00" },
  phoneE164: "40745093730",
  webhookUrl: "https://script.google.com/macros/s/AKfycbyMCIGZKD-zKJWOs4WWhyhK7_O0HFF10VCVrv3CQkAQCoznsVByu6VAkv_DJOHPLbH6/exec",
  prices: {
    VIP: 500,
    PREMIUM: 300,
    STANDARD: 200
  }
};

/** UTILS */
function todayPlusDaysISO(d = 0) { const x = new Date(); x.setHours(0,0,0,0); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); }
function weekdayISO(date){return new Date(date+"T00:00:00").getDay(); }
function isSaturday(dateISO){ return weekdayISO(dateISO)===6; }
function nextSaturdayISO(){ const d=new Date(); const diff=((6-d.getDay()+7)%7)||7; d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function fmtDate(iso){ const d=new Date(iso+"T00:00:00"); try{ const s=d.toLocaleDateString('ro-RO',{weekday:'long',day:'2-digit',month:'long'}); return s.replace(/^./,c=>c.toUpperCase()); }catch{ return iso; } }

const WA = {
  web: (txt)=>`https://api.whatsapp.com/send?phone=${CONFIG.phoneE164}&text=${txt}`,
  scheme: (txt)=>`whatsapp://send?phone=${CONFIG.phoneE164}&text=${txt}`,
};
function isMobile(){ if (typeof navigator==='undefined') return false; const ua=(navigator).userAgent||''; return /android|iphone|ipad|ipod/i.test(ua); }
function primaryWa(txt){ return isMobile()? WA.scheme(txt) : WA.web(txt); }

// API calls
async function fetchBookedTables(date) {
  try {
    const response = await fetch(`${CONFIG.webhookUrl}?date=${date}`);
    const data = await response.json();
    return data.bookedTables || [];
  } catch (error) {
    console.error('Error fetching booked tables:', error);
    return [];
  }
}

async function saveReservation(reservation) {
  try {
    const response = await fetch(CONFIG.webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation)
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving reservation:', error);
    return { success: false, error };
  }
}

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
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [bookedTables, setBookedTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  
  const selTable = TABLES.find(t=>t.id===selected) || null;
  const capacityOK = selTable ? guests <= selTable.cap : false;
  const isTableBooked = selTable ? bookedTables.includes(selTable.id) : false;

  // Fetch booked tables when date changes
  useEffect(()=>{
    async function loadBookedTables() {
      setLoadingTables(true);
      const booked = await fetchBookedTables(date);
      setBookedTables(booked);
      setLoadingTables(false);
    }
    loadBookedTables();
  }, [date]);

  useEffect(()=>{ if(selTable && guests>selTable.cap) setGuests(selTable.cap); }, [selected]);

  const waText = useMemo(()=>{
    if(!selTable) return '';
    const price = CONFIG.prices[selTable.tier];
    const base = `Masa #${selTable.n} (${selTable.zone}, ${selTable.tier})`;
    const rows = [
      `🎉 Rezervare ZEN Lounge`,
      `📅 Data: ${fmtDate(date)} (${date})`,
      `⏰ Interval: Toată seara (${CONFIG.party.open}–${CONFIG.party.close})`,
      `🍽️ Detalii masă: ${base}`,
      `💰 Preț: ${price} RON`,
      `👥 Persoane: ${guests}`,
      `📝 Nume: ${name.trim()}`,
      `📞 Telefon: ${phone.trim()}`,
      note.trim()? `💬 Notă: ${note.trim()}` : null,
    ].filter(Boolean);
    return encodeURIComponent(rows.join('\n'));
  },[selTable,date,guests,name,phone,note]);

  function canSubmit(){
    return !!(selTable && isSaturday(date) && capacityOK && !isTableBooked && name.trim().length>=2 && /^\+?\d{9,15}$/.test(phone.replace(/\s|-/g,'')));
  }
  
  async function onWhatsApp(e){ 
    e.preventDefault();
    if(!canSubmit()) return;
    
    setLoading(true);
    
    // Save to Google Sheets first
    const reservation = {
      date: date,
      tableId: selTable.id,
      tableNumber: selTable.n,
      name: name.trim(),
      phone: phone.trim(),
      guests: guests,
      note: note.trim()
    };
    
    await saveReservation(reservation);
    
    // Update local state
    setBookedTables(prev => [...prev, selTable.id]);
    
    // Open WhatsApp
    setTimeout(() => {
      const waUrl = primaryWa(waText);
      const opened = window.open(waUrl, '_blank');
      
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        window.location.href = waUrl;
      }
      
      setTimeout(() => {
        setLoading(false);
        // Reset form
        setSelected(null);
        setGuests(4);
        setName("");
        setPhone("");
        setNote("");
      }, 1000);
    }, 500);
  }

  return (
    <div className={`page ${darkMode ? 'dark' : 'light'}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="container layout">
        <div className="left">
          <Controls date={date} setDate={setDate} filter={filter} setFilter={setFilter} />
          {loadingTables ? (
            <div className="card floor loading-state">
              <div className="spinner-large"></div>
              <p>Se încarcă mesele disponibile...</p>
            </div>
          ) : (
            <Floor tables={TABLES} selectedId={selected} onSelect={setSelected} filter={filter} 
                   bookedTables={bookedTables} />
          )}
          <Legend />
        </div>
        <div className="right">
          <Sidebar table={selTable} capacityOK={capacityOK} guests={guests} setGuests={setGuests}
                   name={name} setName={setName} phone={phone} setPhone={setPhone}
                   note={note} setNote={setNote} date={date} isBooked={isTableBooked} />
          <div className="cta">
            <button 
              className={`btn-primary ${!canSubmit()? 'disabled':''} ${loading ? 'loading' : ''}`} 
              onClick={onWhatsApp} 
              disabled={!canSubmit() || loading}
            >
              {loading ? (
                <span className="btn-content">
                  <span className="spinner"></span>
                  Se salvează rezervarea...
                </span>
              ) : (
                'Finalizează pe WhatsApp'
              )}
            </button>
            {isTableBooked && <p className="error-msg">❌ Această masă este deja rezervată pentru data selectată</p>}
            <p className="muted tiny">Rezervările se fac doar sâmbăta ({CONFIG.party.open}–{CONFIG.party.close}).</p>
          </div>
        </div>
      </div>
      <GlobalStyles darkMode={darkMode} />
    </div>
  );
}

function Header({darkMode, setDarkMode}){ 
  return (
    <header className="header">
      <div className="container row between center">
        <div className="row center">
          <div className="logo-dot"/>
          <strong className="brand">ZEN Lounge — Rezervări</strong>
        </div>
        <nav className="nav row center">
          <button 
            className="theme-toggle" 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <a className="navlink" href="/">Acasă</a>
        </nav>
      </div>
    </header>
  );
}

function Controls({date,setDate,filter,setFilter}){
  const days=7; const nextDays=[...Array(days)].map((_,i)=> todayPlusDaysISO(i));
  return (
    <div className="card controls fade-in">
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

function Floor({tables,selectedId,onSelect,filter,bookedTables}){
  const svgRef = useRef(null); 
  usePanZoom(svgRef);
  
  return (
    <div className="card floor fade-in" style={{animationDelay: '0.1s'}}>
      <svg ref={svgRef} viewBox={`0 0 ${FLOOR_W} ${FLOOR_H}`} role="img" aria-label="Plan club 2D">
        <rect x={80} y={40} width={840} height={50} className="stage" rx={10} />
        <text x={500} y={72} textAnchor="middle" className="label">STAGE</text>
        <rect x={800} y={160} width={140} height={320} className="bar" rx={12} />
        <text x={870} y={330} textAnchor="middle" className="label">BAR</text>
        <rect x={120} y={200} width={640} height={240} className="dance" rx={20} />
        <text x={440} y={320} textAnchor="middle" className="label">MAIN FLOOR</text>
        {tables.filter(t=> filter==="ALL" || t.tier===filter).map(t=>{
          const isSel = selectedId===t.id;
          const isBooked = bookedTables.includes(t.id);
          return (
            <g 
              key={t.id} 
              className={`table ${isSel? 'sel':''} ${isBooked? 'booked':''}`} 
              onClick={()=> !isBooked && onSelect(t.id)} 
              tabIndex={0}
              style={{cursor: isBooked ? 'not-allowed' : 'pointer'}}
            >
              <circle cx={t.x} cy={t.y} r={t.r+6} className={`halo tier-${t.tier.toLowerCase()}`} />
              <circle cx={t.x} cy={t.y} r={t.r} className="disc" />
              <text x={t.x} y={t.y+4} textAnchor="middle" className="tno">{t.n}</text>
              {isBooked && (
                <>
                  <line x1={t.x-t.r+8} y1={t.y-t.r+8} x2={t.x+t.r-8} y2={t.y+t.r-8} className="booked-cross" />
                  <line x1={t.x+t.r-8} y1={t.y-t.r+8} x2={t.x-t.r+8} y2={t.y+t.r-8} className="booked-cross" />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend(){ 
  return (
    <div className="legend-wrap fade-in" style={{animationDelay: '0.2s'}}>
      <div className="legend row wrap">
        <div className="pill vip">VIP • {CONFIG.prices.VIP} RON</div>
        <div className="pill premium">PREMIUM • {CONFIG.prices.PREMIUM} RON</div>
        <div className="pill standard">STANDARD • {CONFIG.prices.STANDARD} RON</div>
      </div>
      <div className="availability-legend">
        <div className="av-item"><div className="dot available"></div><span>Disponibilă</span></div>
        <div className="av-item"><div className="dot booked"></div><span>Rezervată</span></div>
      </div>
    </div>
  );
} 

function Sidebar({table,capacityOK,guests,setGuests,name,setName,phone,setPhone,note,setNote,date,isBooked}){
  return (
    <div className="card side fade-in" style={{animationDelay: '0.15s'}}>
      <h3 className="h3">Detalii rezervare</h3>
      <div className="kv"><span>Data</span><b>{fmtDate(date)}</b></div>
      <div className="kv"><span>Fereastră</span><b>{CONFIG.party.open} – {CONFIG.party.close}</b></div>
      {table? <>
        <div className="kv highlight"><span>Masa</span><b>#{table.n} • {table.zone} • {table.tier}</b></div>
        <div className="kv"><span>Capacitate</span><b>{table.cap} pers</b></div>
        <div className="kv price-row">
          <span>Preț</span>
          <b className="price">{CONFIG.prices[table.tier]} RON</b>
        </div>
        {isBooked && <div className="booked-banner">🔒 Masa rezervată</div>}
      </> : <p className="muted tiny">Selectează o masă din plan.</p>}

      <div className="form">
        <label>Persoane</label>
        <input type="number" min={1} max={table?table.cap:12} value={guests} onChange={e=>setGuests(parseInt(e.target.value||'0'))} disabled={isBooked} />
        {table && !capacityOK && <p className="warn">⚠️ Masa aleasă are maxim {table.cap} locuri.</p>}

        <label>Nume și prenume</label>
        <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Andrei Pop" disabled={isBooked} />

        <label>Telefon</label>
        <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ex: +40 7xx xxx xxx" disabled={isBooked} />

        <label>Observații (opțional)</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex: aniversare, preferințe" disabled={isBooked} />
      </div>
    </div>
  );
}

function usePanZoom(ref){
  useEffect(()=>{
    const svg=ref.current; if(!svg) return; let pan={x:0,y:0}; let scale=1; let panning=false; let last={x:0,y:0};
    function apply(){ svg.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`; svg.style.transition = 'transform 0.1s ease-out'; }
    function onWheel(e){ e.preventDefault(); const d=Math.sign(e.deltaY)*-0.1; scale=Math.min(2.2, Math.max(0.7, scale+d)); apply(); }
    function onDown(e){ panning=true; last={x:e.clientX,y:e.clientY}; svg.style.cursor = 'grabbing'; }
    function onMove(e){ if(!panning) return; pan.x+=e.clientX-last.x; pan.y+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; apply(); }
    function onUp(){ panning=false; svg.style.cursor = 'grab'; }
    svg.addEventListener('wheel', onWheel, {passive:false});
    svg.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    svg.style.cursor = 'grab';
    return ()=>{ svg.removeEventListener('wheel', onWheel); svg.removeEventListener('mousedown', onDown); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  },[]);
}

function GlobalStyles({darkMode}){ 
  const theme = darkMode ? {
    bg: BRAND.bg,
    fg: BRAND.fg,
    cardBg: '#0b0b0b',
    cardBorder: '#1f2937',
    inputBg: '#0f172a',
    inputBorder: '#334155',
    muted: '#cbd5e1',
    label: '#94a3b8'
  } : {
    bg: '#f8fafc',
    fg: '#0f172a',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    inputBg: '#f1f5f9',
    inputBorder: '#cbd5e1',
    muted: '#64748b',
    label: '#475569'
  };
  
  return (
    <style jsx global>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }

      :root{ 
        --p:${BRAND.p}; 
        --s:${BRAND.s}; 
        --a:${BRAND.a}; 
        --bg:${theme.bg}; 
        --fg:${theme.fg};
        --card-bg:${theme.cardBg};
        --card-border:${theme.cardBorder};
        --input-bg:${theme.inputBg};
        --input-border:${theme.inputBorder};
        --muted:${theme.muted};
        --label:${theme.label};
      }
      
      * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
      
      html,body{height:100%;margin:0;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto}
      .container{max-width:1140px;margin:0 auto;padding:0 16px}
      .row{display:flex;gap:12px}
      .col{display:flex;flex-direction:column;gap:8px}
      .between{justify-content:space-between}
      .center{align-items:center}
      .wrap{flex-wrap:wrap}
      .muted{color:var(--muted)}
      .tiny{font-size:12px}
      .h3{font-size:18px;margin:0 0 8px;font-weight:800}
      
      .fade-in{animation: fadeIn 0.6s ease-out forwards;}

      .header{position:sticky;top:0;z-index:10;background:${darkMode ? 'rgba(7,8,12,.8)' : 'rgba(248,250,252,.8)'};backdrop-filter:blur(12px);border-bottom:1px solid var(--card-border);padding:12px 0}
      .brand{letter-spacing:.02em}
      .logo-dot{width:18px;height:18px;border-radius:50%;background:var(--p);box-shadow:0 0 20px ${BRAND.p}80;margin-right:8px;animation: pulse 2s ease-in-out infinite;}
      .nav{display:flex;gap:16px}
      .navlink{color:var(--fg);text-decoration:none;opacity:.9;transition:opacity 0.2s;}
      .navlink:hover{opacity:1}
      
      .theme-toggle{background:var(--card-bg);border:1px solid var(--card-border);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:18px;transition:all 0.2s;}
      .theme-toggle:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,0.1)}

      .layout{display:grid;grid-template-columns: 1.2fr .8fr; gap:16px; padding:18px 0 28px}
      @media (max-width:980px){ 
        .layout{ grid-template-columns:1fr; } 
        .right{order:-1;}
      }
      .left{display:flex;flex-direction:column;gap:16px}
      .right{display:flex;flex-direction:column;gap:16px}

      .card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:16px;padding:16px;position:relative;box-shadow:0 2px 8px rgba(0,0,0,${darkMode ? '0.3' : '0.05'});transition:all 0.3s}
      .card:hover{box-shadow:0 4px 16px rgba(0,0,0,${darkMode ? '0.4' : '0.1'})}
      
      .loading-state{
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        min-height:520px;
        gap:16px;
      }
      .spinner-large{
        width:48px;
        height:48px;
        border:4px solid var(--input-border);
        border-top-color:var(--p);
        border-radius:50%;
        animation:spin 0.8s linear infinite;
      }
      
      .btn-primary{
        background:var(--s);
        color:#06281f;
        border:1px solid #0f766e;
        padding:12px 16px;
        border-radius:999px;
        font-weight:800;
        text-decoration:none;
        display:inline-block;
        box-shadow:0 6px 24px rgba(16,185,129,.25);
        cursor:pointer;
        font-size:15px;
        width:100%;
        transition:all 0.3s ease;
      }
      .btn-primary:hover:not(.disabled):not(.loading){
        transform:translateY(-2px);
        box-shadow:0 8px 32px rgba(16,185,129,.35);
      }
      .btn-primary:active:not(.disabled):not(.loading){
        transform:translateY(0);
      }
      .btn-primary.disabled{opacity:.5;pointer-events:none;cursor:not-allowed}
      .btn-primary.loading{opacity:.8;cursor:wait}
      
      .btn-content{display:flex;align-items:center;justify-content:center;gap:10px}
      .spinner{width:16px;height:16px;border:2px solid #06281f40;border-top-color:#06281f;border-radius:50%;animation:spin 0.6s linear infinite}
      
      .cta{display:flex;flex-direction:column;gap:8px}
      .error-msg{color:#ef4444;font-size:13px;font-weight:600;text-align:center;animation:fadeIn 0.3s ease-out}

      .controls label{font-size:12px;color:var(--label);font-weight:700}
      .controls select{background:var(--input-bg);color:var(--fg);border:1px solid var(--input-border);border-radius:10px;padding:8px 10px;cursor:pointer}
      .chiprow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .chip{
        background:var(--input-bg);
        color:var(--fg);
        border:1px solid var(--input-border);
        border-radius:999px;
        padding:8px 12px;
        font-weight:700;
        cursor:pointer;
        font-size:13px;
        transition:all 0.2s;
      }
      .chip:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
      .chip.on{
        background:linear-gradient(120deg,rgba(217,70,239,.18),rgba(14,165,233,.18));
        border-color:#475569;
        box-shadow:0 0 18px rgba(168,85,247,.25);
        transform:scale(1.05);
      }

      .floor{overflow:hidden}
      .floor svg{
        width:100%;
        height:520px;
        display:block;
        background:${darkMode ? `
          radial-gradient(900px 500px at 15% 15%, rgba(168,85,247,.08), transparent 60%),
          radial-gradient(900px 500px at 85% 25%, rgba(217,70,239,.08), transparent 60%),
          linear-gradient(#0a0a0a,#0a0a0a)` : `
          radial-gradient(900px 500px at 15% 15%, rgba(168,85,247,.05), transparent 60%),
          radial-gradient(900px 500px at 85% 25%, rgba(217,70,239,.05), transparent 60%),
          linear-gradient(#f1f5f9,#f1f5f9)`
        };
      }
      .stage{fill:${darkMode ? '#0f172a' : '#e2e8f0'};stroke:${darkMode ? '#334155' : '#cbd5e1'};stroke-width:2}
      .bar{fill:${darkMode ? '#0f172a' : '#e2e8f0'};stroke:${darkMode ? '#334155' : '#cbd5e1'};stroke-width:2}
      .dance{fill:${darkMode ? 'rgba(14,165,233,.06)' : 'rgba(14,165,233,.08)'};stroke:${darkMode ? '#1f2937' : '#cbd5e1'};stroke-width:2}
      .label{fill:var(--label);font-size:14px;font-weight:700;letter-spacing:.06em}
      
      .table{
        cursor:pointer;
        transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-origin:center;
      }
      .table:not(.booked):hover{
        animation: float 1s ease-in-out infinite;
      }
      .table:not(.booked):hover .disc{
        fill:${darkMode ? '#1e293b' : '#e2e8f0'};
        filter:drop-shadow(0 8px 16px rgba(0,0,0,0.3));
      }
      .table:not(.booked):hover .halo{
        filter:brightness(1.5) drop-shadow(0 0 24px currentColor);
        stroke-width:4;
      }
      .table:not(.booked):hover .tno{
        font-size:16px;
        font-weight:900;
      }
      
      .disc{fill:${darkMode ? '#111827' : '#ffffff'};stroke:${darkMode ? '#374151' : '#94a3b8'};stroke-width:2;transition:all 0.3s}
      .halo{fill:transparent;transition:all 0.3s}
      .tier-vip{stroke:${BRAND.p}; stroke-width:3; filter: drop-shadow(0 0 12px ${BRAND.p}55)}
      .tier-premium{stroke:${BRAND.a}; stroke-width:3; filter: drop-shadow(0 0 12px ${BRAND.a}55)}
      .tier-standard{stroke:${BRAND.s}; stroke-width:3; filter: drop-shadow(0 0 12px ${BRAND.s}55)}
      .tno{fill:var(--fg);font-size:14px;font-weight:900;transition:all 0.3s}
      
      .table.sel .disc{fill:${darkMode ? '#0b1325' : '#dbeafe'};stroke:#60a5fa;transform:scale(1.15);transform-origin:center}
      .table.sel .halo{filter:drop-shadow(0 0 24px #60a5fa);stroke-width:4}
      
      .table.booked{
        opacity:0.4;
        cursor:not-allowed !important;
      }
      .table.booked .disc{
        fill:${darkMode ? '#1f2937' : '#f1f5f9'};
        stroke:#ef4444;
      }
      .table.booked .halo{
        stroke:#ef4444;
        filter:drop-shadow(0 0 8px #ef444455);
      }
      .booked-cross{
        stroke:#ef4444;
        stroke-width:3;
        stroke-linecap:round;
      }

      .kv{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--card-border);transition:all 0.2s}
      .kv:hover{background:${darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}}
      .kv.highlight{background:linear-gradient(90deg, ${darkMode ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.1)'}, transparent);border-left:3px solid #60a5fa;padding-left:12px}
      .kv.price-row{border-left:3px solid ${BRAND.s};padding-left:12px;background:linear-gradient(90deg, ${darkMode ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)'}, transparent)}
      .kv span{color:var(--label);font-size:13px}
      .kv b{color:var(--fg);font-size:13px}
      .kv .price{color:${BRAND.s};font-size:16px;font-weight:900}

      .booked-banner{
        background:linear-gradient(135deg, #ef4444, #dc2626);
        color:white;
        padding:8px 12px;
        border-radius:8px;
        text-align:center;
        font-weight:700;
        font-size:13px;
        margin-top:8px;
        animation:fadeIn 0.3s ease-out;
      }

      .form{display:flex;flex-direction:column;gap:12px;margin-top:12px}
      .form label{display:block;font-size:12px;color:var(--label);font-weight:700;margin-bottom:4px}
      .form input,.form textarea{
        width:100%;
        background:var(--input-bg);
        color:var(--fg);
        border:1px solid var(--input-border);
        border-radius:10px;
        padding:10px 12px;
        box-sizing:border-box;
        transition:all 0.2s;
      }
      .form input:disabled,.form textarea:disabled{
        opacity:0.5;
        cursor:not-allowed;
      }
      .form input:focus,.form textarea:focus{
        outline:none;
        border-color:${BRAND.a};
        box-shadow:0 0 0 3px ${BRAND.a}20;
      }
      .form input::placeholder,.form textarea::placeholder{color:${darkMode ? '#64748b' : '#94a3b8'}}
      .form textarea{min-height:96px;resize:vertical}
      .warn{color:#fbbf24;font-size:12px;margin:2px 0 0;animation:fadeIn 0.3s ease-out}

      .legend-wrap{display:flex;flex-direction:column;gap:12px}
      .legend{display:flex;gap:12px;padding:12px;flex-wrap:wrap}
      .pill{padding:8px 14px;border-radius:999px;font-size:13px;font-weight:700;transition:all 0.2s}
      .pill:hover{transform:translateY(-2px)}
      .pill.vip{background:rgba(217,70,239,.15);color:${BRAND.p};border:1px solid ${BRAND.p}55}
      .pill.premium{background:rgba(14,165,233,.15);color:${BRAND.a};border:1px solid ${BRAND.a}55}
      .pill.standard{background:rgba(34,197,94,.15);color:${BRAND.s};border:1px solid ${BRAND.s}55}
      
      .availability-legend{
        display:flex;
        gap:16px;
        padding:12px;
        background:var(--card-bg);
        border:1px solid var(--card-border);
        border-radius:12px;
        justify-content:center;
      }
      .av-item{
        display:flex;
        align-items:center;
        gap:8px;
        font-size:13px;
        font-weight:600;
      }
      .dot{
        width:12px;
        height:12px;
        border-radius:50%;
        border:2px solid;
      }
      .dot.available{
        background:${BRAND.s};
        border-color:${BRAND.s};
        box-shadow:0 0 12px ${BRAND.s}66;
      }
      .dot.booked{
        background:#ef4444;
        border-color:#ef4444;
        box-shadow:0 0 12px #ef444466;
      }
      
      @media (max-width: 640px) {
        .container{padding:0 12px}
        .header .brand{font-size:14px}
        .logo-dot{width:14px;height:14px}
        .floor svg{height:400px}
        .controls .row{flex-direction:column}
        .controls .col{width:100%}
        .chiprow{justify-content:center}
        .legend{justify-content:center}
        .btn-primary{font-size:14px;padding:10px 14px}
        .availability-legend{flex-direction:column;gap:8px}
      }
      
      @media (max-width: 480px) {
        .h3{font-size:16px}
        .kv{font-size:12px;padding:6px 0}
        .form input,.form textarea{font-size:14px;padding:8px 10px}
        .floor svg{height:350px}
        .pill{font-size:11px;padding:6px 10px}
      }
    `}</style>
  );
}