import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Building2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  MapPin,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { createSavedJob, listSavedJobs, updateSavedJob } from "../api";
import { getDeviceId, isPro } from "../storage";
import type { SavedJob } from "../types";
import {
  createJobHandoff,
  placeholderJobs,
  statusLabels,
  storeJobHandoff,
  type JobPosting,
  type JobStatus,
} from "../jobSearchData";

function formatCardLocation(job: JobPosting) {
  if (job.location.toLowerCase() === "remote") return "Remote";
  return `${job.remoteType} in ${job.location}`;
}

function savedJobInput(job: JobPosting, deviceId: string) {
  return {
    device_id: deviceId,
    source: job.source,
    source_id: job.id,
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
    status: "saved" as JobStatus,
    notes: "",
  };
}

function sameJob(saved: SavedJob, job: JobPosting) {
  return saved.sourceUrl === job.sourceUrl || (saved.source_id === job.id && saved.source === job.source);
}

export default function JobSearch() {
  const navigate = useNavigate();
  const pro = isPro();
  const [selectedJobId, setSelectedJobId] = useState(placeholderJobs[0].id);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savingJob, setSavingJob] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const [trackerMessage, setTrackerMessage] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [appliedDraft, setAppliedDraft] = useState("");
  const [followUpDraft, setFollowUpDraft] = useState("");
  const selectedJob = useMemo(
    () => placeholderJobs.find((job) => job.id === selectedJobId) ?? placeholderJobs[0],
    [selectedJobId]
  );
  const selectedSavedJob = savedJobs.find((job) => sameJob(job, selectedJob)) || null;

  useEffect(() => {
    if (!pro) return;
    listSavedJobs(getDeviceId())
      .then(setSavedJobs)
      .catch((e) => setTrackerError(e instanceof Error ? e.message : "Could not load saved jobs."));
  }, [pro]);

  useEffect(() => {
    setNotesDraft(selectedSavedJob?.notes || "");
    setAppliedDraft(selectedSavedJob?.applied_at || "");
    setFollowUpDraft(selectedSavedJob?.follow_up_at || "");
    setTrackerError(null);
    setTrackerMessage(null);
  }, [selectedSavedJob?.id]);

  const upsertSavedJob = (job: SavedJob) => {
    setSavedJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
  };

  const saveSelectedJob = async () => {
    if (!pro) {
      navigate("/pro");
      return;
    }
    setSavingJob(true);
    setTrackerError(null);
    setTrackerMessage(null);
    try {
      const saved = await createSavedJob(savedJobInput(selectedJob, getDeviceId()));
      upsertSavedJob(saved);
      setTrackerMessage("Job saved. You can now track status, notes, and follow-up dates.");
    } catch (e) {
      setTrackerError(e instanceof Error ? e.message : "Could not save this job.");
    } finally {
      setSavingJob(false);
    }
  };

  const updateSelectedSavedJob = async (data: Partial<Pick<SavedJob, "status" | "notes" | "applied_at" | "follow_up_at">>) => {
    if (!selectedSavedJob) return null;
    setTrackerError(null);
    setTrackerMessage(null);
    try {
      const updated = await updateSavedJob(selectedSavedJob.id, getDeviceId(), data);
      upsertSavedJob(updated);
      return updated;
    } catch (e) {
      setTrackerError(e instanceof Error ? e.message : "Could not update this saved job.");
      return null;
    }
  };

  const saveTrackerDetails = async () => {
    const updated = await updateSelectedSavedJob({
      applied_at: appliedDraft || null,
      follow_up_at: followUpDraft || null,
      notes: notesDraft,
    });
    if (updated) setTrackerMessage("Tracker details saved.");
  };

  return (
    <div className="pb-12" data-testid="job-search-screen">
      <section className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <div className="inline-flex rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
                Job Search
              </div>
              <div className="inline-flex rounded-lg bg-[#FFF3CF] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-ink">
                External search coming soon
              </div>
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Find the role, then build the application around it.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              This shell frames the full job workflow: search, review, save, match, tailor, and track. Placeholder jobs are using the same shape a live provider will use later.
            </p>
          </div>
          <Link
            to="/analyze"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
          >
            Paste a posting <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_0.8fr_auto]">
          <label className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-[#DCD6E5] bg-[#F8F7FA] px-4 py-3 opacity-75">
            <Search size={21} className="text-muted" />
            <input
              className="w-full cursor-not-allowed bg-transparent text-base font-semibold text-ink outline-none placeholder:text-muted"
              placeholder="Job title, company, or skill"
              aria-label="Search by title, company, or skill"
              disabled
            />
          </label>
          <label className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-[#DCD6E5] bg-[#F8F7FA] px-4 py-3 opacity-75">
            <MapPin size={21} className="text-muted" />
            <input
              className="w-full cursor-not-allowed bg-transparent text-base font-semibold text-ink outline-none placeholder:text-muted"
              placeholder="City, state, or remote"
              aria-label="City, state, or remote"
              disabled
            />
          </label>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#ECE8F1] px-6 py-3 text-sm font-black text-muted"
          >
            Search soon
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Remote", "Date posted", "Salary", "Full-time", "Contract"].map((filter) => (
            <button
              key={filter}
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-[#DCD6E5] bg-white px-4 py-2 text-sm font-black text-muted opacity-70"
            >
              {filter}
              <SlidersHorizontal size={15} />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-lg border border-[#E2DDEA] bg-white shadow-card">
          <div className="border-b border-[#EEEAF3] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">Matches your preferences</div>
                <h2 className="mt-1 text-2xl font-black text-ink">Sample job results</h2>
              </div>
              <button
                type="button"
                disabled
                className="h-10 w-10 cursor-not-allowed rounded-lg border border-[#DCD6E5] text-muted flex items-center justify-center opacity-60"
                aria-label="Filter jobs coming soon"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#EEEAF3]">
            {placeholderJobs.map((job) => {
              const selected = job.id === selectedJob.id;
              const saved = savedJobs.some((item) => sameJob(item, job));
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setExpandedDescription(false);
                  }}
                  className={`w-full p-5 text-left transition hover:bg-brand-50/60 ${
                    selected ? "border-l-4 border-brand-500 bg-brand-50/70" : "border-l-4 border-transparent bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-black leading-tight text-ink">{job.title}</div>
                      <div className="mt-3 space-y-1 text-sm font-semibold text-muted">
                        <div className="inline-flex items-center gap-2">
                          <Building2 size={16} />
                          {job.company}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          {formatCardLocation(job)}
                        </div>
                      </div>
                    </div>
                    <Bookmark size={22} className={saved || selected ? "text-brand-500" : "text-muted"} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
                      <CheckCircle2 size={16} />
                      {job.salary}
                    </span>
                    <span className="rounded-lg bg-[#F1EFF5] px-3 py-2 text-sm font-black text-muted">{job.employmentType}</span>
                    <span className="rounded-lg bg-[#F1EFF5] px-3 py-2 text-sm font-black text-muted">{job.schedule}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <article className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card lg:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">{selectedJob.source}</div>
                <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight text-ink">{selectedJob.title}</h2>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-base font-semibold text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    {selectedJob.company}
                    <ExternalLink size={16} />
                  </span>
                  <span>|</span>
                  <span>{selectedJob.location}</span>
                  <span>|</span>
                  <span>{selectedJob.remoteType}</span>
                </div>
                <div className="mt-2 text-xl font-bold text-muted">{selectedJob.salary}</div>
              </div>
              <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-black text-brand-500">{selectedJob.postedAt}</div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#ECE8F1] px-5 py-3 text-sm font-black text-muted"
                title="Live apply links will be wired with external job search."
              >
                Apply on company site <ExternalLink size={17} />
              </button>
              <button
                type="button"
                onClick={saveSelectedJob}
                disabled={savingJob}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black ${
                  selectedSavedJob
                    ? "border-brand-200 bg-brand-50 text-brand-500"
                    : "border-[#DCD6E5] bg-white text-ink hover:bg-brand-50"
                } disabled:opacity-70`}
              >
                <Bookmark size={18} />
                {savingJob ? "Saving..." : selectedSavedJob ? "Saved job" : "Save job"}
              </button>
              {selectedSavedJob && (
                <Link
                  to="/tracker"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm font-black text-brand-500 hover:bg-brand-50"
                >
                  Open tracker <ArrowRight size={17} />
                </Link>
              )}
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-[#DCD6E5] bg-white px-4 py-3 text-sm font-black text-muted opacity-70"
                aria-label="Share job coming soon"
              >
                <Share2 size={18} />
              </button>
            </div>
            {trackerError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                {trackerError}
              </div>
            )}

            <div className="mt-6 border-t border-[#EEEAF3] pt-5">
              <h3 className="text-xl font-black text-ink">About this role</h3>
              <p className="mt-3 text-base font-semibold leading-7 text-muted">
                {expandedDescription ? selectedJob.description : selectedJob.shortDescription}
              </p>
              <button
                type="button"
                onClick={() => setExpandedDescription((current) => !current)}
                className="mt-3 text-sm font-black text-brand-500 hover:text-brand-600"
              >
                {expandedDescription ? "Show less" : "See full description"}
              </button>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
                <Sparkles size={16} />
                Match workflow
              </div>
              <h3 className="mt-2 text-xl font-black text-ink">Match this job to a resume</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Pick a saved/imported resume later; for now this sends the selected description into the existing analyzer.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/analyze?jobHandoff=1&jobId=${selectedJob.id}${selectedSavedJob ? `&savedJobId=${selectedSavedJob.id}` : ""}`}
                  state={{ jd: selectedJob.description }}
                  onClick={() => storeJobHandoff(selectedJob)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-black text-white hover:bg-brand-600"
                >
                  Match this job <ArrowRight size={17} />
                </Link>
                <Link
                  to={`/resumes?mode=select-for-job&jobHandoff=1&jobId=${selectedJob.id}${selectedSavedJob ? `&savedJobId=${selectedSavedJob.id}` : ""}`}
                  state={createJobHandoff(selectedJob)}
                  onClick={() => storeJobHandoff(selectedJob)}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm font-black text-brand-500 hover:bg-brand-50"
                >
                  Use saved resume
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
                <FileText size={16} />
                Builder workflow
              </div>
              <h3 className="mt-2 text-xl font-black text-ink">Build application materials</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                Start a tailored resume or cover letter with this posting attached as context.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/resume-builder/workspace?mode=job-description&jobHandoff=1&jobId=${selectedJob.id}`}
                  state={createJobHandoff(selectedJob)}
                  onClick={() => storeJobHandoff(selectedJob)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-black text-white hover:bg-brand-600"
                >
                  Create tailored resume
                </Link>
                <Link
                  to={`/resume-builder/workspace?mode=improve&jobHandoff=1&jobId=${selectedJob.id}`}
                  state={createJobHandoff(selectedJob)}
                  onClick={() => storeJobHandoff(selectedJob)}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm font-black text-brand-500 hover:bg-brand-50"
                >
                  Improve existing resume
                </Link>
                <Link
                  to={`/resume-builder/workspace?mode=cover-letter&tab=cover&jobHandoff=1&jobId=${selectedJob.id}`}
                  state={createJobHandoff(selectedJob, "cover")}
                  onClick={() => storeJobHandoff(selectedJob, "cover")}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm font-black text-brand-500 hover:bg-brand-50"
                >
                  Generate cover letter
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
                  <ClipboardList size={16} />
                  Application tracker
                </div>
                <h3 className="mt-2 text-xl font-black text-ink">Saved job workflow</h3>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">
                  This panel belongs to the selected job above. Status saves immediately; notes and dates save with the button below.
                </p>
              </div>
              {selectedSavedJob ? (
                <div className="inline-flex rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                  Tracking selected job
                </div>
              ) : (
                <button
                  type="button"
                  onClick={saveSelectedJob}
                  className="inline-flex rounded-lg bg-brand-500 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-white hover:bg-brand-600"
                >
                  Save to track
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {(Object.keys(statusLabels) as JobStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={!selectedSavedJob}
                  onClick={async () => {
                    const updated = await updateSelectedSavedJob({ status });
                    if (updated) setTrackerMessage("Status updated.");
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-black disabled:cursor-not-allowed ${
                    selectedSavedJob?.status === status
                      ? "bg-brand-500 text-white"
                      : "border border-[#DCD6E5] bg-white text-muted disabled:opacity-70"
                  }`}
                >
                  {statusLabels[status]}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-muted">Applied date</span>
                <input
                  type="date"
                  value={appliedDraft}
                  disabled={!selectedSavedJob}
                  onChange={(e) => setAppliedDraft(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-[#DCD6E5] bg-white px-3 py-3 text-sm font-bold text-ink outline-none disabled:cursor-not-allowed disabled:bg-[#F8F7FA] disabled:text-muted"
                />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-muted">Follow-up reminder</span>
                <input
                  type="date"
                  value={followUpDraft}
                  disabled={!selectedSavedJob}
                  onChange={(e) => setFollowUpDraft(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-[#DCD6E5] bg-white px-3 py-3 text-sm font-bold text-ink outline-none disabled:cursor-not-allowed disabled:bg-[#F8F7FA] disabled:text-muted"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-muted">Notes</span>
              <textarea
                value={notesDraft}
                disabled={!selectedSavedJob}
                onChange={(e) => setNotesDraft(e.target.value)}
                className="mt-2 min-h-[96px] w-full rounded-lg border border-[#DCD6E5] bg-white p-3 text-sm font-semibold text-ink outline-none disabled:cursor-not-allowed disabled:bg-[#F8F7FA] disabled:text-muted"
                placeholder={selectedSavedJob ? "Add notes, contacts, next steps, or interview prep." : "Save this job to add tracker notes."}
              />
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!selectedSavedJob || savingJob}
                onClick={saveTrackerDetails}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-black text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-[#ECE8F1] disabled:text-muted"
              >
                Save tracker details
              </button>
              {selectedSavedJob && (
                <Link
                  to="/tracker"
                  className="inline-flex items-center justify-center rounded-lg border border-brand-200 bg-white px-4 py-3 text-sm font-black text-brand-500 hover:bg-brand-50"
                >
                  Open full tracker
                </Link>
              )}
              {trackerMessage && <span className="text-sm font-black text-emerald-700">{trackerMessage}</span>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
