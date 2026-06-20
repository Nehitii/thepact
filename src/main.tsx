import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Global stylesheets (cannot be loaded via @import at the bottom of
// index.css — those rules are CSS-spec invalid and silently dropped).
// Kept global because their classes are used across multiple pages or
// shared components (sidebar, DSBackground, profile, etc.).
import "./styles/hero-animations.css";
import "./styles/difficulty.css";
import "./styles/shop.css";
import "./styles/glassmorphism.css";
import "./styles/journal.css";
// finance.css, analytics.css and goals.css are co-located with their
// respective lazy pages (Finance/Analytics/Goals) so they ship in the
// page chunk instead of the initial bundle.

// i18n must be initialized once, before any components render.
import "@/i18n/i18n";

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

// --- Sentry initialization (deferred, after first render) ---
// Loaded dynamically during browser idle time to avoid blocking the initial render
// and to keep @sentry/react out of the main bundle.
function initSentryDeferred() {
  const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const SENTRY_ENV = import.meta.env.MODE;
  if (!SENTRY_DSN) {
    if (SENTRY_ENV === "production") {
      console.warn("[Sentry] VITE_SENTRY_DSN missing — error monitoring disabled");
    }
    return;
  }
  import("@sentry/react").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENV,
      sampleRate: 1.0,
      tracesSampleRate: SENTRY_ENV === "production" ? 0.1 : 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.5,
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
  }).catch((err) => {
    console.warn("[Sentry] failed to load", err);
  });
}

const ric: typeof window.requestIdleCallback | undefined =
  typeof window !== "undefined" ? (window as any).requestIdleCallback : undefined;
if (ric) {
  ric(() => initSentryDeferred(), { timeout: 4000 });
} else {
  setTimeout(initSentryDeferred, 2000);
}
