import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Circle, MessageSquare, PlayCircle, ChevronRight, Lock, ShieldCheck, TrendingUp, Send, Ruler, Menu, X, LogOut, Loader2 } from "lucide-react";

const SUPABASE_URL = "https://qiymevvbgpbeuyzafciu.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeW1ldnZiZ3BiZXV5emFmY2l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjU3NTgsImV4cCI6MjEwMjk0MTc1OH0.ZhoUN02CGW3RenUP5nHSlDzS_gXtnnItSVtZMyQ1aWg";
const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');`;

function isWeekendPromo() {
  // Promo: Friday 00:00 through Sunday 23:59:59 (local browser time, matches "Fri night to Sun night")
  const day = new Date().getDay(); // 0=Sun,5=Fri,6=Sat
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

function TitleBlock({ code, label }) {
  return (
    <div className="inline-flex items-center gap-2 border px-2 py-1" style={{ borderColor: "#1E3A5F33", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: 1, color: "#1E3A5F" }}>
      <span className="opacity-60">{label}</span>
      <span className="font-medium">{code}</span>
    </div>
  );
}

function DimensionBar({ pct }) {
  return (
    <div className="relative w-full">
      <div className="h-1.5 w-full rounded-full" style={{ background: "#1E3A5F1A" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#3D8BFF,#2E8B57)" }} />
      </div>
      <div className="flex justify-between mt-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#1E3A5F99" }}>
        <span>0</span><span>{pct}% COMPLETE</span><span>100</span>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-sm border-2 flex items-center justify-center" style={{ borderColor: "#3D8BFF" }}>
        <Ruler size={16} color="#3D8BFF" />
      </div>
      <span className="font-semibold tracking-tight text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#F5F3EC" }}>
        GSOL <span style={{ color: "#E8622C" }}>DESIGN</span> ACADEMY
      </span>
    </div>
  );
}

function Nav({ page, setPage, session, setAuthOpen, signOut, menuOpen, setMenuOpen }) {
  const items = session ? [["home", "Home"], ["courses", "Courses"], ["dashboard", "Dashboard"]] : [["home", "Home"], ["courses", "Courses"]];
  return (
    <header className="sticky top-0 z-40 border-b" style={{ background: "#0F1826", borderColor: "#ffffff14" }}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {items.map(([id, label]) => (
            <button key={id} onClick={() => setPage(id)} className="px-4 py-2 text-sm rounded-full"
              style={{ color: page === id ? "#0F1826" : "#F5F3ECcc", background: page === id ? "#3D8BFF" : "transparent" }}>{label}</button>
          ))}
          {session ? (
            <button onClick={signOut} className="ml-2 px-4 py-2 text-sm rounded-full flex items-center gap-1.5" style={{ color: "#F5F3ECcc" }}><LogOut size={14} /> Sign out</button>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="ml-2 px-4 py-2 text-sm rounded-full font-medium" style={{ background: "#E8622C", color: "#fff" }}>Sign in</button>
          )}
        </nav>
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-1 px-5 pb-4">
          {items.map(([id, label]) => (
            <button key={id} onClick={() => { setPage(id); setMenuOpen(false); }} className="text-left px-3 py-2 rounded-md" style={{ color: "#F5F3EC", background: page === id ? "#3D8BFF33" : "transparent" }}>{label}</button>
          ))}
          {session ? (
            <button onClick={signOut} className="text-left px-3 py-2 rounded-md" style={{ color: "#F5F3EC" }}>Sign out</button>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="text-left px-3 py-2 rounded-md" style={{ color: "#F5F3EC" }}>Sign in</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#0F182699" }}>
      <div className="w-full max-w-sm rounded-lg p-6" style={{ background: "#fff" }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </h3>
          <button onClick={onClose}><X size={18} color="#14181F99" /></button>
        </div>
        <div className="space-y-3">
          {mode === "signup" && (
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#1E3A5F22" }} />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#1E3A5F22" }} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#1E3A5F22" }} />
          {err && <p className="text-xs" style={{ color: "#c0392b" }}>{err}</p>}
          <button onClick={submit} disabled={loading} className="w-full py-2.5 rounded-md font-medium text-white flex items-center justify-center gap-2" style={{ background: "#E8622C" }}>
            {loading && <Loader2 size={16} className="animate-spin" />} {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </div>
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm w-full text-center" style={{ color: "#1E3A5F" }}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function Home({ setPage, courses, loading }) {
  const weekend = isWeekendPromo();
  return (
    <div style={{ background: "#F5F3EC" }}>
      <section className="border-b" style={{ borderColor: "#1E3A5F14" }}>
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-14">
          <TitleBlock label="PROJECT" code="GSOL-2026" />
          <h1 className="mt-5 leading-[1.05]" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(2.2rem,5vw,3.2rem)", color: "#14181F" }}>
            Draft your career in <span style={{ color: "#3D8BFF" }}>construction software</span>.
          </h1>
          <p className="mt-4 text-lg max-w-md" style={{ color: "#14181Fcc" }}>
            Revit, AutoCAD, ArchiCAD, SketchUp, ETABS, ProtaStructure, Orion, PlanSwift — real courses, real progress tracking, real answers.
          </p>
          {weekend && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: "#E8622C1A", color: "#E8622C" }}>
              🔥 Weekend promo live — 50% off all courses until Sunday midnight
            </div>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => setPage("courses")} className="px-6 py-3 rounded-md font-medium text-white flex items-center gap-2" style={{ background: "#E8622C" }}>
              Browse courses <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 py-12">
        <h2 className="mb-6" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "1.6rem", color: "#14181F" }}>Popular courses</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: "#1E3A5F" }}><Loader2 size={16} className="animate-spin" /> Loading live course data…</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.slice(0, 3).map((c) => (
              <button key={c.id} onClick={() => setPage("courses")} className="text-left p-5 rounded-lg border" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
                <TitleBlock label="NO." code={c.code} />
                <h3 className="font-semibold text-lg mt-3" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>{c.title}</h3>
                <p className="text-sm mt-1.5" style={{ color: "#14181F99" }}>{c.blurb}</p>
                <div className="mt-4 font-semibold" style={{ color: "#E8622C" }}>${weekend ? c.price_intl_weekend : c.price_intl_weekday}</div>
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="max-w-6xl mx-auto px-5 pb-16 grid sm:grid-cols-3 gap-6">
        {[[ShieldCheck, "Secure by design", "Row-level security means your data and progress are yours alone."],
          [TrendingUp, "Real progress tracking", "Lesson-by-lesson completion, visible to you and your instructor."],
          [MessageSquare, "Built-in Q&A", "Ask questions inside each course, answered by real instructors."]].map(([Icon, t, b], i) => (
          <div key={i} className="p-6 rounded-lg border" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
            <Icon size={22} color="#3D8BFF" />
            <h3 className="mt-3 font-semibold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>{t}</h3>
            <p className="mt-2 text-sm" style={{ color: "#14181F99" }}>{b}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Courses({ courses, loading, error, session, checkout, checkingOut }) {
  const weekend = isWeekendPromo();
  return (
    <div className="max-w-6xl mx-auto px-5 py-12" style={{ background: "#F5F3EC" }}>
      <TitleBlock label="INDEX" code="ALL COURSES" />
      <h2 className="mt-4 mb-8" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#14181F" }}>Course catalog</h2>
      {error && (
        <div className="mb-6 p-4 rounded-md text-sm" style={{ background: "#c0392b1A", color: "#c0392b" }}>
          Couldn't load courses: {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#1E3A5F" }}><Loader2 size={16} className="animate-spin" /> Loading live courses from the database…</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="p-5 rounded-lg border flex flex-col" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
              <div className="flex justify-between items-start mb-3">
                <TitleBlock label="NO." code={c.code} />
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#2E8B571A", color: "#2E8B57", fontFamily: "'JetBrains Mono',monospace" }}>{c.level}</span>
              </div>
              <h3 className="font-semibold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>{c.title}</h3>
              <p className="text-sm mt-1.5 flex-1" style={{ color: "#14181F99" }}>{c.blurb}</p>
              <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: "#1E3A5F14" }}>
                <span className="font-semibold" style={{ color: "#E8622C" }}>
                  ${weekend ? c.price_intl_weekend : c.price_intl_weekday}
                  {weekend && <span className="ml-1 text-xs line-through opacity-40">${c.price_intl_weekday}</span>}
                </span>
              </div>
              {session ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => checkout(c.id, "paystack")} disabled={checkingOut === c.id} className="py-2 rounded-md font-medium text-white text-xs flex items-center justify-center gap-1.5" style={{ background: "#2E8B57" }}>
                    {checkingOut === c.id && <Loader2 size={12} className="animate-spin" />} Pay (Paystack)
                  </button>
                  <button onClick={() => checkout(c.id, "flutterwave")} disabled={checkingOut === c.id} className="py-2 rounded-md font-medium text-white text-xs flex items-center justify-center gap-1.5" style={{ background: "#1E3A5F" }}>
                    {checkingOut === c.id && <Loader2 size={12} className="animate-spin" />} Pay (Flutterwave)
                  </button>
                </div>
              ) : (
                <a href={c.selar_link} target="_blank" rel="noreferrer" className="mt-3 w-full py-2 rounded-md font-medium text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: "#1E3A5F" }}>
                  Sign in to enroll
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard({ session, courses, enrollments, loading, openCourse }) {
  const enrolledCourses = enrollments.map((e) => ({ ...courses.find((c) => c.id === e.course_id), enrollment: e })).filter((c) => c.id);
  return (
    <div className="max-w-6xl mx-auto px-5 py-12" style={{ background: "#F5F3EC" }}>
      <TitleBlock label="STUDENT" code={(session?.user?.email || "").split("@")[0].toUpperCase()} />
      <h2 className="mt-4 mb-8" style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: "2rem", color: "#14181F" }}>My learning</h2>
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#1E3A5F" }}><Loader2 size={16} className="animate-spin" /> Loading your enrollments…</div>
      ) : enrolledCourses.length === 0 ? (
        <p className="text-sm" style={{ color: "#14181F99" }}>You're not enrolled in any courses yet — head to the catalog to get started.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {enrolledCourses.map((c) => (
            <div key={c.id} className="p-5 rounded-lg border" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
              <TitleBlock label="NO." code={c.code} />
              <h3 className="font-semibold text-lg mt-3 mb-3" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>{c.title}</h3>
              {c.enrollment.status === "pending" ? (
                <div className="text-sm px-3 py-2 rounded-md flex items-center gap-2" style={{ background: "#E8622C1A", color: "#E8622C" }}>
                  <Loader2 size={14} className="animate-spin" /> Payment processing — this updates automatically once confirmed
                </div>
              ) : (
                <>
                  <DimensionBar pct={0} />
                  <button onClick={() => openCourse(c)} className="mt-4 w-full py-2.5 rounded-md font-medium flex items-center justify-center gap-2 text-sm" style={{ background: "#1E3A5F", color: "#fff" }}>
                    <PlayCircle size={16} /> Continue learning
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
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

  if (!course) return <div className="max-w-6xl mx-auto px-5 py-12" style={{ color: "#14181F99" }}>Pick a course from your dashboard.</div>;

  return (
    <div style={{ background: "#F5F3EC" }} className="min-h-[70vh]">
      <div className="max-w-6xl mx-auto px-5 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-lg border p-4 h-fit" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
          <TitleBlock label="NO." code={course.code} />
          <h3 className="mt-3 font-semibold" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>{course.title}</h3>
          <div className="mt-3"><DimensionBar pct={pct} /></div>
          {loading ? <div className="mt-4 text-sm flex items-center gap-2" style={{ color: "#1E3A5F" }}><Loader2 size={14} className="animate-spin" /> Loading lessons…</div> : (
            <div className="mt-4 space-y-1 max-h-[60vh] overflow-y-auto">
              {lessons.map((l) => (
                <button key={l.id} onClick={() => setActiveLesson(l)} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-left"
                  style={{ background: activeLesson?.id === l.id ? "#3D8BFF14" : "transparent", color: "#14181F" }}>
                  {progress[l.id] ? <CheckCircle2 size={16} color="#2E8B57" /> : <Circle size={16} color="#1E3A5F55" />}
                  <span className={activeLesson?.id === l.id ? "font-medium" : ""}>{l.title}</span>
                </button>
              ))}
            </div>
          )}
        </aside>
        <div>
          <div className="flex gap-1 mb-4">
            {[["lessons", "Lesson", PlayCircle], ["qa", "Q&A", MessageSquare]].map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className="px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                style={{ background: tab === id ? "#1E3A5F" : "#1E3A5F0D", color: tab === id ? "#fff" : "#1E3A5F" }}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          {tab === "lessons" && activeLesson ? (
            <div className="rounded-lg border p-6" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
              <div className="aspect-video rounded-md flex items-center justify-center mb-4" style={{ background: "#0F1826" }}>
                {activeLesson.video_url ? (
                  <a href={activeLesson.video_url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2" style={{ color: "#3D8BFF" }}>
                    <PlayCircle size={56} /><span className="text-xs">Open video</span>
                  </a>
                ) : <PlayCircle size={56} color="#3D8BFF55" />}
              </div>
              <h3 className="font-semibold text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif", color: "#14181F" }}>{activeLesson.title}</h3>
              {activeLesson.content && <p className="text-sm mt-2" style={{ color: "#14181F99" }}>{activeLesson.content}</p>}
              <button onClick={markComplete} disabled={progress[activeLesson.id]} className="mt-4 px-5 py-2.5 rounded-md font-medium text-white text-sm" style={{ background: progress[activeLesson.id] ? "#2E8B57" : "#E8622C" }}>
                {progress[activeLesson.id] ? "Completed ✓" : "Mark lesson complete"}
              </button>
            </div>
          ) : tab === "qa" && activeLesson ? (
            <div className="rounded-lg border p-6" style={{ borderColor: "#1E3A5F1A", background: "#fff" }}>
              <div className="flex items-center gap-2 mb-4" style={{ color: "#1E3A5F" }}>
                <MessageSquare size={17} /><span className="font-medium text-sm">Q&amp;A — {activeLesson.title}</span>
              </div>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {messages.length === 0 && <p className="text-sm" style={{ color: "#14181F66" }}>No questions yet — be the first to ask.</p>}
                {messages.map((m, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium" style={{ color: m.profiles?.role === "instructor" ? "#E8622C" : "#14181F" }}>{m.profiles?.full_name || "Student"}</span>
                    </div>
                    <p style={{ color: "#14181Fcc" }}>{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask a question about this lesson..." className="flex-1 px-3 py-2 rounded-md border text-sm outline-none" style={{ borderColor: "#1E3A5F22" }} />
                <button onClick={send} className="px-4 py-2 rounded-md text-white flex items-center gap-1.5 text-sm" style={{ background: "#1E3A5F" }}><Send size={14} /> Send</button>
              </div>
            </div>
          ) : null}
        </div>
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

  // After returning from Paystack/Flutterwave's hosted checkout page, re-check
  // enrollments — the webhook usually lands within a few seconds of redirect.
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
      window.location.href = checkout_url; // redirect to Paystack/Flutterwave's hosted payment page
    } catch (e) {
      alert("Could not start checkout: " + e.message);
      setCheckingOut(null);
    }
  };

  const openCourse = (course) => { setActiveCourse(course); setPage("player"); };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", minHeight: "100vh" }}>
      <style>{FONT_IMPORT}</style>
      <Nav page={page} setPage={setPage} session={session} setAuthOpen={setAuthOpen} signOut={signOut} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onAuthed={onAuthed} />}
      {page === "home" && <Home setPage={setPage} courses={courses} loading={coursesLoading} />}
      {page === "courses" && <Courses courses={courses} loading={coursesLoading} error={coursesError} session={session} checkout={checkout} checkingOut={checkingOut} />}
      {page === "dashboard" && session && <Dashboard session={session} courses={courses} enrollments={enrollments} loading={enrollLoading} openCourse={openCourse} />}
      {page === "player" && session && <Player course={activeCourse} session={session} token={session.access_token} />}
      <footer className="py-6 text-center text-xs" style={{ background: "#0F1826", color: "#F5F3EC66" }}>
        Gsol Design Academy — live data from Supabase
      </footer>
    </div>
  );
}
