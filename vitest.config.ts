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
    /* LES FONCTIONS EDGE ETAIENT HORS DE PORTEE DES TESTS.
       Ce motif ne couvrait que `src/`, et les deux fonctions de
       `supabase/functions` — deux mille cent lignes, dont tout le
       second facteur — n avaient donc aucun filet possible : y ecrire
       un test n aurait rien execute. Leur cœur pur vit maintenant a
       cote de leur `index.ts`, qui, lui, reste intestable (il importe
       depuis esm.sh et lit Deno.env). */
    include: ["src/**/*.test.{ts,tsx}", "supabase/functions/**/*.test.ts"],
    /* Les feuilles de style importées par les composants ne sont pas
       traitées : on teste du comportement, pas du rendu visuel — et
       celui-ci se mesure dans le navigateur, pas ici. */
    css: false,
    /* Ce que jsdom ne fournit pas et que nos dépendances supposent. */
    setupFiles: ["src/tests/preparation.ts"],
  },
});
