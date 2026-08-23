import React, { useState, useEffect, useCallback, useRef } from "react";
import { CheckCircle2, Circle, MessageSquare, PlayCircle, ChevronRight, ShieldCheck, TrendingUp, Send, Menu, X, LogOut, Loader2, Sparkles, Award, Users, Clock, Star, ArrowRight, Zap } from "lucide-react";

const SUPABASE_URL = "https://qiymevvbgpbeuyzafciu.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeW1ldnZiZ3BiZXV5emFmY2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjU3NTgsImV4cCI6MjEwMjk0MTc1OH0.ZhoUN02CGW3RenUP5nHSlDzS_gXtnnItSVtZMyQ1aWg";

// Brand system, pulled from the official Gsol Design Academy brochure:
// Deep navy (#0A1A38 -> #14294F) with an electric blue gradient accent (#1E56A0 -> #3DA5FF),
// bold condensed display type (Oswald, matching the brochure's stencil-industrial headings),
// tagline "Impacting Innovation Through Building Designs".
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`;

const GLOBAL_STYLE = `
${FONT_IMPORT}
@keyframes fadeUp { from { opacity:0; transform:translateY(24px);} to {opacity:1; transform:translateY(0);} }
@keyframes floatY { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-14px);} }
@keyframes gridPan { from{background-position:0 0;} to{background-position:60px 60px;} }
@keyframes shimmer { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }
@keyframes pulseGlow { 0%,100%{opacity:.5;} 50%{opacity:1;} }
.reveal { opacity:0; animation: fadeUp .7s ease forwards; }
.float { animation: floatY 5s ease-in-out infinite; }
.grid-bg {
  background-image: linear-gradient(#ffffff10 1px, transparent 1px), linear-gradient(90deg, #ffffff10 1px, transparent 1px);
  background-size: 34px 34px;
  animation: gridPan 6s linear infinite;
}
.shine-btn { position:relative; overflow:hidden; }
.shine-btn::after {
  content:''; position:absolute; inset:0;
  background: linear-gradient(120deg, transparent 30%, #ffffff55 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer 2.8s ease-in-out infinite;
}
`;

function isWeekendPromo() {
  const day = new Date().getDay();
  return day === 0 || day === 5 || day === 6;
}

async function api(path, { method = "GET", token, body, params } = {}) {
  const url = new URL(SUPABASE_URL + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      "Content-Type": "application/json",
      ...(method !== "GET" ? { Prefer: "return=representation" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("json") ? res.json() : null;
}

async function authRequest(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || data.error || "Auth error");
  return data;
}

async function startCheckout(token, courseId, provider) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/checkout-init`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ course_id: courseId, provider, redirect_url: window.location.href }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed to start");
  return data;
}

/* ---------- Brand mark: recreated as crisp SVG from the brochure logo ---------- */
function Mark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="gsolGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3DA5FF" />
          <stop offset="1" stopColor="#0A1A38" />
        </linearGradient>
      </defs>
      <path d="M62 8H30a22 22 0 0 0 0 44h6v12h-6a34 34 0 0 1 0-68h32z" fill="url(#gsolGrad)" />
      <rect x="60" y="8" width="10" height="20" fill="#0A1A38" />
      <rect x="76" y="8" width="10" height="20" fill="#0A1A38" />
      <rect x="60" y="52" width="26" height="10" fill="url(#gsolGrad)" />
      <rect x="76" y="30" width="10" height="22" fill="url(#gsolGrad)" />
      <rect x="42" y="52" width="10" height="12" fill="#0A1A38" />
      <rect x="58" y="52" width="10" height="12" fill="#0A1A38" />
    </svg>
  );
}

function Logo({ light = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={34} />
      <div className="leading-none">
        <div className="font-bold tracking-tight" style={{ fontFamily: "'Oswald',sans-serif", fontSize: 17, color: light ? "#fff" : "#0A1A38", letterSpacing: 0.3 }}>
          GSOL <span style={{ color: "#3DA5FF" }}>DESIGN</span> ACADEMY
        </div>
        <div className="hidden sm:block" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: 1.5, color: light ? "#ffffff80" : "#0A1A3880" }}>
          IMPACTING INNOVATION THROUGH BUILDING DESIGN
        </div>
      </div>
    </div>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setShown(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={shown ? `reveal ${className}` : `opacity-0 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Counter({ to, suffix = "", duration = 1400 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          setVal(Math.floor(p * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function TitleBlock({ code, label }) {
  return (
    <div className="inline-flex items-center gap-2 border px-2 py-1" style={{ borderColor: "#0A1A3833", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 1, color: "#0A1A38" }}>
      <span className="opacity-60">{label}</span>
      <span className="font-medium">{code}</span>
    </div>
  );
}

function DimensionBar({ pct }) {
  return (
    <div className="relative w-full">
      <div className="h-1.5 w-full rounded-full" style={{ background: "#0A1A381A" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }} />
      </div>
      <div className="flex justify-between mt-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#0A1A3899" }}>
        <span>0</span><span>{pct}% COMPLETE</span><span>100</span>
      </div>
    </div>
  );
}

function Nav({ page, setPage, session, setAuthOpen, signOut, menuOpen, setMenuOpen }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const items = session ? [["home", "Home"], ["courses", "Courses"], ["ebooks", "Ebooks"], ["dashboard", "Dashboard"]] : [["home", "Home"], ["courses", "Courses"], ["ebooks", "Ebooks"]];
  return (
    <header className="sticky top-0 z-40 transition-all" style={{ background: scrolled ? "#0A1A38F2" : "#0A1A38", backdropFilter: "blur(10px)", borderBottom: scrolled ? "1px solid #ffffff14" : "1px solid transparent", boxShadow: scrolled ? "0 8px 30px #0A1A3840" : "none" }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={() => setPage("home")}><Logo /></button>
        <nav className="hidden md:flex items-center gap-1">
          {items.map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} className="px-4 py-2 text-sm rounded-full transition-all"
              style={{ color: page === id ? "#0A1A38" : "#F5F3ECcc", background: page === id ? "linear-gradient(90deg,#3DA5FF,#1E56A0)" : "transparent", backgroundColor: page === id ? "#3DA5FF" : "transparent" }}>{label}</button>
          ))}
          {session ? (
            <button onClick={signOut} className="ml-2 px-4 py-2 text-sm rounded-full flex items-center gap-1.5" style={{ color: "#F5F3ECcc" }}><LogOut size={14} /> Sign out</button>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="shine-btn ml-2 px-5 py-2 text-sm rounded-full font-semibold" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)", color: "#fff" }}>Get started</button>
          )}
        </nav>
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-1 px-5 pb-4">
          {items.map(([id, label]) => (
            <button key={id} onClick={() => { setPage(id); setMenuOpen(false); }} className="text-left px-3 py-2 rounded-md" style={{ color: "#F5F3EC", background: page === id ? "#3DA5FF33" : "transparent" }}>{label}</button>
          ))}
          {session ? (
            <button onClick={signOut} className="text-left px-3 py-2 rounded-md" style={{ color: "#F5F3EC" }}>Sign out</button>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="text-left px-3 py-2 rounded-md font-semibold" style={{ color: "#3DA5FF" }}>Get started</button>
          )}
        </div>
      )}
    </header>
  );
}

function AuthModal({ onClose, onAuthed }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "signup") {
        const data = await authRequest("signup", { email, password, data: { full_name: fullName } });
        if (data.access_token) {
          await api("/rest/v1/profiles", { method: "POST", token: data.access_token, body: { id: data.user.id, full_name: fullName, role: "student" } }).catch(() => {});
          onAuthed(data);
        } else {
          setErr("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const data = await authRequest("token?grant_type=password", { email, password });
        onAuthed(data);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0A1A38cc", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-7 relative overflow-hidden" style={{ background: "#fff" }}>
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle,#3DA5FF33,transparent 70%)" }} />
        <div className="flex justify-between items-center mb-5 relative">
          <h3 className="font-bold text-xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>
            {mode === "signin" ? "Welcome back" : "Join the academy"}
          </h3>
          <button onClick={onClose}><X size={18} color="#0A1A3899" /></button>
        </div>
        <div className="space-y-3 relative">
          {mode === "signup" && (
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
          {err && <p className="text-xs" style={{ color: "#c0392b" }}>{err}</p>}
          <button onClick={submit} disabled={loading} className="shine-btn w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
            {loading && <Loader2 size={16} className="animate-spin" />} {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm w-full text-center relative" style={{ color: "#1E56A0" }}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  { name: "Chiamaka O.", role: "AutoCAD graduate, Lagos", quote: "I went from zero drafting skill to landing my first paid project three weeks after finishing the course." },
  { name: "Tunde A.", role: "Revit MEP graduate, Abuja", quote: "The Q&A support inside each lesson made all the difference — I never stayed stuck for long." },
  { name: "Fatima B.", role: "Structural design graduate, Kano", quote: "Real project work, not just theory. I use the ETABS workflow from this course every week at my job now." },
];

function Home({ setPage, courses, loading }) {
  const weekend = isWeekendPromo();
  const [tIndex, setTIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTIndex((i) => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "#F7F8FA" }}>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg,#0A1A38,#0F2450 55%,#14294F)" }}>
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-10 -right-20 w-72 h-72 rounded-full float pointer-events-none" style={{ background: "radial-gradient(circle,#3DA5FF3a,transparent 70%)" }} />
        <div className="absolute bottom-0 -left-24 w-96 h-96 rounded-full float pointer-events-none" style={{ background: "radial-gradient(circle,#1E56A030,transparent 70%)", animationDelay: "1.5s" }} />

        <div className="max-w-6xl mx-auto px-5 pt-20 pb-24 relative">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "#3DA5FF1f", color: "#7FC0FF", border: "1px solid #3DA5FF40" }}>
              <Sparkles size={13} /> Trusted by 5,000+ students across 7+ African countries
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="leading-[1.05] max-w-2xl" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "clamp(2.4rem,6vw,4rem)", color: "#fff" }}>
              Master the software behind every <span style={{ background: "linear-gradient(90deg,#3DA5FF,#7FC0FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>great build</span>.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-5 text-lg max-w-lg" style={{ color: "#C7D2E8" }}>
              Revit, AutoCAD, ArchiCAD, SketchUp, ETABS, ProtaStructure, Orion, PlanSwift — taught by working professionals, with real progress tracking and real answers when you're stuck.
            </p>
          </Reveal>

          {weekend && (
            <Reveal delay={300}>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: "linear-gradient(90deg,#FF8A3D,#FF5F5F)", color: "#fff" }}>
                <Zap size={15} /> Weekend flash sale — 50% off every course, ends Sunday midnight
              </div>
            </Reveal>
          )}

          <Reveal delay={400}>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => setPage("courses")} className="shine-btn px-7 py-3.5 rounded-full font-semibold text-white flex items-center gap-2 text-base" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)", boxShadow: "0 10px 30px #3DA5FF33" }}>
                Explore courses <ArrowRight size={18} />
              </button>
              <button onClick={() => setPage("courses")} className="px-7 py-3.5 rounded-full font-semibold text-sm border" style={{ borderColor: "#ffffff33", color: "#fff" }}>
                View pricing
              </button>
              <button onClick={() => setPage("ebooks")} className="px-7 py-3.5 rounded-full font-semibold text-sm border" style={{ borderColor: "#ffffff33", color: "#fff" }}>
                Browse ebooks
              </button>
            </div>
          </Reveal>

          <Reveal delay={500}>
            <div className="mt-16 grid grid-cols-3 max-w-lg gap-6">
              <div>
                <div className="font-bold text-3xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#fff" }}><Counter to={5000} suffix="+" /></div>
                <div className="text-xs mt-1" style={{ color: "#8CA0C4", fontFamily: "'JetBrains Mono',monospace" }}>STUDENTS TRAINED</div>
              </div>
              <div>
                <div className="font-bold text-3xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#fff" }}><Counter to={10} /></div>
                <div className="text-xs mt-1" style={{ color: "#8CA0C4", fontFamily: "'JetBrains Mono',monospace" }}>SOFTWARE TRACKS</div>
              </div>
              <div>
                <div className="font-bold text-3xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#fff" }}><Counter to={7} suffix="+" /></div>
                <div className="text-xs mt-1" style={{ color: "#8CA0C4", fontFamily: "'JetBrains Mono',monospace" }}>COUNTRIES REACHED</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="py-4" style={{ background: "#0F2450" }}>
        <div className="max-w-6xl mx-auto px-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-xs" style={{ color: "#8CA0C4", fontFamily: "'JetBrains Mono',monospace" }}>
          <span>REVIT</span><span>AUTOCAD</span><span>ARCHICAD</span><span>SKETCHUP</span><span>ETABS</span><span>PROTASTRUCTURE</span><span>ORION</span><span>PLANSWIFT</span>
        </div>
      </div>

      {/* POPULAR COURSES */}
      <section className="max-w-6xl mx-auto px-5 py-20">
        <Reveal>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#1E56A0", fontFamily: "'JetBrains Mono',monospace" }}>COURSE CATALOG</div>
              <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#0A1A38" }}>Popular right now</h2>
            </div>
            <button onClick={() => setPage("courses")} className="text-sm font-semibold flex items-center gap-1" style={{ color: "#1E56A0" }}>View all courses <ChevronRight size={16} /></button>
          </div>
        </Reveal>
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading live course data…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.slice(0, 3).map((c, i) => (
              <Reveal key={c.id} delay={i * 100}>
                <button onClick={() => setPage("courses")} className="text-left p-6 rounded-2xl border w-full h-full transition-transform hover:-translate-y-1" style={{ borderColor: "#0A1A3814", background: "#fff", boxShadow: "0 4px 20px #0A1A380a" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#1E56A0,#3DA5FF)" }}>
                    <Award size={20} color="#fff" />
                  </div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{c.title}</h3>
                  <p className="text-sm mt-1.5 line-clamp-2" style={{ color: "#0A1A3899" }}>{c.blurb}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ color: "#1E56A0" }}>${weekend ? c.price_intl_weekend : c.price_intl_weekday}</span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#1E56A00f", color: "#1E56A0" }}>{c.level}</span>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* WHY US vs typical platforms */}
      <section className="py-20" style={{ background: "#0A1A38" }}>
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-xs font-semibold tracking-widest mb-2 text-center" style={{ color: "#3DA5FF", fontFamily: "'JetBrains Mono',monospace" }}>WHY GSOL</div>
            <h2 className="text-center mb-14" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#fff" }}>Built for construction professionals, not generic video hosting</h2>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              [ShieldCheck, "Secure by design", "Row-level security keeps your data and progress private and encrypted — not a shared drive link."],
              [TrendingUp, "Real progress tracking", "Lesson-by-lesson completion, visible to you and your instructor — never lose your place."],
              [MessageSquare, "Instructor-answered Q&A", "Ask questions inside each lesson and get answered by real working professionals, not a forum bot."],
            ].map(([Icon, t, b], i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="p-7 rounded-2xl h-full" style={{ background: "#0F2450", border: "1px solid #ffffff10" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "#3DA5FF1f" }}>
                    <Icon size={20} color="#3DA5FF" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Oswald',sans-serif", color: "#fff" }}>{t}</h3>
                  <p className="text-sm" style={{ color: "#8CA0C4" }}>{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-4xl mx-auto px-5 py-20 text-center">
        <Reveal>
          <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: "#1E56A0", fontFamily: "'JetBrains Mono',monospace" }}>STUDENT RESULTS</div>
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#FFB020" color="#FFB020" />)}
          </div>
          <div className="relative h-32">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="absolute inset-0 transition-opacity duration-700" style={{ opacity: i === tIndex ? 1 : 0 }}>
                <p className="text-xl leading-relaxed" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38", fontWeight: 500 }}>"{t.quote}"</p>
                <p className="mt-4 text-sm font-semibold" style={{ color: "#1E56A0" }}>{t.name} <span className="font-normal" style={{ color: "#0A1A3899" }}>— {t.role}</span></p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <Reveal>
          <div className="rounded-3xl p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(120deg,#1E56A0,#0A1A38)" }}>
            <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full float" style={{ background: "radial-gradient(circle,#3DA5FF40,transparent 70%)" }} />
            <Users size={30} color="#7FC0FF" className="mx-auto mb-4" />
            <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#fff" }}>Your next skill starts this week</h2>
            <p className="mt-3 max-w-md mx-auto" style={{ color: "#C7D2E8" }}>Join thousands of architects, engineers and builders leveling up with Gsol Design Academy.</p>
            <button onClick={() => setPage("courses")} className="shine-btn mt-7 px-8 py-3.5 rounded-full font-semibold text-white inline-flex items-center gap-2" style={{ background: "linear-gradient(90deg,#3DA5FF,#7FC0FF)", color: "#0A1A38" }}>
              Start learning today <ArrowRight size={18} />
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Courses({ courses, loading, error, session, checkout, checkingOut }) {
  const weekend = isWeekendPromo();
  return (
    <div style={{ background: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <TitleBlock label="INDEX" code="ALL COURSES" />
        <h2 className="mt-4 mb-8" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>Course catalog</h2>
        {error && (
          <div className="mb-6 p-4 rounded-md text-sm" style={{ background: "#c0392b1A", color: "#c0392b" }}>
            Couldn't load courses: {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading live courses from the database…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 80}>
                <div className="p-6 rounded-2xl border flex flex-col h-full transition-transform hover:-translate-y-1" style={{ borderColor: "#0A1A3814", background: "#fff", boxShadow: "0 4px 20px #0A1A380a" }}>
                  <div className="flex justify-between items-start mb-3">
                    <TitleBlock label="NO." code={c.code} />
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#1E56A00f", color: "#1E56A0", fontFamily: "'JetBrains Mono',monospace" }}>{c.level}</span>
                  </div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{c.title}</h3>
                  <p className="text-sm mt-1.5 flex-1" style={{ color: "#0A1A3899" }}>{c.blurb}</p>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: "#0A1A3814" }}>
                    <span className="font-bold text-lg" style={{ color: "#1E56A0" }}>
                      ${weekend ? c.price_intl_weekend : c.price_intl_weekday}
                      {weekend && <span className="ml-1.5 text-xs line-through opacity-40 font-normal">${c.price_intl_weekday}</span>}
                    </span>
                  </div>
                  {session ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => checkout(c.id, "paystack")} disabled={checkingOut === c.id} className="py-2 rounded-lg font-medium text-white text-xs flex items-center justify-center gap-1.5" style={{ background: "#0A1A38" }}>
                        {checkingOut === c.id && <Loader2 size={12} className="animate-spin" />} Paystack
                      </button>
                      <button onClick={() => checkout(c.id, "flutterwave")} disabled={checkingOut === c.id} className="py-2 rounded-lg font-medium text-white text-xs flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                        {checkingOut === c.id && <Loader2 size={12} className="animate-spin" />} Flutterwave
                      </button>
                    </div>
                  ) : (
                    <a href={c.selar_link} target="_blank" rel="noreferrer" className="mt-3 w-full py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: "#0A1A38" }}>
                      Sign in to enroll
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ session, courses, enrollments, loading, openCourse }) {
  const enrolledCourses = enrollments.map((e) => ({ ...courses.find((c) => c.id === e.course_id), enrollment: e })).filter((c) => c.id);
  return (
    <div style={{ background: "#F7F8FA", minHeight: "70vh" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <TitleBlock label="STUDENT" code={(session?.user?.email || "").split("@")[0].toUpperCase()} />
        <h2 className="mt-4 mb-8" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>My learning</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading your enrollments…</div>
        ) : enrolledCourses.length === 0 ? (
          <p className="text-sm" style={{ color: "#0A1A3899" }}>You're not enrolled in any courses yet — head to the catalog to get started.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {enrolledCourses.map((c) => (
              <div key={c.id} className="p-6 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <TitleBlock label="NO." code={c.code} />
                <h3 className="font-semibold text-lg mt-3 mb-3" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{c.title}</h3>
                {c.enrollment.status === "pending" ? (
                  <div className="text-sm px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "#FF8A3D1A", color: "#FF8A3D" }}>
                    <Loader2 size={14} className="animate-spin" /> Payment processing — updates automatically once confirmed
                  </div>
                ) : (
                  <>
                    <DimensionBar pct={0} />
                    <button onClick={() => openCourse(c)} className="mt-4 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm text-white" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                      <PlayCircle size={16} /> Continue learning
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Player({ course, session, token }) {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({});
  const [activeLesson, setActiveLesson] = useState(null);
  const [tab, setTab] = useState("lessons");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!course) return;
    setLoading(true);
    const ls = await api("/rest/v1/lessons", { token, params: { course_id: `eq.${course.id}`, order: "position.asc", select: "*" } });
    setLessons(ls);
    if (ls[0]) setActiveLesson(ls[0]);
    const prog = await api("/rest/v1/lesson_progress", { token, params: { student_id: `eq.${session.user.id}`, select: "lesson_id,completed" } });
    const map = {};
    prog.forEach((p) => { map[p.lesson_id] = p.completed; });
    setProgress(map);
    setLoading(false);
  }, [course, token, session]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeLesson) return;
    api("/rest/v1/qa_messages", { token, params: { lesson_id: `eq.${activeLesson.id}`, order: "created_at.asc", select: "*,profiles(full_name,role)" } })
      .then(setMessages).catch(() => setMessages([]));
  }, [activeLesson, token]);

  const markComplete = async () => {
    await api("/rest/v1/lesson_progress", { method: "POST", token, body: { student_id: session.user.id, lesson_id: activeLesson.id, completed: true, completed_at: new Date().toISOString() } });
    setProgress((p) => ({ ...p, [activeLesson.id]: true }));
  };

  const send = async () => {
    if (!draft.trim()) return;
    const [msg] = await api("/rest/v1/qa_messages", { method: "POST", token, body: { lesson_id: activeLesson.id, author_id: session.user.id, body: draft } });
    setMessages((m) => [...m, { ...msg, profiles: { full_name: "You", role: "student" } }]);
    setDraft("");
  };

  const done = Object.values(progress).filter(Boolean).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

  if (!course) return <div className="max-w-6xl mx-auto px-5 py-12" style={{ color: "#0A1A3899" }}>Pick a course from your dashboard.</div>;

  return (
    <div style={{ background: "#F7F8FA" }} className="min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-5 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-2xl border p-4 h-fit" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
          <TitleBlock label="NO." code={course.code} />
          <h3 className="mt-3 font-semibold" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{course.title}</h3>
          <div className="mt-3"><DimensionBar pct={pct} /></div>
          {loading ? <div className="mt-4 text-sm flex items-center gap-2" style={{ color: "#0A1A38" }}><Loader2 size={14} className="animate-spin" /> Loading lessons…</div> : (
            <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto">
              {lessons.map((l) => (
                <button key={l.id} onClick={() => setActiveLesson(l)} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left"
                  style={{ background: activeLesson?.id === l.id ? "#3DA5FF14" : "transparent", color: "#0A1A38" }}>
                  {progress[l.id] ? <CheckCircle2 size={16} color="#1E9E5C" /> : <Circle size={16} color="#0A1A3855" />}
                  <span className={activeLesson?.id === l.id ? "font-medium" : ""}>{l.title}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
        <div>
          <div className="flex gap-1 mb-4">
            {[["lessons", "Lesson", PlayCircle], ["qa", "Q&A", MessageSquare]].map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ background: tab === id ? "#0A1A38" : "#0A1A380D", color: tab === id ? "#fff" : "#0A1A38" }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          {tab === "lessons" && activeLesson ? (
            <div className="rounded-2xl border p-6" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div className="aspect-video rounded-xl flex items-center justify-center mb-4" style={{ background: "#0A1A38" }}>
                {activeLesson.video_url ? (
                  <a href={activeLesson.video_url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2" style={{ color: "#3DA5FF" }}>
                    <PlayCircle size={56} /><span className="text-xs">Open video</span>
                  </a>
                ) : <PlayCircle size={56} color="#3DA5FF55" />}
              </div>
              <h3 className="font-semibold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{activeLesson.title}</h3>
              {activeLesson.content && <p className="text-sm mt-2" style={{ color: "#0A1A3899" }}>{activeLesson.content}</p>}
              <button onClick={markComplete} disabled={progress[activeLesson.id]} className="mt-4 px-5 py-2.5 rounded-lg font-medium text-white text-sm" style={{ background: progress[activeLesson.id] ? "#1E9E5C" : "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                {progress[activeLesson.id] ? "Completed ✓" : "Mark lesson complete"}
              </button>
            </div>
          ) : tab === "qa" && activeLesson ? (
            <div className="rounded-2xl border p-6" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div className="flex items-center gap-2 mb-4" style={{ color: "#0A1A38" }}>
                <MessageSquare size={17} /><span className="font-medium text-sm">Q&amp;A — {activeLesson.title}</span>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {messages.length === 0 && <p className="text-sm" style={{ color: "#0A1A3866" }}>No questions yet — be the first to ask.</p>}
                {messages.map((m, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" style={{ color: m.profiles?.role === "instructor" ? "#1E56A0" : "#0A1A38" }}>{m.profiles?.full_name || "Student"}</span>
                    </div>
                    <p style={{ color: "#0A1A38cc" }}>{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask a question about this lesson..." className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
                <button onClick={send} className="px-4 py-2 rounded-lg text-white flex items-center gap-1.5 text-sm" style={{ background: "#0A1A38" }}><Send size={14} /> Send</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Ebooks({ ebooks, loading, error }) {
  const weekend = isWeekendPromo();
  return (
    <div style={{ background: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <TitleBlock label="INDEX" code="EBOOKS" />
        <h2 className="mt-4 mb-3" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>Ebooks &amp; guides</h2>
        <p className="mb-8 text-sm max-w-lg" style={{ color: "#0A1A3899" }}>Instant-download PDF guides, checklists, and templates — no course enrollment needed, read on any device.</p>
        {error && (
          <div className="mb-6 p-4 rounded-md text-sm" style={{ background: "#c0392b1A", color: "#c0392b" }}>
            Couldn't load ebooks: {error}
          </div>
        )}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading ebooks…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ebooks.map((e, i) => (
              <Reveal key={e.id} delay={(i % 3) * 80}>
                <div className="p-6 rounded-2xl border flex flex-col h-full transition-transform hover:-translate-y-1" style={{ borderColor: "#0A1A3814", background: "#fff", boxShadow: "0 4px 20px #0A1A380a" }}>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{e.title}</h3>
                  <p className="text-sm mt-1.5 flex-1" style={{ color: "#0A1A3899" }}>{e.description}</p>
                  {e.includes && e.includes.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {e.includes.slice(0, 3).map((inc, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-1.5" style={{ color: "#0A1A3888" }}>
                          <CheckCircle2 size={13} color="#1E56A0" className="mt-0.5 flex-shrink-0" /> {inc}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: "#0A1A3814" }}>
                    <span className="font-bold text-lg" style={{ color: "#1E56A0" }}>
                      ₦{Number(weekend ? e.price_ngn_weekend : e.price_ngn_weekday).toLocaleString()}
                      {weekend && <span className="ml-1.5 text-xs line-through opacity-40 font-normal">₦{Number(e.price_ngn_weekday).toLocaleString()}</span>}
                    </span>
                  </div>
                  <a href={e.selar_link} target="_blank" rel="noreferrer" className="mt-3 w-full py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                    Get this ebook
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [ebooks, setEbooks] = useState([]);
  const [ebooksLoading, setEbooksLoading] = useState(true);
  const [ebooksError, setEbooksError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);

  useEffect(() => {
    api("/rest/v1/courses", { params: { select: "*", is_published: "eq.true", order: "code.asc" } })
      .then((data) => { setCourses(data); setCoursesError(null); })
      .catch((e) => { setCourses([]); setCoursesError(e.message); })
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    api("/rest/v1/ebooks", { params: { select: "*", is_published: "eq.true", order: "title.asc" } })
      .then((data) => { setEbooks(data); setEbooksError(null); })
      .catch((e) => { setEbooks([]); setEbooksError(e.message); })
      .finally(() => setEbooksLoading(false));
  }, []);

  const loadEnrollments = useCallback(async (token, uid) => {
    setEnrollLoading(true);
    const data = await api("/rest/v1/enrollments", { token, params: { student_id: `eq.${uid}`, select: "*" } }).catch(() => []);
    setEnrollments(data);
    setEnrollLoading(false);
  }, []);

  const onAuthed = (data) => {
    setSession(data);
    setAuthOpen(false);
    loadEnrollments(data.access_token, data.user.id);
    setPage("dashboard");
  };

  useEffect(() => {
    if (!session) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("reference") || params.has("tx_ref") || params.has("transaction_id")) {
      setPage("dashboard");
      const t1 = setTimeout(() => loadEnrollments(session.access_token, session.user.id), 3000);
      const t2 = setTimeout(() => loadEnrollments(session.access_token, session.user.id), 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [session, loadEnrollments]);

  const signOut = () => { setSession(null); setEnrollments([]); setPage("home"); };

  const checkout = async (courseId, provider) => {
    setCheckingOut(courseId);
    try {
      const { checkout_url } = await startCheckout(session.access_token, courseId, provider);
      window.location.href = checkout_url;
    } catch (e) {
      alert("Could not start checkout: " + e.message);
      setCheckingOut(null);
    }
  };

  const openCourse = (course) => { setActiveCourse(course); setPage("player"); };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh" }}>
      <style>{GLOBAL_STYLE}</style>
      <Nav page={page} setPage={setPage} session={session} setAuthOpen={setAuthOpen} signOut={signOut} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthed={onAuthed} />}
      {page === "home" && <Home setPage={setPage} courses={courses} loading={coursesLoading} />}
      {page === "courses" && <Courses courses={courses} loading={coursesLoading} error={coursesError} session={session} checkout={checkout} checkingOut={checkingOut} />}
      {page === "ebooks" && <Ebooks ebooks={ebooks} loading={ebooksLoading} error={ebooksError} />}
      {page === "dashboard" && session && <Dashboard session={session} courses={courses} enrollments={enrollments} loading={enrollLoading} openCourse={openCourse} />}
      {page === "player" && session && <Player course={activeCourse} session={session} token={session.access_token} />}
      <footer style={{ background: "#0A1A38" }} className="pt-14 pb-8">
        <div className="max-w-6xl mx-auto px-5">
          <Logo />
          <p className="mt-4 text-sm max-w-xs" style={{ color: "#8CA0C4" }}>Impacting innovation through building design — construction software training for architects, engineers, and builders.</p>
          <div className="mt-8 pt-6 border-t text-xs text-center" style={{ borderColor: "#ffffff14", color: "#8CA0C4" }}>
            © {new Date().getFullYear()} Gsol Design Academy Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
