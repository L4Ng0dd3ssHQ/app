import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { getCheckoutStatus } from "../api";
import { setProState } from "../storage";
import { track } from "../analytics";

type Phase = "polling" | "success" | "failed" | "expired";

export default function ProSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [phase, setPhase] = useState<Phase>("polling");
  const [proUntil, setProUntil] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setPhase("failed");
      setError("Missing session id");
      return;
    }
    const MAX_ATTEMPTS = 15;
    const INTERVAL = 2000;

    const poll = async () => {
      if (stoppedRef.current) return;
      attemptsRef.current += 1;
      try {
        const s = await getCheckoutStatus(sessionId);
        if (s.payment_status === "paid" && s.fulfilled) {
          setProState({ is_pro: true, pro_until: s.pro_until });
          setProUntil(s.pro_until);
          setPhase("success");
          track("pro_checkout_succeeded");
          stoppedRef.current = true;
          return;
        }
        if (s.status === "expired") {
          setPhase("expired");
          stoppedRef.current = true;
          return;
        }
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setPhase("failed");
          setError("Payment status check timed out. Refresh the page or check your email.");
          stoppedRef.current = true;
          return;
        }
        setTimeout(poll, INTERVAL);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setPhase("failed");
          stoppedRef.current = true;
          return;
        }
        setTimeout(poll, INTERVAL);
      }
    };
    poll();
    return () => { stoppedRef.current = true; };
  }, [sessionId]);

  return (
    <div className="px-4 pt-12 pb-10 flex flex-col items-center text-center" data-testid="pro-success-screen">
      {phase === "polling" && (
        <>
          <Loader2 size={56} className="text-brand-500 animate-spin mb-4" />
          <h1 className="text-2xl font-extrabold text-ink">Confirming your payment…</h1>
          <p className="text-sm text-muted mt-2 max-w-xs">Hang tight — this usually takes 5–10 seconds.</p>
        </>
      )}
      {phase === "success" && (
        <>
          <CheckCircle2 size={64} className="text-good mb-4" />
          <h1 className="text-3xl font-black text-ink">You're Pro!</h1>
          <p className="text-sm text-muted mt-2 max-w-sm">
            Unlimited analyses unlocked{proUntil ? ` until ${new Date(proUntil).toLocaleDateString()}` : ""}.
          </p>
          <Link
            to="/analyze"
            data-testid="pro-success-cta"
            className="mt-6 inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black tracking-widest text-sm px-6 py-3.5 rounded-xl"
          >
            <Sparkles size={18} /> ANALYZE A JOB NOW
          </Link>
        </>
      )}
      {phase === "expired" && (
        <>
          <XCircle size={56} className="text-warn mb-4" />
          <h1 className="text-2xl font-extrabold text-ink">Session expired</h1>
          <p className="text-sm text-muted mt-2 max-w-sm">The checkout timed out. You can try again any time.</p>
          <Link to="/pro" className="mt-6 bg-brand-500 hover:bg-brand-600 text-white font-black tracking-wider text-sm px-5 py-3 rounded-xl">
            TRY AGAIN
          </Link>
        </>
      )}
      {phase === "failed" && (
        <>
          <XCircle size={56} className="text-bad mb-4" />
          <h1 className="text-2xl font-extrabold text-ink">Couldn't confirm payment</h1>
          <p className="text-sm text-muted mt-2 max-w-sm">{error || "Something went wrong."}</p>
          <Link to="/pro" className="mt-6 bg-brand-500 hover:bg-brand-600 text-white font-black tracking-wider text-sm px-5 py-3 rounded-xl">
            BACK TO PRO
          </Link>
        </>
      )}
    </div>
  );
}
