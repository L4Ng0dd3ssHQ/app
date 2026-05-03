import AsyncStorage from "@react-native-async-storage/async-storage";
import { Analysis } from "./theme";

const HISTORY_KEY = "jda.history.v1";
const QUOTA_KEY = "jda.quota.v1";
export const DAILY_LIMIT = 3;

export async function loadHistory(): Promise<Analysis[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Analysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveAnalysis(a: Analysis): Promise<void> {
  const list = await loadHistory();
  const next = [a, ...list.filter((x) => x.id !== a.id)].slice(0, 50);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const list = await loadHistory();
  return list.find((x) => x.id === id) || null;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const list = await loadHistory();
  const next = list.filter((x) => x.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function getQuotaUsed(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUOTA_KEY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== todayKey()) return 0;
    return Number(count) || 0;
  } catch {
    return 0;
  }
}

export async function incrementQuota(): Promise<number> {
  const used = await getQuotaUsed();
  const next = used + 1;
  await AsyncStorage.setItem(QUOTA_KEY, JSON.stringify({ date: todayKey(), count: next }));
  return next;
}

export async function canAnalyze(): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const used = await getQuotaUsed();
  return { allowed: used < DAILY_LIMIT, used, remaining: Math.max(0, DAILY_LIMIT - used) };
}
