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

/* LA TEINTE D UN AVATAR SANS IMAGE.
 *
 * Trois profils sur quatre n ont pas de photo, et affichaient deux
 * lettres grises sur du gris — quatre pastilles identiques dans le
 * rail, impossibles a distinguer d un coup d oeil. Slack, Linear et
 * Instagram derivent tous une teinte de l identifiant : elle est
 * stable dans le temps, differente d un membre a l autre, et ne
 * demande aucune donnee de plus.
 *
 * Douze teintes reparties sur le cercle, en evitant les jaunes ou le
 * texte clair ne passerait pas. Le fond reste sombre et le texte
 * clair dans la meme teinte : le contraste tient sans avoir a le
 * mesurer cas par cas. */
export function teinteAvatar(identifiant: string | null | undefined): { fond: string; texte: string } {
  const cle = identifiant || "";
  let somme = 0;
  for (let i = 0; i < cle.length; i++) somme = (somme * 31 + cle.charCodeAt(i)) >>> 0;
  const teinte = (somme % 12) * 30;
  return {
    fond: `hsl(${teinte} 34% 22%)`,
    texte: `hsl(${teinte} 62% 76%)`,
  };
}
