/* LE VOCABULAIRE DES AVIS.
 *
 * Trois unions et deux tables, sorties de la page : ce sont des
 * donnees, et la page ne fait que les afficher.
 */
import { Bell, Gift, Star, Trophy, Zap, Heart, Info, AlertTriangle, Megaphone, MessageSquare } from "lucide-react";
export type Categorie = "system" | "progress" | "social" | "marketing";

export type Priorite = "critical" | "important" | "informational" | "social" | "silent";

export type Recompense = "bonds" | "frame" | "banner" | "title";

export const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  bell: Bell, gift: Gift, star: Star, trophy: Trophy, zap: Zap,
  heart: Heart, info: Info, warning: AlertTriangle, announcement: Megaphone,
  message: MessageSquare,
};

export const CATEGORIES: { v: Categorie; mot: string; quoi: string }[] = [
  { v: "system", mot: "Système", quoi: "Ce que l'application doit dire, toujours reçu" },
  { v: "progress", mot: "Progression", quoi: "Rappels et jalons" },
  { v: "social", mot: "Social", quoi: "Ce qui vient d'autres personnes" },
  { v: "marketing", mot: "Annonce", quoi: "Offres et nouveautés" },
];


/* Les deux tables qui restaient : les priorites, et leurs teintes. */
export const PRIORITES: { v: Priorite; mot: string }[] = [
  { v: "critical", mot: "Critique" },
  { v: "important", mot: "Important" },
  { v: "informational", mot: "Information" },
  { v: "social", mot: "Social" },
  { v: "silent", mot: "Discret" },
];

export const TEINTES: Record<string, string> = {
  critical: "var(--ad-alerte)",
  important: "var(--ad-veille)",
  social: "hsl(var(--ds-accent-special))",
  informational: "var(--ad-signal)",
  silent: "var(--ad-encre-3)",
};
