/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/* ═══════════════════════════════════════════════════════════════
   POURQUOI UN FICHIER SÉPARÉ DE vite.config.ts

   On pourrait y ajouter un bloc `test`. Chaque exécution embarquerait
   alors VitePWA et le visualiseur : un service worker fabriqué et un
   rapport de bundle écrit, pour lancer des tests qui n'en ont pas
   besoin. On reprend donc seulement ce qui sert — le greffon React et
   l'alias `@`.

   `environment: "jsdom"` : les tests de composants montent du vrai
   DOM. Les tests de fonctions pures s'en passeraient, mais un seul
   environnement vaut mieux que deux configurations.
   ═══════════════════════════════════════════════════════════════ */

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    /* Les feuilles de style importées par les composants ne sont pas
       traitées : on teste du comportement, pas du rendu visuel — et
       celui-ci se mesure dans le navigateur, pas ici. */
    css: false,
    /* Ce que jsdom ne fournit pas et que nos dépendances supposent. */
    setupFiles: ["src/tests/preparation.ts"],
  },
});
