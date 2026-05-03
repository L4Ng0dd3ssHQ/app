import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ChevronRight, Clock as ClockIcon } from "lucide-react";
import { clearHistory, deleteAnalysis, loadHistory } from "../storage";
import type { Analysis } from "../types";

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function scoreColor(s: number) {
  if (s >= 75) return "text-good border-good";
  if (s >= 50) return "text-warn border-warn";
  if (s > 0) return "text-bad border-bad";
  return "text-muted border-muted";
}

export default function History() {
  const [items, setItems] = useState<Analysis[]>([]);

  const refresh = () => setItems(loadHistory());
  useEffect(refresh, []);

  const onClearAll = () => {
    if (!window.confirm("Clear all saved analyses? This can't be undone.")) return;
    clearHistory();
    refresh();
  };

  const onDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this analysis?")) return;
    deleteAnalysis(id);
    refresh();
  };

  return (
    <div className="px-4 pt-6" data-testid="history-screen">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-black text-ink">History</h2>
          <p className="text-xs text-muted mt-0.5">{items.length} saved on this device</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={onClearAll}
            data-testid="clear-history-btn"
            className="flex items-center gap-1.5 bg-red-50 text-bad font-bold text-xs px-3 py-2 rounded-full"
          >
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <ClockIcon size={42} className="text-brand-500" />
          </div>
          <h3 className="text-xl font-extrabold text-ink">No analyses yet</h3>
          <p className="text-sm text-muted mt-1.5 mb-5">Run your first analysis and it will appear here.</p>
          <Link
            to="/analyze"
            data-testid="empty-go-analyze-btn"
            className="bg-brand-500 hover:bg-brand-600 text-white font-black tracking-wider text-sm px-7 py-3 rounded-xl"
          >
            ANALYZE A JOB
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/result/${item.id}`}
              data-testid={`history-item-${item.id}`}
              className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-3 hover:shadow-cardLg transition-shadow group"
            >
              <div className={`w-14 h-14 rounded-full border-[3px] flex flex-col items-center justify-center bg-white shrink-0 ${scoreColor(item.match_score)}`}>
                <span className="text-base font-black leading-none">
                  {item.has_resume ? item.match_score : "—"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink line-clamp-2">{item.job_title}</div>
                <div className="text-[11px] text-muted mt-1">
                  {timeAgo(item.created_at)} · {item.required_skills.length} required · {item.missing_skills.length} gaps
                </div>
              </div>
              <button
                onClick={(e) => onDelete(item.id, e)}
                title="Delete"
                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-muted hover:text-bad opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
              <ChevronRight size={18} className="text-muted shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
