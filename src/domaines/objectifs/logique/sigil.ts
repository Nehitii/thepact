/* LE SIGIL DU PACTE.
 *
 * Les glyphes du cercle de scellement ne sont pas de la decoration :
 * ils se DEDUISENT du pacte, et le meme pacte donne toujours le meme
 * dessin. C est ce qui separe un rituel d une animation — il produit
 * un objet qui lui survit, et qu on retrouve sur la carte d identite
 * du pacte, dans la guilde, au pantheon.
 *
 * Fonction pure : rien a stocker, le sigil se recalcule partout a
 * partir de ce que « pacts » porte deja.
 *
 * ═══ LES DEUX GARDE-FOUS QUE LA FORMULE IMPOSE ═══
 *
 * SEIZE TRAITS AU PLUS. Au-dela, un nom long produit une bouillie
 * illisible : on ECHANTILLONNE le nom au lieu de le parcourir, ce qui
 * garde le debut, la fin, et la meme empreinte pour le meme nom.
 *
 * L ALPHABET EST VERSIONNE. Le jour ou l on ajoute un trait, tous les
 * sceaux deja scelles changeraient de dessin EN SILENCE. C est la
 * seule chose ici qu on ne peut pas reparer apres coup — un sceau qui
 * bouge n est pas un sceau. La colonne « pacts.sigil_version » retient
 * la version sous laquelle chacun a ete jure ; ce module dit laquelle
 * il produit, et sait toujours dessiner les anciennes.
 */

import { ALPHABET_V2 } from "@/domaines/objectifs/logique/reseau";

/**
 * La version que ce module produit aujourd hui.
 *
 * ELLE PASSE A DEUX. Les pactes deja jures gardent la v1 — leur numero
 * est en base, et « alphabetDeLaVersion » le consulte. Ceux qui se
 * scellent a partir de maintenant portent l ecriture engendree.
 */
export const VERSION_ALPHABET = 2;

/** Au-dela, le dessin devient illisible. */
export const TRAITS_MAX = 16;

/* ═══ L ALPHABET ═══
 *
 * Vingt-quatre traits, dessines une fois, dans une boite unitaire :
 * chaque « d » vit dans [0,1]x[0,1], au rendu de le placer et de le
 * faire pivoter. Ils sont volontairement anguleux et ouverts — une
 * forme fermee se lit comme un symbole, une forme ouverte comme un
 * signe, et c est un signe qu on veut.
 *
 * ═══ CELUI-CI EST FIGE. ═══
 *
 * C est l alphabet de la VERSION 1, sous lequel des pactes ont ete
 * jures. On n y touche plus : pas un trait ajoute, pas une courbe
 * redressee. Une version suivante s ecrit A COTE, et « ALPHABETS » dit
 * laquelle repond a quel numero.
 */
const ALPHABET_V1: readonly string[] = [
  "M0 0.5 L1 0.5",                       /* 0  la barre */
  "M0.5 0 L0.5 1",                       /* 1  le mat */
  "M0 0 L1 1",                           /* 2  la pente */
  "M1 0 L0 1",                           /* 3  la contre-pente */
  "M0 0.5 L0.5 0 L1 0.5",                /* 4  le chevron haut */
  "M0 0.5 L0.5 1 L1 0.5",                /* 5  le chevron bas */
  "M0.5 0 L1 0.5 L0.5 1",                /* 6  la pointe droite */
  "M0.5 0 L0 0.5 L0.5 1",                /* 7  la pointe gauche */
  "M0 0 L1 0 L1 1",                      /* 8  l equerre */
  "M1 0 L0 0 L0 1",                      /* 9  l equerre inverse */
  "M0 0.5 L1 0.5 M0.5 0.2 L0.5 0.8",     /* 10 la croix */
  "M0.2 0.2 L0.8 0.8 M0.8 0.2 L0.2 0.8", /* 11 le sautoir */
  "M0 0.5 A0.5 0.5 0 0 1 1 0.5",         /* 12 l arc haut */
  "M0 0.5 A0.5 0.5 0 0 0 1 0.5",         /* 13 l arc bas */
  "M0.5 0 A0.5 0.5 0 0 1 0.5 1",         /* 14 l arc droit */
  "M0.5 0 A0.5 0.5 0 0 0 0.5 1",         /* 15 l arc gauche */
  "M0 0.2 L1 0.2 M0 0.8 L1 0.8",         /* 16 les deux barres */
  "M0.2 0 L0.2 1 M0.8 0 L0.8 1",         /* 17 les deux mats */
  "M0 1 L0.5 0 L1 1 Z",                  /* 18 le triangle */
  "M0.5 0 L1 0.5 L0.5 1 L0 0.5 Z",       /* 19 le losange */
  "M0 0 L1 0.5 L0 1",                    /* 20 la fleche */
  "M1 0 L0 0.5 L1 1",                    /* 21 la fleche inverse */
  "M0 0.5 L0.35 0.5 M0.65 0.5 L1 0.5",   /* 22 la barre rompue */
  "M0.5 0 L0.5 0.35 M0.5 0.65 L0.5 1",   /* 23 le mat rompu */
];

/**
 * QUELLE VERSION DESSINE QUOI.
 *
 * ═══ LA VERSION ETAIT ECRITE ET JAMAIS RELUE ═══
 *
 * L en-tete de ce module promettait que « ce module dit laquelle il
 * produit, et sait toujours dessiner les anciennes ». C etait faux :
 * « sigilDuPacte » recevait bien un parametre « version », le
 * recopiait dans l objet rendu, et dessinait TOUJOURS avec l alphabet
 * courant. La colonne « pacts.sigil_version » etait ecrite fidelement
 * et ignoree a la lecture.
 *
 * Consequence : ajouter un trait a l alphabet aurait redessine EN
 * SILENCE tous les sceaux deja jures — exactement ce que le
 * versionnage etait cense empecher. C est la seule chose ici qu on ne
 * peut pas reparer apres coup : un sceau qui bouge n est pas un sceau.
 *
 * La table est donc consultee pour de vrai. Une version inconnue —
 * une base plus recente que le code, apres un retour en arriere —
 * retombe sur la v1 : un sceau d une autre epoque vaut mieux qu un
 * ecran vide.
 */
const ALPHABETS: Readonly<Record<number, readonly string[]>> = {
  1: ALPHABET_V1,
  2: ALPHABET_V2,
};

/** L alphabet sous lequel un pacte de cette version a ete jure. */
export function alphabetDeLaVersion(version: number): readonly string[] {
  return ALPHABETS[version] ?? ALPHABET_V1;
}

/** L alphabet courant. Les anciens restent joignables par leur version. */
export const ALPHABET: readonly string[] = ALPHABETS[VERSION_ALPHABET];

/* ═══ CE QUE LE SIGIL REND ═══ */

/** Un trait, et l angle ou il se pose sur l anneau. */
export interface TraitDuSigil {
  /** Le chemin SVG, dans la boite unitaire. */
  d: string;
  /** Sa place sur le cercle, en radians. */
  angle: number;
}

/** Une valeur du porteur, accrochee a l anneau externe. */
export interface AncreDuSigil {
  valeur: string;
  angle: number;
}

export interface Sigil {
  /** Sous quelle version de l alphabet ce dessin a ete produit. */
  version: number;
  traits: TraitDuSigil[];
  ancres: AncreDuSigil[];
  /** La corde qui relie les ancres, sur le cercle unite centre en zero. */
  polygone: { x: number; y: number }[];
  /** Le nom normalise dont tout descend — utile aux tests et au debogage. */
  source: string;
}

const DEUX_PI = Math.PI * 2;

/**
 * Le nom, ramene a ce qui compte.
 *
 * NFD puis suppression des diacritiques : « Pacte d'Écriture » et
 * « pacte d ecriture » donnent le meme sceau. Un accent oublie ne doit
 * pas changer un sceau — c est le meme pacte.
 */
export function normaliser(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * FNV-1a sur 32 bits.
 *
 * Choisi parce qu il est court, sans dependance, et surtout STABLE :
 * le sceau doit sortir identique dans dix ans, sur n importe quelle
 * machine. « Math.imul » garde la multiplication dans les 32 bits, ce
 * que l arithmetique flottante de JavaScript ne ferait pas seule.
 */
export function empreinte(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Seize caracteres au plus, pris REGULIEREMENT dans le nom.
 *
 * Couper les seize premiers donnerait le meme sceau a deux pactes qui
 * ne different qu a la fin. On echantillonne donc sur toute la
 * longueur : le debut, la fin, et la forme generale du nom pesent
 * tous les trois.
 */
export function echantillonner(source: string, plafond = TRAITS_MAX): string {
  if (source.length <= plafond) return source;
  let pris = "";
  for (let i = 0; i < plafond; i++) {
    pris += source[Math.floor((i * source.length) / plafond)];
  }
  return pris;
}

/**
 * Le sigil d un pacte.
 *
 * `valeurs` sont celles du porteur, dans leur ordre de rang : c est
 * cet ordre que la corde suit. Un pacte sans valeur a un sigil sans
 * polygone — et c est juste, il n a rien a relier.
 */
export function sigilDuPacte(
  nom: string,
  valeurs: readonly string[] = [],
  version: number = VERSION_ALPHABET,
): Sigil {
  const source = echantillonner(normaliser(nom));
  const decalage = empreinte(source) % DEUX_PI;

  /* L ALPHABET DE SA VERSION, pas celui d aujourd hui. Un pacte jure
     sous la v1 garde son dessin quand une v2 parait. */
  const alphabet = alphabetDeLaVersion(version);

  const traits: TraitDuSigil[] = [];
  for (let i = 0; i < source.length; i++) {
    traits.push({
      d: alphabet[source.charCodeAt(i) % alphabet.length],
      angle: (i / source.length) * DEUX_PI + decalage,
    });
  }

  const ancres: AncreDuSigil[] = valeurs.map((valeur) => ({
    valeur,
    angle: empreinte(valeur) % DEUX_PI,
  }));

  /* La corde suit l ordre de RANG, pas l ordre des angles : deux
     porteurs qui ont choisi les memes valeurs dans un ordre different
     n ont pas le meme sceau, et c est voulu. */
  const polygone = ancres.map((a) => ({ x: Math.cos(a.angle), y: Math.sin(a.angle) }));

  return { version, traits, ancres, polygone, source };
}
