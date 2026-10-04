/* LES PLANS DES ANNEAUX, ET LE VERROU DE L ALIGNEMENT.
 *
 * CE QUI N ALLAIT PAS APRES LE PREMIER ECLAT. Au premier seuil,
 * `avancerLeRecit` fait monter `alignement` a `dt x 1,6` — une rampe
 * LINEAIRE — et les cinq inclinaisons sont interpolees dessus vers 0,42.
 * Trois choses rendaient ce mouvement mecanique :
 *
 *   1. la rampe demarre a pleine vitesse et s arrete net : aucune masse
 *      ne fait ca ;
 *   2. les cinq plans partent ensemble et arrivent ensemble ;
 *   3. seul l aplatissement change, pas le noeud — le plan est ecrase au
 *      lieu de PIVOTER.
 *
 * La reponse tient en trois gestes, et aucun ne touche a la machine a
 * etats : elle continue de rendre exactement le meme `alignement`. On ne
 * change que la maniere dont le dessin le SUIT — un ressort par plan,
 * etage d un anneau a l autre, et un noeud qui vire.
 *
 * Ces fonctions MODIFIENT l etat qu on leur passe au lieu d en rendre un
 * neuf : elles tournent a chaque image, et cinq tableaux jetes par image
 * sont exactement le genre de depense que le ramasse-miettes finit par
 * faire voir.
 */
import { INCLINAISONS_BASE, NB_ANNEAUX, clamp01, doux, lerp } from "./coeur";
import type { EtatDuRecit } from "./coeurRecit";
import { NOEUDS_BASE } from "./espace";

/* De combien le noeud de chaque anneau vire pendant l alignement. Des
   valeurs alternees et inegales : cinq plans qui virent du meme cote du
   meme angle se relisent comme une seule piece. */
export const VIRAGE_DES_NOEUDS = [0.52, -0.38, 0.64, -0.46, 0.31];
/** La derive continue : sens alterne, amplitude croissante vers l exterieur. */
export const DERIVE_PAR_ANNEAU = [0.6, -0.72, 0.84, -0.96, 1.08];

/* LA DEUXIEME PULSATION. Au deuxieme seuil le coeur se dedouble, et les
   anneaux en prennent acte en deux temps qui ne sont pas de meme nature :
   LE COUP, une vitesse injectee dans le ressort a l instant du
   franchissement — pousser une porte, pas la deplacer —, puis LA
   BASCULE, sur toute la montee : ceux qui etaient presque de face passent
   presque de profil, et l inverse. L inclinaison a le droit de passer par
   zero et de changer de signe : c est le renversement, et il est voulu. */
export const BASCULE_DES_PLANS = [0.94, 0.1, 0.86, 0.16, 0.62];
export const VIRAGE_DE_LA_BASCULE = [-1.15, 0.86, -0.72, 1.24, -0.95];
export const COUP_INCLINAISON = [1.25, -1.55, 1.1, -1.35, 1.6];
export const COUP_NOEUD = [3.6, -4.4, 5.0, -3.2, 4.1];
/** Le seuil qui porte le coup plein ; les autres n en donnent qu un cinquieme. */
export const PULSATION = 1;
/* Une inclinaison de un serait un plan vu de face : `sqrt(1 - aplati²)`
   y vaudrait zero, plus de profondeur du tout. On s arrete avant. */
export const INCLINAISON_MAX = 0.97;

/* LA RAIDEUR EST FIXE, L AMORTISSEMENT NE L EST PAS. A un, le ressort
   serait critique : il rejoindrait sa cible sans la depasser. A 0,62 il
   la depasse et revient — c est l elan, et c est ce qui donne
   l impression d une masse plutot que d une consigne. */
export const RAIDEUR = 26;
export const ELAN = 0.62;
/** Le retard d un anneau sur le precedent, en part de la course. */
export const ETAGEMENT = 0.11;

export interface EtatDesPlans {
  incl: number[];
  vIncl: number[];
  noeud: number[];
  vNoeud: number[];
  derive: number;
  dernierSeuil: number;
  bascule: number;
  /** Ce que le verrou lit : ou chaque plan va, et ou en est sa cible. */
  inclCible: number[];
  noeudCible: number[];
  avance: number[];
}

const zeros = () => Array.from({ length: NB_ANNEAUX }, () => 0);

export function plansNeufs(): EtatDesPlans {
  return {
    incl: [...INCLINAISONS_BASE], vIncl: zeros(),
    noeud: [...NOEUDS_BASE], vNoeud: zeros(),
    derive: 0, dernierSeuil: -1, bascule: 0,
    inclCible: [...INCLINAISONS_BASE], noeudCible: [...NOEUDS_BASE], avance: zeros(),
  };
}

/** Avance les cinq ressorts, et ecrit dans `noeuds` le noeud peint de chaque anneau. */
export function avancerLesPlans(
  plans: EtatDesPlans, dt: number, p: number, recit: EtatDuRecit, noeuds: number[],
): void {
  /* La derive s accelere avec l avancement, comme la rotation des
     anneaux : quadratique, donc longtemps lente puis emballee. */
  plans.derive += dt * (0.04 + p * p * 0.55);

  /* LE COUP SE DECLENCHE AU FRANCHISSEMENT, PAS PENDANT. Un seuil qui
     descend est un retour a zero du rituel, et il faut le suivre aussi :
     sinon reprendre la prise ne redeclencherait plus rien. */
  if (recit.seuilAtteint > plans.dernierSeuil) {
    const force = recit.seuilAtteint === PULSATION ? 1 : 0.18;
    for (let i = 0; i < NB_ANNEAUX; i++) {
      plans.vIncl[i] += COUP_INCLINAISON[i] * force;
      plans.vNoeud[i] += COUP_NOEUD[i] * force;
    }
  }
  plans.dernierSeuil = recit.seuilAtteint;

  /* La bascule suit le meme profil que `scission` — montee a 1,2 par
     seconde, retour a 3. */
  plans.bascule = recit.seuilAtteint >= PULSATION
    ? clamp01(plans.bascule + dt * 1.2)
    : clamp01(plans.bascule - dt * 3);

  /* L etagement retarde chaque anneau, mais la course totale reste une :
     sans ce rattrapage, le dernier n arriverait jamais au bout. */
  const course = Math.max(0.2, 1 - ETAGEMENT * (NB_ANNEAUX - 1));
  const frein = 2 * Math.sqrt(RAIDEUR) * ELAN;

  for (let i = 0; i < NB_ANNEAUX; i++) {
    const a = doux(0, 1, clamp01((recit.alignement - i * ETAGEMENT) / course));
    const b = doux(0, 1, clamp01((plans.bascule - i * ETAGEMENT) / course));
    const inclCible = lerp(lerp(INCLINAISONS_BASE[i], 0.42, a), BASCULE_DES_PLANS[i], b);
    const noeudCible = NOEUDS_BASE[i] + VIRAGE_DES_NOEUDS[i] * a + VIRAGE_DE_LA_BASCULE[i] * b;
    plans.inclCible[i] = inclCible;
    plans.noeudCible[i] = noeudCible;
    plans.avance[i] = a;

    plans.vIncl[i] += ((inclCible - plans.incl[i]) * RAIDEUR - plans.vIncl[i] * frein) * dt;
    plans.incl[i] += plans.vIncl[i] * dt;
    plans.vNoeud[i] += ((noeudCible - plans.noeud[i]) * RAIDEUR - plans.vNoeud[i] * frein) * dt;
    plans.noeud[i] += plans.vNoeud[i] * dt;
    /* Le coup peut envoyer l inclinaison au-dela du plan de face. On
       l arrete juste avant sans annuler la vitesse : le ressort la ramene
       tout seul. */
    plans.incl[i] = Math.max(-INCLINAISON_MAX, Math.min(INCLINAISON_MAX, plans.incl[i]));

    /* LA DERIVE S AJOUTE APRES LE RESSORT, PAS DEDANS : un ressort qui
       poursuit une cible en mouvement constant traine derriere elle. */
    noeuds[i] = plans.noeud[i] + plans.derive * DERIVE_PAR_ANNEAU[i];
  }
}

/* ── LE VERROU DE L ALIGNEMENT (acte II) ───────────────────────
 *
 * A quinze secondes les cinq plans pivotent vers la meme inclinaison,
 * chacun sur son ressort et en decale. Le mouvement etait juste ; il lui
 * manquait son ARRIVEE. Un mecanisme qui s engage fait un bruit, et ce
 * bruit est la preuve qu il a tenu : chaque anneau qui touche sa cible
 * s allume d un coup — un cliquet par dent —, et quand le dernier arrive,
 * les cinq s allument ensemble. C est le clac.
 *
 * TOUCHER, C EST LA PREMIERE ENTREE DANS LA TOLERANCE, pas le repos. Le
 * ressort depasse sa cible, et c est au passage qu il frappe : attendre
 * qu il se pose, ce serait entendre le clac une demi-seconde apres la
 * porte. Chaque instant est garde : le son se calera dessus. */
export const TOLERANCE_DU_VERROU = 0.03;
export const DUREE_DU_CLIQUET = 380;
export const DUREE_DU_CLAC = 560;
/* Le filet : un ressort pousse par le coup du seuil peut tourner
   longtemps autour de sa cible sans y entrer. Passe ce delai, il a
   touche — le clac doit avoir lieu. */
export const PATIENCE_DU_VERROU = 900;

export interface EtatDuVerrou {
  arrive: boolean[];
  pret: number[];
  cliquets: number[];
  clac: number;
}

export function verrouNeuf(): EtatDuVerrou {
  return {
    arrive: Array.from({ length: NB_ANNEAUX }, () => false),
    pret: Array.from({ length: NB_ANNEAUX }, () => -1),
    cliquets: Array.from({ length: NB_ANNEAUX }, () => -1),
    clac: -1,
  };
}

export function avancerLeVerrou(
  verrou: EtatDuVerrou, plans: EtatDesPlans, alignement: number, maintenant: number,
): void {
  if (alignement < 0.01) {
    verrou.arrive.fill(false);
    verrou.pret.fill(-1);
    verrou.cliquets.fill(-1);
    verrou.clac = -1;
    return;
  }
  for (let i = 0; i < NB_ANNEAUX; i++) {
    if (verrou.arrive[i] || plans.avance[i] < 0.98) continue;
    if (verrou.pret[i] < 0) verrou.pret[i] = maintenant;
    const ecart = Math.abs(plans.incl[i] - plans.inclCible[i])
      + 0.35 * Math.abs(plans.noeud[i] - plans.noeudCible[i]);
    if (ecart < TOLERANCE_DU_VERROU || maintenant - verrou.pret[i] > PATIENCE_DU_VERROU) {
      verrou.arrive[i] = true;
      verrou.cliquets[i] = maintenant;
    }
  }
  if (verrou.clac < 0 && verrou.arrive.every(Boolean)) verrou.clac = maintenant;
}

/* Le clac a une masse : un a-coup vers le bas, qui retombe en un
   cinquieme de seconde. Directionnel, pas tire au sort — un verrou qui
   tombe ne tremble pas, il cogne. */
export function aCoupDuVerrou(verrou: EtatDuVerrou, maintenant: number, immobile: boolean): number {
  if (verrou.clac < 0 || immobile) return 0;
  const age = (maintenant - verrou.clac) / 200;
  return age >= 1 ? 0 : Math.pow(1 - age, 4) * 3.2;
}
