import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

const sampleJobs = [
  {
    title: "Network Support Specialist",
    company: "Brightline Systems",
    location: "Remote",
    match: "74%",
  },
  {
    title: "Junior Cloud Administrator",
    company: "Northstar Health",
    location: "Atlanta, GA",
    match: "68%",
  },
  {
    title: "IT Operations Analyst",
    company: "CivicGrid",
    location: "Hybrid",
    match: "81%",
  },
];

export default function JobSearch() {
  return (
    <div className="pb-12" data-testid="job-search-screen">
      <section className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card lg:p-6">
        <div className="mb-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="inline-flex rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
              Job Search
            </div>
            <div className="inline-flex rounded-lg bg-[#FFF3CF] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-ink">
              Coming Soon
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Find roles, then apply with a matched resume.</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
            This first version sets up the search workspace. Use it to frame the workflow, save promising roles, and jump into the analyzer when you have a posting.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <div className="lg:col-span-3 inline-flex w-fit rounded-lg bg-[#FFF3CF] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-ink">
            External job search coming soon
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-[#DCD6E5] bg-[#F8F7FA] px-4 py-3">
            <Search size={21} className="text-muted" />
            <input
              className="w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:text-muted"
              placeholder="Search by title or skill"
              aria-label="Search by title or skill"
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-[#DCD6E5] bg-[#F8F7FA] px-4 py-3">
            <MapPin size={21} className="text-muted" />
            <input
              className="w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:text-muted"
              placeholder="City, state, or remote"
              aria-label="City, state, or remote"
            />
          </label>
          <Link
            to="/analyze"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-black text-white hover:bg-brand-600"
          >
            Match posting <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-ink">Sample saved jobs</h2>
            <button className="h-10 w-10 rounded-lg border border-[#DCD6E5] text-muted flex items-center justify-center" aria-label="Filter jobs">
              <SlidersHorizontal size={18} />
            </button>
          </div>
          <div className="mt-4 divide-y divide-[#EEEAF3]">
            {sampleJobs.map((job) => (
              <div key={job.title} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-black text-ink">{job.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={15} />
                        {job.company}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={15} />
                        {job.location}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-black text-brand-500">{job.match}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/analyze" className="rounded-lg bg-brand-500 px-3 py-2 text-xs font-black text-white">
                    Match resume
                  </Link>
                  <button className="inline-flex items-center gap-1 rounded-lg border border-[#DCD6E5] px-3 py-2 text-xs font-black text-ink">
                    <Bookmark size={14} />
                    Save job
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <BriefcaseBusiness size={24} className="text-brand-500" />
            <h2 className="mt-4 text-xl font-black text-ink">Search to resume</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-muted">
              Keep the job posting connected to the resume version you plan to send.
            </p>
          </div>
          <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <ClipboardCheck size={24} className="text-brand-500" />
            <h2 className="mt-4 text-xl font-black text-ink">Application tracker</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-muted">
              Use saved analyses and statuses as the foundation for tracking applications.
            </p>
          </div>
          <div className="rounded-lg border border-brand-100 bg-brand-50 p-5 sm:col-span-2">
            <h2 className="text-xl font-black text-ink">Have a posting ready?</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              Paste it into the analyzer to get a match score, skill gaps, and suggested resume bullets.
            </p>
            <Link
              to="/analyze"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
            >
              Analyze a job <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
