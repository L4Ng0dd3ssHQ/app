import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { deleteSavedJob, listSavedJobs, updateSavedJob } from "../api";
import { getDeviceId, isPro } from "../storage";
import type { JobStatus, SavedJob } from "../types";
import { createJobHandoff, statusLabels, storeJobHandoff, type JobPosting } from "../jobSearchData";

const columns: JobStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];

function asJobPosting(job: SavedJob): JobPosting {
  return {
    id: job.source_id || job.id,
    source: job.source,
    sourceUrl: job.sourceUrl,
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    employmentType: job.employmentType,
    remoteType: job.remoteType,
    schedule: job.schedule,
    postedAt: job.postedAt,
    shortDescription: job.shortDescription,
    description: job.description,
    applyUrl: job.applyUrl,
    status: job.status,
  };
}

export default function Tracker() {
  const pro = isPro();
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(pro);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      columns.reduce<Record<JobStatus, SavedJob[]>>((acc, status) => {
        acc[status] = jobs.filter((job) => job.status === status);
        return acc;
      }, { saved: [], applied: [], interviewing: [], offer: [], rejected: [] }),
    [jobs]
  );

  const refresh = async () => {
    if (!pro) return;
    setLoading(true);
    setError(null);
    try {
      setJobs(await listSavedJobs(getDeviceId()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load saved jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pro]);

  const replaceJob = (updated: SavedJob) => {
    setJobs((current) => current.map((job) => (job.id === updated.id ? updated : job)));
  };

  const changeStatus = async (job: SavedJob, status: JobStatus) => {
    setBusyId(job.id);
    setError(null);
    try {
      replaceJob(await updateSavedJob(job.id, getDeviceId(), { status }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update job status.");
    } finally {
      setBusyId(null);
    }
  };

  const saveField = async (job: SavedJob, data: Partial<Pick<SavedJob, "notes" | "applied_at" | "follow_up_at">>) => {
    setBusyId(job.id);
    setError(null);
    try {
      replaceJob(await updateSavedJob(job.id, getDeviceId(), data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update saved job.");
    } finally {
      setBusyId(null);
    }
  };

  const removeJob = async (job: SavedJob) => {
    if (!window.confirm("Delete this saved job?")) return;
    setBusyId(job.id);
    try {
      await deleteSavedJob(job.id, getDeviceId());
      setJobs((current) => current.filter((item) => item.id !== job.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete saved job.");
    } finally {
      setBusyId(null);
    }
  };

  if (!pro) {
    return (
      <div className="rounded-lg border border-[#E2DDEA] bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <Bookmark size={30} />
        </div>
        <h1 className="mt-4 text-3xl font-black text-ink">Application Tracker is Pro</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-muted">
          Save jobs, track application status, attach resumes, and keep follow-up notes across your search.
        </p>
        <Link
          to="/pro"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-black text-white hover:bg-brand-600"
        >
          Unlock tracker <ArrowRight size={17} />
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-12" data-testid="tracker-screen">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
            Application Tracker
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-ink">Track every saved job.</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-muted">
            Move jobs through your pipeline, keep notes, and jump back into matching, tailoring, or cover letters.
          </p>
        </div>
        <Link
          to="/job-search"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
        >
          Find jobs <ArrowRight size={17} />
        </Link>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-[#E2DDEA] bg-white p-10 text-sm font-black text-muted shadow-card">
          <Loader2 size={18} className="animate-spin" />
          Loading saved jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border border-[#E2DDEA] bg-white p-8 text-center shadow-card">
          <h2 className="text-2xl font-black text-ink">No saved jobs yet</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Save a job from Job Search and it will appear here.</p>
          <Link
            to="/job-search"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
          >
            Go to Job Search <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-5">
            {columns.map((status) => (
              <div key={status} className="rounded-lg border border-[#E2DDEA] bg-white p-4 shadow-card">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-muted">{statusLabels[status]}</div>
                <div className="mt-2 text-3xl font-black text-ink">{grouped[status].length}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#E2DDEA] bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEAF3] pb-4">
              <div>
                <h2 className="text-2xl font-black text-ink">Application pipeline</h2>
                <p className="mt-1 text-sm font-semibold text-muted">Drag-and-drop can come later; for now, use each card's status menu to move it through the board.</p>
              </div>
              <span className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-500">
                {jobs.length} saved
              </span>
            </div>
            <div className="mt-4 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-4">
          {columns.map((status) => (
            <section key={status} className="flex min-h-[420px] w-[310px] flex-none flex-col rounded-lg border border-[#E2DDEA] bg-[#FBFAFD]">
              <div className="border-b border-[#EEEAF3] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black text-ink">{statusLabels[status]}</h2>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-black text-brand-500">{grouped[status].length}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 p-3">
                {grouped[status].length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#DCD6E5] bg-white p-4 text-sm font-semibold leading-6 text-muted">
                    No jobs here yet.
                  </div>
                )}
                {grouped[status].map((job) => {
                  const posting = asJobPosting(job);
                  return (
                    <article key={job.id} className="rounded-lg border border-[#E2DDEA] bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black leading-tight text-ink">{job.title}</h3>
                          <p className="mt-1 text-sm font-bold text-muted">{job.company}</p>
                          <p className="mt-1 text-xs font-semibold text-muted">{job.location}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeJob(job)}
                          className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"
                          aria-label="Delete saved job"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.salary && <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-800">{job.salary}</span>}
                        {job.employmentType && <span className="rounded-lg bg-[#F1EFF5] px-2.5 py-1.5 text-xs font-black text-muted">{job.employmentType}</span>}
                      </div>
                      <div className="mt-3 grid gap-2">
                        <select
                          value={job.status}
                          disabled={busyId === job.id}
                          onChange={(e) => changeStatus(job, e.target.value as JobStatus)}
                          className="min-h-10 rounded-lg border border-[#DCD6E5] bg-white px-3 text-sm font-black text-ink"
                        >
                          {columns.map((item) => (
                            <option key={item} value={item}>{statusLabels[item]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.resume_label && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-black text-brand-500">
                            <FileText size={13} />
                            {job.resume_label}
                          </span>
                        )}
                        {job.analysis_id && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-black text-brand-500">
                            <Sparkles size={13} />
                            Analysis attached
                          </span>
                        )}
                        {job.follow_up_at && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#FFF3CF] px-2.5 py-1.5 text-xs font-black text-ink">
                            <CalendarClock size={13} />
                            {job.follow_up_at}
                          </span>
                        )}
                      </div>
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-black text-brand-500">Notes and details</summary>
                        <div className="mt-3 grid gap-2">
                          <textarea
                            defaultValue={job.notes}
                            onBlur={(e) => saveField(job, { notes: e.target.value })}
                            className="min-h-[78px] rounded-lg border border-[#DCD6E5] bg-white p-3 text-sm font-semibold text-ink outline-none focus:border-brand-300"
                            placeholder="Notes, contacts, next steps..."
                          />
                          <div className="grid gap-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted">
                              Applied
                              <input
                                type="date"
                                defaultValue={job.applied_at || ""}
                                onBlur={(e) => saveField(job, { applied_at: e.target.value || null })}
                                className="mt-1 min-h-10 w-full rounded-lg border border-[#DCD6E5] bg-white px-3 text-sm font-bold text-ink"
                              />
                            </label>
                            <label className="text-[11px] font-black uppercase tracking-[0.12em] text-muted">
                              Follow-up
                              <input
                                type="date"
                                defaultValue={job.follow_up_at || ""}
                                onBlur={(e) => saveField(job, { follow_up_at: e.target.value || null })}
                                className="mt-1 min-h-10 w-full rounded-lg border border-[#DCD6E5] bg-white px-3 text-sm font-bold text-ink"
                              />
                            </label>
                          </div>
                          <p className="text-sm font-semibold leading-6 text-muted">{job.description || job.shortDescription}</p>
                        </div>
                      </details>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={`/analyze?jobHandoff=1&jobId=${posting.id}&savedJobId=${job.id}`}
                          state={{ jd: job.description }}
                          onClick={() => storeJobHandoff(posting)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-500 px-3 py-2 text-xs font-black text-white hover:bg-brand-600"
                        >
                          Match <ArrowRight size={14} />
                        </Link>
                        <Link
                          to={`/resumes?mode=select-for-job&jobHandoff=1&jobId=${posting.id}&savedJobId=${job.id}`}
                          state={createJobHandoff(posting)}
                          onClick={() => storeJobHandoff(posting)}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-black text-brand-500 hover:bg-brand-50"
                        >
                          Use resume
                        </Link>
                        <Link
                          to={`/resume-builder/workspace?mode=cover-letter&tab=cover&jobHandoff=1&jobId=${posting.id}&savedJobId=${job.id}`}
                          state={createJobHandoff(posting, "cover")}
                          onClick={() => storeJobHandoff(posting, "cover")}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-black text-brand-500 hover:bg-brand-50"
                        >
                          Cover letter
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
