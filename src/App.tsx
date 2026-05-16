import { useState, useEffect, useRef, useCallback } from "react";

// ── Palette ──────────────────────────────────────────────────────────────────
const P = {
  bg: "#0e0f13",
  surface: "#13141a",
  card: "#181920",
  border: "#22232e",
  text: "#e8e6f0",
  muted: "#5a5870",
  dim: "#8e8ca0",
  anime: "#4a7fa5",
  animeSoft: "#1a2d3d",
  manhwa: "#4a8a6a",
  manhwaSoft: "#1a2e24",
  shows: "#8a6a3a",
  showsSoft: "#2e2416",
  movies: "#7a4a6a",
  moviesSoft: "#2a1824",
  books: "#6a5a3a",
  booksSoft: "#241e14",
  kdrama: "#7a4a5a",
  kdramaSoft: "#281820",
  wattpad: "#5a4a7a",
  wattpadSoft: "#1e1828",
  adult: "#6a3a4a",
  adultSoft: "#221418",
  green: "#4a8a6a",
  red: "#8a4a4a",
  yellow: "#8a7a3a",
};

const CAT_META = {
  anime:    { label: "Anime",    accent: P.anime,    soft: P.animeSoft,    icon: "⛩" },
  manhwa:   { label: "Manhwa",   accent: P.manhwa,   soft: P.manhwaSoft,   icon: "📖" },
  shows:    { label: "Shows",    accent: P.shows,    soft: P.showsSoft,    icon: "📺" },
  movies:   { label: "Movies",   accent: P.movies,   soft: P.moviesSoft,   icon: "🎬" },
  books:    { label: "Books",    accent: P.books,    soft: P.booksSoft,    icon: "📚" },
  kdrama:   { label: "K-Drama",  accent: P.kdrama,   soft: P.kdramaSoft,   icon: "🎭" },
  wattpad:  { label: "Wattpad",  accent: P.wattpad,  soft: P.wattpadSoft,  icon: "✍️" },
  adult:    { label: "18+",      accent: P.adult,    soft: P.adultSoft,    icon: "🔞" },
};

const STATUS_COLORS = {
  "Watching":       "#4a7fa5", "Reading":        "#4a8a6a",
  "Completed":      "#4a8a6a", "Plan to Watch":  "#8a7a3a",
  "Plan to Read":   "#8a7a3a", "Dropped":        "#8a4a4a",
  "On Hiatus":      "#7a5a3a", "On Hold":        "#5a5870",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const strColor = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 25%, 28%)`;
};

const useLS = (key, def) => {
  const [v, setV] = useState(() => { 
    try { 
      const s = localStorage.getItem(key); 
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return def; 
    } catch { return def; } 
  });
  const save = useCallback((x: any) => { 
    const n = typeof x === "function" ? x(v) : x; 
    setV(n); 
    try { localStorage.setItem(key, JSON.stringify(n)); } catch {} 
  }, [key, v]);
  return [v, save];
};

// ── Cover fetching ────────────────────────────────────────────────────────────
const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8"; // public demo key

const fetchCover = async (title, cat) => {
  try {
    if (cat === "anime" || cat === "manhwa") {
      const q = encodeURIComponent(title);
      const type = cat === "manhwa" ? "manga" : "anime";
      const r = await fetch(`https://api.jikan.moe/v4/${type}?q=${q}&limit=1`);
      const d = await r.json();
      const img = d?.data?.[0]?.images?.jpg?.large_image_url || d?.data?.[0]?.images?.jpg?.image_url;
      if (img) return img;
    }
    if (cat === "movies") {
      const q = encodeURIComponent(title);
      const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${q}&limit=1`);
      const d = await r.json();
      const path = d?.results?.[0]?.poster_path;
      if (path) return `https://image.tmdb.org/t/p/w300${path}`;
    }
    if (cat === "shows" || cat === "kdrama") {
      const q = encodeURIComponent(title);
      const r = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${q}&limit=1`);
      const d = await r.json();
      const path = d?.results?.[0]?.poster_path;
      if (path) return `https://image.tmdb.org/t/p/w300${path}`;
    }
  } catch {}
  return null;
};

const useCoverFetcher = (entries: any[], setEntries: any) => {
  const fetchedRef = useRef<Set<string>>(new Set());
  const coversRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const toFetch = entries.filter((e: any) =>
      !e.cover &&
      ["anime","manhwa","movies","shows","kdrama"].includes(e.cat) &&
      !fetchedRef.current.has(e.id)
    );
    if (!toFetch.length) return;

    let i = 0;
    const next = async () => {
      if (i >= toFetch.length) return;
      const entry = toFetch[i++];
      fetchedRef.current.add(entry.id);
      if (entry.cat === "anime" || entry.cat === "manhwa") {
        await new Promise(r => setTimeout(r, 450));
      }
      const cover = await fetchCover(entry.title, entry.cat);
      if (cover) {
        coversRef.current[entry.id] = cover;
        // batch update using functional form so we always have latest state
        setEntries((es: any[]) => es.map((e: any) => 
          coversRef.current[e.id] ? { ...e, cover: coversRef.current[e.id] } : e
        ));
      }
      next();
    };
    next(); next();
  }, [entries.length]);
};

// ── Pre-loaded data ───────────────────────────────────────────────────────────
const ANIME_SEED = [
  "Battle Through the Heaven","Uncle from Another World","Campfire Cooking in Another World","Delicious in the Dungeon","Fruit of Evolution","Scissors Seven","Horimiya","Komi Can't Communicate","Trapped in a Dating Sim","Oregairu","How a Realist Hero Rebuilt the Kingdom","Classroom of the Elite","The Wrong Way to Use Healing Magic","The Rising of the Shield Hero","The Misfit of the Demon Academy","Black Clover","Solo Leveling","Banished from the Hero's Party","Cautious Hero","Blue Exorcist","Dark Gathering","The Way of the Househusband","Re:Zero","My Isekai Life","Mushoku Tensei","Akuma Kun","Tsukimichi","I Got a Cheat Skill in Another World","A Returner's Magic Should Be Special","Am I Actually the Strongest?","The Great Cleric","Radiant","The Reincarnation of the Strongest Exorcist","Demon Slayer","Chainsaw Man","One Punch Man","Jujutsu Kaisen","Saiki K","Naruto Shippuden","Lookism","My Hero Academia","Death Note","Assassination Classroom","Spy x Family","The Daily Life of the Immortal King","Parasyte","Zom 100","Hell's Paradise","Dreaming Boy is a Realist","Parallel World Pharmacy","In Another World with Smartphone","How NOT to Summon a Demon King","An Archdemon's Dilemma","I Am Quitting Heroing","I Was Reincarnated as the 7th Prince","Chillin in Another World with Level 2 Super Cheat Powers","Windbreaker","The Eminence in Shadow","Genius Prince","The Ice Guy and His Cool Female Colleague","My Love Story with Yamada-kun at Lv999","Dr. Stone","Shangri-La Frontier","Sometimes Alya Hides Her Feelings in Russian","The Case Study of Vanitas","My Stepmom's Daughter is My Ex","The Unwanted Undead Adventure","KonoSuba","Skeleton Knight in Another World","Tomo-chan is a Girl","DanDaDan","Hyouka","Handa-kun","The Devil is a Part-Timer","Handyman Saito","I Am a Villainess So I Am Taming the Boss","Failure Frame","Sakomoto Days","Life Lessons with Uramichi Oniisan","Talentless Nana","Kenichi the Mightiest Disciple","Headhunted to Another World","I Parry Everything","Bartender: Glass of God","Restaurant to Another World","BoBoiBoy","Yakuza's Guide to Babysitting","Kaiju No. 8","Kotaro Lives Alone","The Master of Killing Time","Welcome to the Outcast's Restaurant","Tsuredure Children","Pass the Monster Meat My Lady","Kakuriyo: Bed & Breakfast for Spirits","One Piece","The Apothecary Diaries","My Status as an Assassin","Love Through a Prism","Let the Grieving Soul Retire","Jack of All Trades","A Certain Magical Index","Handyman Saitou","My Senpai is Annoying","My Tiny Senpai","Love is Hard for Otaku","Aharen-san"
];
const ANIME_MOVIES_SEED = ["A Silent Voice","Your Name","I Want to Eat Your Pancreas","Erased"];
const MANHWA_SEED = ["Supergene","Solo Leveling","Omniscient Reader","Chainsaw Man","The Beginning After the End","The World After the Fall","Regressing with the King's Power","Leveling Up with the Gods","The Great Estate Developer","The Lout of Count's Family","Pick Me Up","Hero x Demon Queen","Return to Player","I Am Going to Wipe Out This Country","Infinite Mage","The Reborn Young Lord is an Assassin","The Extra's Academy Survival Guide","Peaceful Camping Life in Another World","The Life of a Quack's Healer","The Archmage's Restaurant","What a Bountiful Harvest Demon Lord","Eleceed","The Top Dungeon Farmer","The Apothecary Prince","Enrolling at the Transcendent Academy","The Grand Duke's Fox Princess","Teenage Mercenary","The Perfect Hybrid","Kindergarten for Divine Beasts","My S-Class Hunters","Dungeon Crawler Carl","Surviving the Game as a Barbarian","Barbarian's Adventure in a Fantasy World"];
const SHOWS_SEED = [
  {t:"Mr Midnight",sub:"Thriller"},{t:"Loki",sub:"Sci-Fi/Fantasy"},{t:"Daredevil",sub:"Thriller"},{t:"Defenders",sub:"Thriller"},{t:"Lockwood and Co",sub:"Sci-Fi/Fantasy"},{t:"The Order",sub:"Sci-Fi/Fantasy"},{t:"Stranger Things",sub:"Sci-Fi/Fantasy"},{t:"The Sandman",sub:"Sci-Fi/Fantasy"},{t:"Dark",sub:"Thriller"},{t:"Wednesday",sub:"Sci-Fi/Fantasy"},{t:"The Midnight Club",sub:"Horror"},{t:"The Haunting of Hill House",sub:"Horror"},{t:"The Haunting of Bly Manor",sub:"Horror"},{t:"Half Bad",sub:"Sci-Fi/Fantasy"},{t:"Umbrella Academy",sub:"Sci-Fi/Fantasy"},{t:"The Family Man",sub:"Thriller"},{t:"Guns and Gulaabs",sub:"Drama"},{t:"Daybreak",sub:"Sci-Fi/Fantasy"},{t:"House",sub:"Drama"},{t:"Severance",sub:"Thriller"},{t:"Weak Hero",sub:"Drama"},
  {t:"Friends",sub:"Sitcom"},{t:"How I Met Your Mother",sub:"Sitcom"},{t:"Modern Family",sub:"Sitcom"},{t:"The Good Place",sub:"Sitcom"},{t:"Brooklyn 99",sub:"Sitcom"},{t:"The Man on the Inside",sub:"Sitcom"},{t:"Bhabhiji Ghar par Hain",sub:"Sitcom"},{t:"Happy ki Ultan Paltan",sub:"Sitcom"},{t:"Jijaji Chhat Par Hain",sub:"Sitcom"},{t:"May I Come in Madam",sub:"Sitcom"},{t:"Taarak Mehta Ka Ooltah Chashmah",sub:"Sitcom"},{t:"Best of Love Nikki",sub:"Sitcom"},
];
const MOVIES_SEED = ["Memento","Fight Club","Hitman's Bodyguard","Hitman's Wife's Bodyguard","White House Down","Barefoot","Death at a Funeral","This is the End","The Hangover","Love and Monsters","Inheritance","Renfield","Abraham Lincoln Vampire Hunter","Nosferatu","Fear Street","The Truman Show","Bruce Almighty","Good Luck to You Leo Grande","Murder on the Orient Express","Death on the Nile","A Haunting in Venice","The Shawshank Redemption","Inception","Coma","Django Unchained","Taken","Final Destination","Bullet Train","Scary Movie","A Family Plan","Love Tactics","Call for Istanbul","Love in the Villa","Art of Love","Little Evil","The Bubble","The Do-Over","Fall Guy"];
const KDRAMA_SEED = ["King the Land","Business Proposal","Love to Hate You"];

const makeEntry = (title, cat, extra = {}) => ({
  id: `${cat}_${title.replace(/\s/g,"_")}_${Math.random().toString(36).slice(2,6)}`,
  title, cat, status: "Completed", cover: "", following: false,
  seasons: [], currentSeason: 1, currentEp: 1,
  chapter: "", totalChapters: "", genre: "", subCat: "",
  subDub: "Sub", type: "", language: cat === "anime" ? "Japanese" : cat === "manhwa" || cat === "kdrama" ? "Korean" : "English",
  note: "", ...extra,
});

const SEED_DATA = [
  ...ANIME_SEED.map(t => makeEntry(t, "anime")),
  ...ANIME_MOVIES_SEED.map(t => makeEntry(t, "anime", { type: "Movie" })),
  ...MANHWA_SEED.map(t => makeEntry(t, "manhwa", { status: "Reading" })),
  ...SHOWS_SEED.map(({ t, sub }) => makeEntry(t, "shows", { subCat: sub })),
  ...MOVIES_SEED.map(t => makeEntry(t, "movies")),
  ...KDRAMA_SEED.map(t => makeEntry(t, "kdrama")),
];

// ── Tiny components ───────────────────────────────────────────────────────────
const Badge = ({ label, color, small=false }: any) => (
  <span style={{ display:"inline-block", padding: small?"2px 7px":"3px 10px", borderRadius:99, fontSize: small?10:11, fontWeight:600, background: color+"28", color, border:`1px solid ${color}40`, whiteSpace:"nowrap" }}>{label}</span>
);

const Btn = ({ children, onClick, variant="primary", small=false, full=false, sx={} }: any) => {
  const vs = { primary:{bg:"#2a2d3e",color:P.text,border:`1px solid ${P.border}`}, accent:{bg:"#1e2a38",color:P.anime,border:`1px solid ${P.anime}60`}, ghost:{bg:"transparent",color:P.muted,border:`1px solid ${P.border}`}, danger:{bg:"#2a1818",color:"#a06060",border:"1px solid #a0606040"} };
  const v = vs[variant]||vs.primary;
  return <button onClick={onClick} style={{ padding: small?"5px 12px":"9px 18px", borderRadius:8, fontSize:small?12:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", background:v.bg, color:v.color, border:v.border, width:full?"100%":"auto", ...sx }}>
    {children}
  </button>;
};

const Input = ({ label, ...p }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:10, fontWeight:700, color:P.muted, marginBottom:5, letterSpacing:"0.07em", textTransform:"uppercase" }}>{label}</div>}
    <input {...p} style={{ width:"100%", background:"#0e0f13", border:`1px solid ${P.border}`, borderRadius:8, padding:"9px 12px", color:P.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", ...p.style }} />
  </div>
);

const Sel = ({ label, options, ...p }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:10, fontWeight:700, color:P.muted, marginBottom:5, letterSpacing:"0.07em", textTransform:"uppercase" }}>{label}</div>}
    <select {...p} style={{ width:"100%", background:"#0e0f13", border:`1px solid ${P.border}`, borderRadius:8, padding:"9px 12px", color:P.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)", display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0" }}>
    <div onClick={e=>e.stopPropagation()} style={{ background:P.surface, borderRadius:"16px 16px 0 0", padding:"20px 18px 36px", width:"100%", maxWidth:520, maxHeight:"88vh", overflowY:"auto", border:`1px solid ${P.border}` }}>
      <div style={{ width:36, height:4, background:P.border, borderRadius:99, margin:"0 auto 18px" }} />
      {title && <div style={{ fontSize:17, fontWeight:700, color:P.text, marginBottom:16, fontFamily:"'Syne',sans-serif" }}>{title}</div>}
      {children}
    </div>
  </div>;
};

// ── Cover image component ─────────────────────────────────────────────────────
const Cover = ({ src, title, size = 56, radius = 8 }) => {
  const bg = strColor(title || "x");
  const initials = (title||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
  if (src) return <img src={src} alt={title} style={{ width:size, minWidth:size, height:size*1.4, objectFit:"cover", borderRadius:radius, background:bg }} onError={e=>{(e.target as HTMLImageElement).style.display="none"}} />;
  return <div style={{ width:size, minWidth:size, height:size*1.4, borderRadius:radius, background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.22, fontWeight:700, color:"rgba(255,255,255,0.5)", fontFamily:"'Syne',sans-serif", flexShrink:0 }}>{initials}</div>;
};

// ── Swipeable Card ─────────────────────────────────────────────────────────────
const SwipeCard = ({ entry, onEdit, onDelete, onTap, onCoverChange, accent }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(null);
  const isDragging = useRef(false);
  const THRESHOLD = 60;
  const fileRef = useRef(null);

  const onTouchStart = e => { startX.current = e.touches[0].clientX; isDragging.current = false; };
  const onTouchMove = e => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    isDragging.current = Math.abs(dx) > 8;
    if (isDragging.current) setOffset(Math.max(-120, Math.min(60, dx)));
  };
  const onTouchEnd = () => {
    if (offset < -THRESHOLD) setOffset(-110);
    else if (offset > THRESHOLD) { /* swipe right — mark next ep, handled via edit */ setOffset(0); }
    else setOffset(0);
    startX.current = null;
  };

  const sc = STATUS_COLORS[entry.status] || P.muted;
  const progress = entry.cat === "manhwa" && entry.chapter && entry.totalChapters
    ? Math.min(1, parseInt(entry.chapter) / parseInt(entry.totalChapters))
    : null;

  return (
    <div style={{ position:"relative", overflow:"hidden", borderRadius:12, marginBottom:8 }}>
      {/* Action buttons behind */}
      <div style={{ position:"absolute", right:0, top:0, bottom:0, display:"flex", alignItems:"stretch", zIndex:0 }}>
        <button onClick={onEdit} style={{ width:55, background:"#1e2a38", border:"none", color:P.anime, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Edit</button>
        <button onClick={onDelete} style={{ width:55, background:"#2a1818", border:"none", color:"#a06060", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Del</button>
      </div>
      {/* Card */}
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={() => { if (!isDragging.current && offset === 0) onTap(); }}
        style={{ position:"relative", zIndex:1, background:P.card, border:`1px solid ${P.border}`, borderRadius:12, padding:"12px", display:"flex", gap:12, transform:`translateX(${offset}px)`, transition: Math.abs(offset) < 5 ? "transform 0.25s ease" : "none", cursor:"pointer" }}
      >
        <Cover src={entry.cover} title={entry.title} size={52} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:14, color:P.text, marginBottom:5, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.title}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom: progress !== null ? 7 : 0 }}>
            <Badge label={entry.status} color={sc} small />
            {entry.subCat && <Badge label={entry.subCat} color={accent} small />}
            {entry.type && <Badge label={entry.type} color={accent+"cc"} small />}
            {entry.subDub && entry.cat === "anime" && <Badge label={entry.subDub} color={P.dim} small />}
            {entry.chapter && entry.cat === "manhwa" && <Badge label={`Ch.${entry.chapter}`} color={P.dim} small />}
            {entry.currentSeason > 0 && (entry.cat === "anime" || entry.cat === "shows" || entry.cat === "kdrama") && entry.status === "Watching" &&
              <Badge label={`S${entry.currentSeason} E${entry.currentEp}`} color={P.dim} small />}
            {entry.following && <Badge label="Following" color={P.yellow} small />}
          </div>
          {progress !== null && (
            <div style={{ height:3, background:P.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress*100}%`, background:accent, borderRadius:99, transition:"width 0.3s" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, open, onToggle, children }: any) => (
  <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:12, marginBottom:12, overflow:"hidden" }}>
    <div onClick={onToggle} style={{ padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
      <div style={{ fontSize:11, fontWeight:700, color:P.muted, letterSpacing:"0.07em", textTransform:"uppercase" }}>{title}</div>
      <span style={{ color:P.muted, fontSize:16, transform: open?"rotate(90deg)":"none", transition:"transform 0.2s", display:"inline-block" }}>›</span>
    </div>
    {open && <div style={{ padding:"0 14px 14px" }}>{children}</div>}
  </div>
);

// ── Detail Page ─────────────────────────────────────────────────────────────
const DetailPage = ({ entry, onClose, onSave, accent }) => {
  const [e, setE] = useState({ ...entry });
  const set = (k, v) => setE(prev => ({ ...prev, [k]: v }));
  const fileInputRef = useRef(null);
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [sectionOpen, setSectionOpen] = useState({ cover:true, progress:true, seasons:true, details:true, note:true });
  const tog = k => setSectionOpen(s => ({ ...s, [k]: !s[k] }));
  const hasSeason = ["anime","shows","kdrama"].includes(e.cat);
  const hasChapter = ["manhwa","books","wattpad","adult"].includes(e.cat);

  const seasons = e.seasons?.length ? e.seasons : [{ n:1, eps:[], note:"" }];
  const setSeason = (idx, data) => {
    const arr = [...seasons];
    arr[idx] = { ...arr[idx], ...data };
    set("seasons", arr);
  };
  const addSeason = () => set("seasons", [...seasons, { n: seasons.length+1, eps:[], note:"" }]);

  const handleFileUpload = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (r) => set("cover", r.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:150, background:P.bg, overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:P.bg+"ee", backdropFilter:"blur(8px)", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${P.border}` }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:P.dim, fontSize:22, cursor:"pointer", padding:"0 8px 0 0" }}>‹</button>
        <div style={{ fontSize:14, fontWeight:700, color:P.text, fontFamily:"'Syne',sans-serif", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:8 }}>{e.title}</div>
        <Btn onClick={() => { onSave(e); onClose(); }} variant="accent" small>Save</Btn>
      </div>

      <div style={{ padding:"16px 16px 80px" }}>
        {/* Cover + basic info */}
        <div style={{ display:"flex", gap:14, marginBottom:16 }}>
          <Cover src={e.cover} title={e.title} size={72} radius={10} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, color:P.text, fontFamily:"'Syne',sans-serif", marginBottom:6, lineHeight:1.2 }}>{e.title}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              <Badge label={e.status} color={STATUS_COLORS[e.status]||P.muted} />
              {e.subCat && <Badge label={e.subCat} color={accent} />}
              {e.language && <Badge label={e.language} color={P.dim} />}
            </div>
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, color:P.muted }}>Following</span>
              <div onClick={() => set("following", !e.following)} style={{ width:36, height:20, borderRadius:99, background: e.following ? accent : P.border, cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                <div style={{ position:"absolute", top:3, left: e.following ? 18 : 3, width:14, height:14, borderRadius:99, background:"white", transition:"left 0.2s" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Cover upload - always visible */}
        <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:12, padding:14, marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:P.muted, marginBottom:10, letterSpacing:"0.06em", textTransform:"uppercase" }}>Cover Image</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display:"none" }}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ width:"100%", padding:"14px", background:P.bg, border:`2px dashed ${P.border}`, borderRadius:10, color:P.text, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxSizing:"border-box" }}
          >
            <span style={{ fontSize:20 }}>🖼️</span> Upload from Gallery
          </button>
          <div style={{ fontSize:11, color:P.muted, textAlign:"center", marginBottom:8 }}>or paste image URL</div>
          <input
            value={newCoverUrl}
            onChange={ev => setNewCoverUrl(ev.target.value)}
            placeholder="https://..."
            style={{ width:"100%", background:P.bg, border:`1px solid ${P.border}`, borderRadius:8, padding:"8px 10px", color:P.text, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:8, fontFamily:"'DM Sans',sans-serif" }}
          />
          {newCoverUrl ? (
            <button onClick={() => { set("cover", newCoverUrl); setNewCoverUrl(""); }} style={{ padding:"7px 16px", background:"#1e2a38", border:`1px solid ${P.anime}60`, borderRadius:8, color:P.anime, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              Apply URL
            </button>
          ) : null}
          {e.cover ? (
            <button onClick={() => set("cover", "")} style={{ padding:"7px 16px", background:"#2a1818", border:"1px solid #a0606040", borderRadius:8, color:"#a06060", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginLeft: newCoverUrl ? 8 : 0 }}>
              Remove Cover
            </button>
          ) : null}
        </div>

        {/* Status */}
        <Sel label="Status" value={e.status} onChange={ev=>set("status",ev.target.value)}
          options={hasChapter ? ["Reading","Completed","Plan to Read","On Hiatus","Dropped"] : ["Watching","Completed","Plan to Watch","On Hold","Dropped"]} />

        {/* Progress section */}
        {hasChapter && (
          <Section title="Progress" open={sectionOpen.progress} onToggle={() => tog("progress")}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Input label="Current Chapter" value={e.chapter} onChange={ev=>set("chapter",ev.target.value)} placeholder="e.g. 147" />
              <Input label="Total Chapters" value={e.totalChapters} onChange={ev=>set("totalChapters",ev.target.value)} placeholder="e.g. 200" />
            </div>
            {e.chapter && e.totalChapters && (
              <div style={{ marginTop:4 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:P.muted, marginBottom:5 }}>
                  <span>Ch. {e.chapter}</span><span>{Math.round(parseInt(e.chapter)/parseInt(e.totalChapters)*100)}%</span>
                </div>
                <div style={{ height:4, background:P.border, borderRadius:99 }}>
                  <div style={{ height:"100%", width:`${Math.min(100,parseInt(e.chapter)/parseInt(e.totalChapters)*100)}%`, background:accent, borderRadius:99 }} />
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Seasons section */}
        {hasSeason && (
          <Section title="Seasons & Episodes" open={sectionOpen.seasons} onToggle={() => tog("seasons")}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {seasons.map((s,i) => (
                <div key={i} onClick={() => set("currentSeason", s.n)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background: e.currentSeason === s.n ? accent+"33" : P.bg, color: e.currentSeason === s.n ? accent : P.muted, border:`1px solid ${e.currentSeason===s.n?accent:P.border}` }}>
                  S{s.n}
                </div>
              ))}
              <div onClick={addSeason} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:P.bg, color:P.muted, border:`1px solid ${P.border}` }}>+ Season</div>
            </div>
            {seasons.filter(s=>s.n===e.currentSeason).map((s,i) => (
              <div key={i}>
                <Input label={`S${s.n} — Current Episode`} value={e.currentSeason===s.n ? e.currentEp : ""} onChange={ev=>set("currentEp",ev.target.value)} placeholder="e.g. 7" />
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:P.muted, marginBottom:5, letterSpacing:"0.07em", textTransform:"uppercase" }}>Season Note</div>
                  <textarea value={s.note||""} onChange={ev=>setSeason(i,{note:ev.target.value})} placeholder="Your thoughts on this season..." rows={3}
                    style={{ width:"100%", background:"#0e0f13", border:`1px solid ${P.border}`, borderRadius:8, padding:"9px 12px", color:P.text, fontSize:13, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Details */}
        <Section title="Details" open={sectionOpen.details} onToggle={() => tog("details")}>
          {e.cat === "anime" && <>
            <Sel label="Sub / Dub" value={e.subDub} onChange={ev=>set("subDub",ev.target.value)} options={["Sub","Dub","Both"]} />
            <Sel label="Type" value={e.type||""} onChange={ev=>set("type",ev.target.value)} options={["","Movie","OVA","Special","Isekai","Slice of Life","Action","Romance","Comedy","Horror","Mystery"]} />
          </>}
          {(e.cat==="shows"||e.cat==="kdrama") && (
            <Sel label="Subcategory" value={e.subCat||""} onChange={ev=>set("subCat",ev.target.value)} options={["","Sitcom","Drama","Thriller","Horror","Sci-Fi/Fantasy","Romance","Indian"]} />
          )}
          <Input label="Genre / Tags" value={e.genre} onChange={ev=>set("genre",ev.target.value)} placeholder="e.g. Action, Fantasy" />
          <Sel label="Language" value={e.language} onChange={ev=>set("language",ev.target.value)} options={["Japanese","Korean","English","Chinese","Hindi","Other"]} />
        </Section>

        {/* Personal note */}
        <Section title="Your Note" open={sectionOpen.note} onToggle={() => tog("note")}>
          <textarea value={e.note||""} onChange={ev=>set("note",ev.target.value)} placeholder="Your thoughts..." rows={4}
            style={{ width:"100%", background:"#0e0f13", border:`1px solid ${P.border}`, borderRadius:8, padding:"9px 12px", color:P.text, fontSize:13, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif" }} />
        </Section>
      </div>
    </div>
  );
};

// ── Add Entry Form ─────────────────────────────────────────────────────────────
const AddForm = ({ cat, onAdd, onClose }) => {
  const acc = CAT_META[cat]?.accent || P.anime;
  const hasChapter = ["manhwa","books","wattpad","adult"].includes(cat);
  const hasSeason = ["anime","shows","kdrama"].includes(cat);
  const [f, setF] = useState({ title:"", status: hasChapter?"Plan to Read":"Plan to Watch", subDub:"Sub", type:"", subCat:"", language: cat==="anime"?"Japanese":cat==="manhwa"||cat==="kdrama"?"Korean":"English", genre:"", chapter:"", totalChapters:"", note:"", cover:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  const save = () => { if (!f.title.trim()) return; onAdd({ ...makeEntry(f.title, cat, f), id: `${cat}_${Date.now()}` }); onClose(); };
  return (
    <Modal open onClose={onClose} title={`Add to ${CAT_META[cat]?.label}`}>
      <Input label="Title *" value={f.title} onChange={e=>set("title",e.target.value)} placeholder="Title..." />
      <Input label="Cover URL (optional)" value={f.cover} onChange={e=>set("cover",e.target.value)} placeholder="https://..." />
      <Sel label="Status" value={f.status} onChange={e=>set("status",e.target.value)} options={hasChapter?["Plan to Read","Reading","Completed","On Hiatus","Dropped"]:["Plan to Watch","Watching","Completed","On Hold","Dropped"]} />
      {cat==="anime" && <Sel label="Sub/Dub" value={f.subDub} onChange={e=>set("subDub",e.target.value)} options={["Sub","Dub","Both"]} />}
      {cat==="anime" && <Sel label="Type" value={f.type} onChange={e=>set("type",e.target.value)} options={["","Movie","OVA","Isekai","Slice of Life","Action","Romance","Comedy","Horror","Mystery"]} />}
      {(cat==="shows"||cat==="kdrama") && <Sel label="Subcategory" value={f.subCat} onChange={e=>set("subCat",e.target.value)} options={["","Sitcom","Drama","Thriller","Horror","Sci-Fi/Fantasy","Romance","Indian"]} />}
      {hasChapter && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Input label="Current Ch." value={f.chapter} onChange={e=>set("chapter",e.target.value)} placeholder="0" />
          <Input label="Total Ch." value={f.totalChapters} onChange={e=>set("totalChapters",e.target.value)} placeholder="?" />
        </div>
      )}
      <Input label="Genre / Tags" value={f.genre} onChange={e=>set("genre",e.target.value)} placeholder="e.g. Action, Fantasy" />
      <div style={{ display:"flex", gap:8, marginTop:4 }}>
        <Btn onClick={save} full>Add Entry</Btn>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
      </div>
    </Modal>
  );
};

// ── Category Screen ───────────────────────────────────────────────────────────
const CatScreen = ({ cat, entries, onSave, onDelete, onAdd }) => {
  const meta = CAT_META[cat];
  const acc = meta.accent;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSub, setFilterSub] = useState("All");
  const [detail, setDetail] = useState(null);
  const [adding, setAdding] = useState(false);

  const hasChapter = ["manhwa","books","wattpad","adult"].includes(cat);
  const statuses = hasChapter ? ["All","Reading","Completed","Plan to Read","On Hiatus","Dropped"] : ["All","Watching","Completed","Plan to Watch","On Hold","Dropped"];
  const subCats: string[] = ["All", ...new Set(entries.map((e:any)=>e.subCat).filter(Boolean))] as string[];

  const shown = entries.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    if (filterSub !== "All" && e.subCat !== filterSub) return false;
    return true;
  });

  if (detail) return (
    <DetailPage entry={detail} accent={acc} onClose={() => setDetail(null)}
      onSave={(updated) => { onSave(updated); setDetail(null); }} />
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:P.bg }}>
      {/* Category header */}
      <div style={{ padding:"14px 16px 0", background: `linear-gradient(180deg, ${meta.soft} 0%, ${P.bg} 100%)` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:acc }}>{meta.icon} {meta.label}</div>
            <div style={{ fontSize:11, color:P.muted }}>{entries.length} titles</div>
          </div>
          <Btn onClick={()=>setAdding(true)} variant="accent" small>+ Add</Btn>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${meta.label}...`}
          style={{ width:"100%", background:"rgba(0,0,0,0.3)", border:`1px solid ${P.border}`, borderRadius:10, padding:"9px 12px", color:P.text, fontSize:13, outline:"none", boxSizing:"border-box", marginBottom:10 }} />
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:10, scrollbarWidth:"none" }}>
          {statuses.map(s => (
            <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:"5px 12px", borderRadius:99, fontSize:11, fontWeight:600, whiteSpace:"nowrap", cursor:"pointer", border:"none", fontFamily:"'DM Sans',sans-serif", background: filterStatus===s ? acc+"33" : "transparent", color: filterStatus===s ? acc : P.muted }}>
              {s}
            </button>
          ))}
          {subCats.length > 1 && subCats.map(s => (
            <button key={"sub_"+s} onClick={()=>setFilterSub(s)} style={{ padding:"5px 12px", borderRadius:99, fontSize:11, fontWeight:600, whiteSpace:"nowrap", cursor:"pointer", border:`1px solid ${filterSub===s?acc:P.border}`, fontFamily:"'DM Sans',sans-serif", background: filterSub===s ? acc+"22" : "transparent", color: filterSub===s ? acc : P.muted }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 16px" }}>
        <div style={{ fontSize:11, color:P.muted, marginBottom:8 }}>{shown.length} result{shown.length!==1?"s":""}</div>
        {shown.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:P.muted }}>
            <div style={{ fontSize:36, marginBottom:8 }}>{meta.icon}</div>
            <div>Nothing here yet</div>
          </div>
        )}
        {shown.map(e => (
          <SwipeCard key={e.id} entry={e} accent={acc}
            onTap={() => setDetail(e)}
            onEdit={() => setDetail(e)}
            onDelete={() => onDelete(e.id)}
            onCoverChange={(id, cover) => onSave({ ...e, cover })} />
        ))}
      </div>

      {adding && <AddForm cat={cat} onAdd={onAdd} onClose={()=>setAdding(false)} />}
    </div>
  );
};

// ── Home Screen ───────────────────────────────────────────────────────────────
const HomeScreen = ({ entries, visibleCats, onGoTo }) => {
  const inProgress = entries.filter(e => e.status === "Watching" || e.status === "Reading").slice(0, 8);
  const following = entries.filter(e => e.following).slice(0, 6);
  const total = entries.length;
  const completed = entries.filter(e=>e.status==="Completed").length;

  return (
    <div style={{ padding:"16px 16px 80px", overflowY:"auto", height:"100%" }}>
      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:P.text, marginBottom:2 }}>MEDIALOG</div>
      <div style={{ fontSize:12, color:P.muted, marginBottom:20 }}>{total} titles · {completed} completed</div>

      {inProgress.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:P.muted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Continue</div>
          <div style={{ display:"flex", gap:10, overflowX:"auto", scrollbarWidth:"none", paddingBottom:4 }}>
            {inProgress.map(e => {
              const acc = CAT_META[e.cat]?.accent || P.anime;
              return (
                <div key={e.id} onClick={()=>onGoTo(e.cat)} style={{ flexShrink:0, cursor:"pointer" }}>
                  <Cover src={e.cover} title={e.title} size={56} radius={10} />
                  <div style={{ width:56*1, marginTop:5, fontSize:10, color:P.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:56 }}>{e.title}</div>
                  {(e.status==="Watching"||e.status==="Reading") && (
                    <div style={{ fontSize:9, color:acc, fontWeight:600 }}>
                      {e.cat==="manhwa"?`Ch.${e.chapter||"?"}`:`S${e.currentSeason||1}E${e.currentEp||1}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {following.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:P.muted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Following</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {following.map(e => {
              const acc = CAT_META[e.cat]?.accent||P.anime;
              return (
                <div key={e.id} onClick={()=>onGoTo(e.cat)} style={{ background:P.card, border:`1px solid ${P.border}`, borderRadius:10, padding:"10px 12px", display:"flex", gap:10, alignItems:"center", cursor:"pointer" }}>
                  <Cover src={e.cover} title={e.title} size={36} radius={6} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:P.text }}>{e.title}</div>
                    <div style={{ fontSize:11, color:acc }}>{CAT_META[e.cat]?.label}</div>
                  </div>
                  <Badge label="Following" color={P.yellow} small />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize:11, fontWeight:700, color:P.muted, letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:10 }}>Categories</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {visibleCats.map(cat => {
          const m = CAT_META[cat];
          const count = entries.filter(e=>e.cat===cat).length;
          return (
            <div key={cat} onClick={()=>onGoTo(cat)} style={{ background:P.card, border:`1px solid ${m.accent}40`, borderRadius:12, padding:"14px", cursor:"pointer" }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{m.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:m.accent, fontFamily:"'Syne',sans-serif" }}>{m.label}</div>
              <div style={{ fontSize:11, color:P.muted }}>{count} titles</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Settings ──────────────────────────────────────────────────────────────────
const SettingsScreen = ({ hidden, onToggle, onClear }) => (
  <div style={{ padding:"16px 16px 80px", overflowY:"auto" }}>
    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:P.text, marginBottom:20 }}>Settings</div>
    <div style={{ background:P.surface, border:`1px solid ${P.border}`, borderRadius:12, padding:16, marginBottom:12 }}>
      <div style={{ fontSize:12, fontWeight:700, color:P.muted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>Guest Mode — Hide Categories</div>
      {["kdrama","wattpad","adult"].map(cat => {
        const m = CAT_META[cat];
        const isHidden = hidden.includes(cat);
        return (
          <div key={cat} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span>{m.icon}</span>
              <span style={{ fontSize:14, color:P.text }}>{m.label}</span>
            </div>
            <div onClick={()=>onToggle(cat)} style={{ width:40, height:22, borderRadius:99, background: isHidden ? P.border : m.accent, cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
              <div style={{ position:"absolute", top:3, left: isHidden ? 3 : 20, width:16, height:16, borderRadius:99, background:"white", transition:"left 0.2s" }} />
            </div>
          </div>
        );
      })}
      <div style={{ fontSize:11, color:P.muted, marginTop:4 }}>Toggle ON to hide from nav bar</div>
    </div>
    <div style={{ background:"#1a0a0a", border:"1px solid #8a4a4a40", borderRadius:12, padding:16 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#a06060", marginBottom:10 }}>Danger Zone</div>
      <Btn onClick={()=>{ if(window.confirm("Clear ALL data? This cannot be undone.")) onClear(); }} variant="danger">Clear All Data</Btn>
    </div>
  </div>
);

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [entries, setEntries] = useLS("ml_entries_v2", SEED_DATA);
  const [hiddenCats, setHiddenCats] = useLS("ml_hidden", []);
  const [activeTab, setActiveTab] = useState("home");
  const [activeCat, setActiveCat] = useState(null);

  const BASE_CATS = ["anime","manhwa","shows","movies","books"];
  const OPTIONAL_CATS = ["kdrama","wattpad","adult"];
  const visibleCats = [...BASE_CATS, ...OPTIONAL_CATS.filter(c=>!hiddenCats.includes(c))];

  const saveEntry = useCallback((updated) => setEntries(es => es.map(e => e.id===updated.id ? updated : e)), [setEntries]);
  const deleteEntry = useCallback((id) => setEntries(es => es.filter(e => e.id!==id)), [setEntries]);
  const addEntry = useCallback((entry) => setEntries(es => [entry, ...es]), [setEntries]);
  const toggleHide = (cat) => setHiddenCats(h => h.includes(cat) ? h.filter(x=>x!==cat) : [...h,cat]);

  // Auto-fetch covers in background
  useCoverFetcher(entries, setEntries);

  const goToCat = (cat) => { setActiveCat(cat); setActiveTab("cat"); };

  const NAV = [
    { id:"home", icon:"⌂", label:"Home" },
    { id:"cat", icon:"≡", label:"Browse" },
    { id:"settings", icon:"⚙", label:"Settings" },
  ];

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:P.bg, fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Main content */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {activeTab === "home" && (
          <HomeScreen entries={entries} visibleCats={visibleCats} onGoTo={goToCat} />
        )}
        {activeTab === "cat" && (
          <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
            {/* Category tabs */}
            <div style={{ display:"flex", gap:0, overflowX:"auto", scrollbarWidth:"none", borderBottom:`1px solid ${P.border}`, background:P.surface, flexShrink:0 }}>
              {visibleCats.map(cat => {
                const m = CAT_META[cat];
                const isActive = activeCat===cat;
                return (
                  <button key={cat} onClick={()=>setActiveCat(cat)} style={{ padding:"10px 14px", fontSize:11, fontWeight:700, whiteSpace:"nowrap", cursor:"pointer", border:"none", fontFamily:"'DM Sans',sans-serif", background:"transparent", color: isActive ? m.accent : P.muted, borderBottom: isActive ? `2px solid ${m.accent}` : "2px solid transparent", transition:"all 0.15s" }}>
                    {m.icon} {m.label}
                  </button>
                );
              })}
            </div>
            <div style={{ flex:1, overflow:"hidden" }}>
              {activeCat && (
                <CatScreen
                  key={activeCat}
                  cat={activeCat}
                  entries={entries.filter(e=>e.cat===activeCat)}
                  onSave={saveEntry}
                  onDelete={deleteEntry}
                  onAdd={addEntry}
                />
              )}
              {!activeCat && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:P.muted }}>Select a category above</div>
              )}
            </div>
          </div>
        )}
        {activeTab === "settings" && (
          <SettingsScreen hidden={hiddenCats} onToggle={toggleHide} onClear={()=>{ setEntries([]); }} />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ display:"flex", background:P.surface, borderTop:`1px solid ${P.border}`, paddingBottom:"env(safe-area-inset-bottom,0px)", flexShrink:0 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={()=>setActiveTab(n.id)} style={{ flex:1, padding:"10px 0", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", background:"transparent", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:600, color: activeTab===n.id ? P.anime : P.muted }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
