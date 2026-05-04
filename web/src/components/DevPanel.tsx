import { useEffect, useState } from "react";
import { Wrench, Crown, Loader2, X } from "lucide-react";
import { getDeviceId, getProState, setProState } from "../storage";
import { devPromoteToPro, devRevokePro, getDevStatus } from "../api";

const DEV_FLAG_KEY = "landit.devmode.v1";

function isDevModeEnabledLocally(): boolean {
  try {
    return localStorage.getItem(DEV_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function maybeEnableDevModeFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") {
      localStorage.setItem(DEV_FLAG_KEY, "1");
    } else if (params.get("dev") === "0") {
      localStorage.removeItem(DEV_FLAG_KEY);
    }
  } catch { /* ignore */ }
}

export default function DevPanel() {
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<"promote" | "revoke" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    maybeEnableDevModeFromUrl();
    if (!isDevModeEnabledLocally()) return;
    getDevStatus().then((s) => setAvailable(!!s.dev_mode));
  }, []);

  if (!available || hidden) return null;

  const pro = getProState();
  const deviceId = getDeviceId();

  const promote = async () => {
    setBusy("promote"); setErr(null); setMsg(null);
    try {
      const r = await devPromoteToPro(deviceId, 30);
      setProState({ is_pro: true, pro_until: r.pro_until });
      setMsg(`Promoted to Pro until ${new Date(r.pro_until).toLocaleDateString()}.`);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Promote failed.");
    } finally {
      setBusy(null);
    }
  };

  const revoke = async () => {
    setBusy("revoke"); setErr(null); setMsg(null);
    try {
      await devRevokePro(deviceId);
      setProState({ is_pro: false, pro_until: null });
      setMsg("Pro revoked on this device.");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Revoke failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      data-testid="dev-panel"
      className="mt-6 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-amber-700" />
          <div className="text-[11px] font-extrabold tracking-widest text-amber-700">DEV PANEL</div>
        </div>
        <button
          onClick={() => setHidden(true)}
          title="Hide for this session"
          className="text-amber-700 hover:text-amber-900"
        >
          <X size={14} />
        </button>
      </div>
      <div className="text-xs text-amber-900 leading-snug mb-3">
        Available because backend has <code className="font-mono">LANDIT_DEV_MODE=true</code>. Hidden in production. Add <code className="font-mono">?dev=1</code> to any URL to re-enable; <code className="font-mono">?dev=0</code> to disable.
      </div>
      <div className="text-[11px] text-amber-900 mb-2">
        <span className="font-bold">Device ID:</span> <span className="font-mono">{deviceId.slice(0, 12)}…</span>
        <br />
        <span className="font-bold">Pro:</span> {pro.is_pro ? <span className="text-emerald-700 font-extrabold">ACTIVE</span> : <span className="text-amber-700">inactive</span>}
        {pro.pro_until && <> · until {new Date(pro.pro_until).toLocaleDateString()}</>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={promote}
          disabled={busy !== null}
          data-testid="dev-promote-btn"
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-black tracking-wider text-xs px-4 py-2 rounded-full"
        >
          {busy === "promote" ? <Loader2 size={12} className="animate-spin" /> : <Crown size={12} />}
          PROMOTE TO PRO (30d)
        </button>
        {pro.is_pro && (
          <button
            onClick={revoke}
            disabled={busy !== null}
            data-testid="dev-revoke-btn"
            className="flex items-center gap-1.5 bg-white border-2 border-amber-600 text-amber-700 font-black tracking-wider text-xs px-4 py-2 rounded-full hover:bg-amber-100"
          >
            {busy === "revoke" ? <Loader2 size={12} className="animate-spin" /> : null}
            REVOKE PRO
          </button>
        )}
      </div>
      {msg && <div className="mt-2 text-xs font-bold text-emerald-700">{msg}</div>}
      {err && <div className="mt-2 text-xs font-bold text-red-700">{err}</div>}
    </div>
  );
}