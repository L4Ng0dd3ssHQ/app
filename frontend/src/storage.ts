const DEVICE_ID_KEY = "landit_device_id";
const PRO_KEY = "landit_pro";
const HISTORY_KEY = "landit_history_v1";
const QUOTA_KEY = "landit_quota_v1";

export const DAILY_LIMIT = 3;

// ===== Device ID =====
export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ===== Pro State =====
export function isPro(): boolean {
  try {
    const raw = localStorage.getItem(PRO_KEY);
    if (!raw) return false;
    const { is_pro, pro_until } = JSON.parse(raw);
    if (!is_pro) return false;
    if (!pro_until) return false;
    return new Date(pro_until) > new Date();
  } catch {
    return false;
  }
}

export function setProState(state: { is_pro: boolean; pro_until: string | null }): void {
  localStorage.setItem(PRO_KEY, JSON.stringify(state));
}

// ===== History =====
export function loadHistory(): any[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysis(a: any): void {
  const list = loadHistory();
  const next = [a, ...list.filter((x) => x.id !== a.id)].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function getAnalysis(id: string): any | null {
  return loadHistory().find((x) => x.id === id) || null;
}

export function deleteAnalysis(id: string): void {
  const list = loadHistory().filter((x) => x.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ===== Quota =====
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getQuotaUsed(): number {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== todayKey()) return 0;
    return Number(count) || 0;
  } catch {
    return 0;
  }
}

export function incrementQuota(): number {
  const used = getQuotaUsed();
  const next = used + 1;
  localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: todayKey(), count: next }));
  return next;
}

export function canAnalyze(): { allowed: boolean; used: number; remaining: number } {
  const used = getQuotaUsed();
  return { allowed: used < DAILY_LIMIT, used, remaining: Math.max(0, DAILY_LIMIT - used) };
}
