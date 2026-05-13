import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  Gauge,
  Lightbulb,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Zap,
} from "lucide-react";
import { DAILY_LIMIT, loadHistory, quotaStatus } from "../storage";

const previewGaps = ["Azure networking", "Firewall configuration", "Incident response"];

const featureCards = [
  {
    icon: Upload,
    title: "Upload or Paste",
    text: "Drop in PDF, DOCX, TXT, or paste your resume by hand.",
    tone: "bg-brand-50 text-brand-700",
  },
  {
    icon: Target,
    title: "See The Fit",
    text: "Get a score, skill match, and the gaps that matter most.",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: PenLine,
    title: "Fix The Resume",
    text: "Turn plain bullets into tailored, ready-to-use language.",
    tone: "bg-amber-50 text-amber-700",
  },
];

export default function Home() {
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setRemaining(quotaStatus().remaining);
    setCount(loadHistory().length);
  }, []);

  return (
    <div className="px-4 lg:px-10 pt-6 pb-10" data-testid="home-screen">
      <header className="flex items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-card">
              <Sparkles size={18} />
            </div>
            <div className="text-3xl font-black tracking-tight text-ink leading-none">LandIt</div>
          </div>
          <div className="text-[10px] font-extrabold text-brand-500 mt-1 tracking-[0.2em]">JOB MATCH ANALYZER</div>
        </div>
        <div
          data-testid="quota-pill"
          className="flex items-center gap-1.5 bg-white border border-brand-100 px-3 py-2 rounded-full shadow-card"
        >
          <Zap size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-brand-700">{remaining}/{DAILY_LIMIT} left today</span>
        </div>
      </header>

      <Link
        to="/pro"
        className="flex items-center justify-between gap-3 bg-white border border-brand-100 text-ink rounded-2xl px-4 py-3 mb-5 shadow-card active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
            <Crown size={15} />
          </div>
          <span className="text-xs font-bold leading-snug">
            May Deal: Go Pro for <span className="text-brand-600 font-black">$1</span>. Unlimited scans, PDF export, saved resumes, and restore codes.
          </span>
        </div>
        <ArrowRight size={16} className="text-brand-700 shrink-0" />
      </Link>

      <section className="grid lg:grid-cols-[1.02fr_0.98fr] gap-4 lg:gap-6 items-stretch mb-5">
        <div
          className="rounded-3xl p-6 lg:p-8 shadow-card text-white relative overflow-hidden min-h-[360px] flex flex-col justify-between"
          style={{ background: "linear-gradient(135deg, #8B3DCC 0%, #641F9A 58%, #2E174D 100%)" }}
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-white/12 border border-white/20 rounded-full px-3 py-1.5 mb-5">
              <ShieldCheck size={14} />
              <span className="text-[11px] font-extrabold tracking-[0.16em]">TAILOR BEFORE YOU APPLY</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
              Land the interview.
              <br />
              Skip the guesswork.
            </h1>
            <p className="text-sm lg:text-base leading-relaxed text-brand-50/95 max-w-xl mb-6">
              Paste a job description, upload your resume, and get a clear fit report with missing skills, stronger bullets, and the next fixes to make.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Link
              to="/analyze"
              data-testid="hero-analyze-btn"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-black tracking-wider text-sm px-5 py-3.5 rounded-xl active:scale-95 transition-transform"
            >
              Check My Resume Fit <ArrowRight size={18} />
            </Link>
            <div className="text-[11px] text-brand-50/80">Free 3/day. Pro removes the cap.</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-4 lg:p-5 border border-brand-50">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-1">SAMPLE REPORT</div>
              <h2 className="text-xl font-black text-ink">Network Engineer</h2>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-good leading-none">82</div>
              <div className="text-[10px] font-extrabold text-good tracking-wider">STRONG FIT</div>
            </div>
          </div>

          <div className="h-2 rounded-full bg-brand-50 overflow-hidden mb-4">
            <div className="h-full w-[82%] bg-good rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-2xl bg-emerald-50 p-3">
              <CheckCircle2 size={18} className="text-good mb-2" />
              <div className="text-xs font-extrabold text-ink">Matched</div>
              <div className="text-[11px] text-muted mt-0.5">VLANs, DHCP, NAT, Cisco</div>
            </div>
            <div className="rounded-2xl bg-red-50 p-3">
              <AlertCircle size={18} className="text-bad mb-2" />
              <div className="text-xs font-extrabold text-ink">Missing</div>
              <div className="text-[11px] text-muted mt-0.5">Cloud networking gaps</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2">SKILL GAPS</div>
            <div>
              {previewGaps.map((gap) => (
                <span key={gap} className="inline-block bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-[12px] font-semibold mr-2 mb-2">
                  {gap}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-bg p-3 border border-brand-50">
            <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.12em] text-brand-700 mb-2">
              <PenLine size={14} />
              REWRITTEN BULLET
            </div>
            <div className="text-[12px] text-muted line-through mb-2">Managed network systems.</div>
            <div className="text-sm text-ink font-semibold leading-snug bg-white rounded-xl border-l-4 border-brand-500 p-3">
              Configured VLAN segmentation and DHCP/NAT policies to improve uptime across multi-site network operations.
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-card p-4" data-testid="stat-history">
          <Clock size={22} className="text-brand-500" />
          <div className="text-3xl font-black text-ink mt-1">{count}</div>
          <div className="text-xs text-muted font-semibold">Past scans</div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4" data-testid="stat-quota">
          <Zap size={22} className="text-amber-500" />
          <div className="text-3xl font-black text-ink mt-1">{remaining}</div>
          <div className="text-xs text-muted font-semibold">Scans left</div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4">
          <Gauge size={22} className="text-emerald-600" />
          <div className="text-3xl font-black text-ink mt-1">10x</div>
          <div className="text-xs text-muted font-semibold">Faster tailoring</div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-4">
          <FileText size={22} className="text-brand-500" />
          <div className="text-3xl font-black text-ink mt-1">ATS</div>
          <div className="text-xs text-muted font-semibold">Resume ready</div>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-1">HOW IT WORKS</div>
            <h2 className="text-2xl font-black text-ink">From posting to plan</h2>
          </div>
          <Link to="/analyze" className="hidden sm:inline-flex text-xs font-black text-brand-700 items-center gap-1">
            START <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid lg:grid-cols-3 gap-3">
          {featureCards.map(({ icon: Icon, title, text, tone }) => (
            <div key={title} className="bg-white rounded-2xl shadow-card p-4">
              <div className={`w-10 h-10 rounded-2xl ${tone} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <div className="font-extrabold text-ink">{title}</div>
              <p className="text-sm text-muted leading-snug mt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_0.9fr] gap-3 mb-5">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={20} className="text-amber-500" />
            <h3 className="font-black text-ink">Why applicants use it</h3>
          </div>
          <div className="space-y-3">
            {[
              "Know whether the role is worth your time before applying.",
              "See exact missing keywords instead of guessing what ATS wants.",
              "Rewrite resume bullets without starting from a blank page.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 size={16} className="text-good shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <Link to="/pro" className="bg-brand-500 text-white rounded-2xl shadow-card p-5 flex flex-col justify-between active:scale-[0.99] transition-transform">
          <div>
            <div className="flex items-center gap-2 text-brand-50 mb-2">
              <Crown size={18} />
              <span className="text-[11px] font-extrabold tracking-[0.16em]">LANDIT PRO</span>
            </div>
            <h3 className="text-2xl font-black leading-tight">Unlimited scans when the job hunt gets serious.</h3>
            <p className="text-sm text-brand-50/90 leading-snug mt-2">Save resumes, export PDFs, restore Pro on up to 3 devices, and keep tailoring without daily caps.</p>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-black">
            VIEW PRO <ArrowRight size={16} />
          </div>
        </Link>
      </section>

      <Link
        to="/analyze"
        data-testid="start-analyze-btn"
        className="block w-full text-center bg-ink hover:bg-brand-800 transition-colors text-white font-black tracking-widest text-sm py-4 rounded-xl shadow-card active:scale-[0.98]"
      >
        START ANALYZING
      </Link>
    </div>
  );
}
