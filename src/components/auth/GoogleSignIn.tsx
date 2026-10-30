"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { API_BASE } from "@/lib/constants";
import { useAuthStateStore } from "@/lib/stateStore";
import { PENDING_KEY } from "./googlePending";

// "Continue with Google" on the log-in and sign-up pages. Hidden unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
// Google's script loads only on these pages, when the button is shown. A new person picks a username and confirms
// they're 18+ in a dialog; an email that already has an account is connected only after a password log-in (the
// token waits in this tab's session storage for the log-in page, see connectPendingGoogle).

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleId = {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup";
  }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
};

let loading: Promise<GoogleId> | null = null;
function loadGoogle(): Promise<GoogleId> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () =>
      resolve(
        (window as unknown as { google: { accounts: { id: GoogleId } } }).google
          .accounts.id,
      );
    script.onerror = () => {
      loading = null;
      reject(new Error("Google sign-in could not load."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

class GoogleError extends ApiError {
  constructor(
    status: number,
    code: string,
    message: string,
    fields: Record<string, string> | undefined,
    public details: Record<string, string>,
  ) {
    super(status, code, message, fields);
  }
}

// POST /auth/google directly rather than through the shared client, so the error's details (the suggested
// username, the email) come through without adding to every page's script
async function postGoogle(body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.ok) return;
  const { error } = await response.json().catch(() => ({ error: null }));
  throw new GoogleError(
    response.status,
    error?.code ?? "unknown",
    error?.message ?? "Something went wrong. Try again.",
    error?.fields,
    error?.details ?? {},
  );
}

export function GoogleSignIn({
  next,
  onLinkRequired,
}: {
  next: string;
  onLinkRequired: (email: string) => void;
}) {
  const router = useRouter();
  const login = useAuthStateStore((state) => state.login);
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    credential: string;
    suggested: string;
  } | null>(null);
  const [GoogleDetails, setGoogleDetails] = useState<
    typeof import("./GoogleDetails").default | null
  >(null);

  function finish() {
    login();
    router.replace(next);
    router.refresh();
  }

  async function continueWith(credential: string) {
    setError(null);
    try {
      await postGoogle({ id_token: credential });
      finish();
    } catch (error) {
      if (
        error instanceof GoogleError &&
        error.code === "google_signup_details"
      ) {
        const dialog = await import("./GoogleDetails");
        setGoogleDetails(() => dialog.default);
        setDetails({
          credential,
          suggested: error.details.suggested_username ?? "",
        });
      } else if (
        error instanceof GoogleError &&
        error.code === "google_link_required"
      ) {
        const email = error.details.email ?? "";
        try {
          sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify({ credential, email }),
          );
        } catch {
          // Without storage they can still log in and connect Google later
        }
        onLinkRequired(email);
      } else {
        setError(errorMessage(error));
      }
    }
  }

  useEffect(() => {
    if (!CLIENT_ID || !container.current) return;
    const element = container.current;
    loadGoogle()
      .then((google) => {
        google.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) => void continueWith(credential),
          ux_mode: "popup",
        });
        const theme = document.documentElement.dataset.theme;
        const dark = theme
          ? theme === "dark"
          : matchMedia("(prefers-color-scheme: dark)").matches;
        google.renderButton(element, {
          type: "standard",
          theme: dark ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: element.clientWidth,
        });
      })
      .catch((error: Error) => setError(error.message));
    // continueWith only reads state through setters; the button is set up once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) return null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      {/* Same height as Google's button, so nothing moves when it appears */}
      <div ref={container} className="flex h-10 w-full justify-center" />
      {error && <ErrorMessage size="small" errorMessage={error} role="alert" />}
      {details && GoogleDetails && (
        <GoogleDetails
          postGoogle={postGoogle}
          credential={details.credential}
          suggested={details.suggested}
          onClose={() => setDetails(null)}
          onJoined={finish}
        />
      )}
    </div>
  );
}
