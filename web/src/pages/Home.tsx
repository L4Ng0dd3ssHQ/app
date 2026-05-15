import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Gauge,
  ListChecks,
  PenLine,
  Quote,
  Search,
  Sparkles,
  Star,
  StarHalf,
} from "lucide-react";

const skillGaps = ["Azure networking", "Incident response", "Firewall policy"];

const testimonials = [
  {
    name: "K.C.",
    role: "User",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&h=160&q=80",
    text: "LandIt resume analyzer is super easy to use! It's been a very effective tool for applying to jobs. I like that it gives me a clear score and highlights the specific skills I need to add to my resume. It's helped me feel more confident in my applications.",
  },
  {
    name: "C.M.",
    role: "User",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&h=160&q=80",
    text: "LandIt is useful when you are applying to a lot of jobs and want to keep track of how well your resume matches each one. It helps me tailor my resume for each application and gives me confidence that I'm highlighting the right skills and experience. Good UI and easy to use!",
  },
];

function Rating() {
  return (
    <div className="flex items-center justify-center gap-1 text-brand-500" aria-label="4.5 out of 5 stars">
      {[0, 1, 2, 3].map((star) => (
        <Star key={star} size={16} fill="currentColor" strokeWidth={0} />
      ))}
      <StarHalf size={16} fill="currentColor" strokeWidth={0} />
    </div>
  );
}

export default function Home() {
  return (
    <div className="pb-12" data-testid="home-screen">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
        <div className="max-w-3xl min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-brand-500">
            <Sparkles size={15} />
            Resume builder and job search
          </div>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Land jobs with resumes built for the role.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            Build a focused resume, search for roles, and match every posting before you apply. LandIt turns a job description into a clearer application plan.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to="/resume-builder"
              data-testid="home-resume-builder-btn"
              className="group rounded-lg border border-brand-200 bg-brand-500 p-5 text-white shadow-card transition-colors hover:bg-brand-600"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-white/15 flex items-center justify-center">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="text-lg font-black">Resume Builder</div>
                    <div className="mt-1 text-sm font-semibold text-brand-50/90">Start, improve, or tailor</div>
                  </div>
                </div>
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>

            <Link
              to="/job-search"
              data-testid="home-job-search-btn"
              className="group rounded-lg border border-[#DDD6E8] bg-white p-5 text-ink shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center">
                    <Search size={22} />
                  </div>
                  <div>
                    <div className="text-lg font-black">Job Search</div>
                    <div className="mt-1 text-sm font-semibold text-muted">Find, save, and match</div>
                  </div>
                </div>
                <ArrowRight size={20} className="text-brand-500 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-bold text-muted">
            <Link to="/analyze" className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600">
              Match a job description <ArrowRight size={16} />
            </Link>
            <span className="hidden h-4 w-px bg-[#DCD6E5] sm:block" />
            <span>No account needed to start</span>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-[#E2DDEA] bg-white p-4 shadow-card lg:p-5">
          <div className="flex items-start justify-between gap-4 border-b border-[#EEEAF3] pb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-muted">Application plan</div>
              <h2 className="mt-2 text-2xl font-black text-ink">Network Engineer</h2>
              <p className="mt-1 text-sm font-semibold text-muted">Tailored resume preview</p>
            </div>
            <div className="rounded-lg bg-brand-50 px-4 py-3 text-right">
              <div className="text-4xl font-black leading-none text-brand-500">82%</div>
              <div className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-brand-500">Match</div>
            </div>
          </div>

          <div className="grid gap-3 py-4 sm:grid-cols-3">
            <div className="rounded-lg bg-[#F7F5FA] p-3">
              <Gauge size={20} className="text-brand-500" />
              <div className="mt-3 text-sm font-black text-ink">Fit score</div>
              <div className="mt-1 text-xs font-semibold text-muted">See whether the role is worth a tailored apply.</div>
            </div>
            <div className="rounded-lg bg-[#F7F5FA] p-3">
              <ListChecks size={20} className="text-brand-500" />
              <div className="mt-3 text-sm font-black text-ink">Skill Gaps</div>
              <div className="mt-1 text-xs font-semibold text-muted">Spot missing language before an ATS does.</div>
            </div>
            <div className="rounded-lg bg-[#F7F5FA] p-3">
              <PenLine size={20} className="text-brand-500" />
              <div className="mt-3 text-sm font-black text-ink">Better bullets</div>
              <div className="mt-1 text-xs font-semibold text-muted">Turn experience into job-specific proof.</div>
            </div>
          </div>

          <div className="border-t border-[#EEEAF3] pt-4">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-muted">Skill Gaps</div>
            <div className="flex flex-wrap gap-2">
              {skillGaps.map((gap) => (
                <span key={gap} className="rounded-lg bg-brand-50 px-3 py-2 text-xs font-black text-brand-500">
                  {gap}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-brand-500">
              <CheckCircle2 size={15} />
              Tailored bullet
            </div>
            <p className="text-sm font-bold leading-6 text-ink">
              Configured VLAN segmentation and DHCP/NAT policies to improve uptime across multi-site network operations.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="testimonials-heading">
        <div className="mb-6 text-center">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">Testimonials</div>
          <h2 id="testimonials-heading" className="mt-2 text-3xl font-black tracking-tight text-ink">
            What LandIt users are saying
          </h2>
        </div>

        <div className="relative">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 shell-scroll md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="min-w-[82%] snap-center rounded-lg border border-[#E2DDEA] bg-white p-6 text-center shadow-card sm:min-w-[48%] md:min-w-0"
              >
                <Quote size={34} className="mx-auto mb-3 text-brand-200" fill="currentColor" strokeWidth={0} />
                <img
                  src={testimonial.image}
                  alt=""
                  className="mx-auto h-20 w-20 rounded-full border-4 border-brand-50 object-cover"
                  loading="lazy"
                />
                <p className="mx-auto mt-5 max-w-md text-sm font-semibold leading-6 text-muted">{testimonial.text}</p>
                <div className="mt-5">
                  <Rating />
                  <div className="mt-3 text-sm font-black text-ink">{testimonial.name}</div>
                  <div className="mt-1 text-xs font-bold text-muted">{testimonial.role}</div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-3 flex justify-center gap-2 md:hidden" aria-hidden="true">
            {testimonials.map((testimonial) => (
              <span key={testimonial.name} className="h-2 w-2 rounded-full bg-brand-200" />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "Build around the target role",
            text: "Start from a blank resume, a template, or the job description that matters most.",
          },
          {
            icon: BriefcaseBusiness,
            title: "Keep the search connected",
            text: "Save promising roles and move from posting to tailored resume without losing context.",
          },
          {
            icon: Sparkles,
            title: "Use the analyzer when it counts",
            text: "The existing job match tool stays ready for quick resume checks and skill gaps.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <div className="h-11 w-11 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center">
              <Icon size={22} />
            </div>
            <h3 className="mt-4 text-lg font-black text-ink">{title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-muted">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
