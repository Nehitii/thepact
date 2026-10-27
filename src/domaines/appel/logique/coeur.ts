/* LES NOMBRES DU COEUR.
 *
 * La toile du rituel ne peint pas des formes : elle peint de la
 * lumiere, image par image, hors de React. Toutes ses decisions
 * tenaient dans une boucle de trois cents lignes ou aucune ne pouvait
 * etre relue seule — et ou une constante fausse ne se voit pas : elle
 * fait juste un dessin legerement different, que personne ne compare a
 * rien.
 *
 * Ce module ne dessine rien. Il rend les nombres.
 */
import { DUREE_EFFONDREMENT, DUREE_ENFLEMENT, DUREE_TEMPS_MORT } from "./sequence";

export const TAU = Math.PI * 2;
export const NB_ANNEAUX = 5;
export const MAX_ONDES = 16;

/** Les quatre seuils du recit, en avancement. */
export const SEUILS = [0.25, 0.5, 0.75, 0.9];

/* CE `lerp` N EST PAS CELUI DE `rituel.ts`.
 *
 * Ici : `a + (b - a) * t`. La-bas : `a * (1 - t) + b * t`. Les deux
 * sont la meme droite en algebre, PAS le meme calcul en virgule
 * flottante — l un fait une soustraction puis une multiplication,
 * l autre deux multiplications et une addition.
 *
 * MESURE, sur huit millions d evaluations couvrant les huit bornes de
 * la rampe : les deux resultats different au dernier bit dans 22,5 %
 * des cas, et l arrondi final ne differe JAMAIS. Les echanger ne
 * changerait donc aucune couleur — sur ce balayage. Ce n est pas une
 * preuve, et les deux restent separes : il n y a rien a gagner a lier
 * la toile au compte a rebours. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* Une rampe qui part et s arrete a vitesse nulle, entre `a` et `b`. C est
   la forme de presque tout ce qui bouge sur la toile : rien de ce qui a
   une masse ne demarre ni ne s arrete net. */
export function doux(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/* LA RAMPE DE LA TOILE, ET SON DESACCORD AVEC CELLE DU TEXTE.
 *
 * Meme decoupage que `teinteDe` de `rituel.ts` — cassures a 50 % et
 * 85 % — et memes couleurs sur la premiere moitie. Ensuite, les deux
 * divergent :
 *
 *            texte (rituel.ts)        toile (ici)
 *   a 85 %   255,   0, 255            255,  64, 255
 *   a 100 %  255, 255, 255            255, 245, 255
 *
 * Le compte a rebours et le reacteur qu il decrit ne sont donc pas
 * exactement de la meme couleur passe la moitie. Constate, non
 * corrige : les unifier changerait ce que l ecran montre. */
export function teinte(p: number): [number, number, number] {
  if (p < 0.5) {
    const t = p * 2;
    return [lerp(6, 139, t), lerp(182, 92, t), lerp(212, 246, t)];
  }
  if (p < 0.85) {
    const t = (p - 0.5) / 0.35;
    return [lerp(139, 255, t), lerp(92, 64, t), lerp(246, 255, t)];
  }
  const t = (p - 0.85) / 0.15;
  return [lerp(255, 255, t), lerp(64, 245, t), lerp(255, 255, t)];
}

export type Couleur = [number, number, number];

export const rgba = ([r, g, b]: Couleur, a: number) =>
  `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;

/* ── LE MEME COEUR, SUR DU PAPIER ────────────────────────────── */

/* Cette toile compose en `lighter` : une fusion ADDITIVE, ou chaque
 * calque ajoute son eclat au precedent. C est le bon modele sur du
 * noir — il n y a rien, et on allume. Sur du papier, ce modele ne peut
 * RIEN produire : ajouter de la lumiere a une surface deja blanche ne
 * change rien, et c est pour cela que les cercles y etaient a peine
 * visibles. Baisser une opacite n y changeait rien non plus : le
 * probleme n etait pas le reglage, c etait le mode de fusion.
 *
 * Le jumeau physique de l addition de lumiere, c est la SOUSTRACTION
 * par l encre : `multiply`. Le dessin est rigoureusement le meme, il
 * s obtient en retirant de la lumiere au papier au lieu d en ajouter
 * au noir. D ou aussi l eclair de blanc total qui devient un eclair de
 * NOIR — le negatif de la meme image. */
export interface Rendu {
  fusion: GlobalCompositeOperation;
  trait: [number, number, number];
  flash: string;
}

export const RENDU: { sombre: Rendu; clair: Rendu } = {
  sombre: { fusion: "lighter", trait: [255, 255, 255], flash: "#fff" },
  clair: { fusion: "multiply", trait: [16, 22, 26], flash: "#12171a" },
};

export function renduDe(sombre: boolean): Rendu {
  return sombre ? RENDU.sombre : RENDU.clair;
}

/* ── CE QUE LA PHASE FAIT A L ECHELLE ────────────────────────── */

export type PhaseCoeur =
  | "attente" | "montee" | "critique"
  | "enflement" | "effondrement" | "tempsMort" | "projection" | "verrouille";

export interface TransformationDePhase {
  echelle: number;
  eclat: number;
  calme: number;
  naissance: number;
}

/* LA CONCLUSION EN QUATRE TEMPS, ET LE TROISIEME EST LE PLUS IMPORTANT.
 *
 * Elle concluait en huit dixiemes de seconde par un evenement qui se
 * termine : implosion, singularite, explosion, revelation. Elle devient
 * un ETAT dans lequel on reste — les jets ne retombent pas, ils tiennent
 * jusqu au clic. Et entre l effondrement et le jaillissement, un silence :
 * c est lui qui donne sa taille a ce qui suit.
 *
 * L ECLAT DU SEUIL NE COMPTE PLUS DES L ENFLEMENT. Les quatre temps
 * posent chacun le leur : ajouter le petit eclair du recit a un
 * effondrement, ce serait un flash sur un flash.
 *
 * L ASTRE D APRES NE SURGIT PAS, IL SE LEVE. La projection n est pas
 * chassee par une minuterie : c est quelqu un qui la quitte, et ce
 * qu il retrouve doit arriver doucement — d ou la cubique. */
export function transformationDePhase(
  phase: PhaseCoeur,
  depuis: number,
  eclatSeuil: number,
  apres: boolean,
): TransformationDePhase {
  const t: TransformationDePhase = { echelle: 1, eclat: 1 + eclatSeuil * 1.4, calme: 0, naissance: 1 };
  if (phase === "enflement") {
    /* IL GONFLE AU-DELA DE SA TAILLE : la coquille se tend, et c est ce
       depassement qui annonce qu elle va lacher. */
    const u = clamp01(depuis / (DUREE_ENFLEMENT / 1000));
    t.echelle = 1 + doux(0, 1, u) * 0.42;
    t.eclat = 1 + u * 0.9;
  } else if (phase === "effondrement") {
    /* IL DOIT PARTIR TOUT DE SUITE. A la puissance quatre, la sphere
       etait encore a 94 % de sa taille a mi-temps : l effondrement se
       lisait comme un decrochage tardif. A 2,6 elle cede des la premiere
       image et accelere sans discontinuer — c est la DERIVEE qui doit
       croitre, pas le depart qui doit tarder. */
    const u = clamp01(depuis / (DUREE_EFFONDREMENT / 1000));
    t.echelle = lerp(1.42, 0.05, Math.pow(u, 2.6));
    t.eclat = 1.9 + Math.pow(u, 3) * 5;
  } else if (phase === "tempsMort") {
    /* RIEN — mais pas le noir. Un point residuel qui palpite : le noir
       total fait croire a une panne et casse la continuite du regard.
       C est ce point survivant qui rend le jaillissement terrible. Il
       palpite aussi longtemps que l ecriture en base se fait attendre. */
    const u = clamp01(depuis / (DUREE_TEMPS_MORT / 1000));
    t.echelle = 0.05;
    t.eclat = (1.6 + Math.sin(depuis * 11) * 0.7) * (1 - u * 0.45);
  } else if (phase === "projection") {
    /* LE REGIME PERMANENT. Le nexus reste ultra comprime au centre et ne
       bouge plus : c est la bouche des jets, pas un personnage. */
    t.echelle = 0.06;
    t.eclat = 2.2;
  } else if (phase === "verrouille") {
    if (apres) {
      const u = clamp01(depuis / 1.1);
      t.naissance = 1 - Math.pow(1 - u, 3);
      t.echelle = 0.42 * t.naissance;
      t.eclat = 0.55 * t.naissance;
      t.calme = 1;
    } else t.echelle = 0;
  }
  return t;
}

/* ── LE FOND, ET LA BORNE QUI L EMPECHE DE TOUT BLANCHIR ─────── */

/* Le fond couvre TOUT l ecran : son alpha doit rester borne. Sans
   cette borne, l eclair du quatrieme seuil le poussait a 0,98 —
   l ecran virait au blanc complet a 90 %. L eclair reste pour le coeur
   et les anneaux, il ne prend pas le fond. */
export const FOND_MAX = 0.4;

export function intensiteDuFond(p: number, eclatSeuil: number, calme: number, naissance: number): number {
  if (calme) return 0.12 * naissance;
  return Math.min(FOND_MAX, (0.10 + p * 0.3) * (1 + eclatSeuil * 0.35));
}

/* ── LA GRILLE COURBEE ───────────────────────────────────────── */

/* CE N EST PAS UNE ATTRACTION DOUCE : PASSE UNE CERTAINE PROXIMITE, LA
 * GRILLE SE RETOURNE. Le deplacement vaut `distance x force / d2`, et
 * `d2` porte un adoucissement de `0,35 base²` qui empeche la division
 * par zero au centre. Il reste que le facteur depasse 1 des que le
 * point est a moins de `base x racine(2,6 p)` du centre : le point
 * traverse alors le centre et ressort de l autre cote. C est ce qui
 * donne le pli au milieu de l image, et ce n est pas un defaut de
 * reglage — c est la formule. Le test dit le rayon exact. */
export function deplacementParGravite(
  x: number, y: number, cx: number, cy: number, base: number, p: number,
): [number, number] {
  const dx = x - cx, dy = y - cy;
  const d2 = dx * dx + dy * dy + base * base * 0.35;
  const k = ((0.35 + p * 2.6) * base * base) / d2;
  return [x - dx * k, y - dy * k];
}

/* ── LES ANNEAUX ─────────────────────────────────────────────── */

export const INCLINAISONS_BASE = [0.28, 0.55, 0.16, 0.78, 0.42];

export interface Anneau {
  rx: number;
  ry: number;
  alpha: number;
  ex: number;
  ey: number;
}

export interface EtatDesAnneaux {
  p: number;
  base: number;
  echelle: number;
  eclat: number;
  impulsion: number;
  purge: number;
  ecarts: number[];
  excentrique: number;
  inclinaisons: number[];
  angles: number[];
  cx: number;
  cy: number;
}

/* NI `rx` NI `alpha` NE PEUVENT DEVENIR NEGATIFS — et le
 * `Math.max(0, ...)` qui les entoure au moment de peindre est donc du
 * code DOMINE. Il l est par une propriete etablie ailleurs :
 * l avancement est borne a un par `clamp01` avant d entrer ici. Le
 * facteur `1 - max(0, p - 0,85) x 1,4` vaut au moins 0,79 tant que
 * p <= 1 ; au-dela il passe sous zero, et une ellipse de rayon negatif
 * fait lever la toile. Le test montre les deux cotes de cette
 * frontiere. */
export function geometrieDUnAnneau(i: number, e: EtatDesAnneaux): Anneau {
  const dispersion = 1 + e.ecarts[i] * 1.8;
  const rx = e.base * (1.35 + i * 0.42) * e.echelle * dispersion
    * (1 - Math.max(0, e.p - 0.85) * 1.4) * (1 - e.impulsion * 0.12);
  const ry = rx * e.inclinaisons[i];
  const alpha = (0.16 + e.p * 0.5) * (1 - i * 0.1) * e.eclat * (1 - e.purge * 0.75) * (1 - e.ecarts[i]);
  const dec = e.excentrique * e.base * 0.22;
  return {
    rx, ry, alpha,
    ex: e.cx + Math.cos(e.angles[i] * 0.7) * dec,
    ey: e.cy + Math.sin(e.angles[i] * 0.9) * dec * 0.6,
  };
}

/** La vitesse angulaire d un anneau : quadratique, donc lente longtemps. */
export function vitesseDUnAnneau(i: number, p: number, sens: number): number {
  return (0.12 + Math.pow(p, 2.2) * 7) * sens * (1 + i * 0.13);
}

/* ── LE COEUR LUI-MEME ───────────────────────────────────────── */

/* LA CONTRACTION REBONDIT. `1 - impulsion x 0,22` creuse, et
 * `max(0, impulsion - 0,7) x 0,5` rend au-dela de 0,7 : le minimum
 * n est donc PAS a l appui maximal mais juste apres, a impulsion =
 * 0,7. C est ce qui donne le coup sec plutot qu un enfoncement. */
export function contractionDuCoeur(impulsion: number): number {
  return 1 - impulsion * 0.22 + Math.max(0, impulsion - 0.7) * 0.5;
}

export function souffleDuCoeur(maintenant: number, p: number, immobile: boolean): number {
  if (immobile) return 1;
  return 1 + Math.sin((maintenant / 1000) * (2 + p * 14)) * (0.02 + p * 0.07);
}

export function rayonDuCoeur(
  base: number, echelle: number, souffle: number, p: number, contraction: number, calme: number,
): number {
  return base * echelle * souffle * (1 + p * 0.35) * contraction * (calme ? 0.8 : 1);
}

/* LE DEDOUBLEMENT SE COMPTE DANS `fusion.ts` : il ne s ouvre plus et ne
   se referme plus par le meme chemin, il lutte. En dessous d un
   demi-pixel de separation, on repasse a un seul lobe — sans quoi deux
   cercles superposes doubleraient l eclat du centre. */
export const SEPARATION_MINIMALE = 0.5;

export function lobesDuCoeur(cx: number, cy: number, separation: number): [number, number][] {
  return separation > SEPARATION_MINIMALE
    ? [[cx - separation, cy], [cx + separation, cy]]
    : [[cx, cy]];
}

export function tremblement(p: number, immobile: boolean, excentrique: number): number {
  return immobile ? 0 : Math.max(0, p - 0.55) * 26 * (1 + excentrique);
}

/* ── LES CADENCES ────────────────────────────────────────────── */

/* Des millisecondes entre deux ondes : le rythme se resserre avec
   l avancement. Les filaments et les arcs, qui avaient les leurs, ont
   cede la place aux protuberances et a la matiere. */
export const cadenceDesOndes = (p: number) => lerp(1500, 170, p);

/* ── LE SOUFFLE FINAL ────────────────────────────────────────── */

/* LA COURBE DU SOUFFLE DEPEND DE L IMMOBILITE. En mouvement, `u^0,45`
   part tres vite puis ralentit — l onde de choc. Immobile, c est une
   droite : la meme duree, sans l a-coup. */
export function rayonDuSouffle(u: number, portee: number, immobile: boolean): number {
  return portee * (immobile ? u : Math.pow(u, 0.45));
}

export const DUREE_SOUFFLE = 0.55;
export const DUREE_SOUFFLE_IMMOBILE = 0.9;

/* L ERADICATION DEPASSE LE CADRE. A 0,55 s et trois quarts de
   diagonale, l onde effleurait le bord et s eteignait avant d en
   sortir. Ce qui se lit comme une eradication doit SORTIR du champ en
   continuant d accelerer, et durer assez pour qu on comprenne qu il ne
   reste rien. */
export const PORTEE_DE_L_ERADICATION = 2.4;

export function dureeDeLEradication(immobile: boolean): number {
  return (immobile ? DUREE_SOUFFLE_IMMOBILE : DUREE_SOUFFLE) * 2.6;
}
