import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  GraduationCap,
  MessageSquareText,
  PenLine,
} from "lucide-react";

const resourceCards = [
  {
    title: "Resume tailoring basics",
    text: "Learn how to use a job description to decide what belongs at the top of your resume.",
    icon: PenLine,
    to: "/resume-builder",
  },
  {
    title: "Job search workflow",
    text: "Build a repeatable process for finding, saving, matching, and following up on roles.",
    icon: BriefcaseBusiness,
    to: "/job-search",
  },
  {
    title: "Interview prep",
    text: "Turn resume bullets and job requirements into stronger interview stories.",
    icon: MessageSquareText,
    to: "https://landitapp.myshopify.com/",
    external: true,
  },
  {
    title: "Career change strategy",
    text: "Use transferable skills and keyword gaps to make a clearer pivot plan.",
    icon: GraduationCap,
    to: "https://landitapp.myshopify.com/",
    external: true,
  },
];

export default function Resources() {
  return (
    <div className="pb-12" data-testid="resources-screen">
      <section className="max-w-4xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="inline-flex rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
            Resources
          </div>
          <div className="inline-flex rounded-lg bg-[#FFF3CF] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-ink">
            Coming Soon
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Practical help for a sharper job search.</h1>
        <p className="mt-4 text-base leading-8 text-muted">
          Start with the workflows inside LandIt, then use the resource library for guides, templates, and deeper strategy.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {resourceCards.map(({ title, text, icon: Icon, to, external }) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="h-12 w-12 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center">
                  <Icon size={24} />
                </div>
                <ArrowRight size={19} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
              </div>
              <h2 className="mt-5 text-xl font-black text-ink">{title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-muted">{text}</p>
            </>
          );

          if (external) {
            return (
              <a
                key={title}
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50"
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={title}
              to={to}
              className="group rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              {content}
            </Link>
          );
        })}
      </section>

      <section className="mt-8 rounded-lg border border-brand-100 bg-brand-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BookOpenText size={24} className="mt-1 text-brand-500" />
            <div>
              <h2 className="text-xl font-black text-ink">Browse the full resource shop</h2>
              <p className="mt-1 text-sm font-semibold text-muted">Open the existing LandIt resource library for more job search material.</p>
            </div>
          </div>
          <a
            href="https://landitapp.myshopify.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
          >
            Browse resources <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}
