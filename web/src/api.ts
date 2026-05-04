import type { Analysis, SavedResume } from "./types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string | undefined;

if (!BACKEND_URL) {
  console.warn("VITE_BACKEND_URL is not set. API calls will fail.");
}

async function asJson<T>(res: Response): Promise<T> {
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
  return (await res.json()) as T;
}

export async function analyzeJob(job_description: string, resume: string): Promise<Analysis> {
  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_description, resume }),
  });
  return asJson<Analysis>(res);
}

export async function createCheckout(deviceId: string, originUrl: string): Promise<{ url: string; session_id: string }> {
  const res = await fetch(`${BACKEND_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      package_id: "pro_monthly",
      origin_url: originUrl,
      device_id: deviceId,
    }),
  });
  return asJson<{ url: string; session_id: string }>(res);
}

export type CheckoutStatus = {
  session_id: string;
  status: string;
  payment_status: string;
  fulfilled: boolean;
  pro_until: string | null;
};

export async function getCheckoutStatus(sessionId: string): Promise<CheckoutStatus> {
  const res = await fetch(`${BACKEND_URL}/api/checkout/status/${encodeURIComponent(sessionId)}`);
  return asJson<CheckoutStatus>(res);
}

export async function getProStatus(deviceId: string): Promise<{ is_pro: boolean; pro_until: string | null }> {
  const res = await fetch(`${BACKEND_URL}/api/pro/${encodeURIComponent(deviceId)}`);
  return asJson<{ is_pro: boolean; pro_until: string | null }>(res);
}

export async function listResumes(deviceId: string): Promise<SavedResume[]> {
  const res = await fetch(`${BACKEND_URL}/api/resumes/${encodeURIComponent(deviceId)}`);
  return asJson<SavedResume[]>(res);
}

export async function createResume(deviceId: string, label: string, content: string): Promise<SavedResume> {
  const res = await fetch(`${BACKEND_URL}/api/resumes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, label, content }),
  });
  return asJson<SavedResume>(res);
}

export async function updateResume(resumeId: string, deviceId: string, data: { label?: string; content?: string }): Promise<SavedResume> {
  const res = await fetch(`${BACKEND_URL}/api/resumes/${encodeURIComponent(resumeId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: deviceId, ...data }),
  });
  return asJson<SavedResume>(res);
}

export async function deleteResume(resumeId: string, deviceId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`${BACKEND_URL}/api/resumes/${encodeURIComponent(resumeId)}?device_id=${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
  });
  return asJson<{ deleted: boolean }>(res);
}