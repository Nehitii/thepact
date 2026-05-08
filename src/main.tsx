import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// i18n must be initialized once, before any components render.
import "@/i18n/i18n";

// Service worker safety: never register inside iframes or Lovable preview hosts.
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
  }
})();

createRoot(document.getElementById("root")!).render(<App />);

