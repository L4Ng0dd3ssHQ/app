import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, KeyRound, Loader2, Sparkles } from "lucide-react";
import { createCheckout, restorePro, type ProPackageId } from "../api";
import { getDeviceId, getProState, setProState, type ProState } from "../storage";
import { track } from "../analytics";

const FEATURES = [
  "Unlimited daily analyses with no 3/day cap",
  "Save resumes and reopen every edited version",
  "Export resumes and results as PDF",
  "Restore Pro on up to 3 devices",
  "One-time passes with no automatic renewal",
];

const PLANS: Array<{
  id: ProPackageId;
  name: string;
  price: string;
  duration: string;
  badge?: string;
  note: string;
  cta: string;
}> = [
  {
    id: "pro_weekly",
    name: "7-day pass",
    price: "$7",
    duration: "7 days",
    badge: "Use LANDIT1 for $1",
    note: "Best for a quick resume sprint, job batch, or one application push.",
    cta: "Start 7-day pass",
  },
  {
    id: "pro_monthly",
    name: "30-day pass",
    price: "$19",
    duration: "30 days",
    note: "Best for a full search cycle with saved resumes, PDF export, and repeated analyses.",
    cta: "Start 30-day pass",
  },
];

export default function Pro() {
  const navigate = useNavigate();
  const [loadingPackage, setLoadingPackage] = useState<ProPackageId | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pro, setPro] = useState<ProState>(() => getProState());

  const onCheckout = async (packageId: ProPackageId) => {
    setError(null);
    setLoadingPackage(packageId);
    track("pro_checkout_started", { package_id: packageId });
    try {
      const deviceId = getDeviceId();
      const originUrl = window.location.origin;
      const { url } = await createCheckout(deviceId, originUrl, packageId);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout. Try again.");
      setLoadingPackage(null);
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
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 lg:px-10" data-testid="pro-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-brand-500"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div
          className="rounded-3xl p-6 text-white shadow-card lg:p-10"
          style={{ background: "linear-gradient(135deg, #9B4FD4 0%, #7C2FB8 100%)" }}
        >
          <div className="mb-2 text-[11px] font-extrabold tracking-[0.3em] opacity-90">LANDIT PRO</div>
          <h1 className="mb-4 text-3xl font-black leading-tight lg:text-5xl">
            Pick the pass that fits your job search.
          </h1>
          <p className="mb-6 text-sm leading-snug text-brand-50/95 lg:text-base">
            Keep the free analyzer, then unlock saved resumes, PDF export, full recommendations, and repeated checks
            whenever you need a focused push.
          </p>
          <div className="rounded-2xl bg-white/12 p-4 text-sm font-bold leading-snug text-white">
            Promo stays simple: use <span className="font-black">LANDIT1</span> for a $1 first week on the 7-day pass.
          </div>
          {pro.is_pro ? (
            <Link
              to="/analyze"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black tracking-wider text-brand-700"
            >
              <Sparkles size={18} /> YOU'RE PRO - START ANALYZING
            </Link>
          ) : null}
          {error && <div className="mt-3 rounded p-2 text-sm text-red-200 bg-red-900/30">{error}</div>}
          {restoreMsg && <div className="mt-3 rounded p-2 text-sm text-emerald-100 bg-emerald-900/30">{restoreMsg}</div>}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {PLANS.map((plan) => {
              const loading = loadingPackage === plan.id;
              return (
                <div key={plan.id} className="rounded-3xl bg-white p-6 shadow-card">
                  <div className="mb-3 flex min-h-7 items-center justify-between gap-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-muted">{plan.name}</div>
                    {plan.badge && (
                      <div className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-brand-700">
                        {plan.badge}
                      </div>
                    )}
                  </div>
                  <div className="mb-1 flex items-end gap-2">
                    <div className="text-5xl font-black text-ink">{plan.price}</div>
                    <div className="pb-2 text-sm font-extrabold text-muted">/ {plan.duration}</div>
                  </div>
                  <p className="mb-5 min-h-14 text-sm font-semibold leading-snug text-muted">{plan.note}</p>
                  <button
                    type="button"
                    onClick={() => onCheckout(plan.id)}
                    disabled={Boolean(loadingPackage)}
                    data-testid={`checkout-${plan.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-black tracking-wider text-white transition hover:bg-brand-600 active:scale-95 disabled:opacity-70"
                  >
                    {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                    {loading ? "Opening checkout..." : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-card lg:p-8">
            <div className="mb-3 text-[11px] font-extrabold tracking-[0.15em] text-muted">EVERYTHING IN PRO</div>
            <ul className="space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-sm leading-snug text-ink">{feature}</span>
                </li>
              ))}
            </ul>

            {pro.pro_until && (
              <div className="mt-5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                Pro active until {new Date(pro.pro_until).toLocaleDateString()}
              </div>
            )}
          </div>

          {!pro.is_pro && (
            <div className="rounded-3xl bg-white p-6 shadow-card lg:p-8" data-testid="restore-pro-panel">
              <div className="mb-2 flex items-center gap-2">
                <KeyRound size={18} className="text-brand-500" />
                <div className="text-sm font-extrabold text-ink">Restore Pro</div>
              </div>
              <p className="mb-3 text-xs leading-snug text-muted">
                Bought Pro on another device? Enter your restore code to unlock this browser too. Restore works on up
                to 3 devices, and the pass still expires on the same 7-day or 30-day date from purchase.
              </p>
              <input
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value.toUpperCase())}
                placeholder="LANDIT-ABCD-1234"
                data-testid="restore-code-input"
                className="mb-3 w-full rounded-xl bg-brand-50/50 p-3 text-sm font-bold text-ink outline-none placeholder:text-muted/70 focus:ring-2 focus:ring-brand-300"
              />
              <button
                type="button"
                onClick={onRestore}
                disabled={restoring}
                data-testid="restore-pro-btn"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-black tracking-wider text-white hover:bg-brand-600 disabled:opacity-70"
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
