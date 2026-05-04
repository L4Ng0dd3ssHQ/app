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
