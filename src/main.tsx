import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// i18n must be initialized once, before any components render.
import "@/i18n/i18n";

createRoot(document.getElementById("root")!).render(<App />);

