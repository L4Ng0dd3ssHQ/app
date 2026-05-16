import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  FilePlus2,
  FileText,
  Layers,
  ListFilter,
  PenLine,
  Search,
  SlidersHorizontal,
  ScrollText,
} from "lucide-react";
import { listResumes } from "../api";
import { getDeviceId, isPro } from "../storage";
import type { SavedResume } from "../types";

const builderActions = [
  {
    title: "New Resume",
    text: "Create a clean version you can shape around a role.",
    icon: FilePlus2,
    to: "/resume-builder/workspace?mode=new",
  },
  {
    title: "Start from Job Description",
    text: "Paste the job first, then build toward what it asks for.",
    icon: BriefcaseBusiness,
    to: "/resume-builder/workspace?mode=job-description",
  },
  {
    title: "Improve Existing Resume",
    text: "Upload or paste what you have and get targeted gaps.",
    icon: PenLine,
    to: "/resume-builder/workspace?mode=improve",
  },
  {
    title: "Saved Resumes",
    text: "Keep versions organized for different roles and searches.",
    icon: FileText,
    to: "/resumes",
  },
  {
    title: "Start from Template",
    text: "Use a focused structure for ATS-friendly applications.",
    icon: Layers,
    to: "/resume-builder/workspace?mode=template",
  },
  {
    title: "Cover Letter",
    text: "Turn the same role context into a matching letter.",
    icon: ScrollText,
    to: "/resume-builder/workspace?mode=cover-letter",
  },
];

export default function ResumeBuilder() {
  const [recentResumes, setRecentResumes] = useState<SavedResume[]>([]);

  useEffect(() => {
    if (!isPro()) return;
    listResumes(getDeviceId())
      .then((items) => setRecentResumes(items.slice(0, 6)))
      .catch(() => setRecentResumes([]));
  }, []);

  return (
    <div className="-mx-4 -my-5 min-h-screen bg-white sm:-mx-6 lg:-mx-10 lg:-my-6" data-testid="resume-builder-screen">
      <section className="flex items-center justify-between border-b border-[#DAD8DE] px-6 py-6 lg:px-10">
        <h1 className="text-3xl font-black tracking-tight text-ink">Resume Builder</h1>
        <Link
          to="/resume-builder/workspace?mode=new"
          className="hidden items-center gap-2 rounded-lg border border-[#CFCBD5] bg-white px-4 py-3 text-sm font-black text-ink hover:bg-brand-50 hover:text-brand-500 sm:inline-flex"
        >
          <FilePlus2 size={18} />
          New
        </Link>
      </section>

      <section className="mx-auto grid max-w-[1580px] gap-4 px-6 py-12 md:grid-cols-2 xl:grid-cols-4 lg:px-10">
        {builderActions.slice(0, 4).map(({ title, icon: Icon, to }, index) => (
          <Link
            key={title}
            to={to}
            className="group flex min-h-[245px] flex-col items-center justify-center rounded-lg border border-[#D8D6DC] bg-white px-5 text-center transition-colors hover:border-brand-300 hover:bg-[#FCFAFE]"
          >
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full ${
                index === 0
                  ? "bg-brand-50 text-brand-500"
                  : index === 1
                    ? "bg-[#E8E9FF] text-[#2A2590]"
                    : index === 2
                      ? "bg-[#F8D8DD] text-[#8A214A]"
                      : "bg-[#FFF6C9] text-[#946800]"
              }`}
            >
              <Icon size={42} strokeWidth={2.2} />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-ink">{title}</h2>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-[1580px] px-6 pb-14 lg:px-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-extrabold text-ink">Recent Resumes</h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex h-14 min-w-[280px] items-center gap-3 rounded-lg border border-[#D1CED7] bg-white px-4 text-muted">
              <Search size={22} />
              <span className="text-xl font-semibold">Search Resumes</span>
            </div>
            <button className="flex h-14 w-14 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-500" aria-label="List view">
              <ListFilter size={24} />
            </button>
            <button className="flex h-14 w-14 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-500" aria-label="Sort">
              <SlidersHorizontal size={23} />
            </button>
          </div>
        </div>

        {recentResumes.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {recentResumes.map((resume) => (
            <Link
              key={resume.id}
              to="/resumes"
              className="min-h-[220px] rounded-lg border border-[#D8D6DC] bg-white p-8 transition-colors hover:border-brand-300 hover:bg-[#FCFAFE]"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-black text-black">{resume.label}</h3>
                <span className="text-2xl font-black leading-none text-muted">...</span>
              </div>
              <div className="mt-16 flex items-center gap-3 text-lg font-bold text-brand-500">
                <BriefcaseBusiness size={20} />
                Match a job
              </div>
              <div className="mt-3 text-lg font-semibold text-muted">
                Edited: {new Date(resume.updated_at || resume.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D8D6DC] bg-[#FAFAFB] px-8 py-10">
            <h3 className="text-2xl font-black text-ink">No saved resumes yet</h3>
            <p className="mt-2 max-w-2xl text-base font-semibold leading-7 text-muted">
              Create, import, or customize a template, then save it to keep edited versions here.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {builderActions.slice(4).map(({ title, to, icon: Icon }) => (
            <Link
              key={title}
              to={to}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D8D6DC] bg-white px-5 py-3 text-sm font-black text-ink hover:border-brand-300 hover:bg-brand-50"
            >
              <Icon size={18} className="text-brand-500" />
              {title}
              <ArrowRight size={17} className="text-muted" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
