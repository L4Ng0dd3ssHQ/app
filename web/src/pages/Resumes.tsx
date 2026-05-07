import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, FileText, Loader2, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { isPro, getDeviceId } from "../storage";
import { listResumes, createResume, updateResume, deleteResume } from "../api";
import type { SavedResume } from "../types";
import { track } from "../analytics";

export default function Resumes() {
  const navigate = useNavigate();
  const pro = isPro();
  const [items, setItems] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editContent, setEditContent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    if (!pro) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listResumes(getDeviceId());
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setError(null);
    const label = newLabel.trim();
    const content = newContent.trim();
    if (!label) { setError("Give this resume a label (e.g. \u201CSenior PM \u2014 Product\u201D)."); return; }
    if (content.length < 30) { setError("Resume is too short. Paste at least 30 characters."); return; }
    setBusyId("new");
    try {
      const created = await createResume(getDeviceId(), label, content);
      setItems((prev) => [created, ...prev]);
      setNewLabel("");
      setNewContent("");
      setCreating(false);
      track("resume_saved", { chars: content.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save resume.");
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (r: SavedResume) => {
    setEditingId(r.id);
    setEditLabel(r.label);
    setEditContent(r.content);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setError(null);
    const label = editLabel.trim();
    const content = editContent.trim();
    if (!label) { setError("Label cannot be empty."); return; }
    if (content.length < 30) { setError("Resume must be at least 30 chars."); return; }
    setBusyId(editingId);
    try {
      const updated = await updateResume(editingId, getDeviceId(), { label, content });
      setItems((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      setEditingId(null);
      track("resume_updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update resume.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this resume? This can\u2019t be undone.")) return;
    setBusyId(id);
    try {
      await deleteResume(id, getDeviceId());
      setItems((prev) => prev.filter((r) => r.id !== id));
      track("resume_deleted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete resume.");
    } finally {
      setBusyId(null);
    }
  };

  if (!pro) {
    return (
      <div className="px-4 lg:px-10 pt-6" data-testid="resumes-locked-screen">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted hover:text-brand-500 mb-3">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="bg-white rounded-3xl shadow-card p-6 lg:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Crown size={28} className="text-brand-500" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-ink mb-2">Saved Resumes is a Pro feature</h2>
          <p className="text-sm text-muted leading-snug max-w-md mx-auto mb-5">
            Save up to 25 versions of your resume and one-click reuse them on every analysis. Use code <span className="font-black text-brand-500">LANDIT1</span> for $1 this May.
          </p>
          <Link to="/pro" data-testid="resumes-upgrade-btn" className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-black tracking-wider text-sm px-6 py-3 rounded-xl">
            <Crown size={16} /> GO PRO — $1 THIS MONTH
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-10 pt-6 pb-10" data-testid="resumes-screen">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted hover:text-brand-500 mb-3">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-ink flex items-center gap-2">
            <FileText size={26} className="text-brand-500" /> Saved Resumes
          </h2>
          <p className="text-xs text-muted mt-0.5">{items.length} saved · up to 25 per device</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            data-testid="new-resume-btn"
            className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-full"
          >
            <Plus size={14} /> NEW RESUME
          </button>
        )}
      </div>

      {error && (
        <div data-testid="resumes-error" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-3">{error}</div>
      )}

      {creating && (
        <div data-testid="new-resume-form" className="bg-white rounded-2xl shadow-card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-extrabold text-ink">New Resume</label>
            <button onClick={() => { setCreating(false); setNewLabel(""); setNewContent(""); setError(null); }} className="text-muted hover:text-ink">
              <X size={18} />
            </button>
          </div>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Senior PM \u2014 Product)"
            maxLength={80}
            className="w-full bg-brand-50/50 rounded-xl p-3 text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-brand-300 mb-2"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Paste your resume text here..."
            rows={8}
            className="w-full bg-brand-50/50 rounded-xl p-3 text-sm leading-relaxed text-ink outline-none focus:ring-2 focus:ring-brand-300 resize-y min-h-[160px]"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-[11px] text-muted">{newContent.length} chars</div>
            <button
              onClick={handleCreate}
              disabled={busyId === "new"}
              data-testid="save-new-resume-btn"
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-black tracking-wider text-xs px-5 py-2.5 rounded-full"
            >
              {busyId === "new" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              SAVE
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10 text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : items.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <FileText size={42} className="text-brand-500" />
          </div>
          <h3 className="text-xl font-extrabold text-ink">No saved resumes yet</h3>
          <p className="text-sm text-muted mt-1.5 mb-5">Save a resume so you can one-click reuse it for every analysis.</p>
          <button
            onClick={() => setCreating(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-black tracking-wider text-sm px-7 py-3 rounded-xl"
          >
            CREATE FIRST RESUME
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((r) => (
            <div key={r.id} data-testid={`resume-item-${r.id}`} className="bg-white rounded-2xl shadow-card p-4">
              {editingId === r.id ? (
                <>
                  <input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    maxLength={80}
                    className="w-full bg-brand-50/50 rounded-xl p-3 text-sm font-semibold text-ink outline-none focus:ring-2 focus:ring-brand-300 mb-2"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className="w-full bg-brand-50/50 rounded-xl p-3 text-sm leading-relaxed text-ink outline-none focus:ring-2 focus:ring-brand-300 resize-y min-h-[160px]"
                  />
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button onClick={() => setEditingId(null)} className="text-xs font-bold text-muted hover:text-ink px-3 py-2">
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={busyId === editingId}
                      className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-black tracking-wider text-xs px-5 py-2.5 rounded-full"
                    >
                      {busyId === editingId ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      SAVE
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ink truncate">{r.label}</div>
                      <div className="text-[11px] text-muted mt-1">{r.content.length} chars · updated {new Date(r.updated_at).toLocaleDateString()}</div>
                      <p className="text-sm text-muted leading-snug mt-2 line-clamp-2">{r.content.slice(0, 220)}{r.content.length > 220 ? "\u2026" : ""}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => startEdit(r)} title="Edit" className="w-9 h-9 rounded-full hover:bg-brand-50 flex items-center justify-center text-muted hover:text-brand-700">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} disabled={busyId === r.id} title="Delete" className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center text-muted hover:text-bad disabled:opacity-50">
                        {busyId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}