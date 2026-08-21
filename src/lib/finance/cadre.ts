/**
 * LE CADRAGE D UNE IMAGE DE CREANCIER.
 *
 * Un logo n arrive pas au format de sa plaque. Certains sont larges,
 * d autres carres ; certains sont cernes de marge, d autres sont
 * blancs sur fond transparent et disparaissent purement et simplement
 * sur du blanc. Les poser tous de la meme facon revient a bien
 * afficher ceux qui tombaient juste, et a maltraiter les autres.
 *
 * On enregistre donc COMMENT l image se pose, et pas seulement ou elle
 * est :
 *
 *   ajustement  « contenir » montre le logo entier, cerne de vide.
 *               « remplir » remplit la plaque et rogne les bords.
 *   dx, dy      le decalage, en pourcentage de la plaque. Zero est
 *               centre ; les bornes sont a plus ou moins cinquante.
 *   zoom        de 100 a 300, pour un logo livre avec trois cents
 *               pixels de marge blanche autour.
 *   fond        clair, sombre, ou la teinte de la categorie.
 *
 * POURQUOI UN DECALAGE PLUTOT QU UN POINT D ANCRAGE.
 *
 * La premiere version rangeait un point d ancrage a la maniere de
 * object-position : « garde le bord gauche ». C etait le reglage
 * naturel — mais object-position ne sait deplacer une image que
 * lorsqu elle deborde deja, donc uniquement en remplissage. En mode
 * « contenir », meme zoomee, l image restait clouee : la propriete n a
 * aucune marge de manoeuvre a l interieur de sa boite.
 *
 * Un decalage applique par transform fonctionne dans les deux modes,
 * et se prete au glisser : un pixel de souris vaut un pixel d image.
 *
 * LES BORNES SONT ICI, ET NULLE PART AILLEURS.
 *
 * Le cadre vient d une colonne jsonb, donc de n importe quoi. Un zoom
 * de 4000 ne doit pas pouvoir casser une fiche. normaliserCadre est le
 * seul point de passage : tout ce qui entre en ressort utilisable.
 */

export type Ajustement = 'contenir' | 'remplir';
export type FondDeMarque = 'clair' | 'sombre' | 'teinte';

export interface CadreImage {
  ajustement: Ajustement;
  /** Decalage horizontal, en % de la plaque. Zero est centre. */
  dx: number;
  /** Decalage vertical, en % de la plaque. Zero est centre. */
  dy: number;
  /** De 100 a 300. */
  zoom: number;
  fond: FondDeMarque;
}

export const DECALAGE_MAX = 50;

export const CADRE_PAR_DEFAUT: CadreImage = {
  /* « Contenir » par defaut : montrer un logo entier et un peu petit
     est un moindre mal que d en couper le nom. */
  ajustement: 'contenir',
  dx: 0,
  dy: 0,
  zoom: 100,
  /* Les logos sont dessines pour du blanc — c est le fond sur lequel
     ils sont fournis, et celui sur lequel ils sont lisibles. */
  fond: 'clair',
};

const borner = (v: unknown, min: number, max: number, defaut: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, Math.round(n)));
};

export function normaliserCadre(brut: unknown): CadreImage {
  if (!brut || typeof brut !== 'object') return { ...CADRE_PAR_DEFAUT };
  const o = brut as Record<string, unknown>;

  /* LES CADRES DE LA PREMIERE VERSION.
     Ils rangeaient un point d ancrage x/y de 0 a 100, ou 50 valait
     centre et 0 valait « garde le bord gauche ». Garder le bord gauche
     revient a pousser l image vers la droite : le decalage a donc le
     signe inverse, et 50 - x le convertit. L amplitude n est
     qu approchee — elle dependait de l image — mais un cadre repris de
     travers se corrige d un glissement, la ou un cadre ignore
     donnerait l impression d avoir tout perdu. */
  const ancien = o.dx === undefined && o.dy === undefined
    && (typeof o.x === 'number' || typeof o.y === 'number');

  return {
    ajustement: o.ajustement === 'remplir' ? 'remplir' : 'contenir',
    dx: ancien
      ? borner(50 - Number(o.x ?? 50), -DECALAGE_MAX, DECALAGE_MAX, 0)
      : borner(o.dx, -DECALAGE_MAX, DECALAGE_MAX, CADRE_PAR_DEFAUT.dx),
    dy: ancien
      ? borner(50 - Number(o.y ?? 50), -DECALAGE_MAX, DECALAGE_MAX, 0)
      : borner(o.dy, -DECALAGE_MAX, DECALAGE_MAX, CADRE_PAR_DEFAUT.dy),
    zoom: borner(o.zoom, 100, 300, CADRE_PAR_DEFAUT.zoom),
    fond: o.fond === 'sombre' || o.fond === 'teinte' ? o.fond : 'clair',
  };
}

/** Vrai si ce cadre ne dit rien de plus que le reglage par defaut. */
export function estCadreParDefaut(c: CadreImage): boolean {
  return c.ajustement === CADRE_PAR_DEFAUT.ajustement
    && c.dx === CADRE_PAR_DEFAUT.dx
    && c.dy === CADRE_PAR_DEFAUT.dy
    && c.zoom === CADRE_PAR_DEFAUT.zoom
    && c.fond === CADRE_PAR_DEFAUT.fond;
}

/**
 * Ce qu on enregistre : rien, quand le cadre est celui par defaut.
 *
 * Ecrire un objet identique au defaut sur chaque ligne remplirait la
 * base de reglages qui ne reglent rien, et ferait croire a une
 * intention la ou personne n a rien choisi.
 */
export function cadreAEnregistrer(c: CadreImage): CadreImage | null {
  return estCadreParDefaut(c) ? null : c;
}

const FONDS: Record<FondDeMarque, string | null> = {
  clair: '#ffffff',
  sombre: '#0b1018',
  /* La teinte n est pas une couleur fixe : elle vient de la categorie
     et se passe donc au moment du rendu. */
  teinte: null,
};

/**
 * Les proprietes CSS d une plaque.
 *
 * DEUX MECANIQUES, PARCE QUE LE DEBORDEMENT N EST PAS LE MEME.
 *
 * Une premiere version deplacait l image par un simple transform, dans
 * les deux modes. Elle avait un defaut serieux : rien ne la bornait au
 * debordement reel. Un logo carre de deux cents pixels dans une plaque
 * au format 16/7, en remplissage, ne deborde QUE verticalement — le
 * pousser horizontalement le sortait a moitie du cadre et laissait du
 * blanc a cote. Un panoramique qui decouvre du vide est casse.
 *
 * En REMPLISSAGE, object-position fait exactement ce travail et se
 * borne tout seul : ses pourcentages vont de « bord gauche » a « bord
 * droit », et sur l axe ou l image ne deborde pas ils n ont simplement
 * aucun effet. On ne peut donc pas decouvrir de vide.
 *
 * En AJUSTEMENT, object-position n a aucune marge — l image tient
 * entiere — et seul le zoom en cree. Le decalage passe alors par un
 * transform dont l amplitude est multipliee par (zoom - 1) : a zoom 1
 * il ne bouge rien, ce qui est exact, et a zoom 2 un decalage de
 * cinquante amene le bord de l image pile sur celui de la plaque.
 *
 * Le signe est inverse pour object-position, afin que les deux modes
 * se pilotent pareil : on glisse l image, elle suit.
 */
export function styleDuCadre(c: CadreImage, teinte: string): React.CSSProperties {
  const remplit = c.ajustement === 'remplir';
  const ampleur = c.zoom / 100 - 1;
  return {
    background: FONDS[c.fond] ?? teinte,
    '--cadre-ajuste': remplit ? 'cover' : 'contain',
    '--cadre-pos': remplit ? `${50 - c.dx}% ${50 - c.dy}%` : '50% 50%',
    '--cadre-decale': remplit
      ? '0%, 0%'
      : `${(c.dx * ampleur).toFixed(2)}%, ${(c.dy * ampleur).toFixed(2)}%`,
    '--cadre-zoom': String(c.zoom / 100),
    /* Un logo cale sur les bords a besoin de respirer ; un logo qui
       remplit la plaque, non — la marge y rognerait pour rien. */
    '--cadre-marge': remplit ? '0px' : '8px',
  } as React.CSSProperties;
}

/**
 * LE FORMAT DE LA PLAQUE, PARTAGE PAR L APERCU ET LA FICHE.
 *
 * L apercu du cadreur mentait : il supposait une plaque de 203 sur 92,
 * alors que la fiche avait une hauteur fixe et une largeur qui suivait
 * la grille. Le format changeait donc avec la fenetre, et en
 * remplissage un format different rogne differemment — on reglait sur
 * une forme pour obtenir l autre.
 *
 * Le format est desormais fixe des deux cotes, et defini une seule
 * fois. C est la seule facon qu un apercu soit une promesse.
 */
export const FORMAT_PLAQUE = 16 / 7;
