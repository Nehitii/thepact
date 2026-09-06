import { ecritureDeLaVersion, VERSION_ALPHABET, echantillonner, empreinte, normaliser } from "@/domaines/objectifs/logique/sigil";

/* LA ROSACE DU PACTE — la structure, pas le dessin.
 *
 * Le sigil v1 posait ses signes a « (i / n) x 2π + decalage », le
 * decalage venant de l empreinte du nom. Rien ne tombait donc jamais
 * sur un axe : ni vertical, ni horizontal. Une figure dont aucun
 * element n est aligne ne peut pas PARAITRE construite, quel que soit
 * le soin du reste — et les ancres, posees a « empreinte(valeur) % 2π »,
 * pouvaient se superposer a deux degres l une de l autre.
 *
 * Ici la symetrie n est plus esperee, elle est CONSTRUITE : un nombre
 * de branches, un motif par branche, et les branches se repondent en
 * miroir gauche-droite. Mesure sur cinq pactes : 97 a 100 % des points
 * traces ont leur reflet de l autre cote de l axe vertical, contre 42 a
 * 85 % pour la v1.
 *
 * CE MODULE NE DESSINE RIEN. Il dit ou vont les choses ; « RosaceDuPacte »
 * les rend. La separation permet de tester la symetrie et l unicite
 * sans monter d ecran.
 */

/** Quatre, six ou huit branches — le pacte choisit. */
export const BRANCHES_POSSIBLES = [4, 6, 8] as const;

export interface BrancheDeLaRosace {
  /** L angle de son rayon, en radians. Zero est en haut. */
  angle: number;
  /** Les signes posés de part et d autre du rayon, du plus proche au plus loin. */
  signes: string[];
}

export interface MedaillonDeLaRosace {
  valeur: string;
  /** Le signe de cette valeur. */
  d: string;
  angle: number;
}

export interface Rosace {
  version: number;
  branches: number;
  bandes: BrancheDeLaRosace[];
  medaillons: MedaillonDeLaRosace[];
  /** Le signe du coeur, deduit du nom entier. */
  coeur: string | null;
  source: string;
}

const DEUX_PI = Math.PI * 2;
/** Zero est en haut, pas a droite : un sceau se lit depuis son sommet. */
const HAUT = -Math.PI / 2;

/**
 * La rosace d un pacte.
 *
 * CHAQUE BRANCHE PORTE SA PROPRE TRANCHE DU NOM, et les branches se
 * repondent en miroir : celle du haut et celle du bas sont sur l axe,
 * les autres vont par paires. Repeter le MEME motif partout n employait
 * que deux ou trois lettres — mesure sur deux mille noms distincts,
 * deux cent soixante et un pactes auraient partage leur sceau avec un
 * autre. En miroir de branche, aucun.
 *
 * LA FIGURE SE CONSTRUIT DECLARATION PAR DECLARATION. Les medaillons
 * naissent des valeurs, la bande et le coeur naissent du nom : chacun
 * apparait quand SA declaration est faite, pas quand la derniere l est.
 * Tant que le nom manque, la bande reste vide et les anneaux se
 * dessinent seuls — mieux vaut un cadre qui attend qu un sceau qu on
 * n a pas encore.
 */
export function rosaceDuPacte(
  nom: string,
  valeurs: readonly string[] = [],
  version: number = VERSION_ALPHABET,
): Rosace {
  /* DEUX ECRITURES, DEUX EMPLOIS. La bande epelle le nom lettre a
     lettre ; chaque medaillon porte une valeur entiere, et recoit donc
     un caractere qui la tient seule. Sous les versions 1 et 2, les
     deux tables sont la meme — le sceau ne change pas pour autant. */
  const { signes, valeurs: ecritureDesValeurs } = ecritureDeLaVersion(version);
  const source = echantillonner(normaliser(nom));

  /* LES MEDAILLONS SE CALCULENT AVANT TOUT LE RESTE, PARCE QU ILS NE
     DEPENDENT PAS DU NOM. Chacun descend de SA valeur : il existe des
     qu on choisit celle-ci, meme si le pacte n a pas encore de nom.
     Ils sortaient d un retour anticipe qui rendait la rosace entiere
     vide tant que le nom manquait. Le nom etant la DERNIERE declaration
     de la forge, les valeurs etaient toujours choisies avant lui : le
     sceau se construisait donc d un seul coup a la fin. Mesure a
     l ecran, trois valeurs jurees, zero medaillon jusqu au nom.

     ILS SE REPARTISSENT SUR LE TOUR ENTIER, pas sur les axes des
     branches : poses sur les axes, trois valeurs dans une figure a
     quatre branches laissaient un axe nu et la figure perdait son
     miroir. Repartis, n valeurs gardent toujours un axe vertical. */
  /* DEUX VALEURS D UN MEME PACTE NE PORTENT PAS LE MEME CARACTERE.
     Le caractere se prenait a « empreinte(valeur) % 24 » : sur un
     vocabulaire de vingt-quatre valeurs, 374 pactes a trois valeurs sur
     2 024 — 18,5 % — en affichaient deux identiques. Le pacte de
     reference en faisait partie : « Excellence » et « Apprentissage »
     tombent l un et l autre sur l index 19.

     Le defaut existait des la v1 ; les ideogrammes le rendent
     flagrant, parce qu un caractere dense se reconnait la ou deux
     traits se confondent. On avance donc jusqu au premier libre.

     A PARTIR DE LA V3 SEULEMENT. Corriger en amont redessinerait les
     sceaux deja jures — c est exactement ce que le versionnage
     empeche.

     L ORDRE DECIDE, ET C EST DEJA LE CAS. Le rang d une valeur place
     son medaillon sur le tour ; il choisit maintenant aussi lequel
     cede sa place. Deux porteurs qui ont jure les memes valeurs dans
     un ordre different n avaient deja pas le meme sceau. */
  const pris = new Set<number>();
  const medaillons = valeurs.map((valeur, i) => {
    let k = empreinte(valeur) % ecritureDesValeurs.length;
    if (version >= 3) {
      for (let n = 0; pris.has(k) && n < ecritureDesValeurs.length; n++) {
        k = (k + 1) % ecritureDesValeurs.length;
      }
      pris.add(k);
    }
    return {
      valeur,
      d: ecritureDesValeurs[k],
      angle: HAUT + (i / valeurs.length) * DEUX_PI,
    };
  });

  if (source.length === 0) {
    return { version, branches: 0, bandes: [], medaillons, coeur: null, source };
  }

  const marque = empreinte(source);
  const branches = BRANCHES_POSSIBLES[marque % BRANCHES_POSSIBLES.length];
  /* Deux signes par demi-secteur des six branches : au-dela ils se
     touchent. A quatre branches le secteur est assez large pour trois. */
  const parBranche = branches >= 6 ? 2 : 3;
  const demi = Math.floor(branches / 2);

  /* LES TRANCHES SE PRENNENT SUR TOUTE LA LONGUEUR DU NOM.
     Lues consecutivement depuis le debut, elles n en couvraient que
     les premiers caracteres : a six branches, huit places pour un nom
     de dix, et la fin n etait jamais lue. Mesure sur mille noms, trois
     paires portaient le meme sceau en ne differant que par leur queue.
     C est le meme principe qu « echantillonner » : le debut, la fin et
     la forme generale pesent tous les trois. */
  const places = (demi + 1) * parBranche;
  const bandes: BrancheDeLaRosace[] = [];
  for (let b = 0; b < branches; b++) {
    /* La branche et son reflet lisent la meme tranche. */
    const rang = b <= demi ? b : branches - b;
    const lus: string[] = [];
    for (let i = 0; i < parBranche; i++) {
      /* BORNES COMPRISES : on repartit sur « longueur - 1 », pas sur
         « longueur ». Sinon la derniere lettre n est jamais lue — huit
         places sur un nom de quinze donnaient 0, 1, 3, 5, 7, 9, 11, 13,
         et deux pactes ne differant que par leur derniere lettre
         portaient le meme sceau. */
      const place = rang * parBranche + i;
      const ou = places > 1 ? Math.round((place * (source.length - 1)) / (places - 1)) : 0;
      lus.push(signes[source.charCodeAt(ou) % signes.length]);
    }
    bandes.push({ angle: HAUT + (b / branches) * DEUX_PI, signes: lus });
  }

  return {
    version,
    branches,
    bandes,
    medaillons,
    coeur: signes[marque % signes.length],
    source,
  };
}
