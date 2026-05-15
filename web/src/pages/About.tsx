import { Rocket, ArrowLeftRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="px-4 pt-6 pb-2" data-testid="about-screen">
      <h2 className="text-3xl font-black text-ink mb-4">About</h2>

      <div className="rounded-3xl p-6 mb-4 shadow-card text-white"
           style={{ background: "linear-gradient(135deg, #9B4FD4 0%, #7C2FB8 100%)" }}>
        <div className="text-[11px] font-extrabold tracking-[0.3em] opacity-90 mb-2">LANDIT</div>
        <h3 className="text-2xl font-black leading-tight mb-3">One job posting → one clear plan.</h3>
        <p className="text-sm leading-snug text-brand-50/95">
          Paste any job description and (optionally) your resume. AI returns the skills that matter, your real fit score, gaps, and ready-to-paste resume bullets.
        </p>
      </div>

      <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2">WHO IT'S FOR</div>
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        {[
          { Icon: Rocket, t: "High-volume applicants", s: "Tailor 10× faster" },
          { Icon: ArrowLeftRight, t: "Career changers", s: "See the real gaps before applying" },
          { Icon: GraduationCap, t: "Entry to mid-level", s: "Stop guessing what recruiters want" },
        ].map(({ Icon, t, s }) => (
          <div key={t} className="flex items-center gap-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-extrabold text-ink">{t}</div>
              <div className="text-xs text-muted">{s}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2">PRIVACY</div>
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4 text-sm text-ink leading-relaxed">
        • No account required.<br />
        • Your scans are stored locally in your browser.<br />
        • Job descriptions and resumes are sent to the AI only at the moment of analysis.
      </div>

      <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2">PRICING</div>
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4">
        <div className="flex items-center py-2">
          <div className="flex-1">
            <div className="font-extrabold text-ink">Free</div>
            <div className="text-xs text-muted">3 analyses / day</div>
          </div>
          <div className="text-lg font-black">$0</div>
        </div>
        <div className="h-px bg-brand-50 my-2" />
        <div className="flex items-center py-2">
          <div className="flex-1">
            <div className="font-extrabold text-brand-500">LandIt Pro</div>
            <div className="text-xs text-muted">$7 for 7 days or $19 for 30 days</div>
          </div>
          <div className="text-lg font-black text-brand-500">$7+</div>
        </div>
        <Link
          to="/pro"
          data-testid="pricing-go-pro-btn"
          className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-white font-black tracking-widest text-xs py-3.5 rounded-xl mt-3"
        >
          GO PRO - $1 FIRST WEEK
        </Link>
      </div>

      <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-2 mt-6">RESOURCES</div>
      <div className="bg-white rounded-2xl shadow-card p-5 mb-4">
        <h3 className="font-extrabold text-ink mb-1">Still feeling lost in the job search?</h3>
        <p className="text-sm text-muted leading-snug mb-4">
          Our team put together practical guides covering AI-powered resume optimization, career pivoting,
          and interview prep — designed for real job seekers, not just buzzwords.
        </p>
        <a href="https://landitapp.myshopify.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black tracking-wider text-sm px-5 py-3 rounded-xl">
          Browse Resources →
        </a>
      </div>
      <p className="text-center text-xs text-muted mb-4">v1.0 · Built with care</p>
    </div>
  );
}
