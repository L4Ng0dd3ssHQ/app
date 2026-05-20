export type JobStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export type JobPosting = {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  employmentType: string;
  remoteType: string;
  schedule: string;
  postedAt: string;
  shortDescription: string;
  description: string;
  applyUrl: string;
  status: JobStatus;
};

export type JobSearchHandoff = {
  workflow?: "matcher" | "cover";
  job?: {
    id?: string;
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
    remoteType?: string;
    source?: string;
    sourceUrl?: string;
  };
  jd?: string;
  jobDescription?: string;
};

export const JOB_SEARCH_HANDOFF_KEY = "landit_job_search_handoff";

export const statusLabels: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export const placeholderJobs: JobPosting[] = [
  {
    id: "ai-trainer",
    source: "Placeholder listing",
    sourceUrl: "https://example.com/jobs/ai-trainer",
    title: "Software Engineer Analyst - AI Trainer",
    company: "DataAnnotation",
    location: "High Point, NC",
    salary: "$50 - $100 an hour",
    employmentType: "Contract",
    remoteType: "Remote",
    schedule: "Flexible schedule",
    postedAt: "Today",
    shortDescription:
      "Review AI-generated code, write clear feedback, and help improve model performance for real software engineering tasks.",
    description:
      "DataAnnotation is looking for software engineers to evaluate AI-generated code, write high-quality explanations, and create coding prompts across common programming languages. This role is remote and flexible, with projects focused on debugging, reasoning, documentation, and software design judgment. Ideal candidates have hands-on engineering experience, strong written communication, and comfort explaining why a solution works or fails.",
    applyUrl: "https://example.com/jobs/ai-trainer/apply",
    status: "saved",
  },
  {
    id: "cloud-support",
    source: "Placeholder listing",
    sourceUrl: "https://example.com/jobs/cloud-support",
    title: "Junior Cloud Support Specialist",
    company: "Northstar Health Systems",
    location: "Atlanta, GA",
    salary: "$62,000 - $78,000 a year",
    employmentType: "Full-time",
    remoteType: "Hybrid",
    schedule: "Monday to Friday",
    postedAt: "2 days ago",
    shortDescription:
      "Support cloud applications, triage user issues, document incidents, and partner with engineering on reliability improvements.",
    description:
      "Northstar Health Systems is hiring a Junior Cloud Support Specialist to support internal tools and cloud-hosted applications. Responsibilities include monitoring queues, troubleshooting access and application issues, escalating incidents, documenting fixes, and assisting with cloud operations projects. Experience with help desk workflows, basic networking, ticketing systems, and AWS or Azure fundamentals is helpful.",
    applyUrl: "https://example.com/jobs/cloud-support/apply",
    status: "applied",
  },
  {
    id: "operations-analyst",
    source: "Placeholder listing",
    sourceUrl: "https://example.com/jobs/operations-analyst",
    title: "IT Operations Analyst",
    company: "CivicGrid",
    location: "Remote",
    salary: "$35 - $45 an hour",
    employmentType: "Part-time",
    remoteType: "Remote",
    schedule: "Evening shift",
    postedAt: "Just now",
    shortDescription:
      "Monitor systems, coordinate incident response, update runbooks, and keep service operations moving across distributed teams.",
    description:
      "CivicGrid needs an IT Operations Analyst to monitor service health, coordinate incident response, maintain runbooks, and support operational reporting. The role requires strong communication, careful documentation, and experience working across technical teams. Familiarity with monitoring dashboards, ticket queues, and basic scripting is preferred.",
    applyUrl: "https://example.com/jobs/operations-analyst/apply",
    status: "interviewing",
  },
];

export function findPlaceholderJob(jobId: string | null) {
  return placeholderJobs.find((job) => job.id === jobId) || null;
}

export function createJobHandoff(job: JobPosting, workflow: "matcher" | "cover" = "matcher"): JobSearchHandoff {
  return {
    workflow,
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary,
      employmentType: job.employmentType,
      remoteType: job.remoteType,
      source: job.source,
      sourceUrl: job.sourceUrl,
    },
    jd: job.description,
    jobDescription: job.description,
  };
}

export function storeJobHandoff(job: JobPosting, workflow: "matcher" | "cover" = "matcher") {
  try {
    window.sessionStorage.setItem(JOB_SEARCH_HANDOFF_KEY, JSON.stringify(createJobHandoff(job, workflow)));
  } catch {
    // Route state and jobId query fallback still carry the review flow.
  }
}

export function readStoredJobHandoff() {
  try {
    const raw = window.sessionStorage.getItem(JOB_SEARCH_HANDOFF_KEY);
    return raw ? (JSON.parse(raw) as JobSearchHandoff) : null;
  } catch {
    return null;
  }
}
