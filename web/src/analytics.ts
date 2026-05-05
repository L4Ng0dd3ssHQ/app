export function track(event: string, props?: Record<string, unknown>): void {
  try {
    if (typeof window !== "undefined" && (window as any).va) {
      (window as any).va("event", { name: event, ...props });
    }
  } catch {
    // ignore
  }
}