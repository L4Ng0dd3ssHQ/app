import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, ArrowLeft, Loader2 } from "lucide-react";
import { DAILY_LIMIT, incrementQuota, quotaStatus, saveAnalysis } from "../storage";
import { analyzeJob } from "../api";
import type { Analysis } from "../types";
import AnalysisView from "../components/AnalysisView";

export default function Analyze() {
  const navigate = useNavigate();
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);

  useEffect(() => {
    setRemaining(quotaStatus().remaining);
  }, []);

  const onAnalyze = async () => {
    setError(null);
    if (jd.trim().length < 30) {
      setError("Job description is too short. Paste the full posting (at least 30 chars).");
      return;
    }
    const q = quotaStatus();
    if (!q.allowed) {
      setError(`You've used your ${DAILY_LIMIT} free analyses today. Come back tomorrow.`);
      return;
    }
    setLoading(true);
    try {
      const data = await analyzeJob(jd, resume);
      saveAnalysis(data);
      incrementQuota();
      setRemaining(quotaStatus().remaining);
      setResult(data);
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
        <div data-testid="analyze-quota-pill" className="flex items-center gap-1.5 bg-brand-50 px-3 py-2 rounded-full">
          <Zap size={14} className="text-brand-700" />
          <span className="text-xs font-bold text-brand-700">{remaining}/{DAILY_LIMIT} left</span>
        </div>
      </div>
      <p className="text-sm text-muted mb-4">Paste a job description and get an instant fit report.</p>

      <div className="bg-white rounded-2xl shadow-card p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-extrabold text-ink">Job Description</label>
          <span className="text-[10px] font-extrabold tracking-widest text-brand-500">REQUIRED</span>
        </div>
        <textarea
          data-testid="jd-input"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-3" data-testid="error-msg">
          {error}
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={disabled}
        data-testid="analyze-btn"
        className={`w-full flex items-center justify-center gap-2 font-black tracking-widest text-sm py-4 rounded-xl shadow-card transition-colors ${
          disabled ? "bg-brand-300 text-white cursor-not-allowed" : "bg-brand-500 hover:bg-brand-600 text-white"
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> ANALYZING…
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

      <button
        onClick={() => navigate("/")}
        className="block mx-auto text-xs text-muted hover:text-brand-500 mt-6 underline-offset-2 hover:underline"
      >
        ← Back to home
      </button>
    </div>
  );
}
