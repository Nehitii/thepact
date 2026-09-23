/* CE QUE LE BANC DU BANDEAU PROPOSE DANS SES MENUS.
 *
 * Des donnees, pas de l interface : elles sont sorties de la page du
 * banc quand elle a passe les 400 lignes. Rien ici n est lu en base —
 * c est ce que le banc met a la place d un pacte. */

/* LA VERSION DE L ALPHABET EST UN REGLAGE DU BANC, pas un detail.
   « pacts.sigil_version » a ete ajoutee avec « default 1 » : tous les
   pactes anterieurs sont donc en v1, et rien dans l application ne les
   fait passer en v2. Un pacte jure avant ce jour dessine encore
   l ancien alphabet — et son porteur ne verra jamais le nouveau, meme
   sur la derniere version du code. C est voulu (un sceau qui bouge
   n est pas un sceau) mais il faut pouvoir le CONSTATER. */
export const VERSIONS = [
  { valeur: 4, nom: "v4 — cursive au pourtour, ideogrammes aux sommets" },
  { valeur: 3, nom: "v3 — reseau au pourtour, ideogrammes aux sommets" },
  { valeur: 2, nom: "v2 — le reseau partout" },
  { valeur: 1, nom: "v1 — l ancien alphabet" },
];
export const SYMBOLES = [
  "flame", "heart", "target", "sparkles", "phoenix",
  "compass", "citadel", "vortex", "shield",
];

/* L EMBLEME D UN PALIER EST UNE IMAGE CHOISIE PAR L UTILISATEUR
   (« ranks.logo_url »). Le banc ne lit rien en base : il en propose
   deux pour voir — un ecusson dessine ici, a fond transparent comme
   la plupart des emblemes, et le symbole de la marque, plus large que
   haut. « Aucun » montre ce que fait chaque variante sans image. */
export const ECUSSON_D_ESSAI = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>"
  + "<defs><linearGradient id='o' x1='0' y1='0' x2='0' y2='1'>"
  + "<stop offset='0' stop-color='#ffe29a'/><stop offset='1' stop-color='#b8741c'/></linearGradient></defs>"
  + "<path d='M64 8 112 27v38c0 28-21 48-48 56C37 113 16 93 16 65V27Z' fill='#1a1430'"
  + " stroke='url(#o)' stroke-width='6' stroke-linejoin='round'/>"
  + "<path d='M38 72 64 55l26 17M38 90 64 73l26 17' fill='none' stroke='url(#o)' stroke-width='8'"
  + " stroke-linecap='round' stroke-linejoin='round'/>"
  + "<path d='M64 23l5.3 10.8 11.9 1.7-8.6 8.4 2 11.8L64 50.1l-10.6 5.6 2-11.8-8.6-8.4 11.9-1.7Z' fill='url(#o)'/>"
  + "</svg>",
);
export const EMBLEMES = [
  { valeur: ECUSSON_D_ESSAI, nom: "écusson d’essai" },
  { valeur: "/marque/overwrite-symbole.svg", nom: "symbole de la marque" },
  { valeur: "", nom: "aucun — le niveau prend sa place" },
];
/* « ranks.frame_color ». La derniere est l ancienne variable CSS du
   prereglage « Cyan », que le noyau refuse : chaque variante doit
   retomber proprement. */
export const TEINTES_DE_PALIER = [
  { valeur: "#f5b93a", nom: "or" },
  { valeur: "#22d3ee", nom: "cyan" },
  { valeur: "#f43f5e", nom: "rose" },
  { valeur: "#a3e635", nom: "lime" },
  { valeur: "", nom: "aucune" },
  { valeur: "hsl(var(--ds-accent-primary))", nom: "ancienne variable (illisible)" },
];
