import type { JobStatus } from "../types";

const STYLES: Record<JobStatus, { bg: string; text: string; label: string }> = {
  saved:        { bg: "bg-brand-50",     text: "text-brand-700",   label: "Saved" },
  applied:      { bg: "bg-blue-50",      text: "text-blue-700",    label: "Applied" },
  interviewing: { bg: "bg-amber-50",     text: "text-amber-700",   label: "Interviewing" },
  offer:        { bg: "bg-emerald-50",   text: "text-emerald-700", label: "Offer" },
  rejected:     { bg: "bg-red-50",       text: "text-red-700",     label: "Rejected" },
};

export function statusLabel(s: JobStatus): string {
  return STYLES[s].label;
}

export default function StatusBadge({ status, size = "md" }: { status: JobStatus; size?: "sm" | "md" }) {
  const s = STYLES[status];
  const cls = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1";
  return (
    <span className={`inline-block ${s.bg} ${s.text} ${cls} rounded-full font-extrabold tracking-wider uppercase`}>
      {s.label}
    </span>
  );
}
