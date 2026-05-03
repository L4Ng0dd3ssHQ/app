import type { Analysis } from "./types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string | undefined;

if (!BACKEND_URL) {
  // eslint-disable-next-line no-console
  console.warn("VITE_BACKEND_URL is not set. API calls will fail.");
}

export async function analyzeJob(job_description: string, resume: string): Promise<Analysis> {
  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_description, resume }),
  });
  if (!res.ok) {
    let detail = `Server error ${res.status}`;
    try {
      const err = await res.json();
      if (err?.detail) detail = err.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return (await res.json()) as Analysis;
}
