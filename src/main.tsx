/* ═══ CE PREMIER IMPORT DOIT RESTER LE PREMIER ═══
   Les modules ES sont évalués dans l ordre des imports, AVANT la
   première ligne de ce fichier : un appel de fonction posé ici
   s exécuterait après que tous les autres modules ont déjà lu leurs
   réglages. C est donc l import lui-même qui déplace les clés de
   « vowpact… » vers « overwrite… ». Le déplacement est aussi déclenché
   par preferencesAffichage.ts, au cas où un outil réordonnerait cette
   liste : la fonction ne fait rien la seconde fois. */
import "./lib/renommageLocal";

/* ═══ CELUI-CI AUSSI DOIT PRÉCÉDER LE RENDU ═══
   Il capture l'erreur qu'un fournisseur d'authentification laisse dans
   l'URL. Le retour se fait sur « / », une route protégée : sans
   session le routeur rebondit vers « /auth » et le rebond perd le
   fragment. Ce module le lit avant que React n'existe. */
import "./lib/erreurOAuth";

/* Le relais vers Sentry. Il n'importe PAS @sentry/react — c'est tout
   son intérêt : il met les appels en file jusqu'à ce que l'import
   dynamique plus bas lui passe l'instance réelle. */
import { attacher as attacherSentry } from "./lib/sentry";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Global stylesheets (cannot be loaded via @import at the bottom of
// index.css — those rules are CSS-spec invalid and silently dropped).
// Kept global because their classes are used across multiple pages or
// shared components (sidebar, DSBackground, profile, etc.).
// design-tokens.css etait importe depuis index.css ligne 80, apres 66 regles :
// un @import CSS doit preceder toute autre regle, sinon il est invalide et
// silencieusement ignore. Les 45 variables et 24 classes ds-* qu'il definit
// n'etaient donc jamais chargees — d'ou le lien "Skip to content" visible sur
// toutes les pages, qui aurait du rester masque hors focus.
import "./styles/design-tokens.css";
import "./styles/singularity.css";
import "./styles/hero-animations.css";
import "./styles/difficulty.css";
import "./styles/glassmorphism.css";
import "./styles/journal.css";
import "./styles/sidebar.css";
import "./styles/revue.css";
// EN DERNIER, ET CE N EST PAS un detail : chaque regle de
// theme-clair.css est prefixee .light, ce qui lui donne une classe
// de specificite de plus que la regle qu elle corrige. Le sombre
// n est atteint par aucune d entre elles.
import "./styles/theme-clair.css";
// finance.css, analytics.css and goals.css are co-located with their
// respective lazy pages (Finance/Analytics/Goals) so they ship in the
// page chunk instead of the initial bundle.

// i18n must be initialized once, before any components render.
import "@/i18n/i18n";

// Suspend les animations perpetuelles quand l'onglet est cache.
import { watchIdleAnimations } from "@/lib/idleAnimations";
watchIdleAnimations();

// Service worker: register only on real top-level pages (push notifications).
// Inside an iframe, unregister any existing SW to avoid HMR collisions.
(() => {
  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  if (isInIframe) {
    navigator.serviceWorker?.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
    return;
  }
  /* PLUS D'INSCRIPTION À LA MAIN.
     vite-plugin-pwa injecte déjà un script registerSW.js dans
     index.html, qui inscrit /sw.js. Celle-ci inscrivait le MÊME
     chemin une seconde fois — et, en développement où le greffon
     s'abstient, elle inscrivait le fichier de push brut, qui prenait
     alors le contrôle de la page sans rien mettre en cache.

     La désinscription en iframe, elle, reste : elle protège les
     aperçus intégrés, et le greffon ne la fait pas. */
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
      /* AUCUN ENREGISTREMENT DE SESSION, DANS AUCUN CAS.
         La page /legal dit « l'enregistrement des sessions est
         désactivé ». C'était vrai des sessions ordinaires
         (replaysSessionSampleRate: 0) et faux en cas d'erreur, où une
         sur deux était bel et bien enregistrée — masquée, mais
         enregistrée. Deux valeurs à zéro valent mieux qu'une phrase à
         réécrire : l'enregistrement n'a jamais servi à un diagnostic
         ici, la pile d'appels suffit. */
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
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
        return event;
      },
    });
    /* ═══ LE RELAIS REÇOIT L'INSTANCE ICI, ET PAS AVANT ═══
       Le reste de l'application appelle `@/lib/sentry`, jamais
       `@sentry/react` : c'est ce qui garde les 159 Ko hors du premier
       chargement. Les appels faits avant cette ligne ont été mis en
       file et sont rejoués maintenant — un utilisateur identifié pendant
       le démarrage n'est donc pas perdu. */
    attacherSentry({
      setUser: (u) => Sentry.setUser(u),
      captureException: (e, contexte) => Sentry.captureException(e, contexte),
    });
    console.info("[Sentry] initialized", { env: SENTRY_ENV });
  }).catch((err) => {
    console.warn("[Sentry] failed to load", err);
  });
}

/* Safari n'a `requestIdleCallback` que depuis la 18.4 : on retombe sur
   un simple delai plus bas quand il manque. */
const ric: typeof window.requestIdleCallback | undefined =
  typeof window !== "undefined" ? window.requestIdleCallback : undefined;
if (ric) {
  ric(() => initSentryDeferred(), { timeout: 4000 });
} else {
  setTimeout(initSentryDeferred, 2000);
}
