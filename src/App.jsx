import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron, Points, PointMaterial } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { CheckCircle2, Circle, MessageSquare, PlayCircle, ChevronRight, ShieldCheck, TrendingUp, Send, Menu, X, LogOut, Loader2, Sparkles, Award, Users, Star, ArrowRight, Zap, Package, Bot, HelpCircle, Bell, Paperclip, RotateCcw, Eye } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Respect prefers-reduced-motion everywhere: when true, Reveal/TextReveal
// skip their GSAP animation entirely and render children in their final,
// fully-visible state immediately — never leaving content stuck invisible.
const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
.premium-card { transition: transform .3s ease, box-shadow .3s ease; }
.premium-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px #0A1A3822; }
@media (prefers-reduced-motion: reduce) {
  .premium-card:hover { transform: none; }
  .float, .grid-bg, .shine-btn::after { animation: none !important; }
}
`;

/* ---------- 3D hero scene: a rotating wireframe icosahedron with a drifting
   point-field, standing in for "blueprint geometry" without being literal.
   Kept to the hero only — a full 3D scene per section would hurt load time
   and readability on a course-catalog site, so this is the one deliberate
   "wow" moment rather than a gimmick repeated everywhere. ---------- */
/* ---------- Smooth scrolling (Lenis), synced to GSAP's ticker so
   ScrollTrigger's viewport math stays correct. Skipped entirely for
   prefers-reduced-motion — native scroll behavior is the accessible default. ---------- */
function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return null;
}

function FloatingGeo() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.08;
      ref.current.rotation.y += delta * 0.12;
    }
  });
  return (
    <Icosahedron ref={ref} args={[1.6, 1]} position={[1.4, 0, 0]}>
      <meshBasicMaterial color="#3DA5FF" wireframe transparent opacity={0.55} />
    </Icosahedron>
  );
}

function ParticleField() {
  const ref = useRef();
  const [positions] = useState(() => {
    const arr = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  });
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.02; });
  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial color="#7FC0FF" size={0.03} sizeAttenuation transparent opacity={0.6} />
    </Points>
  );
}

function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.9 }}>
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <ParticleField />
          <FloatingGeo />
        </Canvas>
      </Suspense>
    </div>
  );
}

/* ---------- Tilt card: subtle 3D pointer-tracked tilt for a "futuristic"
   feel on hover, used across course/bundle cards ---------- */
function TiltCard({ children, className, style }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -8, y: px * 8 });
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={className}
      style={{ ...style, transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform 0.15s ease-out" }}
    >
      {children}
    </div>
  );
}

/* ---------- Floating AI support widget: answers from live academy data via
   the support-agent edge function; falls back gracefully if unconfigured ---------- */
function ChatWidget({ open, setOpen }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I'm the Gsol Design Academy assistant. Ask me about any course, pricing, or how enrollment works." }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    const userMsg = { role: "user", content: draft };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/support-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON_KEY },
        body: JSON.stringify({ message: userMsg.content, history: messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent error");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `I'm not able to answer right now (${e.message}). Try the community board, or a human will follow up there.` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        aria-label="Open support chat"
        style={{ background: "linear-gradient(135deg,#1E56A0,#3DA5FF)" }}
      >
        {open ? <X color="#fff" size={22} /> : <Bot color="#fff" size={24} />}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm rounded-2xl overflow-hidden flex flex-col"
            style={{ height: 460, background: "#fff", boxShadow: "0 20px 60px #0A1A3855" }}
          >
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#0A1A38" }}>
              <Bot size={18} color="#3DA5FF" />
              <span className="text-sm font-semibold" style={{ color: "#fff", fontFamily: "'Oswald',sans-serif" }}>Gsol Support Agent</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className="text-sm px-3 py-2 rounded-xl max-w-[85%]"
                  style={{ background: m.role === "user" ? "#0A1A38" : "#F0F4FA", color: m.role === "user" ? "#fff" : "#0A1A38", marginLeft: m.role === "user" ? "auto" : 0 }}>
                  {m.content}
                </div>
              ))}
              {sending && <div className="text-xs flex items-center gap-1.5" style={{ color: "#0A1A3899" }}><Loader2 size={12} className="animate-spin" /> Thinking…</div>}
            </div>
            <div className="p-3 border-t flex gap-2" style={{ borderColor: "#0A1A3814" }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask about a course, price, anything…" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
              <button onClick={send} className="px-3 py-2 rounded-lg text-white" style={{ background: "#1E56A0" }}><Send size={15} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


// Pinned to West Africa Time (UTC+1, no DST) so every visitor sees the same
// weekend-promo window regardless of their own device's timezone — and the
// checkout-init edge function uses this exact same formula, so what's shown
// always matches what's actually charged.
function isWeekendPromo() {
  const watDate = new Date(Date.now() + 60 * 60 * 1000);
  const day = watDate.getUTCDay();
  return day === 0 || day === 5 || day === 6;
}

async function api(path, { method = "GET", token, body, params, upsert } = {}) {
  const url = new URL(SUPABASE_URL + path);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      "Content-Type": "application/json",
      ...(method !== "GET" ? { Prefer: upsert ? "return=representation,resolution=merge-duplicates" : "return=representation" } : {}),
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

// Session persistence: browser localStorage survives refreshes and closed
// tabs (unlike React state, which resets to nothing on every reload). Tokens
// expire after ~1hr, so refreshSession exchanges the longer-lived refresh
// token for a fresh access token without making the student sign in again.
const SESSION_KEY = "gsol_session";
function saveSessionToStorage(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
}
function loadSessionFromStorage() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function clearSessionFromStorage() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
async function refreshAccessToken(refresh_token) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Session refresh failed");
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

// Uploads a file straight to Supabase Storage via its REST API (no supabase-js
// client needed, consistent with the rest of this app). Returns the public
// URL for public buckets, or the storage path for private ones (the caller
// resolves a signed URL when displaying a private file).
async function uploadFile(bucket, path, file, token) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${text}`);
  }
  return path;
}

function publicFileUrl(bucket, path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

async function signedFileUrl(bucket, path, token) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  const data = await res.json();
  return data.signedURL ? `${SUPABASE_URL}/storage/v1${data.signedURL}` : null;
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
  useGSAP(() => {
    if (!ref.current) return;
    if (prefersReducedMotion) { gsap.set(ref.current, { opacity: 1, y: 0 }); return; }
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: delay / 1000,
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      }
    );
  }, { scope: ref });
  return (
    <div ref={ref} className={className} style={{ opacity: prefersReducedMotion ? 1 : 0 }}>
      {children}
    </div>
  );
}

function Counter({ to, suffix = "", duration = 1400 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useGSAP(() => {
    if (prefersReducedMotion) { setVal(to); return; }
    const obj = { n: 0 };
    gsap.to(obj, {
      n: to, duration: duration / 1000, ease: "power2.out",
      onUpdate: () => setVal(Math.floor(obj.n)),
      scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
    });
  }, { scope: ref, dependencies: [to, duration] });
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

// Renders whatever's in a lesson's video_url as an inline player instead of
// a link that leaves the site. Google Drive links use Drive's own embeddable
// preview (works without any file migration); direct video files (e.g.
// admin-uploaded to Supabase Storage) use a native HTML5 player.
function LessonVideo({ url }) {
  if (!url) return <PlayCircle size={56} color="#3DA5FF55" />;
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return (
      <iframe
        src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
        className="w-full h-full rounded-xl"
        allow="autoplay"
        title="Lesson video"
      />
    );
  }
  return (
    <video controls className="w-full h-full rounded-xl" src={url}>
      Your browser doesn't support inline video — <a href={url} style={{ color: "#3DA5FF" }}>open it directly</a>.
    </video>
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
  const navRef = useRef(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Navbar entrance: a quick, subtle drop-in on first mount only.
  useGSAP(() => {
    if (prefersReducedMotion || !navRef.current) return;
    gsap.from(navRef.current, { y: -24, opacity: 0, duration: 0.6, ease: "power3.out" });
  }, []);
  const isAdmin = session?.profile?.role === "admin" || session?.profile?.role === "instructor";
  const items = session
    ? [["home", "Home"], ["courses", "Courses"], ["bundles", "Bundles"], ["ebooks", "Ebooks"], ["community", "Community"], ["dashboard", "Dashboard"], ...(isAdmin ? [["admin", "Admin"]] : [])]
    : [["home", "Home"], ["courses", "Courses"], ["bundles", "Bundles"], ["ebooks", "Ebooks"], ["community", "Community"]];
  return (
    <header ref={navRef} className="sticky top-0 z-40 transition-all" style={{ background: scrolled ? "#0A1A38F2" : "#0A1A38", backdropFilter: "blur(10px)", borderBottom: scrolled ? "1px solid #ffffff14" : "1px solid transparent", boxShadow: scrolled ? "0 8px 30px #0A1A3840" : "none" }}>
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-between transition-all" style={{ height: scrolled ? 56 : 64 }}>
        <button onClick={() => setPage("home")}><Logo /></button>
        <nav className="hidden md:flex items-center gap-1">
          {items.map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} className="px-4 py-2 text-sm rounded-full transition-all hover:opacity-90"
              style={{ color: page === id ? "#0A1A38" : "#F5F3ECcc", background: page === id ? "linear-gradient(90deg,#3DA5FF,#1E56A0)" : "transparent", backgroundColor: page === id ? "#3DA5FF" : "transparent" }}>{label}</button>
          ))}
          {session ? (
            <button onClick={signOut} className="ml-2 px-4 py-2 text-sm rounded-full flex items-center gap-1.5 transition-opacity hover:opacity-80" style={{ color: "#F5F3ECcc" }}><LogOut size={14} /> Sign out</button>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="shine-btn ml-2 px-5 py-2 text-sm rounded-full font-semibold transition-transform hover:scale-[1.04] active:scale-[0.97]" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)", color: "#fff" }}>Get started</button>
          )}
        </nav>
        <button className="md:hidden text-white relative w-6 h-6" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>
          <motion.span animate={{ rotate: menuOpen ? 90 : 0, opacity: 1 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex items-center justify-center">
            {menuOpen ? <X /> : <Menu />}
          </motion.span>
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-5 pb-4">
              {items.map(([id, label]) => (
                <button key={id} onClick={() => { setPage(id); setMenuOpen(false); }} className="text-left px-3 py-2 rounded-md transition-colors" style={{ color: "#F5F3EC", background: page === id ? "#3DA5FF33" : "transparent" }}>{label}</button>
              ))}
              {session ? (
                <button onClick={signOut} className="text-left px-3 py-2 rounded-md" style={{ color: "#F5F3EC" }}>Sign out</button>
              ) : (
                <button onClick={() => setAuthOpen(true)} className="text-left px-3 py-2 rounded-md font-semibold" style={{ color: "#3DA5FF" }}>Get started</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.61z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function signInWithGoogle() {
  const redirectTo = window.location.origin + window.location.pathname;
  window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
}

function ResetPasswordModal({ token, onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setErr("");
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || data.error_description || "Couldn't update password");
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0A1A38cc", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-7" style={{ background: "#fff" }}>
        <h3 className="font-bold text-xl mb-5" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>Set a new password</h3>
        {done ? (
          <div className="text-center py-2">
            <CheckCircle2 size={36} color="#1E9E5C" className="mx-auto mb-3" />
            <p className="text-sm mb-5" style={{ color: "#0A1A38" }}>Password updated — sign in with your new password.</p>
            <button onClick={onDone} className="px-5 py-2.5 rounded-lg font-medium text-white text-sm" style={{ background: "#0A1A38" }}>Continue</button>
          </div>
        ) : (
          <>
            <label htmlFor="new-password" className="sr-only">New password</label>
            <input id="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" className="w-full mb-3 px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
            <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
            <input id="confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" type="password" className="w-full mb-3 px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
            {err && <p className="text-xs mb-2" style={{ color: "#c0392b" }}>{err}</p>}
            <button onClick={submit} disabled={loading} className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
              {loading && <Loader2 size={16} className="animate-spin" />} Update password
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AuthModal({ onClose, onAuthed }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(""); setInfo(""); setLoading(true);
    try {
      if (mode === "signup") {
        const data = await authRequest("signup", { email, password, data: { full_name: fullName, phone } });
        if (data.access_token) {
          await api("/rest/v1/profiles", { method: "POST", token: data.access_token, body: { id: data.user.id, full_name: fullName, phone, role: "student" } }).catch(() => {});
          onAuthed(data);
        } else {
          setInfo("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else if (mode === "forgot") {
        await authRequest("recover", { email, redirect_to: window.location.origin + window.location.pathname });
        setInfo("If that email has an account, a reset link is on its way — check your inbox.");
      } else if (mode === "magiclink") {
        await authRequest("magiclink", { email, create_user: true, redirect_to: window.location.origin + window.location.pathname });
        setInfo("Check your email for a sign-in link — no password needed.");
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
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Join the academy" : mode === "magiclink" ? "Sign in without a password" : "Reset your password"}
          </h3>
          <button onClick={onClose} aria-label="Close dialog"><X size={18} color="#0A1A3899" /></button>
        </div>

        {mode !== "forgot" && mode !== "magiclink" && (
          <>
            <button onClick={signInWithGoogle} className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2.5 border relative mb-4" style={{ borderColor: "#0A1A3822", color: "#0A1A38" }}>
              <GoogleIcon /> Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="flex-1 h-px" style={{ background: "#0A1A3814" }} />
              <span className="text-xs" style={{ color: "#0A1A3866" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "#0A1A3814" }} />
            </div>
          </>
        )}

        <div className="space-y-3 relative">
          {mode === "signup" && (
            <>
              <label htmlFor="auth-name" className="sr-only">Full name</label>
              <input id="auth-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
              <label htmlFor="auth-phone" className="sr-only">Phone number</label>
              <input id="auth-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
            </>
          )}
          <label htmlFor="auth-email" className="sr-only">Email</label>
          <input id="auth-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
          {mode !== "forgot" && mode !== "magiclink" && (
            <>
              <label htmlFor="auth-password" className="sr-only">Password</label>
              <input id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
            </>
          )}
          {mode === "signin" && (
            <div className="flex justify-between text-xs">
              <button onClick={() => { setMode("magiclink"); setErr(""); setInfo(""); }} style={{ color: "#1E56A0" }}>Email me a sign-in link</button>
              <button onClick={() => { setMode("forgot"); setErr(""); setInfo(""); }} style={{ color: "#1E56A0" }}>Forgot password?</button>
            </div>
          )}
          {err && <p className="text-xs" style={{ color: "#c0392b" }}>{err}</p>}
          {info && <p className="text-xs" style={{ color: "#1E9E5C" }}>{info}</p>}
          <button onClick={submit} disabled={loading} className="shine-btn w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
            {loading && <Loader2 size={16} className="animate-spin" />} {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "magiclink" ? "Send sign-in link" : "Send reset link"}
          </button>
        </div>
        <button onClick={() => { setMode(mode === "signup" ? "signin" : mode === "signin" ? "signup" : "signin"); setErr(""); setInfo(""); }} className="mt-4 text-sm w-full text-center relative" style={{ color: "#1E56A0" }}>
          {mode === "signin" ? "Need an account? Sign up" : mode === "signup" ? "Already have an account? Sign in" : "Back to sign in"}
        </button>
      </div>
    </div>
  );
}

function Home({ setPage, courses, loading }) {
  const weekend = isWeekendPromo();
  const [announcements, setAnnouncements] = useState([]);
  const heroRef = useRef(null);
  const sceneWrapRef = useRef(null);
  useEffect(() => {
    api("/rest/v1/announcements", { params: { is_published: "eq.true", select: "*", order: "created_at.desc", limit: "3" } })
      .then(setAnnouncements).catch(() => {});
  }, []);

  // Subtle parallax on the 3D hero scene — the graphic drifts slightly slower
  // than the page scrolls, a classic premium-feel touch. Transform-only (no
  // layout impact), skipped entirely for prefers-reduced-motion.
  useGSAP(() => {
    if (prefersReducedMotion || !sceneWrapRef.current) return;
    gsap.to(sceneWrapRef.current, {
      y: 90, ease: "none",
      scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.6 },
    });
  }, { scope: heroRef });

  return (
    <div style={{ background: "#F7F8FA" }}>
      {announcements.length > 0 && (
        <div style={{ background: "#0A1A38" }} className="py-2.5 overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 flex items-center gap-3 text-sm" style={{ color: "#7FC0FF" }}>
            <Bell size={13} className="flex-shrink-0" />
            <span className="truncate"><strong>{announcements[0].title}:</strong> {announcements[0].body}</span>
          </div>
        </div>
      )}
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden" style={{ background: "linear-gradient(160deg,#0A1A38,#0F2450 55%,#14294F)" }}>
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div ref={sceneWrapRef} className="absolute inset-0"><HeroScene /></div>
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
              <button onClick={() => setPage("courses")} className="shine-btn group px-7 py-3.5 rounded-full font-semibold text-white flex items-center gap-2 text-base transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)", boxShadow: "0 10px 30px #3DA5FF33" }}>
                Explore courses <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>
              <button onClick={() => setPage("courses")} className="px-7 py-3.5 rounded-full font-semibold text-sm border" style={{ borderColor: "#ffffff33", color: "#fff" }}>
                View pricing
              </button>
              <button onClick={() => setPage("ebooks")} className="px-7 py-3.5 rounded-full font-semibold text-sm border" style={{ borderColor: "#ffffff33", color: "#fff" }}>
                Browse ebooks
              </button>
              <button onClick={() => setPage("community")} className="px-7 py-3.5 rounded-full font-semibold text-sm border flex items-center gap-2" style={{ borderColor: "#ffffff33", color: "#fff" }}>
                <HelpCircle size={16} /> Ask a question
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

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <Reveal>
          <div className="rounded-3xl p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(120deg,#1E56A0,#0A1A38)" }}>
            <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full float" style={{ background: "radial-gradient(circle,#3DA5FF40,transparent 70%)" }} />
            <Users size={30} color="#7FC0FF" className="mx-auto mb-4" />
            <h2 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#fff" }}>Your next skill starts this week</h2>
            <p className="mt-3 max-w-md mx-auto" style={{ color: "#C7D2E8" }}>Join thousands of architects, engineers and builders leveling up with Gsol Design Academy.</p>
            <button onClick={() => setPage("courses")} className="shine-btn group mt-7 px-8 py-3.5 rounded-full font-semibold text-white inline-flex items-center gap-2 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]" style={{ background: "linear-gradient(90deg,#3DA5FF,#7FC0FF)", color: "#0A1A38" }}>
              Start learning today <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Courses({ courses, loading, error, session, checkout, checkingOut, selarCheckout, onSelectCourse }) {
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
                <div className="premium-card p-6 rounded-2xl border flex flex-col h-full" style={{ borderColor: "#0A1A3814", background: "#fff", boxShadow: "0 4px 20px #0A1A380a" }}>
                  <div className="flex justify-between items-start mb-3">
                    <TitleBlock label="NO." code={c.code} />
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#1E56A00f", color: "#1E56A0", fontFamily: "'JetBrains Mono',monospace" }}>{c.level}</span>
                  </div>
                  <button onClick={() => onSelectCourse(c)} className="text-left">
                    <h3 className="font-semibold text-lg hover:underline" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{c.title}</h3>
                  </button>
                  <p className="text-sm mt-1.5 flex-1" style={{ color: "#0A1A3899" }}>{c.blurb}</p>
                  <button onClick={() => onSelectCourse(c)} className="text-xs font-medium text-left mt-1" style={{ color: "#1E56A0" }}>View full curriculum →</button>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: "#0A1A3814" }}>
                    <span className="font-bold text-lg" style={{ color: "#1E56A0" }}>
                      ${weekend ? c.price_intl_weekend : c.price_intl_weekday}
                      {weekend && <span className="ml-1.5 text-xs line-through opacity-40 font-normal">${c.price_intl_weekday}</span>}
                    </span>
                  </div>
                  {session ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button onClick={() => checkout(c.id, "paystack")} disabled={checkingOut === c.id} className="py-2 rounded-lg font-medium text-white text-xs flex items-center justify-center gap-1" style={{ background: "#0A1A38" }}>
                        {checkingOut === c.id && <Loader2 size={11} className="animate-spin" />} Paystack
                      </button>
                      <button onClick={() => checkout(c.id, "flutterwave")} disabled={checkingOut === c.id} className="py-2 rounded-lg font-medium text-white text-xs flex items-center justify-center gap-1" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                        {checkingOut === c.id && <Loader2 size={11} className="animate-spin" />} Flutter.
                      </button>
                      <button onClick={() => selarCheckout(c)} className="py-2 rounded-lg font-medium text-white text-xs flex items-center justify-center gap-1" style={{ background: "#1E9E5C" }}>
                        Selar
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

function downloadCertificate(studentName, courseTitle) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = 297, h = 210;

  // Border
  doc.setDrawColor(10, 26, 56);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.4);
  doc.setDrawColor(61, 165, 255);
  doc.rect(14, 14, w - 28, h - 28);

  doc.setTextColor(10, 26, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("GSOL DESIGN ACADEMY", w / 2, 40, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(61, 165, 255);
  doc.text("IMPACTING INNOVATION THROUGH BUILDING DESIGN", w / 2, 47, { align: "center" });

  doc.setTextColor(10, 26, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("This certifies that", w / 2, 80, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(studentName || "Student", w / 2, 98, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("has successfully completed the course", w / 2, 114, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 86, 160);
  doc.text(courseTitle, w / 2, 130, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(10, 26, 56);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Issued ${dateStr}`, w / 2, 155, { align: "center" });

  doc.save(`${courseTitle.replace(/\s+/g, "-")}-certificate.pdf`);
}

function StreakFlame({ streak }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ fontSize: 22 }}>🔥</span>
      <span className="font-bold text-2xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{streak}</span>
    </div>
  );
}

function ReminderPanel({ session }) {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api("/rest/v1/reminder_settings", { token: session.access_token, params: { student_id: `eq.${session.user.id}`, select: "*" } })
      .then((data) => setSettings(data[0] || { student_id: session.user.id, enabled: true, inactivity_days: 3 }))
      .finally(() => setLoaded(true));
  }, [session]);

  const save = async (next) => {
    setSettings(next);
    setSaving(true);
    try {
      await api("/rest/v1/reminder_settings", { method: "POST", token: session.access_token, upsert: true, body: next });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded || !settings) return null;

  return (
    <div className="p-5 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
      <div className="flex items-center gap-2 mb-1" style={{ color: "#0A1A38" }}>
        <Bell size={16} /><span className="font-semibold text-sm">Learning reminders</span>
      </div>
      <p className="text-xs mb-3" style={{ color: "#0A1A3888" }}>Get an email nudge if you go quiet for a while.</p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: "#0A1A38" }}>Email reminders</span>
        <button onClick={() => save({ ...settings, enabled: !settings.enabled })} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: settings.enabled ? "#1E56A0" : "#0A1A3822" }}>
          <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: settings.enabled ? 22 : 2 }} />
        </button>
      </div>
      {settings.enabled && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "#0A1A38" }}>Remind me after</span>
          <select value={settings.inactivity_days} onChange={(e) => save({ ...settings, inactivity_days: Number(e.target.value) })} className="px-2 py-1.5 rounded-lg border text-sm" style={{ borderColor: "#0A1A3822" }}>
            {[1, 2, 3, 5, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
          </select>
        </div>
      )}
      {saving && <div className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "#0A1A3866" }}><Loader2 size={11} className="animate-spin" /> Saving…</div>}
    </div>
  );
}

function RefundRequestModal({ course, session, onClose }) {
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (reason.trim().length < 5) { setErr("Tell us a bit more about the issue."); return; }
    setSubmitting(true);
    setErr("");
    try {
      const uploadedPaths = [];
      for (const file of files) {
        const path = `${session.user.id}/${Date.now()}-${file.name}`;
        await uploadFile("refund-attachments", path, file, session.access_token);
        uploadedPaths.push(path);
      }
      await api("/rest/v1/refund_requests", {
        method: "POST", token: session.access_token,
        body: { student_id: session.user.id, course_id: course.id, reason, attachment_urls: uploadedPaths },
      });
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0A1A38cc", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl p-7 relative" style={{ background: "#fff" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>Request a refund</h3>
          <button onClick={onClose} aria-label="Close dialog"><X size={18} color="#0A1A3899" /></button>
        </div>
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 size={40} color="#1E9E5C" className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#0A1A38" }}>Request submitted for <strong>{course.title}</strong>. We'll review it and follow up by email.</p>
            <button onClick={onClose} className="mt-5 px-5 py-2.5 rounded-lg font-medium text-white text-sm" style={{ background: "#0A1A38" }}>Close</button>
          </div>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: "#0A1A3899" }}>For <strong>{course.title}</strong>. Tell us what happened — screenshots help if there's a technical issue.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What went wrong?" rows={4} className="w-full mb-3 px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "#0A1A3822" }} />
            <label className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border cursor-pointer mb-3" style={{ borderColor: "#0A1A3822", color: "#0A1A3899" }}>
              <Paperclip size={15} />
              {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} attached` : "Attach screenshots or files (optional)"}
              <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            </label>
            {err && <p className="text-xs mb-2" style={{ color: "#c0392b" }}>{err}</p>}
            <button onClick={submit} disabled={submitting} className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
              {submitting && <Loader2 size={16} className="animate-spin" />} Submit request
            </button>
          </>
        )}
      </div>
    </div>
  );
}


function StudentFilesPanel({ session }) {
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/rest/v1/student_files", { token: session.access_token, params: { student_id: `eq.${session.user.id}`, select: "*", order: "created_at.desc" } })
      .then(async (data) => {
        setFiles(data);
        const resolved = {};
        for (const f of data) resolved[f.id] = await signedFileUrl("student-files", f.file_url, session.access_token);
        setUrls(resolved);
      })
      .finally(() => setLoading(false));
  }, [session]);

  if (loading || files.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
      <div className="flex items-center gap-2 mb-3" style={{ color: "#0A1A38" }}>
        <Paperclip size={16} /><span className="font-semibold text-sm">Files sent to you</span>
      </div>
      <div className="space-y-2">
        {files.map((f) => (
          <a key={f.id} href={urls[f.id] || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm no-underline" style={{ color: "#1E56A0" }}>
            <Paperclip size={12} /> {f.title}
          </a>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ session, courses, enrollments, loading, openCourse }) {
  const [refundCourse, setRefundCourse] = useState(null);
  const [lessonsByCourseCount, setLessonsByCourseCount] = useState({});
  const [progressByCourse, setProgressByCourse] = useState({});
  const [lastActivityByCourse, setLastActivityByCourse] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const enrolledCourses = enrollments.map((e) => ({ ...courses.find((c) => c.id === e.course_id), enrollment: e })).filter((c) => c.id);
  const activeCourses = enrolledCourses.filter((c) => c.enrollment.status === "active");

  useEffect(() => {
    if (activeCourses.length === 0) { setStatsLoading(false); return; }
    const courseIds = activeCourses.map((c) => c.id);
    Promise.all([
      api("/rest/v1/lessons", { token: session.access_token, params: { course_id: `in.(${courseIds.join(",")})`, select: "id,course_id" } }),
      api("/rest/v1/lesson_progress", { token: session.access_token, params: { student_id: `eq.${session.user.id}`, completed: "eq.true", select: "lesson_id,completed_at,lessons(course_id)" } }),
    ]).then(([lessons, progress]) => {
      const counts = {};
      const lessonToCourse = {};
      lessons.forEach((l) => { counts[l.course_id] = (counts[l.course_id] || 0) + 1; lessonToCourse[l.id] = l.course_id; });
      setLessonsByCourseCount(counts);
      const done = {};
      const lastActivity = {};
      progress.forEach((p) => {
        const cid = p.lessons?.course_id || lessonToCourse[p.lesson_id];
        if (!cid) return;
        done[cid] = (done[cid] || 0) + 1;
        if (!lastActivity[cid] || p.completed_at > lastActivity[cid]) lastActivity[cid] = p.completed_at;
      });
      setProgressByCourse(done);
      setLastActivityByCourse(lastActivity);
    }).finally(() => setStatsLoading(false));
  }, [session, enrollments.length]);

  // Streak: consecutive days (including today) with at least one completed lesson
  const streak = (() => {
    const dates = new Set(Object.values(lastActivityByCourse).map((d) => new Date(d).toDateString()));
    Object.values(progressByCourse); // no-op reference to satisfy linter intent
    let count = 0;
    const cursor = new Date();
    while (dates.has(cursor.toDateString()) || (count === 0 && cursor.toDateString() === new Date().toDateString())) {
      if (!dates.has(cursor.toDateString())) break;
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  })();

  const totalLessonsDone = Object.values(progressByCourse).reduce((a, b) => a + b, 0);
  const completedCourses = activeCourses.filter((c) => lessonsByCourseCount[c.id] > 0 && progressByCourse[c.id] === lessonsByCourseCount[c.id]);
  const continueCourse = [...activeCourses].sort((a, b) => (lastActivityByCourse[b.id] || "").localeCompare(lastActivityByCourse[a.id] || ""))[0];

  return (
    <div style={{ background: "#F7F8FA", minHeight: "70vh" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <TitleBlock label="STUDENT" code={(session?.profile?.full_name || session?.user?.email || "").split("@")[0].toUpperCase()} />
        <h2 className="mt-4 mb-8" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>My learning</h2>

        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading your enrollments…</div>
        ) : enrolledCourses.length === 0 ? (
          <p className="text-sm" style={{ color: "#0A1A3899" }}>You're not enrolled in any courses yet — head to the catalog to get started.</p>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <div className="text-xs mb-1" style={{ color: "#0A1A3888" }}>Enrolled</div>
                <div className="font-bold text-2xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{activeCourses.length}</div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <div className="text-xs mb-1" style={{ color: "#0A1A3888" }}>Completed</div>
                <div className="font-bold text-2xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#1E9E5C" }}>{completedCourses.length}</div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <div className="text-xs mb-1" style={{ color: "#0A1A3888" }}>Lessons done</div>
                <div className="font-bold text-2xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{totalLessonsDone}</div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <div className="text-xs mb-1" style={{ color: "#0A1A3888" }}>Day streak</div>
                <StreakFlame streak={streak} />
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
              <div>
                {/* Continue learning */}
                {continueCourse && (
                  <div className="mb-8 p-6 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(120deg,#1E56A0,#0A1A38)" }}>
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full" style={{ background: "radial-gradient(circle,#3DA5FF40,transparent 70%)" }} />
                    <div className="relative">
                      <div className="text-xs font-medium mb-2" style={{ color: "#7FC0FF" }}>CONTINUE LEARNING</div>
                      <h3 className="font-bold text-xl mb-3" style={{ fontFamily: "'Oswald',sans-serif", color: "#fff" }}>{continueCourse.title}</h3>
                      <div className="max-w-xs mb-4">
                        <DimensionBar pct={lessonsByCourseCount[continueCourse.id] ? Math.round((progressByCourse[continueCourse.id] || 0) / lessonsByCourseCount[continueCourse.id] * 100) : 0} />
                      </div>
                      <button onClick={() => openCourse(continueCourse)} className="px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2" style={{ background: "#fff", color: "#0A1A38" }}>
                        <PlayCircle size={16} /> Resume course
                      </button>
                    </div>
                  </div>
                )}

                <h3 className="font-semibold text-lg mb-4" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>All courses</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  {enrolledCourses.map((c) => {
                    const total = lessonsByCourseCount[c.id] || 0;
                    const done = progressByCourse[c.id] || 0;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <div key={c.id} className="p-6 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                        <div className="flex justify-between items-start">
                          <TitleBlock label="NO." code={c.code} />
                          {pct === 100 && <span className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ background: "#1E9E5C1A", color: "#1E9E5C" }}><Award size={11} /> Certified</span>}
                        </div>
                        <h3 className="font-semibold text-lg mt-3 mb-3" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{c.title}</h3>
                        {c.enrollment.status === "pending" ? (
                          <div className="text-sm px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "#FF8A3D1A", color: "#FF8A3D" }}>
                            <Loader2 size={14} className="animate-spin" /> Payment processing — updates automatically once confirmed
                          </div>
                        ) : (
                          <>
                            {statsLoading ? (
                              <div className="h-1.5 rounded-full animate-pulse" style={{ background: "#0A1A380f" }} />
                            ) : (
                              <>
                                <DimensionBar pct={pct} />
                                <div className="text-xs mt-1.5" style={{ color: "#0A1A3888" }}>{done} of {total} lessons complete</div>
                              </>
                            )}
                            <button onClick={() => openCourse(c)} className="mt-4 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-sm text-white" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                              <PlayCircle size={16} /> {pct === 100 ? "Review course" : pct > 0 ? "Continue learning" : "Start learning"}
                            </button>
                            <button onClick={() => setRefundCourse(c)} className="mt-2 w-full py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 text-xs" style={{ color: "#0A1A3888" }}>
                              <RotateCcw size={12} /> Request a refund
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-5">
                <ReminderPanel session={session} />
                <StudentFilesPanel session={session} />
                {completedCourses.length > 0 && (
                  <div className="p-5 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                    <div className="flex items-center gap-2 mb-3" style={{ color: "#0A1A38" }}>
                      <Award size={16} color="#1E9E5C" /><span className="font-semibold text-sm">Certificates earned</span>
                    </div>
                    <div className="space-y-2">
                      {completedCourses.map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-2 text-sm" style={{ color: "#0A1A38cc" }}>
                          <span className="flex items-center gap-2"><CheckCircle2 size={14} color="#1E9E5C" /> {c.title}</span>
                          <button onClick={() => downloadCertificate(session?.profile?.full_name, c.title)} className="text-xs font-medium flex-shrink-0" style={{ color: "#1E56A0" }}>Download</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {refundCourse && <RefundRequestModal course={refundCourse} session={session} onClose={() => setRefundCourse(null)} />}
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
    // Log the view regardless of video source (Drive iframes give us no
    // playback events, so "opened this lesson" is the honest signal we can
    // capture — see markComplete for the one real completion signal).
    api("/rest/v1/lesson_views", { method: "POST", token, body: { student_id: session.user.id, lesson_id: activeLesson.id } }).catch(() => {});
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
              <div className="aspect-video rounded-xl overflow-hidden mb-4 flex items-center justify-center" style={{ background: "#0A1A38" }}>
                <LessonVideo url={activeLesson.video_url} />
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

function CourseDetail({ course, session, checkout, checkingOut, selarCheckout, onBack }) {
  const weekend = isWeekendPromo();
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!course) return;
    api("/rest/v1/rpc/get_course_curriculum", { method: "POST", body: { course_id_param: course.id } })
      .then(setCurriculum).catch(() => setCurriculum([])).finally(() => setLoading(false));
  }, [course]);

  if (!course) return null;

  return (
    <div style={{ background: "#F7F8FA" }}>
      <div className="max-w-4xl mx-auto px-5 py-14">
        <button onClick={onBack} className="text-sm font-medium mb-6 flex items-center gap-1" style={{ color: "#1E56A0" }}>
          <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to catalog
        </button>
        <TitleBlock label="NO." code={course.code} />
        <h1 className="mt-4 mb-3" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.4rem", color: "#0A1A38" }}>{course.title}</h1>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "#1E56A00f", color: "#1E56A0" }}>{course.level}</span>
        <p className="text-base mt-4 max-w-2xl" style={{ color: "#0A1A38cc", lineHeight: 1.7 }}>{course.blurb}</p>

        <div className="mt-8 p-6 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <span className="font-bold text-3xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#1E56A0" }}>
              ${weekend ? course.price_intl_weekend : course.price_intl_weekday}
              {weekend && <span className="ml-2 text-base line-through opacity-40 font-normal">${course.price_intl_weekday}</span>}
            </span>
            {weekend && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "linear-gradient(90deg,#FF8A3D,#FF5F5F)", color: "#fff" }}>Weekend promo — 50% off</span>}
          </div>
          {session ? (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => checkout(course.id, "paystack")} disabled={checkingOut === course.id} className="py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-1.5" style={{ background: "#0A1A38" }}>
                {checkingOut === course.id && <Loader2 size={13} className="animate-spin" />} Paystack
              </button>
              <button onClick={() => checkout(course.id, "flutterwave")} disabled={checkingOut === course.id} className="py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                {checkingOut === course.id && <Loader2 size={13} className="animate-spin" />} Flutterwave
              </button>
              <button onClick={() => selarCheckout(course)} className="py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-1.5" style={{ background: "#1E9E5C" }}>
                Selar
              </button>
            </div>
          ) : (
            <a href={course.selar_link} target="_blank" rel="noreferrer" className="w-full py-3 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: "#0A1A38" }}>
              Sign in to enroll
            </a>
          )}
        </div>

        <h2 className="mt-10 mb-4" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "#0A1A38" }}>Full curriculum</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading curriculum…</div>
        ) : curriculum.length === 0 ? (
          <p className="text-sm" style={{ color: "#0A1A3899" }}>Curriculum details coming soon.</p>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#0A1A3814" }}>
            {curriculum.map((l, i) => (
              <div key={l.id} className="px-5 py-3 flex items-center gap-3 text-sm" style={{ background: i % 2 === 0 ? "#fff" : "#F7F8FA", color: "#0A1A38cc", borderBottom: i < curriculum.length - 1 ? "1px solid #0A1A3810" : "none" }}>
                <PlayCircle size={14} color="#1E56A0" className="flex-shrink-0" />
                <span>{l.position}. {l.title}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs mt-3" style={{ color: "#0A1A3866" }}>{curriculum.length} lessons total. Full videos unlock after enrollment.</p>
      </div>
    </div>
  );
}


function BundleCoursePicker({ bundle, courses, session, onClose }) {
  const [selected, setSelected] = useState([]);
  const [checkingOut, setCheckingOut] = useState(null);

  const toggle = (id) => {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= bundle.pick_count) return s; // cap at pick_count
      return [...s, id];
    });
  };

  const checkout = async (provider) => {
    if (selected.length !== bundle.pick_count) {
      toast(`Pick exactly ${bundle.pick_count} courses first.`);
      return;
    }
    setCheckingOut(provider);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/checkout-init`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ bundle_id: bundle.id, course_ids: selected, provider, redirect_url: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed to start");
      window.location.href = data.checkout_url;
    } catch (e) {
      toast("Could not start checkout: " + e.message);
      setCheckingOut(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0A1A38cc", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: "#fff" }}>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{bundle.name}</h3>
          <button onClick={onClose} aria-label="Close dialog"><X size={18} color="#0A1A3899" /></button>
        </div>
        <p className="text-sm mb-4" style={{ color: "#0A1A3899" }}>Pick exactly {bundle.pick_count} courses ({selected.length}/{bundle.pick_count} selected).</p>
        <div className="space-y-2 mb-5">
          {courses.map((c) => (
            <label key={c.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{ borderColor: selected.includes(c.id) ? "#3DA5FF" : "#0A1A3814", background: selected.includes(c.id) ? "#3DA5FF0d" : "#fff" }}>
              <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4" />
              <span className="text-sm" style={{ color: "#0A1A38" }}>{c.title}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => checkout("paystack")} disabled={!!checkingOut} className="py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-1.5" style={{ background: "#0A1A38" }}>
            {checkingOut === "paystack" && <Loader2 size={13} className="animate-spin" />} Paystack
          </button>
          <button onClick={() => checkout("flutterwave")} disabled={!!checkingOut} className="py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-1.5" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
            {checkingOut === "flutterwave" && <Loader2 size={13} className="animate-spin" />} Flutterwave
          </button>
        </div>
      </div>
    </div>
  );
}

function Bundles({ bundles, loading, error, session, allCourses }) {
  const weekend = isWeekendPromo();
  const [picking, setPicking] = useState(null);
  return (
    <div style={{ background: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <TitleBlock label="INDEX" code="BUNDLES" />
        <h2 className="mt-4 mb-3" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>Buy more, pay less</h2>
        <p className="mb-8 text-sm max-w-lg" style={{ color: "#0A1A3899" }}>Pick multiple courses in one bundle and save compared to buying them one at a time.</p>
        {error && <div className="mb-6 p-4 rounded-md text-sm" style={{ background: "#c0392b1A", color: "#c0392b" }}>Couldn't load bundles: {error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading bundles…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bundles.map((b, i) => (
              <Reveal key={b.id} delay={(i % 3) * 80}>
                <TiltCard className="p-6 rounded-2xl border flex flex-col h-full" style={{ borderColor: "#0A1A3814", background: "#fff", boxShadow: "0 4px 20px #0A1A380a" }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg,#1E56A0,#3DA5FF)" }}>
                    <Package size={20} color="#fff" />
                  </div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{b.name}</h3>
                  <p className="text-sm mt-1.5 flex-1" style={{ color: "#0A1A3899" }}>{b.description}</p>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: "#0A1A3814" }}>
                    <span className="font-bold text-lg" style={{ color: "#1E56A0" }}>
                      ${weekend ? b.price_intl_weekend : b.price_intl_weekday}
                      {weekend && <span className="ml-1.5 text-xs line-through opacity-40 font-normal">${b.price_intl_weekday}</span>}
                    </span>
                  </div>
                  <a href={b.selar_link} target="_blank" rel="noreferrer" className="mt-3 w-full py-2.5 rounded-lg font-medium text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: "#1E9E5C" }}>
                    Get this bundle via Selar
                  </a>
                  {session && (
                    <button onClick={() => setPicking(b)} className="mt-2 w-full py-2.5 rounded-lg font-medium text-white text-sm" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
                      Pay with Paystack / Flutterwave
                    </button>
                  )}
                </TiltCard>
              </Reveal>
            ))}
          </div>
        )}
        {picking && <BundleCoursePicker bundle={picking} courses={allCourses} session={session} onClose={() => setPicking(null)} />}
      </div>
    </div>
  );
}

/* ---------- Legal & compliance pages ---------- */
function LegalPage({ title, updated, children }) {
  return (
    <div style={{ background: "#F7F8FA" }}>
      <div className="max-w-3xl mx-auto px-5 py-14">
        <TitleBlock label="LEGAL" code={title.toUpperCase().replace(/[^A-Z]/g, "-")} />
        <h1 className="mt-4 mb-2" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#0A1A38" }}>{title}</h1>
        <p className="text-xs mb-8" style={{ color: "#0A1A3866" }}>Last updated: {updated}</p>
        <div className="prose text-sm space-y-4" style={{ color: "#0A1A38cc", lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="September 2026">
      <p><strong>Who we are.</strong> Gsol Design Academy Ltd ("we", "us") operates this website and the courses, ebooks, and community features on it.</p>
      <p><strong>What we collect.</strong> When you create an account we collect your name, email, and phone number. When you enroll in a course we collect payment confirmation details from our payment processors (we never see or store your full card number). We automatically record which lessons you complete so we can track your progress.</p>
      <p><strong>Why we collect it.</strong> To create and manage your account, deliver course content, process payments, respond to support questions, and — only if you opt in — send you learning reminder emails.</p>
      <p><strong>Who we share it with.</strong> Paystack, Flutterwave, and Selar (to process payments), and our email provider (to send reminder emails you've opted into). We do not sell your data to anyone.</p>
      <p><strong>Your choices.</strong> You can turn learning reminders on or off anytime from your dashboard. You can request a copy of your data, or ask us to delete your account, by contacting us via the Community page.</p>
      <p><strong>Cookies.</strong> See our <a href="#" onClick={(e) => { e.preventDefault(); }} style={{ color: "#1E56A0" }}>Cookies Policy</a> for details on what we store in your browser.</p>
    </LegalPage>
  );
}

function TermsAndConditions() {
  return (
    <LegalPage title="Terms & Conditions" updated="September 2026">
      <p><strong>Accounts.</strong> You must provide accurate information when creating an account. You're responsible for keeping your login details secure.</p>
      <p><strong>Course access.</strong> Enrollment grants you personal, non-transferable access to the course you purchased. Course videos and materials may not be redistributed, resold, or shared outside your account.</p>
      <p><strong>Payments.</strong> Prices are shown in the currency displayed at checkout and may vary by weekday/weekend promotion. Payment is processed by Paystack, Flutterwave, or Selar depending on your location — we do not store your card details.</p>
      <p><strong>Conduct.</strong> The Community board and course Q&A are for genuine questions and discussion. We may remove content or restrict access for abusive, spam, or fraudulent behavior.</p>
      <p><strong>Changes.</strong> We may update course content, pricing, or these terms from time to time; continued use of the site means you accept the current version.</p>
    </LegalPage>
  );
}

function CookiesPolicy() {
  return (
    <LegalPage title="Cookies Policy" updated="September 2026">
      <p>We use a small number of browser storage items to make the site work:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Essential (always on):</strong> keeps you signed in between page loads, and remembers your cookie consent choice.</li>
        <li><strong>Functional (optional):</strong> remembers your reminder preferences for a smoother experience.</li>
      </ul>
      <p>We don't use third-party advertising or cross-site tracking cookies. You can clear cookies anytime in your browser settings, though you'll need to sign in again afterward.</p>
    </LegalPage>
  );
}

function RefundPolicy() {
  return (
    <LegalPage title="Refund Policy" updated="September 2026">
      <p>If you're not able to access a course you paid for due to a technical issue on our end, contact us via the Community page and we'll fix access or refund you in full.</p>
      <p>Because course content is delivered digitally and immediately accessible after payment, refund requests made after you've started a course are reviewed case by case rather than guaranteed. If something about a course doesn't match its description, tell us — we'd rather make it right than keep a payment that wasn't earned.</p>
    </LegalPage>
  );
}

// Lightweight toast system: a single global queue rendered at the App root,
// with a `toast(message, type)` function components call directly instead
// of the browser's native alert() (which blocks the page and looks jarring
// next to the rest of the design).
let toastQueueSetter = null;
function toast(message, type = "error") {
  if (toastQueueSetter) toastQueueSetter((q) => [...q, { id: Date.now() + Math.random(), message, type }]);
}

// Reports uncaught errors to log-client-error so admin can actually see when
// something breaks for a student, instead of finding out only if they
// happen to complain. Fire-and-forget — logging failure should never itself
// break the page.
let currentUserIdForLogging = null;
function reportClientError(message, stack) {
  fetch(`${SUPABASE_URL}/functions/v1/log-client-error`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ message, stack, url: window.location.href, user_id: currentUserIdForLogging, user_agent: navigator.userAgent }),
  }).catch(() => {});
}
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => reportClientError(e.message, e.error?.stack));
  window.addEventListener("unhandledrejection", (e) => reportClientError(String(e.reason?.message || e.reason), e.reason?.stack));
}

function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => { toastQueueSetter = setItems; return () => { toastQueueSetter = null; }; }, []);
  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => setItems((q) => q.slice(1)), 4500);
    return () => clearTimeout(t);
  }, [items]);
  return (
    <div className="fixed top-5 right-5 z-[60] flex flex-col gap-2 max-w-sm">
      {items.map((t) => (
        <div key={t.id} className="px-4 py-3 rounded-lg text-sm shadow-lg flex items-start gap-2" style={{ background: t.type === "success" ? "#1E9E5C" : "#c0392b", color: "#fff" }}>
          {t.type === "success" ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /> : <X size={16} className="flex-shrink-0 mt-0.5" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

function CookieConsent() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);
  const choose = (value) => {
    localStorage.setItem("cookie-consent", value);
    setVisible(false);
  };
  if (!visible) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ background: "#0A1A38", boxShadow: "0 -4px 20px #0000002a" }}>
      <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-4 justify-between">
        <p className="text-sm flex-1 min-w-[240px]" style={{ color: "#C7D2E8" }}>
          We use essential cookies to keep you signed in, and optional ones to remember your reminder preferences. No advertising or tracking cookies.
        </p>
        <div className="flex gap-2">
          <button onClick={() => choose("essential-only")} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#ffffff33", color: "#fff" }}>Essential only</button>
          <button onClick={() => choose("all")} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>Accept all</button>
        </div>
      </div>
    </div>
  );
}


function AdminErrors({ session }) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/rest/v1/client_errors", { token: session.access_token, params: { select: "*", order: "created_at.desc", limit: "50" } })
      .then(setErrors).finally(() => setLoading(false));
  }, [session]);

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#0A1A3899" }}>Most recent 50 uncaught errors reported by real visitors' browsers.</p>
      {loading ? <Loader2 size={16} className="animate-spin" /> : errors.length === 0 ? (
        <p className="text-sm" style={{ color: "#0A1A3899" }}>No errors logged — good sign.</p>
      ) : (
        <div className="space-y-2">
          {errors.map((e) => (
            <div key={e.id} className="p-3 rounded-xl border text-sm" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div className="font-medium" style={{ color: "#c0392b" }}>{e.message}</div>
              <div className="text-xs mt-1" style={{ color: "#0A1A3888" }}>{e.url} · {new Date(e.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminOverview({ session, stats }) {
  const cards = [
    ["Students", stats.students, Users],
    ["Active enrollments", stats.enrollments, Award],
    ["Pending refunds", stats.pendingRefunds, RotateCcw],
    ["Unanswered community Qs", stats.unansweredCommunity, HelpCircle],
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {cards.map(([label, value, Icon]) => (
        <div key={label} className="p-4 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
          <Icon size={16} color="#1E56A0" className="mb-2" />
          <div className="font-bold text-2xl" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>{value ?? "—"}</div>
          <div className="text-xs" style={{ color: "#0A1A3888" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function AdminAnnouncements({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api("/rest/v1/announcements", { token: session.access_token, params: { select: "*", order: "created_at.desc" } })
      .then(setItems).finally(() => setLoading(false));
  }, [session]);
  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    try {
      await api("/rest/v1/announcements", { method: "POST", token: session.access_token, body: { title, body, created_by: session.user.id } });
      setTitle(""); setBody(""); load();
    } finally {
      setPosting(false);
    }
  };

  const toggle = async (id, is_published) => {
    await api(`/rest/v1/announcements?id=eq.${id}`, { method: "PATCH", token: session.access_token, body: { is_published: !is_published } });
    load();
  };

  return (
    <div>
      <div className="p-5 rounded-2xl border mb-6" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
        <div className="font-semibold text-sm mb-3" style={{ color: "#0A1A38" }}>Post an update</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full mb-2 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's the update?" rows={3} className="w-full mb-2 px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "#0A1A3822" }} />
        <button onClick={post} disabled={posting} className="px-5 py-2.5 rounded-lg font-medium text-white text-sm flex items-center gap-2" style={{ background: "#0A1A38" }}>
          {posting && <Loader2 size={14} className="animate-spin" />} Publish update
        </button>
        <p className="text-xs mt-2" style={{ color: "#0A1A3866" }}>Published updates show on the homepage for everyone, including visitors who haven't signed up.</p>
      </div>
      {loading ? <Loader2 size={16} className="animate-spin" /> : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="p-4 rounded-xl border flex items-start justify-between gap-3" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: "#0A1A38" }}>{a.title}</div>
                <div className="text-sm mt-1" style={{ color: "#0A1A3899" }}>{a.body}</div>
              </div>
              <button onClick={() => toggle(a.id, a.is_published)} className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: a.is_published ? "#1E9E5C1A" : "#0A1A380D", color: a.is_published ? "#1E9E5C" : "#0A1A3888" }}>
                {a.is_published ? "Published" : "Hidden"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminQA({ session }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [sending, setSending] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api("/rest/v1/qa_messages", {
      token: session.access_token,
      params: { select: "*,profiles(full_name,role),lessons(title,courses(title))", order: "created_at.desc", limit: "50" },
    }).then(setMessages).finally(() => setLoading(false));
  }, [session]);
  useEffect(() => { load(); }, [load]);

  const reply = async (lessonId, key) => {
    if (!drafts[key]?.trim()) return;
    setSending(key);
    try {
      await api("/rest/v1/qa_messages", { method: "POST", token: session.access_token, body: { lesson_id: lessonId, author_id: session.user.id, body: drafts[key] } });
      setDrafts((d) => ({ ...d, [key]: "" }));
      load();
    } finally {
      setSending(null);
    }
  };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#0A1A3899" }}>Most recent 50 questions across every course.</p>
      {loading ? <Loader2 size={16} className="animate-spin" /> : messages.length === 0 ? (
        <p className="text-sm" style={{ color: "#0A1A3899" }}>No questions yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const key = m.id;
            return (
              <div key={m.id} className="p-4 rounded-xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: m.profiles?.role === "student" ? "#0A1A38" : "#1E56A0" }}>{m.profiles?.full_name || "Student"}</span>
                  <span className="text-xs" style={{ color: "#0A1A3866" }}>on {m.lessons?.courses?.title} — {m.lessons?.title}</span>
                </div>
                <p className="text-sm mb-2" style={{ color: "#0A1A38cc" }}>{m.body}</p>
                <div className="flex gap-2">
                  <input value={drafts[key] || ""} onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))} placeholder="Reply as instructor…" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
                  <button onClick={() => reply(m.lesson_id, key)} disabled={sending === key} className="px-4 py-2 rounded-lg text-white text-sm flex items-center gap-1.5" style={{ background: "#1E56A0" }}>
                    {sending === key && <Loader2 size={13} className="animate-spin" />} Reply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminStudents({ session }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadTarget, setUploadTarget] = useState(null);

  useEffect(() => {
    api("/rest/v1/rpc/list_students_for_staff", { method: "POST", token: session.access_token, body: {} })
      .then(setStudents).finally(() => setLoading(false));
  }, [session]);

  const filtered = students.filter((s) =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students by name or email…" className="w-full mb-4 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
      {loading ? <Loader2 size={16} className="animate-spin" /> : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div>
                <div className="font-medium text-sm" style={{ color: "#0A1A38" }}>{s.full_name || "(no name)"} <span className="text-xs font-normal capitalize" style={{ color: s.role === "student" ? "#0A1A3866" : "#1E56A0" }}>· {s.role}</span></div>
                <div className="text-xs" style={{ color: "#0A1A3888" }}>{s.email}{s.phone ? ` · ${s.phone}` : ""}</div>
              </div>
              <button onClick={() => setUploadTarget(s)} className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5" style={{ background: "#1E56A00f", color: "#1E56A0" }}>
                <Paperclip size={12} /> Send file
              </button>
            </div>
          ))}
        </div>
      )}
      {uploadTarget && <StudentFileUploadModal student={uploadTarget} session={session} onClose={() => setUploadTarget(null)} />}
    </div>
  );
}

function StudentFileUploadModal({ student, session, onClose }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!file || !title.trim()) { setErr("Add a title and choose a file."); return; }
    setUploading(true);
    setErr("");
    try {
      const path = `${student.id}/${Date.now()}-${file.name}`;
      await uploadFile("student-files", path, file, session.access_token);
      await api("/rest/v1/student_files", { method: "POST", token: session.access_token, body: { student_id: student.id, title, file_url: path, uploaded_by: session.user.id } });
      setDone(true);
    } catch (e) {
      setErr(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0A1A38cc", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-7" style={{ background: "#fff" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg" style={{ fontFamily: "'Oswald',sans-serif", color: "#0A1A38" }}>Send file to {student.full_name}</h3>
          <button onClick={onClose} aria-label="Close dialog"><X size={18} color="#0A1A3899" /></button>
        </div>
        {done ? (
          <div className="py-4 text-center">
            <CheckCircle2 size={36} color="#1E9E5C" className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#0A1A38" }}>Sent — it'll appear on their dashboard.</p>
            <button onClick={onClose} className="mt-4 px-5 py-2.5 rounded-lg font-medium text-white text-sm" style={{ background: "#0A1A38" }}>Close</button>
          </div>
        ) : (
          <>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this file? (e.g. 'Corrected floor plan')" className="w-full mb-3 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
            <label className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border cursor-pointer mb-3" style={{ borderColor: "#0A1A3822", color: "#0A1A3899" }}>
              <Paperclip size={15} /> {file ? file.name : "Choose a file"}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {err && <p className="text-xs mb-2" style={{ color: "#c0392b" }}>{err}</p>}
            <button onClick={submit} disabled={uploading} className="w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
              {uploading && <Loader2 size={16} className="animate-spin" />} Send to student
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AdminCourses({ session, courses }) {
  const [selected, setSelected] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVideo, setNewVideo] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editVideoFile, setEditVideoFile] = useState(null);
  const [viewCounts, setViewCounts] = useState({});

  const loadLessons = useCallback((course) => {
    setSelected(course);
    setLoading(true);
    Promise.all([
      api("/rest/v1/lessons", { token: session.access_token, params: { course_id: `eq.${course.id}`, order: "position.asc", select: "*" } }),
      api("/rest/v1/rpc/lesson_view_counts", { method: "POST", token: session.access_token, body: { course_id_param: course.id } }).catch(() => []),
    ]).then(([ls, views]) => {
      setLessons(ls);
      const map = {};
      (views || []).forEach((v) => { map[v.lesson_id] = v; });
      setViewCounts(map);
    }).finally(() => setLoading(false));
  }, [session]);

  const uploadVideoAndGetUrl = async (file, courseId) => {
    const path = `${courseId}/${Date.now()}-${file.name}`;
    await uploadFile("course-videos", path, file, session.access_token);
    return publicFileUrl("course-videos", path);
  };

  const addLesson = async () => {
    if (!newTitle.trim() || !selected) return;
    setAdding(true);
    try {
      let video_url = null;
      if (newVideo) video_url = await uploadVideoAndGetUrl(newVideo, selected.id);
      await api("/rest/v1/lessons", { method: "POST", token: session.access_token, body: { course_id: selected.id, title: newTitle, position: lessons.length + 1, video_url } });
      setNewTitle(""); setNewVideo(null);
      loadLessons(selected);
    } finally {
      setAdding(false);
    }
  };

  const updateLessonVideo = async (lessonId) => {
    if (!editVideoFile || !selected) return;
    const url = await uploadVideoAndGetUrl(editVideoFile, selected.id);
    await api(`/rest/v1/lessons?id=eq.${lessonId}`, { method: "PATCH", token: session.access_token, body: { video_url: url } });
    setEditingId(null); setEditVideoFile(null);
    loadLessons(selected);
  };

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      <div className="space-y-1">
        {courses.map((c) => (
          <button key={c.id} onClick={() => loadLessons(c)} className="w-full text-left px-3 py-2 rounded-lg text-sm"
            style={{ background: selected?.id === c.id ? "#1E56A014" : "transparent", color: "#0A1A38", fontWeight: selected?.id === c.id ? 600 : 400 }}>
            {c.title}
          </button>
        ))}
      </div>
      <div>
        {!selected ? (
          <p className="text-sm" style={{ color: "#0A1A3899" }}>Pick a course to manage its lessons.</p>
        ) : loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <div className="p-4 rounded-xl border mb-4" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div className="font-semibold text-sm mb-2" style={{ color: "#0A1A38" }}>Add a lesson to {selected.title}</div>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Lesson title" className="w-full mb-2 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
              <label className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border cursor-pointer mb-2" style={{ borderColor: "#0A1A3822", color: "#0A1A3899" }}>
                <Paperclip size={15} /> {newVideo ? newVideo.name : "Attach video (optional, can add later)"}
                <input type="file" accept="video/*" className="hidden" onChange={(e) => setNewVideo(e.target.files?.[0] || null)} />
              </label>
              <button onClick={addLesson} disabled={adding} className="px-4 py-2 rounded-lg text-white text-sm flex items-center gap-1.5" style={{ background: "#0A1A38" }}>
                {adding && <Loader2 size={13} className="animate-spin" />} Add lesson
              </button>
            </div>
            <div className="space-y-2">
              {lessons.map((l) => (
                <div key={l.id} className="p-3 rounded-xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm" style={{ color: "#0A1A38" }}>{l.position}. {l.title}</div>
                    {l.video_url ? <CheckCircle2 size={14} color="#1E9E5C" /> : <Circle size={14} color="#0A1A3855" />}
                  </div>
                  <div className="text-xs mt-1 flex items-center gap-1.5" style={{ color: "#0A1A3888" }}>
                    <Eye size={11} />
                    {viewCounts[l.id] ? `${viewCounts[l.id].view_count} views · ${viewCounts[l.id].unique_students} students` : "No views yet"}
                  </div>
                  {editingId === l.id ? (
                    <div className="mt-2 flex gap-2 items-center">
                      <input type="file" accept="video/*" onChange={(e) => setEditVideoFile(e.target.files?.[0] || null)} className="text-xs flex-1" />
                      <button onClick={() => updateLessonVideo(l.id)} className="text-xs px-3 py-1.5 rounded-full text-white" style={{ background: "#1E56A0" }}>Save</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingId(l.id)} className="text-xs mt-1" style={{ color: "#1E56A0" }}>{l.video_url ? "Replace video" : "Add video"}</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminEnrollments({ session, courses }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [activating, setActivating] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api("/rest/v1/enrollments", {
      token: session.access_token,
      params: { select: "*,profiles!enrollments_student_id_fkey(full_name)", order: "enrolled_at.desc" },
    }).then((data) => setEnrollments(data)).finally(() => setLoading(false));
  }, [session]);
  useEffect(() => { load(); }, [load]);

  const activate = async (id) => {
    setActivating(id);
    try {
      await api(`/rest/v1/enrollments?id=eq.${id}`, { method: "PATCH", token: session.access_token, body: { status: "active" } });
      load();
    } finally {
      setActivating(null);
    }
  };

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title || "Unknown course";
  const filtered = filter === "all" ? enrollments : enrollments.filter((e) => e.status === filter);
  const sourceColor = { selar: "#1E9E5C", paystack: "#0A1A38", flutterwave: "#3DA5FF", manual: "#0A1A3888" };

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "#0A1A3899" }}>Selar payments don't have an automatic webhook — activate them here once you've confirmed payment on Selar's dashboard.</p>
      <div className="flex gap-2 mb-6">
        {["pending", "active", "revoked", "all"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
            style={{ background: filter === f ? "#0A1A38" : "#0A1A380D", color: filter === f ? "#fff" : "#0A1A38" }}>
            {f} {f !== "all" && `(${enrollments.filter((e) => e.status === f).length})`}
          </button>
        ))}
      </div>
      {loading ? <Loader2 size={16} className="animate-spin" /> : filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "#0A1A3899" }}>No {filter !== "all" ? filter : ""} enrollments.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} className="p-4 rounded-xl border flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
              <div>
                <div className="font-medium text-sm" style={{ color: "#0A1A38" }}>{e.profiles?.full_name || "Student"} — {courseTitle(e.course_id)}</div>
                <div className="text-xs mt-0.5" style={{ color: sourceColor[e.payment_source] || "#0A1A3888" }}>{e.payment_source} · {new Date(e.enrolled_at).toLocaleDateString()}</div>
              </div>
              {e.status === "pending" ? (
                <button onClick={() => activate(e.id)} disabled={activating === e.id} className="px-4 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5" style={{ background: "#1E9E5C" }}>
                  {activating === e.id && <Loader2 size={12} className="animate-spin" />} Activate
                </button>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize" style={{ background: e.status === "active" ? "#1E9E5C1A" : "#c0392b1A", color: e.status === "active" ? "#1E9E5C" : "#c0392b" }}>{e.status}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminHub({ session, courses }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});

  useEffect(() => {
    Promise.all([
      api("/rest/v1/rpc/list_students_for_staff", { method: "POST", token: session.access_token, body: {} }),
      api("/rest/v1/enrollments", { token: session.access_token, params: { status: "eq.active", select: "id" } }),
      api("/rest/v1/refund_requests", { token: session.access_token, params: { status: "eq.pending", select: "id" } }),
      api("/rest/v1/community_questions", { token: session.access_token, params: { answer: "is.null", select: "id" } }),
    ]).then(([students, enrollments, refunds, community]) => {
      setStats({ students: students.length, enrollments: enrollments.length, pendingRefunds: refunds.length, unansweredCommunity: community.length });
    }).catch(() => {});
  }, [session]);

  const tabs = [
    ["overview", "Overview"],
    ["announcements", "Updates"],
    ["qa", "Course Q&A"],
    ["students", "Students"],
    ["courses", "Courses"],
    ["refunds", "Refunds"],
    ["enrollments", "Enrollments"],
    ["errors", "Errors"],
  ];

  return (
    <div style={{ background: "#F7F8FA", minHeight: "70vh" }}>
      <div className="max-w-6xl mx-auto px-5 py-14">
        <TitleBlock label="ADMIN" code="CONTROL PANEL" />
        <h2 className="mt-4 mb-6" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>Admin</h2>
        {tab === "overview" && <AdminOverview session={session} stats={stats} />}
        <div className="flex gap-1 mb-6 flex-wrap">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: tab === id ? "#0A1A38" : "#0A1A380D", color: tab === id ? "#fff" : "#0A1A38" }}>{label}</button>
          ))}
        </div>
        {tab === "announcements" && <AdminAnnouncements session={session} />}
        {tab === "qa" && <AdminQA session={session} />}
        {tab === "students" && <AdminStudents session={session} />}
        {tab === "courses" && <AdminCourses session={session} courses={courses} />}
        {tab === "refunds" && <AdminRefunds session={session} />}
        {tab === "enrollments" && <AdminEnrollments session={session} courses={courses} />}
        {tab === "errors" && <AdminErrors session={session} />}
      </div>
    </div>
  );
}

function AdminRefunds({ session }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);
  const [attachmentUrls, setAttachmentUrls] = useState({});
  const [filter, setFilter] = useState("pending");

  const load = useCallback(() => {
    setLoading(true);
    api("/rest/v1/refund_requests", {
      token: session.access_token,
      params: { select: "*,profiles!refund_requests_student_id_fkey(full_name),courses(title,code)", order: "created_at.desc" },
    })
      .then((data) => { setRequests(data); setError(null); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { load(); }, [load]);

  // Resolve signed URLs for private attachment paths on demand, per request
  const loadAttachments = async (req) => {
    if (attachmentUrls[req.id] || !req.attachment_urls?.length) return;
    const urls = await Promise.all(req.attachment_urls.map((p) => signedFileUrl("refund-attachments", p, session.access_token)));
    setAttachmentUrls((m) => ({ ...m, [req.id]: urls.filter(Boolean) }));
  };

  const updateStatus = async (id, status) => {
    setSaving(id);
    try {
      await api(`/rest/v1/refund_requests?id=eq.${id}`, {
        method: "PATCH", token: session.access_token,
        body: { status, admin_note: notes[id] || null, resolved_by: session.user.id, resolved_at: new Date().toISOString() },
      });
      await load();
    } finally {
      setSaving(null);
    }
  };

  const statusColor = { pending: "#FF8A3D", approved: "#3DA5FF", rejected: "#c0392b", refunded: "#1E9E5C" };
  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div style={{ background: "#F7F8FA", minHeight: "70vh" }}>
      <div className="max-w-4xl mx-auto px-5 py-14">
        <TitleBlock label="ADMIN" code="REFUND REQUESTS" />
        <h2 className="mt-4 mb-6" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>Refund requests</h2>

        <div className="flex gap-2 mb-6">
          {["pending", "approved", "rejected", "refunded", "all"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
              style={{ background: filter === f ? "#0A1A38" : "#0A1A380D", color: filter === f ? "#fff" : "#0A1A38" }}>
              {f} {f !== "all" && `(${requests.filter((r) => r.status === f).length})`}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 p-4 rounded-md text-sm" style={{ background: "#c0392b1A", color: "#c0392b" }}>Couldn't load requests: {error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading requests…</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm" style={{ color: "#0A1A3899" }}>No {filter !== "all" ? filter : ""} refund requests.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                  <div>
                    <span className="font-semibold text-sm" style={{ color: "#0A1A38" }}>{r.profiles?.full_name || "Student"}</span>
                    <span className="text-sm mx-1" style={{ color: "#0A1A3866" }}>—</span>
                    <span className="text-sm" style={{ color: "#0A1A3899" }}>{r.courses?.title}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium capitalize" style={{ background: `${statusColor[r.status]}1A`, color: statusColor[r.status] }}>{r.status}</span>
                </div>
                <p className="text-sm mb-3" style={{ color: "#0A1A38cc" }}>{r.reason}</p>

                {r.attachment_urls?.length > 0 && (
                  <div className="mb-3">
                    <button onClick={() => loadAttachments(r)} className="text-xs font-medium flex items-center gap-1.5" style={{ color: "#1E56A0" }}>
                      <Paperclip size={12} /> {attachmentUrls[r.id] ? `${r.attachment_urls.length} attachment(s)` : "View attachments"}
                    </button>
                    {attachmentUrls[r.id] && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {attachmentUrls[r.id].map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`Attachment ${i + 1}`} loading="lazy" className="w-20 h-20 object-cover rounded-lg border" style={{ borderColor: "#0A1A3814" }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {r.admin_note && (
                  <div className="text-xs mb-3 pl-3 border-l-2" style={{ borderColor: "#0A1A3822", color: "#0A1A3888" }}>Note: {r.admin_note}</div>
                )}

                {r.status === "pending" && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "#0A1A3814" }}>
                    <input
                      value={notes[r.id] || ""}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                      placeholder="Optional note (visible to you only)"
                      className="w-full mb-2 px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: "#0A1A3822" }}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateStatus(r.id, "approved")} disabled={saving === r.id} className="px-4 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-1.5" style={{ background: "#3DA5FF" }}>
                        {saving === r.id && <Loader2 size={12} className="animate-spin" />} Approve
                      </button>
                      <button onClick={() => updateStatus(r.id, "refunded")} disabled={saving === r.id} className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ background: "#1E9E5C" }}>
                        Mark refunded
                      </button>
                      <button onClick={() => updateStatus(r.id, "rejected")} disabled={saving === r.id} className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ background: "#c0392b" }}>
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


function Community({ questions, loading, error, onAsk, asking, onOpenChat, session, onAnswer, onDelete }) {
  const isAdmin = session?.profile?.role === "admin" || session?.profile?.role === "instructor";
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [answering, setAnswering] = useState(null);

  const submitAnswer = async (id) => {
    if (!answerDrafts[id]?.trim()) return;
    setAnswering(id);
    try {
      await onAnswer(id, answerDrafts[id]);
      setAnswerDrafts((d) => ({ ...d, [id]: "" }));
    } finally {
      setAnswering(null);
    }
  };

  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [posting, setPosting] = useState(false);
  const [postErr, setPostErr] = useState("");
  const [file, setFile] = useState(null);

  const submit = async () => {
    if (!name.trim() || !question.trim()) return;
    setPosting(true);
    setPostErr("");
    try {
      let attachmentUrl = null;
      if (file) {
        const path = `${Date.now()}-${file.name}`;
        await uploadFile("community-attachments", path, file, null);
        attachmentUrl = publicFileUrl("community-attachments", path);
      }
      await onAsk(name, question, attachmentUrl);
      setQuestion("");
      setFile(null);
    } catch (e) {
      setPostErr(e.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ background: "#F7F8FA" }}>
      <div className="max-w-4xl mx-auto px-5 py-14">
        <TitleBlock label="COMMUNITY" code="ASK US" />
        <h2 className="mt-4 mb-3" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "2.2rem", color: "#0A1A38" }}>Have a question before you enroll?</h2>
        <p className="mb-8 text-sm max-w-lg" style={{ color: "#0A1A3899" }}>
          Post it here — anyone considering the academy can see the answers. Not finding what you need? Our AI support agent (bottom-right, or the button below) can help instantly.
        </p>

        <button onClick={onOpenChat} className="mb-8 inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm text-white" style={{ background: "linear-gradient(90deg,#1E56A0,#3DA5FF)" }}>
          <Bot size={16} /> Ask the AI support agent instead
        </button>

        <div className="p-5 rounded-2xl border mb-10" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: "#0A1A38" }}>
            <HelpCircle size={17} /> <span className="font-medium text-sm">Ask a new question</span>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full mb-2 px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#0A1A3822" }} />
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do you want to know?" rows={3} className="w-full mb-2 px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "#0A1A3822" }} />
          <label className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border cursor-pointer mb-2" style={{ borderColor: "#0A1A3822", color: "#0A1A3899" }}>
            <Paperclip size={15} />
            {file ? file.name : "Attach a screenshot (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          {postErr && <p className="text-xs mb-2" style={{ color: "#c0392b" }}>{postErr}</p>}
          <button onClick={submit} disabled={posting} className="px-5 py-2.5 rounded-lg font-medium text-white text-sm flex items-center gap-2" style={{ background: "#0A1A38" }}>
            {posting && <Loader2 size={14} className="animate-spin" />} Post question
          </button>
        </div>

        {error && <div className="mb-6 p-4 rounded-md text-sm" style={{ background: "#c0392b1A", color: "#c0392b" }}>Couldn't load questions: {error}</div>}
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#0A1A38" }}><Loader2 size={16} className="animate-spin" /> Loading questions…</div>
        ) : questions.length === 0 ? (
          <p className="text-sm" style={{ color: "#0A1A3899" }}>No questions yet — be the first to ask.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <Reveal key={q.id}>
                <div className="p-5 rounded-2xl border" style={{ borderColor: "#0A1A3814", background: "#fff" }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: "#0A1A38" }}>{q.name}</span>
                      <span className="text-xs" style={{ color: "#0A1A3866" }}>asked</span>
                    </div>
                    {isAdmin && (
                      <button onClick={() => onDelete(q.id)} className="text-xs" style={{ color: "#c0392b" }}>Remove</button>
                    )}
                  </div>
                  <p className="text-sm mb-3" style={{ color: "#0A1A38cc" }}>{q.question}</p>
                  {q.attachment_url && (
                    <img src={q.attachment_url} alt="Attachment from question" loading="lazy" className="mb-3 rounded-lg max-h-48 border" style={{ borderColor: "#0A1A3814" }} />
                  )}
                  {q.answer ? (
                    <div className="pl-3 border-l-2 text-sm" style={{ borderColor: "#3DA5FF", color: "#0A1A38" }}>
                      <span className="font-semibold" style={{ color: "#1E56A0" }}>Gsol Design Academy: </span>{q.answer}
                    </div>
                  ) : isAdmin ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        value={answerDrafts[q.id] || ""}
                        onChange={(e) => setAnswerDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                        placeholder="Write a reply…"
                        className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: "#0A1A3822" }}
                      />
                      <button onClick={() => submitAnswer(q.id)} disabled={answering === q.id} className="px-4 py-2 rounded-lg text-white text-sm flex items-center gap-1.5" style={{ background: "#1E56A0" }}>
                        {answering === q.id && <Loader2 size={13} className="animate-spin" />} Reply
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs italic" style={{ color: "#0A1A3866" }}>Awaiting a reply from the team.</div>
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
                <div className="premium-card p-6 rounded-2xl border flex flex-col h-full" style={{ borderColor: "#0A1A3814", background: "#fff", boxShadow: "0 4px 20px #0A1A380a" }}>
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
                    Get this ebook via Selar
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
  useEffect(() => { currentUserIdForLogging = session?.user?.id || null; }, [session]);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [ebooks, setEbooks] = useState([]);
  const [ebooksLoading, setEbooksLoading] = useState(true);
  const [ebooksError, setEbooksError] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);
  const [bundlesError, setBundlesError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [resetToken, setResetToken] = useState(null);

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

  useEffect(() => {
    api("/rest/v1/bundles", { params: { select: "*", is_published: "eq.true", order: "pick_count.asc" } })
      .then((data) => { setBundles(data); setBundlesError(null); })
      .catch((e) => { setBundles([]); setBundlesError(e.message); })
      .finally(() => setBundlesLoading(false));
  }, []);

  const loadQuestions = useCallback(() => {
    setQuestionsLoading(true);
    api("/rest/v1/community_questions", { params: { select: "*", order: "created_at.desc" } })
      .then((data) => { setQuestions(data); setQuestionsError(null); })
      .catch((e) => { setQuestions([]); setQuestionsError(e.message); })
      .finally(() => setQuestionsLoading(false));
  }, []);
  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const askQuestion = async (name, question, attachmentUrl) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/post-community-question`, {
      method: "POST",
      headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ name, question, attachment_url: attachmentUrl || null }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't post your question");
    loadQuestions();
  };

  const answerQuestion = async (id, answer) => {
    await api(`/rest/v1/community_questions?id=eq.${id}`, {
      method: "PATCH",
      token: session.access_token,
      body: { answer, answered_by: session.user.id, answered_at: new Date().toISOString() },
    });
    loadQuestions();
  };

  const deleteQuestion = async (id) => {
    if (!confirm("Remove this question from the community board?")) return;
    await api(`/rest/v1/community_questions?id=eq.${id}`, { method: "DELETE", token: session.access_token });
    loadQuestions();
  };

  const loadEnrollments = useCallback(async (token, uid) => {
    setEnrollLoading(true);
    const data = await api("/rest/v1/enrollments", { token, params: { student_id: `eq.${uid}`, select: "*" } }).catch(() => []);
    setEnrollments(data);
    setEnrollLoading(false);
  }, []);

  const onAuthed = async (data) => {
    const profile = await api("/rest/v1/profiles", { token: data.access_token, params: { id: `eq.${data.user.id}`, select: "role,full_name" } }).catch(() => []);
    const fullSession = { ...data, profile: profile?.[0] };
    setSession(fullSession);
    saveSessionToStorage(fullSession);
    setAuthOpen(false);
    loadEnrollments(data.access_token, data.user.id);
    setPage("dashboard");
  };

  // Restore a session from localStorage on load (survives refresh/reopen),
  // refreshing the access token first since it may have expired while the
  // tab was closed.
  useEffect(() => {
    const stored = loadSessionFromStorage();
    if (!stored?.refresh_token) return;
    refreshAccessToken(stored.refresh_token)
      .then(async (data) => {
        const profile = await api("/rest/v1/profiles", { token: data.access_token, params: { id: `eq.${data.user.id}`, select: "role,full_name" } }).catch(() => []);
        const fullSession = { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user, profile: profile?.[0] };
        setSession(fullSession);
        saveSessionToStorage(fullSession);
        loadEnrollments(data.access_token, data.user.id);
      })
      .catch(() => clearSessionFromStorage());
  }, [loadEnrollments]);

  // Keep the access token fresh for long study sessions — refresh well
  // before the ~1hr expiry rather than waiting for API calls to start failing.
  useEffect(() => {
    if (!session?.refresh_token) return;
    const interval = setInterval(() => {
      refreshAccessToken(session.refresh_token)
        .then((data) => {
          setSession((s) => {
            const next = { ...s, access_token: data.access_token, refresh_token: data.refresh_token };
            saveSessionToStorage(next);
            return next;
          });
        })
        .catch(() => {}); // next call will naturally fail and prompt re-login if this keeps failing
    }, 45 * 60 * 1000); // every 45 minutes
    return () => clearInterval(interval);
  }, [session?.refresh_token]);

  // Google sign-in redirects back with the session in the URL hash
  // (#access_token=...&refresh_token=...); password-reset links use the same
  // hash shape but include type=recovery, which needs a "set new password"
  // screen instead of silently signing the person in.
  useEffect(() => {
    if (!window.location.hash.includes("access_token")) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");
    if (!access_token) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (type === "recovery") {
      setResetToken(access_token);
      return;
    }

    fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${access_token}` } })
      .then((r) => r.json())
      .then(async (user) => {
        // Ensure a profile row exists (the on_auth_user_created DB trigger
        // normally already created it with the correct role via the admin
        // allowlist). Deliberately omit `role` here — PostgREST's upsert only
        // touches columns present in the body, so this can never clobber an
        // existing admin/instructor role on repeat Google sign-ins.
        await api("/rest/v1/profiles", {
          method: "POST", token: access_token, upsert: true,
          body: { id: user.id, full_name: user.user_metadata?.full_name || user.user_metadata?.name || "" },
        }).catch(() => {});
        onAuthed({ access_token, refresh_token, user });
      });
  }, []);

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

  const signOut = () => { setSession(null); setEnrollments([]); setPage("home"); clearSessionFromStorage(); };

  const checkout = async (courseId, provider) => {
    setCheckingOut(courseId);
    try {
      const { checkout_url } = await startCheckout(session.access_token, courseId, provider);
      window.location.href = checkout_url;
    } catch (e) {
      toast("Could not start checkout: " + e.message);
      setCheckingOut(null);
    }
  };

  // Selar has no webhook wired in yet, so this just records intent (a
  // pending enrollment, visible to admin) and sends the student to Selar's
  // own hosted checkout. Admin activates access manually once payment is
  // confirmed on Selar's side, the same way it worked before this site existed.
  const selarCheckout = async (course) => {
    try {
      await api("/rest/v1/enrollments", { method: "POST", token: session.access_token, body: { student_id: session.user.id, course_id: course.id, payment_source: "selar", status: "pending" } }).catch(() => {});
    } finally {
      window.open(course.selar_link, "_blank", "noopener,noreferrer");
    }
  };

  const openCourse = (course) => { setActiveCourse(course); setPage("player"); };
  const viewCourseDetail = (course) => { setActiveCourse(course); setPage("course-detail"); };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh" }}>
      <style>{GLOBAL_STYLE}</style>
      <SmoothScroll />
      <Nav page={page} setPage={setPage} session={session} setAuthOpen={setAuthOpen} signOut={signOut} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthed={onAuthed} />}
      {resetToken && <ResetPasswordModal token={resetToken} onDone={() => { setResetToken(null); setAuthOpen(true); }} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {page === "home" && <Home setPage={setPage} courses={courses} loading={coursesLoading} />}
          {page === "courses" && <Courses courses={courses} loading={coursesLoading} error={coursesError} session={session} checkout={checkout} checkingOut={checkingOut} selarCheckout={selarCheckout} onSelectCourse={viewCourseDetail} />}
          {page === "course-detail" && <CourseDetail course={activeCourse} session={session} checkout={checkout} checkingOut={checkingOut} selarCheckout={selarCheckout} onBack={() => setPage("courses")} />}
          {page === "bundles" && <Bundles bundles={bundles} loading={bundlesLoading} error={bundlesError} session={session} allCourses={courses} />}
          {page === "ebooks" && <Ebooks ebooks={ebooks} loading={ebooksLoading} error={ebooksError} />}
          {page === "community" && <Community questions={questions} loading={questionsLoading} error={questionsError} onAsk={askQuestion} onOpenChat={() => setChatOpen(true)} session={session} onAnswer={answerQuestion} onDelete={deleteQuestion} />}
          {page === "admin" && session && <AdminHub session={session} courses={courses} />}
          {page === "dashboard" && session && <Dashboard session={session} courses={courses} enrollments={enrollments} loading={enrollLoading} openCourse={openCourse} />}
          {page === "player" && session && <Player course={activeCourse} session={session} token={session.access_token} />}
          {page === "privacy" && <PrivacyPolicy />}
          {page === "terms" && <TermsAndConditions />}
          {page === "cookies" && <CookiesPolicy />}
          {page === "refund" && <RefundPolicy />}
        </motion.div>
      </AnimatePresence>
      <footer style={{ background: "#0A1A38" }} className="pt-14 pb-8">
        <Reveal className="max-w-6xl mx-auto px-5">
          <Logo />
          <p className="mt-4 text-sm max-w-xs" style={{ color: "#8CA0C4" }}>Impacting innovation through building design — construction software training for architects, engineers, and builders.</p>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs" style={{ color: "#8CA0C4" }}>
            <button onClick={() => setPage("privacy")} className="hover:underline">Privacy Policy</button>
            <button onClick={() => setPage("terms")} className="hover:underline">Terms &amp; Conditions</button>
            <button onClick={() => setPage("cookies")} className="hover:underline">Cookies Policy</button>
            <button onClick={() => setPage("refund")} className="hover:underline">Refund Policy</button>
          </div>
          <div className="mt-6 pt-6 border-t text-xs text-center" style={{ borderColor: "#ffffff14", color: "#8CA0C4" }}>
            © {new Date().getFullYear()} Gsol Design Academy Ltd. All rights reserved.
          </div>
        </Reveal>
      </footer>
      <ChatWidget open={chatOpen} setOpen={setChatOpen} />
      <CookieConsent />
      <ToastHost />
    </div>
  );
}
