import type { TFunction } from "i18next";
import type { CommunityPost } from "@/hooks/useCommunity";

/* LE VOCABULAIRE DE LA COMMUNAUTE.
 *
 * Les natures de post et les trois reactions sont des donnees, pas
 * des composants. Les exporter depuis un fichier de composant faisait
 * perdre le rafraichissement a chaud sur ce fichier — l avertissement
 * react-refresh/only-export-components. Ici, ils sont chez eux, et
 * les deux composants qui les habillent n exportent plus qu un
 * composant chacun. */

export type NaturePost = CommunityPost["post_type"];
export type TypeReaction = "support" | "respect" | "inspired";

export const NATURES: NaturePost[] = [
  "reflection",
  "progress",
  "obstacle",
  "mindset",
  "help_request",
  "encouragement",
];

export const REACTIONS: TypeReaction[] = ["support", "respect", "inspired"];

const REPLI_NATURE: Record<NaturePost, string> = {
  reflection: "Réflexion",
  progress: "Progression",
  obstacle: "Obstacle",
  mindset: "Mental",
  help_request: "Besoin d'aide",
  encouragement: "Encouragement",
};

export const REPLI_REACTION: Record<TypeReaction, string> = {
  support: "Soutien",
  respect: "Respect",
  inspired: "Inspiré",
};

export function libelleNature(type: NaturePost, t: TFunction): string {
  return t(`community.natures.${type}`, REPLI_NATURE[type]);
}

/** Deux lettres pour un avatar sans image. */
export function Initiales(nom: string | null | undefined): string {
  const propre = (nom || "").trim();
  return propre ? propre.slice(0, 2).toUpperCase() : "··";
}

/* AUCUNE ADRESSE E-MAIL A L ECRAN.
 *
 * display_name accepte n importe quoi, et trois profils sur quatre y
 * portent une adresse complete — heritee de l inscription. Le
 * classement etant lisible par tout utilisateur authentifie, ces
 * adresses etaient publiees telles quelles, a cote du nom de leur
 * porteur.
 *
 * On ne touche pas a la donnee : c est une decision de produit. Mais
 * l affichage, lui, coupe au premier arobase. « Agent » reste pour
 * les cas ou il ne resterait rien de lisible. */
export function nomAffichable(nom: string | null | undefined, repli: string): string {
  const propre = (nom || "").trim();
  if (!propre) return repli;
  if (!propre.includes("@")) return propre;
  const avant = propre.split("@")[0].trim();
  return avant.length >= 2 ? avant : repli;
}
