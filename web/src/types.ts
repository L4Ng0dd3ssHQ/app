export type KeySkills = {
  technical: string[];
  soft: string[];
  tools: string[];
};

export type BulletSuggestion = {
  before: string;
  after: string;
};

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
};
