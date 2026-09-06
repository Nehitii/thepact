import { ecritureDeLaVersion, VERSION_ALPHABET, echantillonner, empreinte, normaliser } from "@/domaines/objectifs/logique/sigil";

/* LE CERCLE DU PACTE — la structure, pas le dessin.
 *
 * ═══ CE QUE LA FIGURE D AVANT N AVAIT PAS ═══
 *
 * Elle etait faite d anneaux concentriques et de rayons : AUCUNE DROITE
 * NE TRAVERSAIT LE DISQUE. C est la raison, unique et suffisante, pour
 * laquelle elle se lisait « rouage » et jamais « sceau ». Tous les
 * cercles arcaniques portent un polygone etoile inscrit — pentagramme,
 * hexagramme — dont les cordes coupent le champ de part en part.
 *
 * La figure se construit donc dans l autre sens : un POLYGONE ETOILE
 * {n/k} d abord, et les anneaux autour. Les medaillons des valeurs se
 * posent SUR SES SOMMETS, la ou la geometrie et le contenu se
 * rejoignent, au lieu de flotter sur une couronne choisie au hasard.
 *
 * ═══ CE QUE LA SYMETRIE DEVIENT ═══
 *
 * Elle n est plus construite branche par branche, elle est celle du
 * polygone — exacte par definition. Un {n/k} a n axes de symetrie,
 * quel que soit n et quel que soit k. C est plus fort que l ancien
 * miroir gauche-droite, qui se mesurait a 97 ou 100 % selon les
 * pactes, et cela ne coute rien a tenir.
 *
 * CE MODULE NE DESSINE RIEN. Il dit ou vont les choses ; « RosaceDuPacte »
 * les rend. La separation permet de tester la construction sans monter
 * d ecran.
 */

/** Cinq, six, sept ou huit sommets — le nom choisit. */
export const ORDRES_POSSIBLES = [5, 6, 7, 8] as const;

/* L ordre du cadre qui attend, avant qu un nom soit donne. Six : c est
   celui qui porte proprement deux, trois ou six medaillons. */
export const ORDRE_PAR_DEFAUT = 6;

/** Combien de lettres court le pourtour. */
export const LETTRES_DU_POURTOUR = 40;

export interface MedaillonDeLaRosace {
  valeur: string;
  /** Le caractere de cette valeur. */
  d: string;
  /** Le sommet du polygone qui le porte. */
  sommet: number;
  angle: number;
}

export interface Rosace {
  version: number;
  /** Les sommets du polygone. Zero tant que le pacte n a pas de nom. */
  ordre: number;
  /** Le pas du trace : un {ordre/pas}. Zero sans nom. */
  pas: number;
  /** Le nom, lettre a lettre, tout autour. Vide sans nom. */
  inscription: string[];
  medaillons: MedaillonDeLaRosace[];
  source: string;
}

const DEUX_PI = Math.PI * 2;
/** Zero est en haut, pas a droite : un sceau se lit depuis son sommet. */
const HAUT = -Math.PI / 2;

/**
 * LE PAS DU TRACE, ET POURQUOI IL NE SE TIRE PAS AU HASARD.
 *
 * Un {n/k} n est une etoile que si k et n sont premiers entre eux et
 * si k vaut au moins deux. {6/3} n est pas une figure — ce sont trois
 * segments qui se croisent au centre — et {8/2} n est qu un carre
 * dessine deux fois. Le pas se choisit donc dans ce qui tient.
 */
const PAS_POSSIBLES: Readonly<Record<number, readonly number[]>> = {
  5: [2],
  6: [2],
  7: [2, 3],
  8: [3],
};

function pasDeLOrdre(ordre: number, marque: number): number {
  const choix = PAS_POSSIBLES[ordre] ?? [2];
  return choix[marque % choix.length];
}

/**
 * Le cercle d un pacte.
 *
 * IL SE CONSTRUIT DECLARATION PAR DECLARATION. Les medaillons naissent
 * des valeurs, l inscription et le polygone naissent du nom : chacun
 * apparait quand SA declaration est faite, pas quand la derniere l est.
 * Tant que le nom manque, le pourtour reste nu et les medaillons se
 * posent sur les sommets du cadre qui attend.
 */
export function rosaceDuPacte(
  nom: string,
  valeurs: readonly string[] = [],
  version: number = VERSION_ALPHABET,
): Rosace {
  /* DEUX ECRITURES, DEUX EMPLOIS. Le pourtour epelle le nom lettre a
     lettre ; chaque medaillon porte une valeur entiere, et recoit donc
     un caractere qui la tient seule. Sous les versions 1 et 2, les deux
     tables sont la meme — leur sceau ne change pas pour autant. */
  const { signes, valeurs: ecritureDesValeurs } = ecritureDeLaVersion(version);
  const source = echantillonner(normaliser(nom));
  const marque = source.length > 0 ? empreinte(source) : 0;

  const ordre = source.length > 0
    ? ORDRES_POSSIBLES[marque % ORDRES_POSSIBLES.length]
    : 0;
  /* Les medaillons ont besoin d un sommet avant meme le nom : ils se
     posent sur ceux du cadre qui attend, et se replacent quand le nom
     decide de l ordre. C est le seul saut de la forge, et il tombe au
     dernier ecran, la ou toute la figure se ferme de toute facon. */
  const sommets = ordre || ORDRE_PAR_DEFAUT;

  /* LES MEDAILLONS SE REPARTISSENT SUR LES SOMMETS, aussi egalement que
     l ordre le permet. Trois valeurs sur six sommets tombent sur un
     sommet sur deux ; sur sept, la repartition boite d un cran — c est
     la figure qui le dit, pas un defaut de calcul.

     DEUX VALEURS D UN MEME PACTE NE PORTENT PAS LE MEME CARACTERE.
     Il se prenait a « empreinte(valeur) % 24 » : sur un vocabulaire de
     vingt-quatre valeurs, 374 pactes a trois valeurs sur 2 024 — 18,5 %
     — en affichaient deux identiques. On avance jusqu au premier libre,
     a partir de la v3 seulement : corriger en amont redessinerait les
     sceaux deja jures. */
  const pris = new Set<number>();
  const medaillons: MedaillonDeLaRosace[] = valeurs.map((valeur, i) => {
    let k = empreinte(valeur) % ecritureDesValeurs.length;
    if (version >= 3) {
      for (let n = 0; pris.has(k) && n < ecritureDesValeurs.length; n++) {
        k = (k + 1) % ecritureDesValeurs.length;
      }
      pris.add(k);
    }
    const sommet = Math.round((i * sommets) / Math.max(1, valeurs.length)) % sommets;
    return {
      valeur,
      d: ecritureDesValeurs[k],
      sommet,
      angle: HAUT + (sommet / sommets) * DEUX_PI,
    };
  });

  if (source.length === 0) {
    return { version, ordre: 0, pas: 0, inscription: [], medaillons, source };
  }

  /* L INSCRIPTION SE PREND SUR TOUTE LA LONGUEUR DU NOM, bornes
     comprises. Lue consecutivement depuis le debut, elle n en couvrait
     que les premiers caracteres, et deux pactes ne differant que par
     leur queue portaient le meme sceau. On repartit sur
     « longueur - 1 » : la derniere lettre est lue comme la premiere. */
  const inscription: string[] = [];
  for (let i = 0; i < LETTRES_DU_POURTOUR; i++) {
    const ou = source.length > 1
      ? Math.round((i * (source.length - 1)) / (LETTRES_DU_POURTOUR - 1))
      : 0;
    inscription.push(signes[source.charCodeAt(ou) % signes.length]);
  }

  return {
    version,
    ordre,
    pas: pasDeLOrdre(ordre, marque),
    inscription,
    medaillons,
    source,
  };
}
