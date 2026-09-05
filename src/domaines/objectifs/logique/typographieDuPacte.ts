/* COMMENT LE PACTE ECRIT SON NOM.
 *
 * La police du titre et son effet sont deux colonnes de « pacts » :
 * ce sont donc des proprietes DU PACTE, pas du tableau de bord qui les
 * affiche ni de la page qui les choisit. Elles vivent ici, et les deux
 * ecrans les lisent au meme endroit.
 *
 * ═══ POURQUOI CE FICHIER EXISTE ═══
 *
 * Il y avait DEUX tables de polices et DEUX tables d effets, une par
 * ecran, chacune recopiee a la main :
 *
 *   accueil/logique/stylesBanniere.ts  FONT_MAP, EFFECT_STYLES, EFFETS_PAPIER
 *   profil/composants/PactIdentityCard  FONT_OPTIONS, EFFECT_OPTIONS
 *
 * Elles avaient deja diverge. « Parasites » valait « {} » du cote du
 * choix et une animation du cote du bandeau : l apercu ne montrait donc
 * RIEN de ce qu on choisissait. Et le choix ne connaissait que les
 * effets du theme sombre, si bien qu en theme clair on choisissait un
 * halo pour obtenir une bavure d encre.
 *
 * ═══ DEUX DES CINQ POLICES N EXISTAIENT PAS ═══
 *
 * Les deux tables offraient « Space Grotesk » et « Inter ». Aucune des
 * deux n est declaree nulle part dans ce depot — ni @font-face, ni lien
 * Google, ni fichier dans « public/fonts ». Mesure au canvas : le texte
 * rendu sous « 'Space Grotesk', sans-serif » avait exactement la
 * largeur du sans-serif generique du systeme. Les choisir ne changeait
 * donc rien du tout, et l ecran de choix affirmait le contraire en les
 * dessinant sous leur propre nom.
 *
 * Une troisieme mentait autrement : l entree « share-tech-mono » etait
 * presentee comme « Share Tech » et servait du JetBrains Mono.
 *
 * ON N OFFRE PLUS QUE CE QUE L APPLICATION EMBARQUE — quatre familles,
 * quatre fichiers dans « public/fonts », quatre noms exacts. Les deux
 * cles fantomes restent LUES, parce que des pactes les portent deja en
 * base ; elles tombent sur Switzer, le grotesque de la maison, qui est
 * ce que l une et l autre cherchaient a etre.
 */
import type React from "react";

export interface PoliceDuTitre {
  /** La cle ecrite en base. Elle ne change jamais. */
  cle: string;
  /** Le nom de la fonte, tel qu il est. Pas un nom de genre. */
  nom: string;
  famille: string;
}

/* Les quatre fontes que l application embarque vraiment. L ordre est
   celui du choix : de la plus marquee a la plus neutre. */
export const POLICES_DU_TITRE: readonly PoliceDuTitre[] = [
  { cle: "orbitron", nom: "Orbitron", famille: "'Orbitron', sans-serif" },
  { cle: "rajdhani", nom: "Rajdhani", famille: "'Rajdhani', sans-serif" },
  { cle: "share-tech-mono", nom: "JetBrains Mono", famille: "'JetBrains Mono', ui-monospace, monospace" },
  { cle: "switzer", nom: "Switzer", famille: "'Switzer', ui-sans-serif, system-ui, sans-serif" },
] as const;

export const POLICE_PAR_DEFAUT = "orbitron";

/* Ce que devient un pacte jure sous une police qui n a jamais ete
   embarquee. On ne le laisse pas tomber sur le sans-serif du systeme :
   il tomberait sur autre chose selon la machine. */
const REPRISES: Readonly<Record<string, string>> = {
  "space-grotesk": "switzer",
  inter: "switzer",
};

/**
 * La famille CSS d une cle de police.
 *
 * Une cle inconnue rend la police par defaut plutot que rien : le
 * titre du pacte doit s afficher meme si la base porte une valeur
 * qu on ne sait plus lire.
 */
export function familleDeLaPolice(cle: string | null | undefined): string {
  const voulue = REPRISES[cle ?? ""] ?? cle ?? POLICE_PAR_DEFAUT;
  const trouvee = POLICES_DU_TITRE.find((p) => p.cle === voulue);
  return (trouvee ?? POLICES_DU_TITRE[0]).famille;
}

export interface EffetDuTitre {
  cle: string;
  nom: string;
}

export const EFFETS_DU_TITRE: readonly EffetDuTitre[] = [
  { cle: "none", nom: "Aucun" },
  { cle: "cyan-glow", nom: "Halo cyan" },
  { cle: "fire-glow", nom: "Halo de feu" },
  { cle: "purple-glow", nom: "Halo violet" },
  { cle: "gold-glow", nom: "Halo doré" },
  { cle: "glitch", nom: "Parasites" },
] as const;

/* SUR LE NOIR, LA LUMIERE S AJOUTE. */
const SUR_PLAQUE: Readonly<Record<string, React.CSSProperties>> = {
  none: {},
  "cyan-glow": { textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 30px rgba(0,212,255,0.25)" },
  "fire-glow": { textShadow: "0 0 8px rgba(255,106,0,0.7), 0 0 30px rgba(255,60,0,0.25)" },
  "purple-glow": { textShadow: "0 0 8px rgba(168,85,247,0.7), 0 0 30px rgba(168,85,247,0.25)" },
  "gold-glow": { textShadow: "0 0 8px rgba(255,200,0,0.7), 0 0 30px rgba(255,200,0,0.25)" },
  glitch: { animation: "glitchReveal 1.6s ease-out forwards" },
};

/* SUR LE BLANC, ELLE NE PEUT QUE SALIR.
   Un halo de 30 px autour d une lettre, c est de la lumiere qui
   s ajoute au noir. Sur du papier rien ne s ajoute : le halo ne fait
   que troubler le fond autour du mot, et le titre parait flou au lieu
   de paraitre allume.
   L effet choisi n est pas supprime pour autant, il change de nature :
   le halo devient une BAVURE D ENCRE, serree et posee juste sous la
   lettre — ce que fait une impression appuyee sur du papier. */
const SUR_PAPIER: Readonly<Record<string, React.CSSProperties>> = {
  none: {},
  "cyan-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(0,105,127,0.34)" },
  "fire-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(150,64,0,0.34)" },
  "purple-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(113,65,163,0.34)" },
  "gold-glow": { textShadow: "0 1px 0 rgba(255,255,255,0.7), 0 2px 10px rgba(115,90,0,0.34)" },
  glitch: { animation: "glitchReveal 1.6s ease-out forwards" },
};

/**
 * Le style d un effet, sur la plaque noire ou sur le papier.
 *
 * LE THEME EST UN ARGUMENT, PAS UNE SUPPOSITION. L ecran de choix
 * supposait le sombre et montrait un halo a qui allait recevoir une
 * bavure d encre.
 */
export function styleDeLEffet(
  cle: string | null | undefined,
  sombre: boolean,
): React.CSSProperties {
  const table = sombre ? SUR_PLAQUE : SUR_PAPIER;
  return table[cle ?? "none"] ?? {};
}
