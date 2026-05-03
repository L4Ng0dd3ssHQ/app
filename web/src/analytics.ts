import { track as vercelTrack } from "@vercel/analytics";

/**
 * Type-safe wrapper around Vercel Analytics custom events.
 * No-ops gracefully if Analytics isn't loaded (e.g. local dev w/o the package).
 */
export function track(event: string, props?: Record<string, string | number | boolean | null>) {
  try {
    vercelTrack(event, props);
  } catch {
    // ignore
  }
}
