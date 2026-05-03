import type { Analysis } from "./types";

const HISTORY_KEY = "landit.history.v1";
const QUOTA_KEY = "landit.quota.v1";
export const DAILY_LIMIT = 3;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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
