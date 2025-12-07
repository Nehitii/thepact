import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // plus universel que "::" (IPv4, OK pour Lovable)
    port: 5173, // port par défaut de Vite (tu peux aussi le supprimer)
    hmr: {
      overlay: false, // désactive l’overlay d’erreur plein écran
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
