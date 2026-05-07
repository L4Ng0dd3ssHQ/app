import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Clock, Gauge, Lightbulb, ShieldCheck } from "lucide-react";
import { DAILY_LIMIT, loadHistory, quotaStatus } from "../storage";

export default function Home() {
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setRemaining(quotaStatus().remaining);
    setCount(loadHistory().length);
  }, []);

  return (
    <div className="px-4 pt-6" data-testid="home-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-3xl font-black tracking-tight text-ink leading-none">LandIt</div>
          <div className="text-[10px] font-extrabold text-brand-500 mt-0.5 tracking-[0.2em]">JOB MATCH ANALYZER</div>
        </div>
        <div
          data-testid="quota-pill"
          className="flex items-center gap-1.5 bg-brand-50 px-3 py-2 rounded-full"
        >
          <Zap size={14} className="text-brand-700" />
          <span className="text-xs font-bold text-brand-700">{remaining}/{DAILY_LIMIT} left today</span>
        </div>
      </div>
      
      {/* May Promo Banner */}
      <Link
        to="/pro"
        className="flex items-center justify-between gap-2 bg-brand-500 text-white rounded-2xl px-4 py-3 mb-4 shadow-card active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="shrink-0" />
          <span className="text-xs font-extrabold tracking-wide">🎉 May Deal — Go Pro for <span className="underline">$1</span>. Unlimited scans, PDF export. No subscription. Use code LANDIT1.</span>
        </div>
        <ArrowRight size={16} className="shrink-0" />
      </Link>

      {/* Hero */}
      <div className="rounded-3xl p-6 mb-4 shadow-card text-white relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #6b3d4a 0%, #4c333e 50%, #351e28 100%)" }}>
        <div className="text-[11px] font-extrabold tracking-[0.3em] opacity-90 mb-3">LAND IT.</div>
        <h1 className="text-3xl font-black leading-tight mb-3">
          Land the interview.<br />Skip the guesswork.
        </h1>
        <p className="text-sm leading-snug text-brand-50/95 mb-5">
          Paste any job description and your resume — get a match score, missing skills, and ready-to-paste resume bullets in seconds.
        </p>
        <Link
          to="/analyze"
          data-testid="hero-analyze-btn"
          className="inline-flex items-center gap-2 bg-white text-brand-700 font-black tracking-wider text-sm px-5 py-3 rounded-xl active:scale-95 transition-transform"
        >
          ANALYZE A JOB <ArrowRight size={18} />
        </Link>
        <div className="text-[11px] mt-3 text-brand-50/80">1× scan = 1 credit. Free 3/day.</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-card p-4" data-testid="stat-history">
          <Clock size={22} className="text-brand-500" />
          <div className="text-3xl font-black text-ink mt-1">{count}</div>
          <div className="text-xs text-muted font-semibold">Past scans</div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4" data-testid="stat-quota">
          <Zap size={22} className="text-brand-500" />
          <div className="text-3xl font-black text-ink mt-1">{remaining}</div>
          <div className="text-xs text-muted font-semibold">Scans today</div>
        </div>
      </div>

      {/* How it works */}
      <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2">HOW IT WORKS</div>
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        {[
          { n: "1", t: "Paste a job description", s: "From LinkedIn, Indeed, or anywhere" },
          { n: "2", t: "Drop in your resume (optional)", s: "Get personalized match scoring" },
          { n: "3", t: "Get tailored output", s: "Score, gaps, rewritten bullets, focus list" },
        ].map((x) => (
          <div key={x.n} className="flex items-start gap-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-black flex items-center justify-center text-sm shrink-0">{x.n}</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-ink">{x.t}</div>
              <div className="text-xs text-muted mt-0.5">{x.s}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Why it works */}
      <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2">WHY IT WORKS</div>
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { icon: Gauge, t: "10× faster", s: "Tailor in 30s" },
          { icon: Lightbulb, t: "Real bullets", s: "Copy-paste ready" },
          { icon: ShieldCheck, t: "Honest score", s: "No vibe checks" },
        ].map(({ icon: Icon, t, s }) => (
          <div key={t} className="bg-white rounded-2xl shadow-card p-3">
            <Icon size={20} className="text-brand-500" />
            <div className="text-sm font-extrabold text-ink mt-1.5">{t}</div>
            <div className="text-[11px] text-muted mt-0.5">{s}</div>
          </div>
        ))}
      </div>

      <Link
        to="/analyze"
        data-testid="start-analyze-btn"
        className="block w-full text-center bg-brand-500 hover:bg-brand-600 transition-colors text-white font-black tracking-widest text-sm py-4 rounded-xl shadow-card active:scale-[0.98]"
      >
        START ANALYZING
      </Link>
    </div>
  );
}
