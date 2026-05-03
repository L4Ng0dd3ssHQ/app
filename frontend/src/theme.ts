// Shared theme values for the Job Description Analyzer
export const COLORS = {
  purple: "#7C2FB8",
  purpleDeep: "#4B0F8B",
  purpleLight: "#A56BD6",
  purpleSoft: "#F1E6FA",
  bg: "#FAF7FD",
  white: "#FFFFFF",
  text: "#1A0F2E",
  textMuted: "#6E6680",
  border: "#EAE3F4",
  good: "#10B981",
  warn: "#F59E0B",
  bad: "#EF4444",
  badge: "#EDE0FA",
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const SHADOW = {
  card: {
    shadowColor: "#4B0F8B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};

export type Analysis = {
  id: string;
  job_title: string;
  match_score: number;
  key_skills: { technical: string[]; soft: string[]; tools: string[] };
  required_skills: string[];
  preferred_skills: string[];
  missing_skills: string[];
  suggested_bullets: { before: string; after: string }[];
  focus_guidance: string[];
  summary: string;
  has_resume: boolean;
  created_at: string;
};
