import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => ({
  server: {
    /* LE SERVEUR DE DEV EST OFFERT AU RESEAU LOCAL.
     *
     * Il ne l etait plus. Le commentaire precedent le fermait au nom de
     * deux failles precises : un contournement de `server.fs.deny` par
     * chemins alternatifs Windows dans Vite <= 6.4.2, et une lecture du
     * serveur de dev par n importe quel site dans esbuild <= 0.24.2.
     *
     * LES DEUX SONT CORRIGEES DEPUIS. Ce projet tourne en Vite 7.3.6 et
     * esbuild 0.28.2 — la justification ecrite ne decrivait plus rien.
     * Une precaution qu on ne peut plus expliquer finit par etre
     * contournee sans y penser ; mieux vaut la lever franchement et
     * dire ce qui reste vrai.
     *
     * CE QUI RESTE VRAI : un serveur de dev n a AUCUNE
     * AUTHENTIFICATION et sert les sources du projet a qui l atteint.
     * Sur un reseau domestique le risque est faible ; sur un Wi-Fi
     * partage — hotel, espace de travail, aeroport — il ne l est pas.
     * Le jour ou l on developpe ailleurs qu a la maison, cette ligne se
     * commente le temps du sejour.
     *
     * La production ne passe pas par ici : `vite build` produit des
     * fichiers statiques, et rien de ce reglage ne les suit. */
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "analyze" && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap",
    }),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "robots.txt", "marque/overwrite-symbole.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        globIgnores: ["**/stats.html"],
        navigateFallbackDenylist: [/^\/api\//, /^\/functions\//, /^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "html", networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/[a-z0-9]+\.supabase\.co\/storage\/.*\.(webp|png|jpg|jpeg|svg|gif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: "Overwrite",
        short_name: "Overwrite",
        description: "Find The Light",
        /* Le greffon posait « lang: en » par defaut, comme index.html le
           faisait avant correction. L interface est en francais. */
        lang: "fr",
        theme_color: "#0b1018",
        background_color: "#0b1018",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        /* CES DEUX LIGNES POINTAIENT VERS `placeholder.svg` — le carré
           gris livré par l'échafaudage. L'application installée portait
           donc un placeholder sur l'écran d'accueil, à la bonne taille et
           sans rien dire.

           `purpose: "any"`, et PAS "maskable" : le symbole occupe 88 %
           de la largeur de l'icône, alors que la zone sûre d'un masque
           Android est un cercle de 80 %. Déclarer « maskable » ferait
           rogner les lignes de glitch sur la moitié des appareils. Une
           variante masquable se fabrique avec le `build.py` du pack en
           passant RATIO à 0.6 — il demande Python, cairosvg et Pillow. */
        icons: [
          { src: "/marque/overwrite-violet-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/marque/overwrite-violet-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/marque/overwrite-symbole.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  /* Les paquets TipTap doivent partager une seule instance de
     ProseMirror. Decouverts en cours de route — l editeur du journal
     n est charge qu a l ouverture de la fenetre — Vite les
     pre-empaquette en deux fois, et la page se retrouve avec deux
     ProseMirror : le schema du second est nul et l editeur casse. On
     les declare pour qu ils soient tailles ensemble au demarrage. */
  optimizeDeps: {
    include: [
      "@tiptap/core",
      "@tiptap/pm/view",
      "@tiptap/react",
      "@tiptap/react/menus",
      "@tiptap/starter-kit",
      "@tiptap/extension-text-style",
      "@tiptap/extension-task-list",
      "@tiptap/extension-task-item",
    ],
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "query-vendor": ["@tanstack/react-query"],
          "framer-vendor": ["framer-motion"],
          "sentry-vendor": ["@sentry/react"],
          "i18n-vendor": ["i18next", "react-i18next"],
          "date-vendor": ["date-fns"],
          "dnd-vendor": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          "radix-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-visually-hidden",
          ],
        },
      },
    },
  },
}));
