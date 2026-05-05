import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { createCheckout } from "../api";
import { getDeviceId, getProState } from "../storage";
import { track } from "../analytics";

const FEATURES = [
  "Unlimited daily analyses (no 3/day cap)",
  "Save resumes & re-use across analyses",
  "Job tracker — never lose a posting",
  "Export results as PDF",
  "Cancel any time, 30-day pass",
];

export default function Pro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pro = getProState();

  const onCheckout = async () => {
    setError(null);
    setLoading(true);
    track("pro_checkout_started");
    try {
      const deviceId = getDeviceId();
      const originUrl = window.location.origin;
      const { url } = await createCheckout(deviceId, originUrl);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-10 pt-6 pb-10" data-testid="pro-screen">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted hover:text-brand-500 mb-3"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="rounded-3xl p-6 lg:p-10 mb-5 lg:mb-0 shadow-card text-white"
             style={{ background: "linear-gradient(135deg, #A67285 0%, #4c333e 50%, #351e28 100%)" }}>
          <div className="text-[11px] font-extrabold tracking-[0.3em] opacity-90 mb-2">LANDIT PRO</div>
          <h1 className="text-3xl lg:text-5xl font-black leading-tight mb-4">
            Land more interviews. <br className="hidden lg:block" />Land them faster.
          </h1>
          <p className="text-sm lg:text-base leading-snug text-brand-50/95 mb-6">
            Drop the 3/day limit, save your resume, track every application, and get every analysis in seconds.
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-5xl font-black">$7</div>
            <div className="text-sm text-brand-50/90">/ 30 days</div>
          </div>
          <div className="text-[12px] text-brand-50/80 mb-6">One-time charge. Auto-renews never.</div>

          {pro.is_pro ? (
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-black tracking-wider text-sm px-5 py-3 rounded-xl"
            >
              <Sparkles size={18} /> YOU'RE PRO — START ANALYZING
            </Link>
          ) : (
            <button
              onClick={onCheckout}
              disabled={loading}
              data-testid="checkout-btn"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-black tracking-wider text-sm px-6 py-3.5 rounded-xl active:scale-95 transition disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {loading ? "OPENING CHECKOUT…" : "GO PRO — $7"}
            </button>
          )}
          {error && <div className="text-sm text-red-200 bg-red-900/30 rounded p-2 mt-3">{error}</div>}
        </div>

        <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-card">
          <div className="text-[11px] font-extrabold tracking-[0.15em] text-muted mb-3">EVERYTHING IN PRO</div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-sm text-ink leading-snug">{f}</span>
              </li>
            ))}
          </ul>

          {pro.pro_until && (
            <div className="mt-5 rounded-xl bg-brand-50 text-brand-700 px-3 py-2 text-xs font-semibold">
              Pro active until {new Date(pro.pro_until).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
