import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Module-scoped stylesheets (cannot be loaded via @import at the bottom of
// index.css — those rules are CSS-spec invalid and silently dropped).
import "./styles/hero-animations.css";
import "./styles/difficulty.css";
import "./styles/finance.css";
import "./styles/shop.css";
import "./styles/glassmorphism.css";
import "./styles/journal.css";
import "./styles/goals.css";
import "./styles/analytics.css";

// i18n must be initialized once, before any components render.
import "@/i18n/i18n";

// --- Sentry initialization (before any React render) ---
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const SENTRY_ENV = import.meta.env.MODE; // 'development' | 'production'

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENV,
    // Volume limits
    sampleRate: 1.0, // 100% of errors
    tracesSampleRate: SENTRY_ENV === "production" ?  0.1 : 0, // 10% transactions in prod
    replaysSessionSampleRate: 0, // no session replay (free tier limited)
    replaysOnErrorSampleRate: 0.5, // replay only on error (50%)
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      /chrome-extension/i,
      /moz-extension/i,
    ],
    beforeSend(event) {
      if (typeof window !== "undefined") {
        const host = window.location.hostname;
        if (host.includes("id-preview--") || host.includes("lovableproject.com")) {
          return null;
        }
      }
      return event;
    },
  });
  console.info("[Sentry] initialized", { env: SENTRY_ENV });
} else if (SENTRY_ENV === "production") {
  console.warn("[Sentry] VITE_SENTRY_DSN missing — error monitoring disabled");
}

// Service worker: register only on production custom domains (push notifications).
// In Lovable preview / iframes, unregister any existing SW to avoid HMR collisions.
(() => {
  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app");
  if (isPreviewHost || isInIframe) {
    navigator.serviceWorker?.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    return;
  }
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
