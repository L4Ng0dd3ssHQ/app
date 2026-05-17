import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, KeyRound, UserCircle, WalletCards, Zap } from "lucide-react";
import { restorePro } from "../api";
import {
  DAILY_LIMIT,
  getDeviceId,
  getProState,
  quotaStatus,
  setProState,
  type ProState,
} from "../storage";

export default function Account() {
  const quota = quotaStatus();
  const [pro, setPro] = useState<ProState>(() => getProState());
  const [restoreCode, setRestoreCode] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onRestore = async () => {
    const code = restoreCode.trim();
    setMessage(null);
    setError(null);
    if (!code) {
      setError("Enter your restore code.");
      return;
    }
    setRestoring(true);
    try {
      const restored = await restorePro(code, getDeviceId());
      const next = { is_pro: true, pro_until: restored.pro_until };
      setProState(next);
      setPro(next);
      setMessage(`Pro restored on this device (${restored.devices_used}/${restored.device_limit} devices used).`);
      setRestoreCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore Pro. Check the code and try again.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="pb-12" data-testid="account-screen">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
          <div className="h-16 w-16 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center">
            <UserCircle size={34} />
          </div>
          <h1 className="mt-5 text-3xl font-black text-ink">User Profile</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">
            Local account settings for this device. Full user accounts can come later without blocking the new site structure.
          </p>
          <div className="mt-5 rounded-lg bg-[#F7F5FA] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-muted">Profile</div>
            <div className="mt-2 text-2xl font-black text-ink">User</div>
            <div className="mt-1 text-sm font-semibold text-muted">Device profile</div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <Zap size={24} className="text-brand-500" />
            <h2 className="mt-4 text-xl font-black text-ink">Daily usage</h2>
            <p className="mt-2 text-sm font-semibold text-muted">
              {quota.remaining}/{DAILY_LIMIT} free analyses left today.
            </p>
          </div>
          <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <Crown size={24} className="text-brand-500" />
            <h2 className="mt-4 text-xl font-black text-ink">Pro status</h2>
            <p className="mt-2 text-sm font-semibold text-muted">
              {pro.is_pro && pro.pro_until ? `Active until ${new Date(pro.pro_until).toLocaleDateString()}` : "Free plan"}
            </p>
          </div>
          <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card sm:col-span-2">
            <div className="flex items-center gap-2">
              <KeyRound size={22} className="text-brand-500" />
              <h2 className="text-xl font-black text-ink">Restore Pro</h2>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              Already purchased? Enter your restore code to unlock Pro on this device. Restore works on up to 3 devices,
              and your original 7-day or 30-day pass date stays the same.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
                className="min-h-12 flex-1 rounded-lg border border-[#DCD6E5] bg-[#F8F7FA] px-4 text-sm font-bold text-ink outline-none focus:border-brand-300"
                placeholder="Restore code"
                aria-label="Restore code"
              />
              <button
                type="button"
                onClick={onRestore}
                disabled={restoring}
                className="rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-70"
              >
                {restoring ? "Restoring..." : "Restore"}
              </button>
            </div>
            {message && <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</div>}
            {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/pro"
          className="group rounded-lg border border-brand-100 bg-brand-50 p-5 transition-colors hover:bg-brand-100"
        >
          <WalletCards size={24} className="text-brand-500" />
          <h2 className="mt-4 text-xl font-black text-ink">Pricing and Pro</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Review 7-day and 30-day passes, saved resumes, and restore options.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-500">
            View pricing <ArrowRight size={16} />
          </div>
        </Link>
        <Link
          to="/resources"
          className="group rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50"
        >
          <UserCircle size={24} className="text-brand-500" />
          <h2 className="mt-4 text-xl font-black text-ink">Support resources</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Find guides, templates, and job search support.</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-brand-500">
            Open resources <ArrowRight size={16} />
          </div>
        </Link>
      </section>
    </div>
  );
}
