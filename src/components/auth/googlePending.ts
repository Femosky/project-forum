import { api } from "@/lib/api/client";

// A Google sign-in that needs a password log-in first to connect it waits here, in this tab's session storage
export const PENDING_KEY = "pending_google";

type Pending = { credential: string; email: string };

export function readPendingGoogle(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

// After a password log-in: connects the Google account the person tried to continue with, if any
export async function connectPendingGoogle() {
  const pending = readPendingGoogle();
  if (!pending) return;
  try {
    sessionStorage.removeItem(PENDING_KEY);
    await api("/auth/google/link", {
      method: "POST",
      body: { id_token: pending.credential },
    });
  } catch {
    // The Google token may have expired; they can connect it again later
  }
}
