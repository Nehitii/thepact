import type { LucideIcon } from "lucide-react";

/* LES FORMES DU DOMAINE MENTIONS-LEGALES.
 *
 * Venues de contenu.ts, qui les declarait juste avant de les remplir.
 * Les trois fichiers d articles en ont besoin, et aucun d eux n a a
 * dependre du fichier qui porte l identite de l editeur. */
export interface Article {
  /** Le numéro d'article, pour pouvoir s'y référer. */
  n: number;
  titre: string;
  /** Un paragraphe, ou une liste à puces. */
  corps: (string | string[])[];
  /** Une phrase mise en évidence, à la fin de l'article. */
  souligne?: string;
  /** Un avertissement, en rouge. */
  alerte?: string;
}

export interface SectionLegale {
  /** L'intitulé du panneau. */
  code: string;
  icone: LucideIcon;
  ton?: "neutre" | "actif" | "alerte" | "danger";
  etat?: string;
  intro?: string;
  articles: Article[];
}
