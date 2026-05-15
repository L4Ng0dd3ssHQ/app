import {
  ShieldCheck, Star, Grid3x3, AlertCircle, PenSquare, Flag, FileText, Copy, Check, Crown, Download,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Analysis } from "../types";
import { isPro } from "../storage";
import { downloadAnalysisPDF } from "../pdf";
import { track } from "../analytics";

function scoreColor(s: number) {
  if (s >= 75) return "text-good border-good";
  if (s >= 50) return "text-warn border-warn";
  if (s > 0) return "text-bad border-bad";
  return "text-muted border-muted";
}
function scoreBgClass(s: number) {
  if (s >= 75) return "bg-good";
  if (s >= 50) return "bg-warn";
  if (s > 0) return "bg-bad";
  return "bg-muted";
}
function scoreLabel(s: number) {
  if (s >= 85) return "Excellent fit";
  if (s >= 70) return "Strong fit";
  if (s >= 50) return "Decent fit";
  if (s >= 30) return "Needs work";
  if (s > 0) return "Weak match";
  return "No resume";
}

function Pill({ text, tone = "purple" }: { text: string; tone?: "purple" | "red" | "green" }) {
  const cls =
    tone === "red"
      ? "bg-red-50 text-red-700"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-brand-50 text-brand-700";
  return (
    <span
      data-testid="skill-pill"
      className={`inline-block ${cls} px-3 py-1.5 rounded-full text-[13px] font-semibold mr-2 mb-2`}
    >
      {text}
    </span>
  );
}

function Section({
  icon: Icon, title, children, testId,
}: { icon: LucideIcon; title: string; children: React.ReactNode; testId?: string }) {
  return (
    <div data-testid={testId} className="bg-white rounded-2xl shadow-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className="text-brand-500" />
        <h3 className="font-extrabold text-base text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch { /* ignore */ }
      }}
      className="text-xs font-bold flex items-center gap-1 text-brand-700 hover:text-brand-500"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function formatAnalysisText(data: Analysis): string {
  const lines: string[] = [];
  lines.push(`JOB: ${data.job_title}`);
  if (data.match_score > 0) lines.push(`MATCH SCORE: ${data.match_score}/100 — ${scoreLabel(data.match_score)}`);
  if (data.summary) lines.push(`\nSUMMARY\n${data.summary}`);
  if (data.required_skills.length) lines.push(`\nREQUIRED SKILLS\n${data.required_skills.join(", ")}`);
  if (data.preferred_skills.length) lines.push(`\nPREFERRED SKILLS\n${data.preferred_skills.join(", ")}`);
  if (data.missing_skills.length) lines.push(`\nMISSING SKILLS\n${data.missing_skills.join(", ")}`);
  if (data.suggested_bullets.length) lines.push(`\nRESUME BULLETS\n${data.suggested_bullets.map(b => `• ${b.after}`).join("\n")}`);
  if (data.focus_guidance.length) lines.push(`\nFOCUS ON\n${data.focus_guidance.map((f, i) => `${i + 1}. ${f}`).join("\n")}`);
  return lines.join("\n");
}

export default function AnalysisView({ data }: { data: Analysis }) {
  const sc = data.match_score;
  const pro = isPro();
  const onDownload = () => {
    track("pdf_downloaded", { match_score: data.match_score });
    downloadAnalysisPDF(data);
  };
  return (
    <div className="px-4 pb-8" data-testid="analysis-result">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-2xl font-black text-ink flex-1" data-testid="job-title">{data.job_title}</h2>
        {pro ? (
          <button
            onClick={onDownload}
            data-testid="pdf-download-btn"
            className="shrink-0 flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-extrabold text-xs px-3 py-2 rounded-full transition-colors"
            title="Download as PDF"
          >
            <Download size={14} /> PDF
          </button>
        ) : (
          <Link
            to="/pro"
            data-testid="pdf-download-locked"
            className="shrink-0 flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-extrabold text-xs px-3 py-2 rounded-full transition-colors"
            title="Download as PDF (Pro)"
          >
            <Crown size={12} /> PDF
          </Link>
        )}
        {pro && (
          <CopyButton text={formatAnalysisText(data)} />
        )}
      </div>
      {data.summary && <p className="text-sm text-muted leading-snug mb-4">{data.summary}</p>}


      {/* Match Score */}
      {data.has_resume ? (
        <div className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 mb-4" data-testid="match-score-card">
          <div className={`w-22 h-22 rounded-full border-4 flex flex-col items-center justify-center bg-white ${scoreColor(sc)}`} style={{ width: 88, height: 88 }}>
            <span className="text-3xl font-black leading-none" data-testid="match-score">{sc}</span>
            <span className="text-[10px] text-muted">/100</span>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-muted font-bold tracking-wider uppercase">Match Score</div>
            <div className={`text-xl font-extrabold ${scoreColor(sc).split(" ")[0]}`}>{scoreLabel(sc)}</div>
            <div className="h-2 bg-brand-50 rounded-full mt-2 overflow-hidden">
              <div className={`h-full ${scoreBgClass(sc)} transition-all duration-700`} style={{ width: `${sc}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-4 mb-4">
          <FileText size={32} className="text-brand-500 shrink-0" />
          <div>
            <div className="font-extrabold text-ink">No resume provided</div>
            <div className="text-sm text-muted">Add your resume next time to get a match score and gap analysis.</div>
          </div>
        </div>
      )}

      {/* Required */}
      {data.required_skills.length > 0 && (
        <Section icon={ShieldCheck} title="Required Skills" testId="required-section">
          <div>{data.required_skills.map((s, i) => <Pill key={i} text={s} />)}</div>
        </Section>
      )}

      {/* Preferred */}
      {data.preferred_skills.length > 0 && (
        <Section icon={Star} title="Preferred Skills" testId="preferred-section">
          <div>{data.preferred_skills.map((s, i) => <Pill key={i} text={s} />)}</div>
        </Section>
      )}

      {/* Key skills */}
      <Section icon={Grid3x3} title="Key Skills" testId="key-skills-section">
        {data.key_skills.technical.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-1 mb-1.5">Technical</div>
            <div>{data.key_skills.technical.map((s, i) => <Pill key={i} text={s} />)}</div>
          </>
        )}
        {data.key_skills.tools.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-2 mb-1.5">Tools & Platforms</div>
            <div>{data.key_skills.tools.map((s, i) => <Pill key={i} text={s} />)}</div>
          </>
        )}
        {data.key_skills.soft.length > 0 && (
          <>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mt-2 mb-1.5">Soft Skills</div>
            <div>{data.key_skills.soft.map((s, i) => <Pill key={i} text={s} />)}</div>
          </>
        )}
      </Section>

      {/* Missing */}
      {data.has_resume && data.missing_skills.length > 0 && (
        <Section icon={AlertCircle} title="Missing Skills" testId="missing-section">
          {pro ? (
            <div>{data.missing_skills.map((s, i) => <Pill key={i} text={s} tone="red" />)}</div>
          ) : (
            <div className="relative">
              <div className="blur-sm pointer-events-none select-none">
                <Pill text="Communication" tone="red" />
                <Pill text="Project Management" tone="red" />
                <Pill text="Data Analysis" tone="red" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-xl">
                <Crown size={20} className="text-brand-500 mb-2" />
                <div className="text-sm font-extrabold text-ink mb-1">See Your Skill Gaps</div>
                <div className="text-xs text-muted mb-3">Find out exactly what's missing from your resume</div>
                <Link to="/pro" className="flex items-center gap-1.5 bg-brand-500 text-white font-black text-xs px-4 py-2 rounded-full">
                  Go Pro - $1 first week
                </Link>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Bullets */}
      {data.suggested_bullets.length > 0 && (
        <Section icon={PenSquare} title="Resume Bullet Suggestions" testId="bullets-section">
          {pro ? (
            data.suggested_bullets.map((b, i) => (
              <div key={i} data-testid={`bullet-${i}`} className="bg-brand-50/70 rounded-xl p-3 mb-2 last:mb-0">
                {b.before && (
                  <>
                    <div className="text-[10px] font-extrabold tracking-widest text-bad">BEFORE</div>
                    <div className="text-[13px] text-muted italic mt-1 mb-2">{b.before}</div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-extrabold tracking-widest text-good">AFTER</div>
                  <CopyButton text={b.after} />
                </div>
                <div className="text-[14px] text-ink font-semibold leading-relaxed mt-1">{b.after}</div>
              </div>
            ))
          ) : (
            <>
              <div className="relative">
                <div className="bg-brand-50/70 rounded-xl p-3 mb-2 blur-sm pointer-events-none select-none">
                  <div className="text-[10px] font-extrabold tracking-widest text-good">AFTER</div>
                  <div className="text-[14px] text-ink font-semibold leading-relaxed mt-1">
                    Spearheaded cross-functional initiatives resulting in 40% improvement in delivery timelines...
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-xl">
                  <Crown size={20} className="text-brand-500 mb-2" />
                  <div className="text-sm font-extrabold text-ink mb-1">Unlock Resume Bullets</div>
                  <div className="text-xs text-muted mb-3">Get copy-paste ready bullets tailored to this job</div>
                  <Link
                    to="/pro"
                    className="flex items-center gap-1.5 bg-brand-500 text-white font-black text-xs px-4 py-2 rounded-full"
                  >
                    Go Pro - $1 first week
                  </Link>
                </div>
              </div>
            </>
          )}
        </Section>
      )}
      {/* Focus */}
      {data.focus_guidance.length > 0 && (
        <Section icon={Flag} title="What To Focus On" testId="focus-section">
          {pro ? (
            data.focus_guidance.map((f, i) => (
              <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                <div className="flex-1 text-sm text-ink leading-snug">{f}</div>
              </div>
            ))
          ) : (
            <div className="relative">
              <div className="blur-sm pointer-events-none select-none">
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div className="flex-1 text-sm text-ink leading-snug">Highlight your leadership experience in previous roles...</div>
                </div>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div className="flex-1 text-sm text-ink leading-snug">Add quantifiable metrics to your achievements...</div>
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-xl">
                <Crown size={20} className="text-brand-500 mb-2" />
                <div className="text-sm font-extrabold text-ink mb-1">Unlock Your Action Plan</div>
                <div className="text-xs text-muted mb-3">Get a personalized list of exactly what to fix</div>
                <Link to="/pro" className="flex items-center gap-1.5 bg-brand-500 text-white font-black text-xs px-4 py-2 rounded-full">
                  Go Pro - $1 first week
                </Link>
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
