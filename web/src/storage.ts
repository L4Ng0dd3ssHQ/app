import type { Analysis, JobStatus } from "./types";

const HISTORY_KEY = "landit.history.v1";
const QUOTA_KEY = "landit.quota.v1";
const DEVICE_KEY = "landit.device_id.v1";
const PRO_KEY = "landit.pro.v1";
export const DAILY_LIMIT = 3;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ===== History =====
export function loadHistory(): Analysis[] {
  return safeParse<Analysis[]>(localStorage.getItem(HISTORY_KEY), []);
}

export function saveAnalysis(a: Analysis): void {
  const list = loadHistory();
  const next = [a, ...list.filter((x) => x.id !== a.id)].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function getAnalysis(id: string): Analysis | null {
  return loadHistory().find((x) => x.id === id) || null;
}

export function deleteAnalysis(id: string): void {
  const next = loadHistory().filter((x) => x.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ===== Tracker status (local-only, lives on each Analysis) =====
export function setAnalysisStatus(id: string, status: JobStatus): void {
  const list = loadHistory();
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status };
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export function getAnalysisStatus(a: Analysis): JobStatus {
  return (a.status as JobStatus) || "saved";
}

// ===== Daily Quota =====
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getQuotaUsed(): number {
  const obj = safeParse<{ date: string; count: number } | null>(
    localStorage.getItem(QUOTA_KEY),
    null
  );
  if (!obj || obj.date !== todayKey()) return 0;
  return obj.count || 0;
}

export function incrementQuota(): number {
  const next = getQuotaUsed() + 1;
  localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: todayKey(), count: next }));
  return next;
}

export function quotaStatus() {
  const used = getQuotaUsed();
  return { used, remaining: Math.max(0, DAILY_LIMIT - used), allowed: used < DAILY_LIMIT };
}

// ===== Device ID (for Pro identification, no auth) =====
function uuid(): string {
  // RFC 4122 v4-ish, fine for non-cryptographic device id
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// ===== Pro =====
export type ProState = { is_pro: boolean; pro_until: string | null };

export function getProState(): ProState {
  const raw = safeParse<ProState | null>(localStorage.getItem(PRO_KEY), null);
  if (!raw || !raw.pro_until) return { is_pro: false, pro_until: null };
  const stillActive = new Date(raw.pro_until).getTime() > Date.now();
  return { is_pro: stillActive, pro_until: raw.pro_until };
}

export function setProState(state: ProState): void {
  localStorage.setItem(PRO_KEY, JSON.stringify(state));
}

export function isPro(): boolean {
  return getProState().is_pro;
}
