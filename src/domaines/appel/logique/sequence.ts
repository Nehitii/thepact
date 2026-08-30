/* LA SEQUENCE DU RITUEL : CE QUI SE PASSE APRES LES VINGT SECONDES.
 *
 * L avancement de zero a un vit dans `rituel.ts`, la toile qui le peint
 * dans `coeur.ts`. Ce qui restait sans nom, c est le DEROULE : quatre
 * phases enchainees par des attentes ecrites en clair au milieu d une
 * fonction asynchrone, et deux echelles de texte qui ne disent pas la
 * meme chose au meme moment.
 *
 * Une duree fausse ici ne casse rien : elle fait juste une sequence un
 * peu trop longue ou un peu trop breve, que personne ne chronometre.
 */
import type { PhaseCoeur } from "./coeur";

/* LA PHASE EST CELLE DE LA TOILE, PAS UNE DEUXIEME LISTE. Les huit
   valeurs etaient ecrites deux fois — une fois pour le reacteur, une
   fois pour la page — et rien ne garantissait qu elles restent
   d accord. */
export type Phase = PhaseCoeur;

/* ── QUAND LA PRISE EST TENABLE ──────────────────────────────── */

/* LES QUATRE PHASES OU LA MAIN NE SERT PLUS A RIEN. Une fois la
   sequence partie, elle va jusqu au bout : reprendre la prise au milieu
   relancerait un compte par-dessus un appel deja conclu. */
export const PHASES_DE_SEQUENCE: Phase[] = ["implosion", "singularite", "explosion", "revelation"];

export function enSequence(phase: Phase): boolean {
  return PHASES_DE_SEQUENCE.includes(phase);
}

/* TROIS CONDITIONS, ET « pret » EST LA PREMIERE : tant que la ligne du
   pacte n est pas lue, on ne sait pas si l appel du jour est deja
   fait, et laisser tenir ferait un second appel refuse en silence. */
export function priseTenable(pret: boolean, phase: Phase): boolean {
  return pret && phase !== "verrouille" && !enSequence(phase);
}

/* ── LE DEROULE DE LA CONCLUSION ─────────────────────────────── */

/** L effondrement : une demi-seconde pour rentrer dans le point. */
export const DUREE_IMPLOSION = 500;
/** Le point lui-meme : deux dixiemes, juste de quoi le voir. */
export const DUREE_SINGULARITE = 200;
/* LE SOUFFLE DURE CINQ FOIS PLUS LONGTEMPS QUAND LE MOUVEMENT EST
   REDUIT. Ce n est pas une compensation d animation : sans a-coup, une
   onde de un dixieme de seconde ne se voit pas passer. */
export const DUREE_EXPLOSION = 100;
export const DUREE_EXPLOSION_IMMOBILE = 500;

export interface EtapeDeConclusion {
  phase: Phase;
  attente: number;
}

/* CE QUI SE JOUE AVANT L ECRITURE, ET CE QUI SE JOUE APRES.
 *
 * La coupure n est pas decorative : l ecriture est ATTENDUE, et son
 * echec rend la main. Ce qui vient avant a donc lieu meme si
 * l enregistrement echoue ; ce qui vient apres n a lieu que s il
 * reussit. Sept dixiemes de seconde separent la fin de l appui de la
 * requete — et pendant ces sept dixiemes, quitter la page n annule
 * rien : l appel sera ecrit. C est voulu, la course etait finie. */
export const AVANT_ECRITURE: EtapeDeConclusion[] = [
  { phase: "implosion", attente: DUREE_IMPLOSION },
  { phase: "singularite", attente: DUREE_SINGULARITE },
];

export function apresEcriture(immobile: boolean): EtapeDeConclusion[] {
  return [
    { phase: "explosion", attente: immobile ? DUREE_EXPLOSION_IMMOBILE : DUREE_EXPLOSION },
    /* LA REVELATION NE S EFFACE PAS TOUTE SEULE. Elle restait trois
       secondes puis disparaissait : ce qu on vient de gagner ne doit
       pas etre chasse par une minuterie. C est un bouton qui la
       quitte, d ou une attente nulle. */
    { phase: "revelation", attente: 0 },
  ];
}

export function dureeDeLaConclusion(immobile: boolean): number {
  return [...AVANT_ECRITURE, ...apresEcriture(immobile)]
    .reduce((somme, e) => somme + e.attente, 0);
}

/** Le temps qu il faut a la revelation pour s eteindre avant le poste. */
export const DUREE_SORTIE = 620;
/** Puis le clavier reprend la main sur le bouton de suite. */
export const DELAI_FOCUS = 900;
/** Le mode demonstration laisse une image au retour a zero. */
export const DELAI_DEMONSTRATION = 50;

/* ── LACHER LA PRISE ─────────────────────────────────────────── */

/* AU-DESSUS DE CINQ POUR CENT, LACHER SE VOIT. En dessous, c est un
   faux depart — un doigt qui glisse — et rien ne se disperse. */
export const SEUIL_DE_RUPTURE = 0.05;
export const DUREE_MESSAGE_RUPTURE = 2500;

export function ruptureAuRelachement(avancement: number): boolean {
  return avancement > SEUIL_DE_RUPTURE;
}

/* LE RETOUR A ZERO SE COMPTE EN IMAGES, PAS EN SECONDES.
 *
 * Chaque image retire cinq centiemes, quelle que soit la duree de
 * l image : la descente prend vingt images depuis le sommet — un tiers
 * de seconde a soixante hertz, un septieme a cent quarante-quatre. Sur
 * un ecran rapide, la jauge retombe donc deux fois plus vite. Constate,
 * non corrige : la faire dependre du temps ecoule changerait ce que
 * l ecran montre. */
export const PAS_DE_RETOUR = 0.05;

export function retourDe(avancement: number): number {
  return Math.max(0, avancement - PAS_DE_RETOUR);
}

/* CE COMPTE SE SIMULE, IL NE SE DIVISE PAS.
 *
 * `avancement / PAS_DE_RETOUR` donne la reponse arithmetique, et elle
 * est FAUSSE pour dix valeurs de depart sur cent : soustraire cinq
 * centiemes ne retombe pas sur zero. Depuis 0,2, la suite descend
 * 0,15000000000000002 — 0,10000000000000003 — 0,05000000000000003 —
 * puis 1,39e-17, qui est encore strictement positif. Il faut donc une
 * cinquieme image la ou la division en annonce quatre.
 *
 * Ce residu se voit ailleurs : la boucle de la page continue tant que
 * `p > 0`, et le compte a rebours s affiche des que `p > 0`. Sur cette
 * derniere image, l ecran reaffiche donc « 20.0s » pendant un
 * seizieme de seconde avant de s effacer. Constate, non corrige.
 *
 * LA BORNE N EST PAS DECORATIVE : un pas qui ne ferait pas descendre
 * rendrait cette boucle infinie. */
export const IMAGES_MAX_DE_RETOUR = 1000;

export function imagesDeRetour(avancement: number): number {
  let p = avancement, images = 0;
  while (p > 0 && images < IMAGES_MAX_DE_RETOUR) {
    p = retourDe(p);
    images++;
  }
  return images;
}

/* ── LES DEUX ECHELLES DE TEXTE ──────────────────────────────── */

/* CE QUE L ECRAN MONTRE ET CE QUE LE LECTEUR D ECRAN ANNONCE NE SONT
 * PAS LA MEME LISTE, ET L ECART EST REEL :
 *
 *   phase        ecran                annonce
 *   relache tot  thecall.fading       (rien — l ecart est invisible)
 *   critique     thecall.critical     thecall.critical
 *   montee       thecall.rising       thecall.syncing
 *   verrouille   thecall.awaiting     thecall.announceDone
 *   sequence     thecall.awaiting     (rien)
 *
 * Trois consequences, constatees et non corrigees — les accorder
 * changerait ce qui est dit :
 *   — « relache tot » ne s entend jamais ;
 *   — pendant toute la sequence finale, la region vive se tait ;
 *   — a l arret, l ecran dit « en attente » alors que l appel du jour
 *     est deja fait. */
export function cleDuMessage(phase: Phase, relacheTot: boolean): string {
  if (relacheTot) return "thecall.fading";
  if (phase === "critique") return "thecall.critical";
  if (phase === "montee") return "thecall.rising";
  return "thecall.awaiting";
}

/** La chaine vide veut dire : la region vive ne dit rien. */
export function cleDeLAnnonce(phase: Phase): string {
  if (phase === "critique") return "thecall.critical";
  if (phase === "verrouille") return "thecall.announceDone";
  if (phase === "montee") return "thecall.syncing";
  return "";
}
