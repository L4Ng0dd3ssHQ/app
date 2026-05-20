export type KeySkills = {
  technical: string[];
  soft: string[];
  tools: string[];
};

export type BulletSuggestion = {
  before: string;
  after: string;
};

export type JobStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected";

export const JOB_STATUSES: JobStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];

export type Analysis = {
  id: string;
  job_title: string;
  match_score: number;
  key_skills: KeySkills;
  required_skills: string[];
  preferred_skills: string[];
  missing_skills: string[];
  suggested_bullets: BulletSuggestion[];
  focus_guidance: string[];
  summary: string;
  has_resume: boolean;
  created_at: string;
  status: JobStatus;
};

export type SavedResume = {
  id: string;
  device_id: string;
  label: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type SavedJob = {
  id: string;
  device_id: string;
  source: string;
  source_id?: string | null;
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
  notes: string;
  resume_id?: string | null;
  resume_label?: string | null;
  analysis_id?: string | null;
  cover_letter_id?: string | null;
  applied_at?: string | null;
  follow_up_at?: string | null;
  created_at: string;
  updated_at: string;
};
