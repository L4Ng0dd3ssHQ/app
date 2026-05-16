import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Sparkles, Zap, ArrowLeft, Loader2, Crown } from "lucide-react";
import { DAILY_LIMIT, incrementQuota, isPro, quotaStatus, saveAnalysis } from "../storage";
import { analyzeJob } from "../api";
import type { Analysis } from "../types";
import AnalysisView from "../components/AnalysisView";
import ResumeFileInput from "../components/ResumeFileInput";
import { track } from "../analytics";

export default function Analyze() {
  const navigate = useNavigate();
  const location = useLocation();
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [pro, setPro] = useState(false);
  const [handoffNotice, setHandoffNotice] = useState<string | null>(null);

  useEffect(() => {
    setRemaining(quotaStatus().remaining);
    setPro(isPro());
    const state = location.state as { resume?: string; jd?: string; fromBuilder?: boolean } | null;
    if (state?.resume) setResume(state.resume);
    if (state?.jd) setJd(state.jd);
    if (state?.fromBuilder && state.resume && !state.jd) {
      setHandoffNotice("Your resume is loaded from Resume Builder. Paste the job description here to run the full match analysis.");
    }
  }, []);

  const onAnalyze = async () => {
    setError(null);
    setHandoffNotice(null);
    if (jd.trim().length < 30) {
      setError("Job description is too short. Paste the full posting (at least 30 chars).");
      return;
    }
    track("analyze_clicked", { has_resume: !!resume.trim(), jd_chars: jd.length });
    if (!pro) {
      const q = quotaStatus();
      if (!q.allowed) {
        setError(`You've used your ${DAILY_LIMIT} free analyses today. Upgrade to Pro for unlimited.`);
        track("quota_blocked");
        return;
      }
    }
    setLoading(true);
    try {
      const data = await analyzeJob(jd, resume);
      saveAnalysis(data);
      if (!pro) incrementQuota();
      setRemaining(quotaStatus().remaining);
      setResult(data);
      track("analyze_succeeded", { match_score: data.match_score });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const onReset = () => {
    setResult(null);
    setJd("");
    setResume("");
    setError(null);
    setHandoffNotice(null);
  };

  if (result) {
    return (
      <div data-testid="analyze-result-screen">
        <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-brand-50 bg-bg sticky top-0 z-10">
          <button
            onClick={onReset}
            data-testid="new-analysis-btn"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-50"
          >
            <ArrowLeft size={22} className="text-ink" />
          </button>
          <div className="font-extrabold text-ink">Your Analysis</div>
          <div className="w-10" />
        </div>
        <AnalysisView data={result} />
        <div className="px-4 pb-6">
          <button
            onClick={onReset}
            data-testid="run-another-btn"
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black tracking-widest text-sm py-4 rounded-xl shadow-card"
          >
            RUN ANOTHER ANALYSIS
          </button>
        </div>
      </div>
    );
  }

  const disabled = loading || jd.trim().length < 30;

  return (
    <div className="px-4 pt-6" data-testid="analyze-screen">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-3xl font-black text-ink">Analyze a Job</h2>
        {pro ? (
          <div data-testid="pro-pill" className="flex items-center gap-1.5 bg-brand-500 text-white px-3 py-2 rounded-full">
            <Crown size={14} />
            <span className="text-xs font-extrabold tracking-wider">PRO</span>
          </div>
        ) : (
          <Link to="/pro" data-testid="analyze-quota-pill" className="flex items-center gap-1.5 bg-brand-50 px-3 py-2 rounded-full hover:bg-brand-100 transition-colors">
            <Zap size={14} className="text-brand-700" />
            <span className="text-xs font-bold text-brand-700">{remaining}/{DAILY_LIMIT} left</span>
          </Link>
        )}
      </div>
      <p className="text-sm text-muted mb-4">Paste a job description and get an instant fit report.</p>

      {/* Input grid: stacked on mobile, 2-col on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
      <div className="bg-white rounded-2xl shadow-card p-4 mb-3 lg:mb-0">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-extrabold text-ink">Job Description</label>
          <span className="text-[10px] font-extrabold tracking-widest text-brand-500">REQUIRED</span>
        </div>
        <textarea
          data-testid="jd-input"
          value={jd}
          onChange={(e) => {
            setJd(e.target.value);
            if (handoffNotice) setHandoffNotice(null);
          }}
          placeholder="Paste the full job posting here..."
          rows={6}
          className="w-full bg-brand-50/50 rounded-xl p-3 text-sm leading-relaxed text-ink placeholder-muted/70 outline-none focus:ring-2 focus:ring-brand-300 resize-y min-h-[140px]"
        />
        <div className="text-right text-[11px] text-muted mt-1.5">{jd.length} chars</div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-extrabold text-ink">Your Resume</label>
          <span className="text-[10px] font-extrabold tracking-widest text-muted">OPTIONAL</span>
        </div>
        <ResumeFileInput
          disabled={loading}
          onParsed={(r) => {
            setResume(r.text);
            track("resume_file_parsed", { format: r.format, chars: r.chars });
          }}
        />
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted my-2">
          <div className="h-px bg-brand-100 flex-1" />
          <span>OR PASTE BELOW</span>
          <div className="h-px bg-brand-100 flex-1" />
        </div>
        <textarea
          data-testid="resume-input"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your resume to unlock match score and gap analysis..."
          rows={6}
          className="w-full bg-brand-50/50 rounded-xl p-3 text-sm leading-relaxed text-ink placeholder-muted/70 outline-none focus:ring-2 focus:ring-brand-300 resize-y min-h-[140px]"
        />
        <div className="text-right text-[11px] text-muted mt-1.5">{resume.length} chars</div>
      </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-3" data-testid="error-msg">
          {error}
        </div>
      )}
      {handoffNotice && (
        <div className="bg-brand-50 border border-brand-100 text-brand-700 text-sm font-bold rounded-xl p-3 mb-3" data-testid="analyze-handoff-notice">
          {handoffNotice}
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={disabled}
        data-testid="analyze-btn"
        className={`w-full flex items-center justify-center gap-2 font-black tracking-widest text-sm py-4 rounded-xl shadow-card transition-colors mt-3 lg:mt-4 ${
          disabled ? "bg-brand-300 text-white cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600 text-white"
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> ANALYZING...
          </>
        ) : (
          <>
            <Sparkles size={18} /> ANALYZE
          </>
        )}
      </button>

      <p className="text-xs text-muted text-center mt-3">
        Tip: longer JD + resume = sharper match score and bullet suggestions.
      </p>
      {!pro && (
        <Link
          to="/pro"
          className="block w-fit mx-auto mt-4 text-xs font-bold text-brand-700 underline-offset-4 hover:underline flex items-center gap-1"
        >
          <Crown size={14} /> Hit the daily limit? Go Pro for unlimited.
        </Link>
      )}

      <button
        onClick={() => navigate("/")}
        className="mx-auto mt-6 flex items-center gap-1 text-xs text-muted hover:text-brand-500 underline-offset-2 hover:underline"
      >
        <ArrowLeft size={14} /> Back to home
      </button>
    </div>
  );
}
