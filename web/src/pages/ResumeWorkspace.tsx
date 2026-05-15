import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  LayoutTemplate,
  Loader2,
  Menu,
  Palette,
  PenLine,
  ScrollText,
  Search,
  Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";
import { getDeviceId, isPro } from "../storage";
import { analyzeJob, createResume, listResumes, updateResume as updateSavedResume } from "../api";
import ResumeFileInput from "../components/ResumeFileInput";
import type { ParseResult } from "../parseResume";
import type { Analysis } from "../types";

type BuilderTab = "content" | "designer" | "analyzer" | "matcher" | "cover";

const tabs: Array<{ id: BuilderTab; label: string; icon: typeof FileText; badge?: string }> = [
  { id: "content", label: "Editor", icon: FileText },
  { id: "designer", label: "Designer", icon: Palette },
  { id: "analyzer", label: "Analyzer", icon: Sparkles },
  { id: "matcher", label: "Job Matcher", icon: BriefcaseBusiness, badge: "!" },
  { id: "cover", label: "Cover Letter", icon: ScrollText },
];

const resumeTemplates = [
  {
    id: "minimalist",
    name: "Minimalist",
    label: "Clean ATS",
    candidateName: "Jordan M. Rivera",
    contact: "jordan.rivera@email.com | (555) 867-5309 | linkedin.com/in/jordanrivera | github.com/jrivera | Austin, TX",
    targetTitle: "Staff Software Engineer",
    summary:
      "High-availability software engineer with deep experience in Python, Go, Kubernetes, observability, and developer experience. Proven record delivering reliable systems at scale.",
    accent: "bg-brand-500",
    layout: "minimal",
    role: "Customizable Resume Headline",
  },
  {
    id: "tech",
    name: "Tech ATS",
    label: "Engineering",
    candidateName: "Jordan M. Rivera",
    contact: "jordan.rivera@email.com | (555) 867-5309 | linkedin.com/in/jordanrivera | github.com/jrivera | Austin, TX",
    targetTitle: "Staff Software Engineer",
    summary:
      "Staff software engineer specializing in distributed systems, cloud architecture, CI/CD, and platform reliability for high-traffic products.",
    accent: "bg-emerald-600",
    layout: "technical",
    role: "Customizable Resume Headline",
  },
  {
    id: "creative",
    name: "Creative ATS",
    label: "Modern",
    candidateName: "Simone A. Beaumont",
    contact: "simone@beaumontstudio.com | (555) 204-7731 | linkedin.com/in/simonebeaumont | beaumontstudio.com | New York, NY",
    targetTitle: "Creative Director",
    summary:
      "Award-winning creative director with 10 years shaping brand identity and visual storytelling for global consumer, tech, and nonprofit clients.",
    accent: "bg-[#8B1E56]",
    layout: "creative",
    role: "Customizable Resume Headline",
  },
  {
    id: "career-pivot",
    name: "Career Pivot",
    label: "Transition",
    candidateName: "Marcus D. Holloway",
    contact: "marcus.holloway@email.com | (555) 391-0044 | linkedin.com/in/marcusholloway | Chicago, IL",
    targetTitle: "Data Analyst",
    summary:
      "Finance professional with 8 years of analysis, reporting, and modeling experience, now transitioning into data analytics with Python, SQL, and Power BI projects.",
    accent: "bg-amber-600",
    layout: "pivot",
    role: "Customizable Resume Headline",
  },
  {
    id: "entry-level",
    name: "Entry Level",
    label: "Early Career",
    candidateName: "Aaliya K. Patel",
    contact: "aaliya.patel@email.com | (555) 672-9183 | linkedin.com/in/aaliyapatel | Boston, MA",
    targetTitle: "Marketing Coordinator",
    summary:
      "Recent marketing graduate with hands-on experience in content creation, social media management, and brand strategy through internships and campus leadership.",
    accent: "bg-sky-600",
    layout: "entry",
    role: "Customizable Resume Headline",
  },
];

type ResumeTemplate = (typeof resumeTemplates)[number];
type DesignerPanel = "templates" | "sections";
type ResumeSectionId = "summary" | "skills" | "experience" | "projects" | "education" | "certifications";
type ResumeRole = {
  title: string;
  company: string;
  dates: string;
  location: string;
  bullets: string[];
};
type ResumeData = {
  templateId: string;
  candidateName: string;
  contact: string;
  role: string;
  targetTitle: string;
  summary: string;
  skills: string[];
  roles: ResumeRole[];
  projects: string[];
  education: string;
  certifications: string;
  sectionOrder: ResumeSectionId[];
  hiddenSections: ResumeSectionId[];
};

const sectionLabels: Record<ResumeSectionId, string> = {
  summary: "Professional Summary",
  skills: "Skills & Interests",
  experience: "Work Experience",
  projects: "Projects",
  education: "Education",
  certifications: "Certifications",
};

const defaultSectionOrder: ResumeSectionId[] = ["summary", "skills", "experience", "projects", "education", "certifications"];

const coverLetterTemplates = [
  {
    id: "tech",
    name: "Tech Cover Letter",
    label: "Engineering",
    roleLine: "Software Engineer | Full-Stack | Cloud | Platform",
    opening:
      "I am writing to express my interest in the role at your company. With experience building scalable systems and improving reliability, I have a track record of delivering technical solutions that create measurable impact.",
    body:
      "In my most recent work, I engineered services, improved deployment workflows, and supported high-availability systems. This required strong technical judgment, collaboration, and the ability to translate complex requirements into durable software.",
    closing:
      "I would welcome the opportunity to discuss how my background fits what you are building. I have attached my resume and am happy to provide work samples, references, or anything else helpful.",
  },
  {
    id: "creative",
    name: "Creative Cover Letter",
    label: "Brand / Creative",
    roleLine: "Creative Professional | Brand Strategy | Storytelling",
    opening:
      "I am writing to express my interest in the role at your company. My background centers on turning ambiguous briefs into clear, compelling work that connects with the right audience.",
    body:
      "In recent roles, I have led projects from concept through execution, balancing strategy, craft, and collaboration. I bring a practical creative process and a strong sense of how to make work both distinctive and useful.",
    closing:
      "I would welcome the chance to discuss how my creative background fits your team. I have attached my resume and can share work samples or references if helpful.",
  },
  {
    id: "career-pivot",
    name: "Career Pivot Cover Letter",
    label: "Transition",
    roleLine: "Transitioning Professional | Transferable Skills | Growth",
    opening:
      "I am writing to express my interest in the role at your company. I am making a deliberate move into this field, backed by focused learning, hands-on projects, and transferable experience.",
    body:
      "My previous work required problem-solving, communication, and follow-through under pressure. I now apply those strengths to the target role while continuing to build practical, role-specific experience.",
    closing:
      "I would welcome the opportunity to discuss how my background can support your team. I have attached my resume and am happy to provide examples of relevant work.",
  },
];

const baseResumeData: ResumeData = {
  templateId: "minimalist",
  candidateName: "Jordan M. Rivera",
  contact: "jordan.rivera@email.com | (555) 867-5309 | linkedin.com/in/jordanrivera | github.com/jrivera | Austin, TX",
  role: "Customizable Resume Headline",
  targetTitle: "Staff Software Engineer",
  summary:
    "Proven track record delivering high-availability services handling 10M+ daily requests. Deep expertise in Python, Go, and Kubernetes. Passionate about developer experience, observability, and clean architecture.",
  skills: [
    "Languages: Python, Go, TypeScript, JavaScript, SQL, Bash, Rust (learning)",
    "Frameworks: FastAPI, Django, Echo, React, Next.js, Node.js, GraphQL",
    "Data: PostgreSQL, Redis, Kafka, Elasticsearch, DynamoDB, Snowflake",
    "Practices: CI/CD, TDD, DDD, ADRs, OpenTelemetry, Prometheus, Grafana, SLO/SLA",
  ],
  roles: [
    {
      title: "Staff Software Engineer",
      company: "Apex Cloud Solutions",
      dates: "Jan 2022 - Present",
      location: "Austin, TX",
      bullets: [
        "Engineered microservices platform using Go and gRPC, reducing p99 latency by 42% across 18 services.",
        "Led migration of monolithic Rails application to Kubernetes on AWS EKS, improving deployment frequency by 10%.",
        "Established internal developer platform (IDP) with Kubernetes and AWS EKS, reducing onboarding from 3 days to 4 hours.",
      ],
    },
    {
      title: "Senior Software Engineer",
      company: "DataStream Technologies",
      dates: "Mar 2019 - Dec 2021",
      location: "Remote",
      bullets: [
        "Provided hardware/software troubleshooting for 200+ students and staff weekly.",
        "Imaged and deployed machines using standard configuration tools.",
        "Maintained help desk logs and escalated advanced issues to senior technicians.",
      ],
    },
    {
      title: "Software Engineer",
      company: "NexaTech Inc.",
      dates: "Jun 2017 - Feb 2019",
      location: "San Francisco, CA",
      bullets: [
        "Built real-time data pipeline ingesting 50K events/sec using Kafka, Flink, and Postgres.",
        "Designed and shipped REST and GraphQL APIs serving 8M daily active users with 99.97% uptime.",
        "Implemented CI/CD pipeline with GitHub Actions, reducing deployment cycle from 2 weeks to daily releases.",
        "Authored internal Python SDK consumed by 5 product teams, cutting integration time by 60%.",
      ],
    },
  ],
  projects: [
    "OpenTrace - Open-source distributed tracing library with 1.2K GitHub stars and 98% test coverage.",
    "HomeHeat - Go backend and React dashboard for IoT energy data from smart sensors via MQTT.",
  ],
  education: "Bachelor of Science in Computer Science, Any University, Any City, Aug 2022 - Aug 2026",
  certifications: "CCST Networking exp. 10/01/2030; Security+ exp. 01/01/2027",
  sectionOrder: defaultSectionOrder,
  hiddenSections: [],
};

const blankResumeData: ResumeData = {
  templateId: "blank",
  candidateName: "",
  contact: "",
  role: "",
  targetTitle: "",
  summary: "",
  skills: [],
  roles: [
    {
      title: "",
      company: "",
      dates: "",
      location: "",
      bullets: [],
    },
  ],
  projects: [],
  education: "",
  certifications: "",
  sectionOrder: [...defaultSectionOrder],
  hiddenSections: [],
};

function createBlankResume(): ResumeData {
  return {
    ...blankResumeData,
    skills: [],
    roles: blankResumeData.roles.map((role) => ({ ...role, bullets: [] })),
    projects: [],
    sectionOrder: [...defaultSectionOrder],
    hiddenSections: [],
  };
}

function createResumeFromTemplate(template: ResumeTemplate): ResumeData {
  const common = {
    ...baseResumeData,
    templateId: template.id,
    candidateName: template.candidateName,
    contact: template.contact,
    role: template.role,
    targetTitle: template.targetTitle,
    summary: template.summary,
    sectionOrder: [...defaultSectionOrder],
    hiddenSections: [],
  };

  if (template.id === "creative") {
    return {
      ...common,
      skills: ["Brand Strategy, Art Direction, Campaign Development, Identity Systems", "Tools: Adobe Creative Suite, Figma, Webflow, Miro", "Leadership: Creative reviews, vendor direction, cross-functional launches"],
      roles: [
        {
          company: "Meridian Creative Agency",
          title: "Creative Director",
          dates: "Feb 2021 - Present",
          location: "New York, NY",
          bullets: [
            "Led integrated brand campaigns across digital, social, and retail channels for national consumer clients.",
            "Directed a team of designers, writers, and producers from concept through final delivery.",
            "Built presentation systems that improved client approval speed and reduced revision rounds.",
          ],
        },
        {
          company: "Nova Brand Studio",
          title: "Senior Art Director",
          dates: "May 2017 - Jan 2021",
          location: "Brooklyn, NY",
          bullets: [
            "Created visual identity systems for technology and nonprofit organizations.",
            "Partnered with strategy teams to translate research into campaign concepts and launch assets.",
          ],
        },
      ],
      projects: ["Brand refresh for a nonprofit fundraising campaign that exceeded donation goals.", "Editorial design system for a multi-channel product launch."],
      education: "Bachelor of Fine Arts in Graphic Design, Pratt Institute, Brooklyn, NY",
      certifications: "Adobe Certified Professional; Brand Strategy Intensive",
    };
  }

  if (template.id === "career-pivot") {
    return {
      ...common,
      skills: ["Analytics: SQL, Python, Excel, Power BI, Tableau", "Finance: Forecasting, variance analysis, KPI reporting, budget modeling", "Data projects: dashboarding, data cleaning, exploratory analysis"],
      roles: [
        {
          company: "Lakeview Capital Partners",
          title: "Senior Financial Analyst",
          dates: "Jul 2019 - Present",
          location: "Chicago, IL",
          bullets: [
            "Built monthly reporting dashboards that reduced manual reconciliation time for finance leadership.",
            "Analyzed expense trends and forecast variance to support quarterly planning decisions.",
            "Translated business questions into structured datasets, pivot models, and executive summaries.",
          ],
        },
        {
          company: "BrightLine Retail Group",
          title: "Financial Analyst",
          dates: "Aug 2015 - Jun 2019",
          location: "Chicago, IL",
          bullets: ["Maintained sales and inventory models across 40 retail locations.", "Prepared KPI reporting packages used by operations and merchandising teams."],
        },
      ],
      projects: ["Personal finance dashboard using Python, pandas, and Power BI.", "Chicago housing analysis project using SQL and public datasets."],
      education: "Bachelor of Business Administration in Finance, DePaul University, Chicago, IL",
      certifications: "Google Data Analytics Certificate; SQL for Data Analysis",
    };
  }

  if (template.id === "entry-level") {
    return {
      ...common,
      skills: ["Content calendars, social media management, email marketing, Canva, Google Analytics", "Research, campaign reporting, community engagement, copywriting", "Tools: HubSpot, Mailchimp, Figma, Google Workspace"],
      roles: [
        {
          company: "Bloom Collective",
          title: "Marketing Intern",
          dates: "Jan 2025 - May 2025",
          location: "Boston, MA",
          bullets: [
            "Drafted weekly social content and tracked engagement trends across Instagram and LinkedIn.",
            "Assisted with email campaign QA, audience segmentation, and performance reporting.",
            "Researched competitor messaging to support brand positioning recommendations.",
          ],
        },
        {
          company: "Northeast University Marketing Club",
          title: "Social Media Lead",
          dates: "Sep 2023 - Dec 2024",
          location: "Boston, MA",
          bullets: ["Planned campus event promotion calendars and coordinated student creator posts.", "Increased club event signups through consistent short-form content and newsletter updates."],
        },
      ],
      projects: ["Capstone campaign plan for a local wellness brand.", "Freelance content calendar for a student-run apparel shop."],
      education: "Bachelor of Science in Marketing, Northeast University, Boston, MA",
      certifications: "HubSpot Content Marketing; Google Analytics Certification",
    };
  }

  return common;
}

function initialTab(mode: string | null, tab: string | null): BuilderTab {
  if (tab === "designer" || tab === "analyzer" || tab === "matcher" || tab === "cover") return tab;
  if (mode === "improve") return "analyzer";
  if (mode === "job-description") return "matcher";
  if (mode === "template") return "designer";
  if (mode === "cover-letter") return "cover";
  return "content";
}

function recommendationsFromAnalysis(analysis: Analysis | null): string[] {
  if (!analysis) return [];
  return [
    ...analysis.focus_guidance,
    ...analysis.missing_skills.map((skill) => `Add stronger evidence for ${skill}.`),
    ...analysis.suggested_bullets.map((bullet) => bullet.after),
  ].filter(Boolean);
}

function recommendationCountFromAnalysis(analysis: Analysis | null) {
  if (!analysis) return 0;
  return analysis.focus_guidance.length + analysis.suggested_bullets.length + analysis.missing_skills.length;
}

function buildResumeText(resume: ResumeData) {
  return `${resume.candidateName}
${resume.contact}

TARGET TITLE
${resume.targetTitle || "Target title not selected"}

PROFESSIONAL SUMMARY
${resume.summary}

SKILLS
${resume.skills.join("\n")}

WORK EXPERIENCE
${resume.roles
  .map((role) => `${role.title} - ${role.company} - ${role.dates} - ${role.location}\n${role.bullets.map((bullet) => `- ${bullet}`).join("\n")}`)
  .join("\n\n")}

PROJECTS
${resume.projects.map((project) => `- ${project}`).join("\n")}

EDUCATION
${resume.education}

CERTIFICATIONS
${resume.certifications}`;
}

function hasMeaningfulResumeContent(resume: ResumeData) {
  return Boolean(
    resume.candidateName.trim() ||
      resume.contact.trim() ||
      resume.role.trim() ||
      resume.targetTitle.trim() ||
      resume.summary.trim() ||
      resume.skills.some((skill) => skill.trim()) ||
      resume.projects.some((project) => project.trim()) ||
      resume.education.trim() ||
      resume.certifications.trim() ||
      resume.roles.some(
        (role) =>
          role.title.trim() ||
          role.company.trim() ||
          role.dates.trim() ||
          role.location.trim() ||
          role.bullets.some((bullet) => bullet.trim()),
      ),
  );
}

const STRUCTURED_RESUME_PREFIX = "LANDIT_RESUME_JSON:";

function serializeResume(resume: ResumeData) {
  return `${STRUCTURED_RESUME_PREFIX}${JSON.stringify(resume)}`;
}

function parseSavedResumeContent(content: string): ResumeData {
  if (content.startsWith(STRUCTURED_RESUME_PREFIX)) {
    try {
      const parsed = JSON.parse(content.slice(STRUCTURED_RESUME_PREFIX.length)) as ResumeData;
      return {
        ...createResumeFromTemplate(resumeTemplates.find((template) => template.id === parsed.templateId) || resumeTemplates[0]),
        ...parsed,
        sectionOrder: parsed.sectionOrder?.length ? parsed.sectionOrder : [...defaultSectionOrder],
        hiddenSections: parsed.hiddenSections || [],
      };
    } catch {
      return createResumeFromPlainText(content);
    }
  }
  return createResumeFromPlainText(content);
}

function createResumeFromPlainText(text: string, filename?: string): ResumeData {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] || "Imported Resume";
  const contactLine = lines.slice(1, 5).find((line) => /@|\d{3}|linkedin|github|\.com/i.test(line)) || "";
  const targetLine = lines.find((line) => /engineer|designer|director|analyst|manager|coordinator|developer|specialist/i.test(line)) || "";
  const bulletLines = lines.filter((line) => /^[-•*]/.test(line)).map((line) => line.replace(/^[-•*]\s*/, ""));
  const summaryStart = contactLine ? lines.indexOf(contactLine) + 1 : 1;
  const summary = lines
    .slice(summaryStart, summaryStart + 4)
    .filter((line) => !/^[-•*]/.test(line))
    .join(" ")
    .slice(0, 700) || "Imported resume text is ready to edit. Add a target role and refine each section before exporting.";

  return {
    ...baseResumeData,
    templateId: "minimalist",
    candidateName: firstLine,
    contact: contactLine,
    role: targetLine || "Imported Resume",
    targetTitle: targetLine,
    summary,
    skills: ["Review imported text and move skills into this section."],
    roles: [
      {
        company: filename ? filename.replace(/\.[^.]+$/, "") : "Imported Experience",
        title: targetLine || "Role Title",
        dates: "",
        location: "",
        bullets: bulletLines.length ? bulletLines.slice(0, 8) : lines.slice(0, 8),
      },
    ],
    projects: [],
    education: lines.find((line) => /university|college|bachelor|master|degree|certificate/i.test(line)) || "",
    certifications: lines.filter((line) => /certified|certification|certificate|security\+|ccst/i.test(line)).join("; "),
    sectionOrder: [...defaultSectionOrder],
    hiddenSections: [],
  };
}

function safeFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "resume";
}

function downloadResumePDF(resume: ResumeData) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 44;
  const maxWidth = 612 - margin * 2;
  let y = 44;

  const line = (text: string, size = 9, style: "normal" | "bold" = "normal", gap = 12) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
    const parts = doc.splitTextToSize(text || " ", maxWidth) as string[];
    parts.forEach((part) => {
      if (y < 752) doc.text(part, margin, y);
      y += gap;
    });
  };

  const heading = (text: string) => {
    y += 8;
    line(text.toUpperCase(), 9, "bold", 11);
    if (y < 752) doc.line(margin, y - 7, 612 - margin, y - 7);
  };

  line(resume.candidateName, 16, "bold", 18);
  line(resume.role, 10, "bold", 13);
  line(resume.contact, 8, "normal", 11);

  resume.sectionOrder.filter((id) => !resume.hiddenSections.includes(id)).forEach((sectionId) => {
    if (sectionId === "summary") {
      heading(resume.targetTitle || "Professional Summary");
      line(resume.summary, 9, "normal", 12);
    } else if (sectionId === "skills") {
      heading("Skills");
      resume.skills.forEach((skill) => line(skill, 8, "normal", 10));
    } else if (sectionId === "experience") {
      heading("Work Experience");
      resume.roles.forEach((role) => {
        line(`${role.company} | ${role.title}`, 9, "bold", 11);
        line(`${role.dates}${role.location ? ` | ${role.location}` : ""}`, 8, "bold", 10);
        role.bullets.forEach((bullet) => line(`• ${bullet}`, 8, "normal", 10));
        y += 4;
      });
    } else if (sectionId === "projects" && resume.projects.length) {
      heading("Projects");
      resume.projects.forEach((project) => line(`• ${project}`, 8, "normal", 10));
    } else if (sectionId === "education" && resume.education) {
      heading("Education");
      line(resume.education, 8, "normal", 10);
    } else if (sectionId === "certifications" && resume.certifications) {
      heading("Certifications");
      line(resume.certifications, 8, "normal", 10);
    }
  });

  doc.save(`${safeFilename(resume.targetTitle || resume.candidateName)}.pdf`);
}

function buildResumeQualityPrompt(targetTitle: string, mode: string | null) {
  return `Evaluate this resume as if the user is preparing to apply for ${targetTitle || "a competitive technical role"}.
Focus on resume structure, measurable results, skill gaps, missing role evidence, and improvements needed before applying.
Return practical recommendations as missing skills, focus guidance, and suggested bullet rewrites.
Context: the user entered the Resume Builder through ${mode || "new resume"} mode.`;
}

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function sentenceFragment(text: string) {
  const cleaned = text
    .trim()
    .replace(/\.$/, "")
    .replace(/\bRail application\b/g, "Rails application");
  return cleaned ? cleaned.charAt(0).toLowerCase() + cleaned.slice(1) : "";
}

function PaywallBlock({
  context,
  analysis,
  loading,
  error,
  onAnalyze,
}: {
  context: "analyzer" | "matcher" | "cover";
  analysis: Analysis | null;
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
}) {
  const realRecommendations = recommendationsFromAnalysis(analysis);
  const totalRecommendationCount = recommendationCountFromAnalysis(analysis);
  const recommendationCount = totalRecommendationCount || realRecommendations.length || 0;
  const heading =
    context === "cover"
      ? "Unlock your cover letter generator"
      : context === "matcher"
        ? "Unlock job match recommendations"
        : `Unlock ${recommendationCount || "your"} resume recommendations`;
  const score = analysis?.match_score;
  const skillGapIssues = analysis ? analysis.missing_skills.length : 0;
  const recommendedBulletIssues = analysis ? analysis.suggested_bullets.length : 0;
  const focusGuidanceIssues = analysis ? analysis.focus_guidance.length : 0;

  return (
    <div className="rounded-lg border border-brand-100 bg-white p-5 shadow-card">
      <div className="grid gap-5 xl:grid-cols-[220px_1fr] xl:items-center">
        <div className="mx-auto h-44 w-44 rounded-full border-[14px] border-brand-50 flex items-center justify-center text-center">
          <div>
            <div className="text-5xl font-black text-ink">{typeof score === "number" ? `${score}%` : "--"}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-muted">Sneak peek</div>
          </div>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-500">
            <Sparkles size={15} />
            {analysis ? `${recommendationCount} recommendations found` : "Real analyzer preview"}
          </div>
          <h2 className="mt-4 text-2xl font-black text-ink">{heading}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">
            {analysis
              ? "We found issues that can make this resume stronger. Preview the score now, then upgrade to see every recommendation and the exact fixes."
              : "Run the real LandIt analyzer to preview this resume's score and discover what recommendations are waiting behind Pro."}
          </p>
          {!analysis && (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={loading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-70"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {loading ? "Running analyzer..." : "Preview my score"}
            </button>
          )}
          {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

          <div className="mt-5 space-y-3">
            {[
              ["Focus Guidance", `${focusGuidanceIssues} items`, `${Math.max(12, focusGuidanceIssues * 18)}%`, "bg-[#8B1E56]"],
              ["Recommended Bullets", `${recommendedBulletIssues} items`, `${Math.max(12, recommendedBulletIssues * 14)}%`, "bg-brand-500"],
              ["Skill Gaps", `${skillGapIssues} issues`, `${Math.max(12, Math.min(90, skillGapIssues * 10))}%`, "bg-emerald-500"],
            ].map(([label, issue, width, color]) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm font-black text-ink">
                  <span>{label}</span>
                  <span className="text-muted">{issue}</span>
                </div>
                <div className="h-2 rounded-full bg-[#ECE8F1]">
                  <div className={`h-full rounded-full ${color}`} style={{ width }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-brand-500 p-5 text-white">
            <h3 className="text-xl font-black">Make your resume stand out by unlocking {recommendationCount || "your"} recommendations</h3>
            <Link
              to="/pro"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#FDBA00] px-5 py-3 text-sm font-black text-ink hover:bg-[#F2AE00]"
            >
              Upgrade to LandIt Pro <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2 border-t border-[#EEEAF3] pt-5">
        {(realRecommendations.length ? realRecommendations : ["Run the analyzer to generate your first real recommendation."]).slice(0, 4).map((item, index) => (
          <div
            key={item}
            className={`flex items-start gap-3 rounded-lg border border-[#EEEAF3] bg-[#F8F7FA] p-3 ${
              index > 0 ? "blur-[2px] select-none" : ""
            }`}
          >
            <AlertCircle size={17} className="mt-0.5 text-brand-500" />
            <span className="text-sm font-bold text-ink">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationList({ analysis }: { analysis: Analysis | null }) {
  const realRecommendations = recommendationsFromAnalysis(analysis);
  return (
    <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">Unlocked recommendations</div>
      <h2 className="mt-2 text-2xl font-black text-ink">{realRecommendations.length || "Real"} ways to improve this resume</h2>
      <div className="mt-5 space-y-3">
        {realRecommendations.map((item) => (
          <div key={item} className="flex items-start gap-3 rounded-lg bg-brand-50 p-3">
            <CheckCircle2 size={18} className="mt-0.5 text-brand-500" />
            <span className="text-sm font-bold text-ink">{item}</span>
          </div>
        ))}
        {!realRecommendations.length && (
          <div className="rounded-lg bg-brand-50 p-3 text-sm font-bold text-muted">Run the analyzer to generate recommendations.</div>
        )}
      </div>
    </div>
  );
}

export default function ResumeWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const savedResumeId = searchParams.get("resume_id");
  const [activeTab, setActiveTab] = useState<BuilderTab>(() => initialTab(mode, searchParams.get("tab")));
  const [designerPanel, setDesignerPanel] = useState<DesignerPanel>("templates");
  const [resume, setResume] = useState<ResumeData>(() => {
    return mode === "template" ? createResumeFromTemplate(resumeTemplates[0]) : createBlankResume();
  });
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [pastedResume, setPastedResume] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [importedFilename, setImportedFilename] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingResume, setSavingResume] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [currentSavedResumeId, setCurrentSavedResumeId] = useState<string | null>(savedResumeId);
  const [currentSavedResumeLabel, setCurrentSavedResumeLabel] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(resumeTemplates[0].id);
  const [selectedCoverTemplate, setSelectedCoverTemplate] = useState(coverLetterTemplates[0].id);
  const [coverFields, setCoverFields] = useState(() => ({
    hiringManager: "Hiring Manager",
    companyName: "",
    roleLine: coverLetterTemplates[0].roleLine,
    opening: coverLetterTemplates[0].opening,
    body: coverLetterTemplates[0].body,
    closing: coverLetterTemplates[0].closing,
  }));
  const pro = isPro();
  const needsResumeSource = !savedResumeId && (mode === "new" || mode === "improve" || mode === "job-description");
  const hasResumeContent = hasMeaningfulResumeContent(resume);
  const title = useMemo(() => {
    if (resume.targetTitle.trim()) return `${resume.targetTitle.trim()} Resume`;
    if (mode === "template") return "Template Resume";
    if (mode === "improve") return "Imported Resume";
    return "Untitled Resume";
  }, [mode, resume.targetTitle]);

  const showPaywall = !pro && (activeTab === "analyzer" || activeTab === "matcher");
  const analyzerBadge = analysis ? String(recommendationCountFromAnalysis(analysis)) : undefined;

  useEffect(() => {
    if (!savedResumeId || !pro) return;
    let cancelled = false;
    const loadSavedResume = async () => {
      setSaveError(null);
      try {
        const saved = (await listResumes(getDeviceId())).find((item) => item.id === savedResumeId);
        if (!saved || cancelled) return;
        setResume(parseSavedResumeContent(saved.content));
        setCurrentSavedResumeId(saved.id);
        setCurrentSavedResumeLabel(saved.label);
        setAnalysis(null);
      } catch (e) {
        if (!cancelled) setSaveError(e instanceof Error ? e.message : "Could not load saved resume.");
      }
    };
    loadSavedResume();
    return () => {
      cancelled = true;
    };
  }, [savedResumeId, pro]);

  const runBuilderAnalysis = async () => {
    setAnalysisError(null);
    if (!hasMeaningfulResumeContent(resume)) {
      setAnalysisError("Upload or paste a resume first.");
      return;
    }
    setAnalysisLoading(true);
    try {
      const prompt =
        (activeTab === "matcher" || activeTab === "cover") && jobDescription.trim().length >= 30
          ? jobDescription
          : buildResumeQualityPrompt(resume.targetTitle, mode);
      const result = await analyzeJob(prompt, buildResumeText(resume));
      setAnalysis(result);
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : "Could not run the analyzer. Try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = resumeTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedTemplate(template.id);
    setResume(createResumeFromTemplate(template));
    setAnalysis(null);
    setActiveTab("content");
  };

  const updateResume = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setResume((current) => ({ ...current, [key]: value }));
    setAnalysis(null);
    setSaveMessage(null);
  };

  const updateRole = (roleIndex: number, updates: Partial<ResumeRole>) => {
    setResume((current) => ({
      ...current,
      roles: current.roles.map((role, index) => (index === roleIndex ? { ...role, ...updates } : role)),
    }));
    setAnalysis(null);
    setSaveMessage(null);
  };

  const moveSection = (sectionId: ResumeSectionId, direction: -1 | 1) => {
    setResume((current) => {
      const order = [...current.sectionOrder];
      const index = order.indexOf(sectionId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current;
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, sectionOrder: order };
    });
  };

  const toggleSection = (sectionId: ResumeSectionId) => {
    setResume((current) => {
      const hidden = current.hiddenSections.includes(sectionId)
        ? current.hiddenSections.filter((id) => id !== sectionId)
        : [...current.hiddenSections, sectionId];
      return { ...current, hiddenSections: hidden };
    });
  };

  const handleResumeParsed = (result: ParseResult) => {
    setImportedFilename(result.filename);
    setResume(createResumeFromPlainText(result.text, result.filename));
    setSelectedTemplate("minimalist");
    setAnalysis(null);
    setSaveMessage("Resume imported. Review the fields, then analyze or export when ready.");
  };

  const handlePastedResume = () => {
    const text = pastedResume.trim();
    if (!text) {
      setSaveError("Paste your resume text first.");
      return;
    }
    setImportedFilename("Pasted resume");
    setResume(createResumeFromPlainText(text, "Pasted resume"));
    setSelectedTemplate("minimalist");
    setAnalysis(null);
    setSaveError(null);
    setSaveMessage("Resume pasted. Review the fields, then analyze or export when ready.");
  };

  const handleExportPDF = () => {
    if (!pro) {
      navigate("/pro");
      return;
    }
    downloadResumePDF(resume);
    setSaveMessage("PDF export started. Pro users can also save this version below.");
  };

  const handleAnalyzeResume = () => {
    if (!hasMeaningfulResumeContent(resume)) {
      setSaveError("Upload or paste a resume before analyzing.");
      return;
    }
    if (pro) {
      navigate("/analyze", {
        state: {
          resume: buildResumeText(resume),
          jd: jobDescription.trim().length >= 30 ? jobDescription : "",
        },
      });
      return;
    }
    setActiveTab("analyzer");
  };

  const handleSaveCurrentResume = async () => {
    if (!pro) {
      navigate("/pro");
      return;
    }
    setSavingResume(true);
    setSaveError(null);
    try {
      const label = currentSavedResumeLabel.trim() || title;
      const content = serializeResume(resume);
      const saved = currentSavedResumeId
        ? await updateSavedResume(currentSavedResumeId, getDeviceId(), { label, content })
        : await createResume(getDeviceId(), label, content);
      setCurrentSavedResumeId(saved.id);
      setCurrentSavedResumeLabel(saved.label);
      setSavePromptOpen(false);
      setSaveMessage("Saved to Saved Resumes.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save this resume.");
    } finally {
      setSavingResume(false);
    }
  };

  const applyCoverTemplate = (templateId: string) => {
    const template = coverLetterTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSelectedCoverTemplate(template.id);
    setCoverFields((current) => ({
      ...current,
      roleLine: template.roleLine,
      opening: template.opening,
      body: template.body,
      closing: template.closing,
    }));
  };

  const applyAiCoverSuggestions = () => {
    if (!analysis) {
      runBuilderAnalysis();
      return;
    }
    const strengths = uniqueItems([
      ...analysis.required_skills.slice(0, 2),
      ...analysis.key_skills.technical.slice(0, 2),
    ]).slice(0, 3);
    const gap = analysis.missing_skills[0];
    const bulletEvidence = analysis.suggested_bullets
      .slice(0, 2)
      .map((bullet) => sentenceFragment(bullet.after || bullet.before))
      .filter(Boolean);
    const evidenceSentence = bulletEvidence.length
      ? `In recent roles, I ${bulletEvidence.join(". I ")}.`
      : "In recent roles, I have delivered reliable technical work, partnered across teams, and improved systems with measurable outcomes.";
    setCoverFields((current) => ({
      ...current,
      companyName: company || current.companyName,
      opening: `I am excited to apply for the ${jobTitle || resume.targetTitle || "open"} role${current.companyName ? ` at ${current.companyName}` : ""}. My background aligns with the role through ${strengths.length ? strengths.join(", ") : "relevant technical experience"} and a record of delivering measurable engineering outcomes.`,
      body: `${evidenceSentence} That experience connects directly to the role's need for someone who can turn platform priorities into dependable systems and practical developer workflows.`,
      closing: gap
        ? `I would welcome the opportunity to discuss how my experience fits the role, especially as your team continues to prioritize ${gap} and related platform reliability goals.`
        : current.closing,
    }));
  };

  useEffect(() => {
    if (!hasMeaningfulResumeContent(resume)) return;
    if ((activeTab === "analyzer" || activeTab === "matcher" || activeTab === "cover") && !analysis && !analysisLoading) {
      runBuilderAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const resumeSourcePanel = (
    <div className="mb-5 rounded-lg border border-[#E2DDEA] bg-white p-4 shadow-card">
      <h2 className="text-xl font-black text-ink">Import Resume</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted">
        Upload a PDF, DOCX, TXT, or Markdown resume, or paste your resume text. LandIt will pull it into this same editor so you can clean it up before analyzing.
      </p>
      <div className="mt-4">
        <ResumeFileInput onParsed={handleResumeParsed} />
      </div>
      <div className="mt-4">
        <label className="text-xs font-black uppercase tracking-[0.16em] text-muted">Paste resume text</label>
        <textarea
          value={pastedResume}
          onChange={(e) => setPastedResume(e.target.value)}
          className="mt-2 min-h-[180px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300"
          placeholder="Paste your resume text here"
        />
        <button
          type="button"
          onClick={handlePastedResume}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
        >
          Load pasted resume <ArrowRight size={17} />
        </button>
      </div>
      {importedFilename && (
        <div className="mt-4 rounded-lg bg-brand-50 p-3 text-sm font-bold text-brand-500">
          Imported {importedFilename}. Check each field before exporting or saving.
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-10" data-testid="resume-workspace-screen">
      <header className="mb-4 rounded-lg border border-[#E2DDEA] bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEAF3] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/resume-builder"
              className="h-11 w-11 rounded-lg border border-[#DCD6E5] bg-white text-muted flex items-center justify-center hover:text-brand-500"
              aria-label="Back to Resume Builder"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="truncate text-2xl font-black text-ink">{title}</h1>
          </div>
          <div className="flex gap-2">
            {pro && (
              <button
                type="button"
                onClick={() => {
                  setCurrentSavedResumeLabel((current) => current || title);
                  setSavePromptOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600"
              >
                <FileText size={17} />
                Save version
              </button>
            )}
            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-lg border border-[#DCD6E5] bg-white px-4 py-2.5 text-sm font-black text-ink hover:bg-brand-50"
            >
              <Download size={17} />
              Export PDF
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-[#DCD6E5] bg-white px-4 py-2.5 text-sm font-black text-ink">
              <Menu size={17} />
              Menu
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 py-3 shell-scroll" aria-label="Resume builder tools">
          {tabs.map(({ id, label, icon: Icon, badge }) => {
            const displayBadge = id === "analyzer" ? analyzerBadge : badge;
            return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-sm font-black transition-colors ${
                activeTab === id ? "bg-brand-50 text-brand-500 shadow-card" : "text-ink hover:bg-[#F7F5FA]"
              }`}
            >
              <Icon size={19} />
              {label}
              {displayBadge && (
                <span className="rounded-full bg-[#EF4B32] px-2 py-0.5 text-xs font-black text-white">{displayBadge}</span>
              )}
            </button>
            );
          })}
        </nav>
      </header>

      {(saveMessage || saveError) && (
        <div className="mb-4">
          {saveMessage && <div className="rounded-lg bg-brand-50 p-3 text-sm font-bold text-brand-500">{saveMessage}</div>}
          {saveError && <div className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{saveError}</div>}
        </div>
      )}

      {savePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">Saved Resumes</div>
            <h2 className="mt-2 text-2xl font-black text-ink">Save this edited version?</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              Keep this resume version so you can reopen it later with the same editor, preview, analyzer, matcher, and cover letter tools.
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-muted">Resume label</span>
              <input
                value={currentSavedResumeLabel}
                onChange={(e) => setCurrentSavedResumeLabel(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-[#DCD6E5] px-3 text-sm font-bold outline-none focus:border-brand-300"
                placeholder={title}
                autoFocus
              />
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSavePromptOpen(false)}
                className="rounded-lg border border-[#DCD6E5] bg-white px-4 py-2.5 text-sm font-black text-ink hover:bg-[#F7F5FA]"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentResume}
                disabled={savingResume}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-70"
              >
                {savingResume ? <Loader2 size={17} className="animate-spin" /> : <FileText size={17} />}
                {currentSavedResumeId ? "Update saved resume" : "Save resume"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card md:max-h-[calc(100vh-220px)] md:overflow-y-auto shell-scroll">
          {activeTab === "designer" ? (
            <div>
              <div className="mb-5 flex flex-wrap gap-5 border-b border-[#EEEAF3] pb-4 text-sm font-black text-muted">
                <button
                  type="button"
                  onClick={() => setDesignerPanel("templates")}
                  className={designerPanel === "templates" ? "text-brand-500" : "hover:text-ink"}
                >
                  Templates
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerPanel("sections")}
                  className={designerPanel === "sections" ? "text-brand-500" : "hover:text-ink"}
                >
                  Sections
                </button>
              </div>
              {designerPanel === "templates" ? (
                <>
                  <div className="mb-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
                    <h2 className="flex items-center gap-2 text-xl font-black text-ink">
                      <LayoutTemplate size={22} className="text-brand-500" />
                      Template Library
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                      Choose a LandIt template to populate the same editable fields as a new resume.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {resumeTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template.id)}
                        className={`group rounded-lg border bg-white p-4 text-left shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50 ${
                          selectedTemplate === template.id ? "border-brand-300" : "border-[#E2DDEA]"
                        }`}
                      >
                        <div className="relative overflow-hidden rounded-lg border border-[#EEEAF3] bg-[#F8F7FA] p-3">
                          {!pro && (
                            <div className="pointer-events-none absolute inset-0 z-10 flex -rotate-12 items-center justify-center opacity-[0.1]">
                              <div className="text-xl font-black uppercase tracking-[0.16em] text-brand-500">LandIt Preview</div>
                            </div>
                          )}
                          <TemplateThumbnail template={template} />
                        </div>
                        <div className="mt-4 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-black text-ink">{template.name}</div>
                            <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-brand-500">{template.label}</div>
                          </div>
                          {selectedTemplate === template.id && (
                            <span className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-black text-white">Selected</span>
                          )}
                        </div>
                        <p className="mt-3 text-sm font-semibold leading-6 text-muted">{template.role}</p>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div>
                  <div className="mb-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
                    <h2 className="text-xl font-black text-ink">Section Order & Visibility</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                      Move sections up or down and hide anything that should not appear in this resume.
                    </p>
                  </div>
                  <div className="space-y-3" data-testid="section-order-list">
                    {resume.sectionOrder.map((sectionId, index) => {
                      const hidden = resume.hiddenSections.includes(sectionId);
                      return (
                        <div key={sectionId} className="flex items-center gap-3 rounded-lg border border-[#E2DDEA] bg-white p-3 shadow-card">
                          <GripVertical size={18} className="text-brand-300" />
                          <span className={`min-w-0 flex-1 text-base font-black ${hidden ? "text-muted line-through" : "text-ink"}`}>
                            {sectionLabels[sectionId]}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveSection(sectionId, -1)}
                            disabled={index === 0}
                            className="rounded-lg border border-[#DCD6E5] p-2 text-brand-500 disabled:opacity-30"
                            aria-label={`Move ${sectionLabels[sectionId]} up`}
                          >
                            <ArrowUp size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(sectionId, 1)}
                            disabled={index === resume.sectionOrder.length - 1}
                            className="rounded-lg border border-[#DCD6E5] p-2 text-brand-500 disabled:opacity-30"
                            aria-label={`Move ${sectionLabels[sectionId]} down`}
                          >
                            <ArrowDown size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSection(sectionId)}
                            className="rounded-lg border border-[#DCD6E5] p-2 text-brand-500"
                            aria-label={`${hidden ? "Show" : "Hide"} ${sectionLabels[sectionId]}`}
                          >
                            {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "matcher" || activeTab === "cover" ? (
            <div>
              {activeTab === "cover" && (
                <div className="mb-5">
                  <div className="rounded-lg border border-brand-100 bg-brand-50 p-5">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-ink">
                      <PenLine size={24} className="text-brand-500" />
                      Cover Letter Builder
                    </h2>
                    <p className="mt-3 text-sm font-semibold leading-6 text-muted">
                      Choose a template, edit the letter, then use analyzer-backed suggestions when a job description is attached.
                    </p>
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900">
                      Draft only: proofread, personalize, and edit this cover letter before submitting it. Do not send the generated version as-is.
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {coverLetterTemplates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyCoverTemplate(template.id)}
                        className={`rounded-lg border bg-white p-4 text-left shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50 ${
                          selectedCoverTemplate === template.id ? "border-brand-300" : "border-[#E2DDEA]"
                        }`}
                      >
                        <div className="text-base font-black text-ink">{template.name}</div>
                        <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-brand-500">{template.label}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3">
                    <input
                      value={coverFields.companyName}
                      onChange={(e) => setCoverFields((current) => ({ ...current, companyName: e.target.value }))}
                      className="min-h-12 rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300"
                      placeholder="Company name"
                    />
                    <input
                      value={coverFields.hiringManager}
                      onChange={(e) => setCoverFields((current) => ({ ...current, hiringManager: e.target.value }))}
                      className="min-h-12 rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300"
                      placeholder="Hiring manager"
                    />
                    <textarea
                      value={coverFields.opening}
                      onChange={(e) => setCoverFields((current) => ({ ...current, opening: e.target.value }))}
                      className="min-h-[90px] rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300"
                      placeholder="Opening paragraph"
                    />
                    <textarea
                      value={coverFields.body}
                      onChange={(e) => setCoverFields((current) => ({ ...current, body: e.target.value }))}
                      className="min-h-[120px] rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300"
                      placeholder="Body paragraph"
                    />
                    <textarea
                      value={coverFields.closing}
                      onChange={(e) => setCoverFields((current) => ({ ...current, closing: e.target.value }))}
                      className="min-h-[90px] rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300"
                      placeholder="Closing paragraph"
                    />
                    {pro ? (
                      <button
                        type="button"
                        onClick={applyAiCoverSuggestions}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
                      >
                        <Sparkles size={17} />
                        {analysis ? "Apply analyzer suggestions" : "Run analyzer for suggestions"}
                      </button>
                    ) : (
                      <Link
                        to="/pro"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
                      >
                        <Sparkles size={17} />
                        Unlock analyzer suggestions
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <h2 className="flex items-center gap-2 text-2xl font-black text-ink">
                <Search size={25} />
                Compare a Job Description to Your Resume
              </h2>
              {!hasResumeContent && (
                <div className="mt-5">
                  {resumeSourcePanel}
                  <div className="rounded-lg bg-brand-50 p-3 text-sm font-bold text-muted">
                    Upload or paste a resume first, then add the job description you want to compare.
                  </div>
                </div>
              )}
              {hasResumeContent && (
                <>
              <div className="mt-3 inline-flex rounded-lg bg-[#FFF3CF] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-ink">
                External job search coming soon
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="min-h-12 rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300"
                  placeholder="Job title"
                />
                <button
                  type="button"
                  onClick={() => setActiveTab("matcher")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white"
                >
                  <Search size={18} />
                  Search
                </button>
              </div>
              <div className="mt-6 border-t border-[#EEEAF3] pt-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-ink">Add a Job Description</h3>
                  <button
                  type="button"
                  onClick={runBuilderAnalysis}
                  className="rounded-lg bg-[#FFF3CF] px-4 py-2 text-sm font-black text-ink"
                >
                    {analysisLoading ? "Matching..." : "Match Job"}
                  </button>
                </div>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mb-3 min-h-12 w-full rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300"
                  placeholder="Company"
                />
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[180px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300"
                  placeholder="Paste the job description here"
                />
              </div>
                </>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">Start building</div>
                <p className="mt-2 text-sm font-semibold text-muted">
                  Fill in the essentials first. The analyzer will show what is missing before you apply.
                </p>
              </div>
              {needsResumeSource && !hasResumeContent && resumeSourcePanel}
              {(!needsResumeSource || hasResumeContent) && (
              <>
              {needsResumeSource && hasResumeContent && resumeSourcePanel}
              <div className="space-y-2">
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3" open>
                  <summary className="cursor-pointer text-lg font-black text-ink">Contact Information</summary>
                  <div className="mt-3 grid gap-3">
                    <input value={resume.candidateName} onChange={(e) => updateResume("candidateName", e.target.value)} className="min-h-12 w-full rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300" placeholder="Name" />
                    <input value={resume.contact} onChange={(e) => updateResume("contact", e.target.value)} className="min-h-12 w-full rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300" placeholder="Contact line" />
                    <input value={resume.role} onChange={(e) => updateResume("role", e.target.value)} className="min-h-12 w-full rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300" placeholder="Custom headline" />
                  </div>
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3" open>
                  <summary className="cursor-pointer text-lg font-black text-ink">Target Title</summary>
                  <input value={resume.targetTitle} onChange={(e) => updateResume("targetTitle", e.target.value)} className="mt-3 min-h-12 w-full rounded-lg border border-[#DCD6E5] px-4 text-sm font-bold outline-none focus:border-brand-300" placeholder="Example: Network Engineer" />
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3" open>
                  <summary className="cursor-pointer text-lg font-black text-ink">Professional Summary</summary>
                  <textarea value={resume.summary} onChange={(e) => updateResume("summary", e.target.value)} className="mt-3 min-h-[120px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300" />
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3">
                  <summary className="cursor-pointer text-lg font-black text-ink">Skills & Interests</summary>
                  <textarea value={resume.skills.join("\n")} onChange={(e) => updateResume("skills", e.target.value.split("\n").filter(Boolean))} className="mt-3 min-h-[150px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300" placeholder="One skill group per line" />
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3" open>
                  <summary className="cursor-pointer text-lg font-black text-ink">Work Experience</summary>
                  <div className="mt-3 space-y-4">
                    {resume.roles.map((role, index) => (
                      <div key={`${role.company}-${index}`} className="rounded-lg bg-[#F8F7FA] p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input value={role.company} onChange={(e) => updateRole(index, { company: e.target.value })} className="min-h-11 rounded-lg border border-[#DCD6E5] px-3 text-sm font-bold outline-none focus:border-brand-300" placeholder="Company" />
                          <input value={role.title} onChange={(e) => updateRole(index, { title: e.target.value })} className="min-h-11 rounded-lg border border-[#DCD6E5] px-3 text-sm font-bold outline-none focus:border-brand-300" placeholder="Title" />
                          <input value={role.location} onChange={(e) => updateRole(index, { location: e.target.value })} className="min-h-11 rounded-lg border border-[#DCD6E5] px-3 text-sm font-bold outline-none focus:border-brand-300" placeholder="Location" />
                          <input value={role.dates} onChange={(e) => updateRole(index, { dates: e.target.value })} className="min-h-11 rounded-lg border border-[#DCD6E5] px-3 text-sm font-bold outline-none focus:border-brand-300" placeholder="Dates" />
                        </div>
                        <textarea value={role.bullets.join("\n")} onChange={(e) => updateRole(index, { bullets: e.target.value.split("\n").filter(Boolean) })} className="mt-3 min-h-[120px] w-full rounded-lg border border-[#DCD6E5] p-3 text-sm font-semibold outline-none focus:border-brand-300" placeholder="One bullet per line" />
                      </div>
                    ))}
                  </div>
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3">
                  <summary className="cursor-pointer text-lg font-black text-ink">Projects</summary>
                  <textarea value={resume.projects.join("\n")} onChange={(e) => updateResume("projects", e.target.value.split("\n").filter(Boolean))} className="mt-3 min-h-[110px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300" placeholder="One project per line" />
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3">
                  <summary className="cursor-pointer text-lg font-black text-ink">Education</summary>
                  <textarea value={resume.education} onChange={(e) => updateResume("education", e.target.value)} className="mt-3 min-h-[80px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300" />
                </details>
                <details className="rounded-lg border border-[#EEEAF3] bg-white px-4 py-3">
                  <summary className="cursor-pointer text-lg font-black text-ink">Certifications</summary>
                  <textarea value={resume.certifications} onChange={(e) => updateResume("certifications", e.target.value)} className="mt-3 min-h-[80px] w-full rounded-lg border border-[#DCD6E5] p-4 text-sm font-semibold outline-none focus:border-brand-300" />
                </details>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAnalyzeResume}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-black text-white hover:bg-brand-600"
                >
                  Analyze resume <ArrowRight size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("matcher")}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-5 py-3 text-sm font-black text-brand-500 hover:bg-brand-50"
                >
                  Match to a job
                </button>
              </div>
              </>
              )}
            </div>
          )}
        </section>

        <aside className="min-w-0 overflow-hidden md:max-h-[calc(100vh-220px)] md:overflow-y-auto shell-scroll">
          {showPaywall ? (
            <PaywallBlock
              context={activeTab === "matcher" ? "matcher" : "analyzer"}
              analysis={analysis}
              loading={analysisLoading}
              error={analysisError}
              onAnalyze={runBuilderAnalysis}
            />
          ) : activeTab === "cover" ? (
            <CoverLetterPreview fields={coverFields} resume={resume} targetTitle={jobTitle || resume.targetTitle} pro={pro} />
          ) : activeTab === "analyzer" ? (
            <RecommendationList analysis={analysis} />
          ) : !hasResumeContent ? (
            <div className="rounded-lg border border-[#E2DDEA] bg-white p-5 shadow-card">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-brand-500">Resume needed</div>
              <h2 className="mt-2 text-2xl font-black text-ink">Upload or paste your resume to start</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                The editable preview will appear here after LandIt parses your resume text.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#E2DDEA] bg-[#F8F7FA] p-5 shadow-card">
              <ResumePreview resume={resume} pro={pro} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ResumePreview({
  resume,
  compact,
  pro,
}: {
  resume: ResumeData;
  compact?: boolean;
  pro: boolean;
}) {
  const visibleSections = resume.sectionOrder.filter((sectionId) => !resume.hiddenSections.includes(sectionId));
  return (
    <div
      className={`relative mx-auto overflow-hidden bg-white text-black shadow-card ${
        compact ? "w-full p-3" : "w-full max-w-[640px] rounded-lg border border-[#E2DDEA] p-6"
      }`}
      style={{
        aspectRatio: "8.5 / 11",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
      data-testid="resume-page-preview"
    >
      {!pro && (
        <div className="pointer-events-none absolute inset-0 z-10 flex -rotate-12 items-center justify-center opacity-[0.08]">
          <div className={`${compact ? "text-2xl" : "text-6xl"} font-black uppercase tracking-[0.2em] text-black`}>
            LandIt Preview
          </div>
        </div>
      )}
      <h2 className={`${compact ? "text-[10px]" : "text-xl"} font-bold text-black`}>{resume.candidateName}</h2>
      <p className={`${compact ? "text-[6px]" : "text-xs"} mt-1 font-bold text-black`}>{resume.role}</p>
      <p className={`${compact ? "text-[5px]" : "text-[11px]"} mt-1 font-normal text-black`}>{resume.contact}</p>
      <div data-testid="resume-preview-sections">
        {visibleSections.map((sectionId) => (
          <ResumePreviewSection key={sectionId} sectionId={sectionId} resume={resume} compact={compact} />
        ))}
      </div>
    </div>
  );
}

function ResumePreviewSection({ sectionId, resume, compact }: { sectionId: ResumeSectionId; resume: ResumeData; compact?: boolean }) {
  const headingClass = `${compact ? "text-[6px]" : "text-[11px]"} border-b border-black pb-0.5 font-bold uppercase text-black`;
  if (sectionId === "summary") {
    return (
      <div className="mt-4" data-section-id="summary">
        <h3 className={headingClass}>Professional Summary</h3>
        <p className={`${compact ? "mt-1 text-[6px]" : "mt-2 text-[11px]"} font-normal leading-snug text-black`}>{resume.summary}</p>
      </div>
    );
  }
  if (sectionId === "skills") {
    return (
      <div className="mt-4" data-section-id="skills">
        <h3 className={headingClass}>Skills</h3>
        <div className={`${compact ? "mt-1 text-[5px]" : "mt-2 text-[10px]"} space-y-1 font-normal leading-snug text-black`}>
          {resume.skills.slice(0, compact ? 2 : resume.skills.length).map((skill) => (
            <p key={skill}>{skill}</p>
          ))}
        </div>
      </div>
    );
  }
  if (sectionId === "experience") {
    return (
      <div className="mt-4" data-section-id="experience">
        <h3 className={headingClass}>Work Experience</h3>
        {resume.roles.slice(0, compact ? 1 : resume.roles.length).map((role) => (
          <div key={`${role.company}-${role.title}`} className="mt-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={`${compact ? "text-[6px]" : "text-[11px]"} font-bold text-black`}>{role.company}</div>
                <div className={`${compact ? "text-[6px]" : "text-[11px]"} font-bold text-black`}>{role.title}</div>
              </div>
              <div className={`${compact ? "text-[5px]" : "text-[10px]"} text-right font-bold text-black`}>
                {role.dates}
                <br />
                {role.location}
              </div>
            </div>
            <ul className={`${compact ? "mt-1 text-[5px]" : "mt-1.5 text-[10px]"} list-disc space-y-1 pl-5 font-normal leading-snug text-black`}>
              {role.bullets.slice(0, compact ? 2 : role.bullets.length).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  if (sectionId === "projects") {
    return (
      <div className="mt-4" data-section-id="projects">
        <h3 className={headingClass}>Projects</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[10px] font-normal leading-snug text-black">
          {resume.projects.map((project) => (
            <li key={project}>{project}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (sectionId === "education") {
    return (
      <div className="mt-4" data-section-id="education">
        <h3 className={headingClass}>Education</h3>
        <p className="mt-2 text-[10px] font-normal text-black">{resume.education}</p>
      </div>
    );
  }
  return (
    <div className="mt-4" data-section-id="certifications">
      <h3 className={headingClass}>Certifications</h3>
      <p className="mt-2 text-[10px] font-normal text-black">{resume.certifications}</p>
    </div>
  );
}

function CoverLetterPreview({
  fields,
  resume,
  targetTitle,
  pro,
}: {
  fields: {
    hiringManager: string;
    companyName: string;
    roleLine: string;
    opening: string;
    body: string;
    closing: string;
  };
  resume: ResumeData;
  targetTitle: string;
  pro: boolean;
}) {
  return (
    <div className="relative mx-auto max-w-[640px] overflow-hidden rounded-lg border border-[#E2DDEA] bg-white p-8 shadow-card">
      {!pro && (
        <div className="pointer-events-none absolute inset-0 z-10 flex -rotate-12 items-center justify-center opacity-[0.08]">
          <div className="text-6xl font-black uppercase tracking-[0.2em] text-brand-500">LandIt Preview</div>
        </div>
      )}
      <h2 className="text-2xl font-black text-brand-500">{resume.candidateName}</h2>
      <p className="mt-1 text-xs font-semibold text-ink">{fields.roleLine}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{resume.contact}</p>
      <div className="mt-8 space-y-4 text-sm font-medium leading-7 text-ink">
        <p>{new Date().toLocaleDateString()}</p>
        <p>
          Dear {fields.hiringManager || "Hiring Manager"},
        </p>
        <p>{fields.opening}</p>
        <p>{fields.body}</p>
        <p>{fields.closing}</p>
        <p>
          Sincerely,
          <br />
          {resume.candidateName}
        </p>
      </div>
      <div className="mt-6 rounded-lg bg-brand-50 p-3 text-xs font-bold text-brand-500">
        Target role: {targetTitle || "Attach a job description to personalize this letter"}
        {fields.companyName ? ` at ${fields.companyName}` : ""}
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
        Draft only. Proofread, personalize, and edit before submitting.
      </div>
    </div>
  );
}

function TemplateThumbnail({ template }: { template: ResumeTemplate }) {
  if (template.layout === "creative") {
    return (
      <div>
        <div className={`mb-3 h-10 w-10 rounded-full ${template.accent}`} />
        <div className="grid grid-cols-[0.65fr_1fr] gap-3">
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-ink/70" />
            <div className="h-2 w-4/5 rounded-full bg-muted/25" />
            <div className="mt-4 h-16 rounded bg-brand-50" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full bg-ink/80" />
            <div className="h-2 w-full rounded-full bg-muted/20" />
            <div className="h-2 w-5/6 rounded-full bg-muted/20" />
            <div className="h-2 w-full rounded-full bg-muted/20" />
          </div>
        </div>
      </div>
    );
  }

  if (template.layout === "pivot") {
    return (
      <div>
        <div className={`mb-3 h-2 w-full rounded-full ${template.accent}`} />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2 rounded bg-white p-2">
            <div className="h-2 w-20 rounded-full bg-ink/80" />
            <div className="h-2 w-full rounded-full bg-muted/20" />
            <div className="h-2 w-4/5 rounded-full bg-muted/20" />
          </div>
          <div className="space-y-2 rounded bg-white p-2">
            <div className="h-2 w-16 rounded-full bg-ink/80" />
            <div className="h-2 w-full rounded-full bg-muted/20" />
            <div className="h-2 w-3/5 rounded-full bg-muted/20" />
          </div>
        </div>
        <div className="mt-3 h-2 w-28 rounded-full bg-brand-200" />
      </div>
    );
  }

  if (template.layout === "entry") {
    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className={`h-8 w-8 rounded ${template.accent}`} />
          <div className="space-y-1">
            <div className="h-2 w-24 rounded-full bg-ink/80" />
            <div className="h-2 w-20 rounded-full bg-muted/25" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-muted/20" />
          <div className="h-2 w-5/6 rounded-full bg-muted/20" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="h-10 rounded bg-brand-50" />
            <div className="h-10 rounded bg-brand-50" />
            <div className="h-10 rounded bg-brand-50" />
          </div>
        </div>
      </div>
    );
  }

  if (template.layout === "technical") {
    return (
      <div>
        <div className={`mb-3 h-2 w-16 rounded-full ${template.accent}`} />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded-full bg-ink/80" />
          <div className="h-2 w-full rounded-full bg-muted/20" />
          <div className="h-2 w-5/6 rounded-full bg-muted/20" />
          <div className="mt-3 grid grid-cols-[0.4fr_1fr] gap-2">
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-brand-200" />
              <div className="h-2 rounded-full bg-brand-200" />
              <div className="h-2 rounded-full bg-brand-200" />
            </div>
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-muted/20" />
              <div className="h-2 rounded-full bg-muted/20" />
              <div className="h-2 w-4/5 rounded-full bg-muted/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={`mb-3 h-2 w-16 rounded-full ${template.accent}`} />
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-ink/80" />
        <div className="h-2 w-32 rounded-full bg-muted/30" />
        <div className="h-2 w-28 rounded-full bg-muted/30" />
        <div className="mt-4 h-2 w-20 rounded-full bg-brand-200" />
        <div className="h-2 w-full rounded-full bg-muted/20" />
        <div className="h-2 w-5/6 rounded-full bg-muted/20" />
        <div className="h-2 w-4/6 rounded-full bg-muted/20" />
      </div>
    </div>
  );
}
