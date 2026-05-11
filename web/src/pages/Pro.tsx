import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles, ArrowLeft, KeyRound } from "lucide-react";
import { createCheckout, restorePro } from "../api";
import { getDeviceId, getProState, setProState, type ProState } from "../storage";
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
  const [restoring, setRestoring] = useState(false);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pro, setPro] = useState<ProState>(() => getProState());

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

  const onRestore = async () => {
    setError(null);
    setRestoreMsg(null);
    const code = restoreCode.trim();
    if (!code) {
      setError("Enter your restore code.");
      return;
    }
    setRestoring(true);
    track("pro_restore_started");
    try {
      const restored = await restorePro(code, getDeviceId());
      setProState({ is_pro: true, pro_until: restored.pro_until });
      setPro({ is_pro: true, pro_until: restored.pro_until });
      setRestoreMsg(`Pro restored on this device (${restored.devices_used}/${restored.device_limit} devices used).`);
      track("pro_restore_succeeded", { devices_used: restored.devices_used });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore Pro. Check the code and try again.");
      track("pro_restore_failed");
    } finally {
      setRestoring(false);
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
             style={{ background: "linear-gradient(135deg, #9B4FD4 0%, #7C2FB8 100%)" }}>
          <div className="text-[11px] font-extrabold tracking-[0.3em] opacity-90 mb-2">LANDIT PRO</div>
          <h1 className="text-3xl lg:text-5xl font-black leading-tight mb-4">
            Land more interviews. <br className="hidden lg:block" />Land them faster.
          </h1>
          <p className="text-sm lg:text-base leading-snug text-brand-50/95 mb-6">
            Drop the 3/day limit, save your resume, track every application, and get every analysis in seconds.
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-5xl font-black">$1 May Deal with code LANDIT1</div>
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
              {loading ? "OPENING CHECKOUT…" : "GO PRO — $1 THIS MONTH Code LANDIT1"}
            </button>
          )}
          {error && <div className="text-sm text-red-200 bg-red-900/30 rounded p-2 mt-3">{error}</div>}
          {restoreMsg && <div className="text-sm text-emerald-100 bg-emerald-900/30 rounded p-2 mt-3">{restoreMsg}</div>}
        </div>

        <div className="space-y-4">
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
        {!pro.is_pro && (
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-card" data-testid="restore-pro-panel">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={18} className="text-brand-500" />
              <div className="text-sm font-extrabold text-ink">Restore Pro</div>
            </div>
            <p className="text-xs text-muted leading-snug mb-3">
              Bought Pro on another device? Enter your restore code to unlock this browser too.
            </p>
            <input
              value={restoreCode}
              onChange={(e) => setRestoreCode(e.target.value.toUpperCase())}
              placeholder="LANDIT-ABCD-1234"
              data-testid="restore-code-input"
              className="w-full bg-brand-50/50 rounded-xl p-3 text-sm font-bold text-ink placeholder-muted/70 outline-none focus:ring-2 focus:ring-brand-300 mb-3"
            />
            <button
              type="button"
              onClick={onRestore}
              disabled={restoring}
              data-testid="restore-pro-btn"
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-70 text-white font-black tracking-wider text-sm px-5 py-3 rounded-xl"
            >
              {restoring ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {restoring ? "RESTORING..." : "RESTORE PRO"}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
