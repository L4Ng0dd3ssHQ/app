import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  FilePlus2,
  FileText,
  Layers,
  PenLine,
  ScrollText,
} from "lucide-react";

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
  return (
    <div className="pb-12" data-testid="resume-builder-screen">
      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <div>
          <div className="mb-4 inline-flex rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
            Resume Builder
          </div>
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Build a resume for the job you want.</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
            Start from scratch, improve an existing resume, or let the job description guide what your resume should emphasize.
          </p>
        </div>
        <div className="rounded-lg border border-[#7C2FB8] bg-white p-5 shadow-card">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-muted">Recommended workflow</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Pick a role", "Match your resume", "Apply tailored"].map((step, index) => (
              <div key={step} className="rounded-lg bg-[#F7F5FA] p-4">
                <div className="text-2xl font-black text-brand-500">0{index + 1}</div>
                <div className="mt-2 text-sm font-black text-ink">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {builderActions.map(({ title, text, icon: Icon, to }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-12 w-12 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center">
                <Icon size={24} />
              </div>
              <ArrowRight size={19} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
            </div>
            <h2 className="mt-5 text-xl font-black text-ink">{title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-muted">{text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-brand-100 bg-brand-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">Already have a job description?</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Use the existing analyzer to turn it into a resume improvement plan.</p>
          </div>
          <Link
            to="/resume-builder/workspace?mode=job-description"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
          >
            Match resume to job <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
