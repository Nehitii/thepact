/* LES QUATRE ACTES, ET CE QUI AUTORISE A AVANCER.
 *
 * L ancien onboarding etait six etapes numerotees et un « canNext »
 * fait d une chaine de « if (step === n) ». Six ecrans qui DEMANDENT ;
 * aucun qui fasse arriver quelque chose. Le mot « pacte » y etait
 * prononce sept fois et jamais tenu : on ne signait rien, on validait.
 *
 * Le rite en a huit, et quatre seulement demandent de taper quelque
 * chose — le reste se regarde. On echange du remplissage contre de la
 * mise en scene ; on n ajoute pas du remplissage.
 *
 * TOUT CE QUI DECIDE EST ICI, hors des composants : l ordre des
 * ecrans, ce qui bloque, et ce que le second passage saute. Une
 * condition d avancement qui se trompe ne casse rien — elle laisse
 * passer un pacte sans nom, ou retient quelqu un sur un ecran qu il a
 * rempli. Les deux se lisent comme un ecran correct.
 */

/** Les quatre actes, dans l ordre ou ils se jouent. */
export type Acte = "eveil" | "forge" | "scellement" | "rencontre";

/** Les dix ecrans du rite — neuf traverses, plus le raccourci. */
export type Ecran =
  | "eveil"
  | "porteur"
  | "pacte"
  | "sceau"
  | "phrase"
  | "valeurs"
  | "compact"
  | "lecture"
  | "scellement"
  | "rencontre";

export const ACTE_DE: Record<Ecran, Acte> = {
  eveil: "eveil",
  porteur: "forge",
  pacte: "forge",
  sceau: "forge",
  phrase: "forge",
  valeurs: "forge",
  /* LE FORMULAIRE COMPACT EST LA FORGE, repliee sur un seul ecran :
     memes champs, meme acte. Il ne figure dans AUCUNE des deux suites —
     on ne le traverse pas, on y saute. */
  compact: "forge",
  /* LA LECTURE APPARTIENT AU SCELLEMENT, pas a la forge : on ne
     declare plus rien, on relit ce qu on va jurer. */
  lecture: "scellement",
  scellement: "scellement",
  rencontre: "rencontre",
};

/* L ORDRE COMPLET, ET LES DEUX ECARTS QUI COMPTENT.
 *
 * LE SCEAU PASSE AVANT LA PHRASE. Dans l ancienne page, la
 * personnalisation venait en dernier, apres l objectif : le sceau
 * arrivait quand plus rien ne s y accrochait. Tot, il y a un objet au
 * centre de l ecran pendant tout le reste du rite, et il change de
 * couleur sous les yeux.
 *
 * LE NOM PASSE EN DERNIER, et c est le deuxieme ecart. Il venait en
 * deuxieme : nommer une chose vide est la question la plus dure du
 * rite, et on la posait a froid, avant que le porteur ait rien vu de
 * ce qu il fabriquait. En fin de forge, l anneau porte deja sa teinte,
 * sa corde et son symbole — et chaque lettre tapee fait s engraver un
 * signe. Le pacte nait la, sous les yeux, et il a un nom parce qu il
 * existe. */
export const RITE_COMPLET: readonly Ecran[] = [
  "eveil", "porteur", "sceau", "valeurs", "phrase", "pacte", "lecture", "scellement", "rencontre",
];

/* LE SECOND PASSAGE N EST JAMAIS LE PREMIER. Quelqu un repassera par
   la — « ReinitialiserLePacte » existe. On garde la forge et la
   signature, on saute l eveil et la rencontre : le systeme ne
   redecouvre pas un porteur qu il connait, et M.I.A. ne se represente
   pas a quelqu un qui l a deja rencontree. */
export const RITE_ABREGE: readonly Ecran[] = [
  "porteur", "sceau", "valeurs", "phrase", "pacte", "lecture", "scellement",
];

export const ecransDuRite = (abrege: boolean): readonly Ecran[] =>
  abrege ? RITE_ABREGE : RITE_COMPLET;

/** Ce que le porteur a declare jusqu ici. */
export interface EtatDuRite {
  nomDuPorteur: string;
  nomDuPacte: string;
  mantra: string;
  symbole: string;
  couleur: string;
  valeurs: string[];
  /** Coche a l ecran de scellement, par un geste distinct de la signature. */
  clausesAcceptees: boolean;
  /** Signe une fois le geste tenu jusqu au bout. */
  signe: boolean;
  /** Le gabarit choisi, ou « sur-mesure », ou rien. */
  objectif: { gabarit: string } | { surMesure: string } | null;
}

export const ETAT_VIDE: EtatDuRite = {
  nomDuPorteur: "",
  nomDuPacte: "",
  mantra: "",
  /* VIDES, ET C EST LE POINT. Ils valaient « flame » et « amber » :
     l objet montrait une flamme ambre avant la premiere question, et
     l ecran du sceau laissait passer sans rien toucher. Un choix par
     defaut n est pas un choix — voir « pacteDeclare ». */
  symbole: "",
  couleur: "",
  valeurs: [],
  clausesAcceptees: false,
  signe: false,
  objectif: null,
};

/** Cinq valeurs au plus : au-dela, ce ne sont plus des valeurs. */
export const VALEURS_MAX = 5;

/**
 * COMBIEN DE SIGNES DANS CHAQUE CHAMP LIBRE.
 *
 * Le rite ne plafonnait rien. Les colonnes sont « TEXT » — la base
 * n oppose aucune limite —, et l on pouvait donc coller quatre cents
 * caracteres dans le nom du pacte. Mesure a l ecran : le cadre de
 * l objet passait de 288 a 6239 pixels, et comme il porte un
 * « aspect-ratio: 1 », l anneau devenait un cercle de 6239 sur 6239
 * qui ecrasait la page.
 *
 * CES NOMBRES NE SONT PAS INVENTES ICI : ce sont ceux que
 * l application impose deja aux MEMES champs. Le rite ecrivait des
 * pacte que la page des reglages refusait ensuite de rouvrir sans les
 * tronquer — deux ecrans qui ne s accordaient pas sur ce qu est un
 * nom.
 *
 *   porteur   « ProfileAccountSettings » — profiles.display_name
 *   pacte     « PactIdentityCard »       — pacts.name
 *   phrase    « PactIdentityCard »       — pacts.mantra
 *   objectif  « NewGoal »                — goals.title
 *
 * ILS NE SUFFISENT PAS SEULS. Cinquante signes sans espace debordent
 * encore une colonne de 288 pixels : la feuille de style porte la
 * garde qui, elle, ne peut pas etre contournee — voir « .ob-objet ».
 */
export const LIMITES = {
  nomDuPorteur: 40,
  nomDuPacte: 50,
  mantra: 200,
  objectif: 100,
} as const;

/**
 * Peut-on quitter cet ecran ?
 *
 * LES VALEURS SONT FACULTATIVES — « 3 a 5, ou aucune ». Ne rien
 * choisir est une reponse, et forcer trois cases produirait trois
 * mensonges plutot qu un silence.
 *
 * LE SCELLEMENT DEMANDE DEUX GESTES SEPARES : la case des clauses ET
 * la signature. Les fondre en un seul rendrait le consentement
 * equivoque, ce qu il n a pas le droit d etre — quel que soit le gain
 * de mise en scene.
 */
export function peutAvancer(ecran: Ecran, etat: EtatDuRite): boolean {
  switch (ecran) {
    case "eveil":
      return true;
    case "porteur":
      return etat.nomDuPorteur.trim().length > 0;
    case "pacte":
      return etat.nomDuPacte.trim().length > 0;
    case "sceau":
      return etat.symbole.length > 0 && etat.couleur.length > 0;
    case "phrase":
      return etat.mantra.trim().length > 0;
    case "valeurs":
      return true;
    case "compact":
      /* Il porte les memes champs que la forge entiere : il exige donc
         la meme chose qu elle, d un coup. */
      return pacteDeclare(etat);
    case "lecture":
      /* On ne relit que ce qui existe. C est aussi la garde du rite
         abrege : il commence a la forge, mais rien n empeche d y
         arriver avec un pacte incomplet. */
      return pacteDeclare(etat);
    case "scellement":
      /* On ne scelle que ce qui est declare : sinon « Passer le rite »
         depuis le premier ecran menait a un bouton mort. */
      return pacteDeclare(etat) && etat.clausesAcceptees && etat.signe;
    case "rencontre":
      return etat.objectif !== null && !objectifSansNom(etat.objectif);
  }
}

/** Un objectif sur mesure sans titre n en est pas un. */
const objectifSansNom = (o: NonNullable<EtatDuRite["objectif"]>): boolean =>
  "surMesure" in o && o.surMesure.trim().length === 0;

/**
 * Ce que la case des clauses autorise.
 *
 * Separee de « peutAvancer » parce que la signature s en sert AVANT
 * l avancement : on ne doit pas pouvoir commencer a signer tant que
 * les clauses ne sont pas acceptees. Le theatre enrobe le
 * consentement, il ne le remplace pas.
 */
export const peutSigner = (etat: EtatDuRite): boolean => etat.clausesAcceptees;

/**
 * L ecran suivant, ou `null` quand le rite est fini.
 *
 * LE FORMULAIRE COMPACT N EST DANS AUCUNE SUITE, donc l index ne le
 * trouve pas : il a sa navigation a lui. On y saute depuis la forge,
 * on en sort vers la lecture — le raccourci abrege les declarations,
 * il ne dispense ni de relire ni de jurer.
 */
export function ecranSuivant(ecran: Ecran, abrege: boolean): Ecran | null {
  if (ecran === "compact") return "lecture";
  const suite = ecransDuRite(abrege);
  const i = suite.indexOf(ecran);
  if (i < 0 || i === suite.length - 1) return null;
  return suite[i + 1];
}

/** L ecran precedent, ou `null` quand on est au debut. */
export function ecranPrecedent(ecran: Ecran, abrege: boolean): Ecran | null {
  /* On revient du compact a la premiere fenetre de la forge : il les
     remplace toutes, aucune n est « celle d avant ». */
  if (ecran === "compact") return ecransDuRite(abrege).find((e) => ACTE_DE[e] === "forge") ?? null;
  const suite = ecransDuRite(abrege);
  const i = suite.indexOf(ecran);
  if (i <= 0) return null;
  return suite[i - 1];
}

/**
 * Combien de fenetres de la forge sont closes.
 *
 * LE RITE N A PAS DE BARRE DE PROGRESSION — les fenetres closes
 * restent empilees derriere, en transparence, et c est la trace de ce
 * qu on a declare qui tient ce role. Ce compte les denombre.
 */
export function fenetresCloses(ecran: Ecran, abrege: boolean): number {
  const suite = ecransDuRite(abrege).filter((e) => ACTE_DE[e] === "forge");
  const i = suite.indexOf(ecran);
  /* Passe la forge, elles sont toutes closes. */
  if (i < 0) return ACTE_DE[ecran] === "eveil" ? 0 : suite.length;
  return i;
}

/**
 * Le pacte est-il pret a etre ecrit en base ?
 *
 * La garde ultime avant l insertion : elle ne fait pas confiance a la
 * navigation, parce qu un ecran saute par un bouton mal garde ecrirait
 * un pacte sans nom — et la colonne « pacts.name » est NOT NULL, donc
 * ce serait un refus de la base au dernier moment du rite.
 */
export function pretASceller(etat: EtatDuRite): boolean {
  return pacteDeclare(etat) && etat.clausesAcceptees && etat.signe;
}

/**
 * Le pacte est-il DECLARE — a-t-il tout ce sans quoi on ne scelle pas ?
 *
 * Un nom et une phrase, parce que la base les refuse vides. Un signe et
 * une teinte, parce que L ETAT VIDE N EN A PLUS : ils valaient « flame »
 * et « amber » d avance, l ecran du sceau laissait passer sans rien
 * toucher, et l on pouvait sceller un pacte sous un signe jamais choisi
 * — grave a vie dans le sceau.
 *
 * C est aussi ce qui autorise « Passer le rite » : on ne peut abreger
 * que ce qui existe. Offert des le premier ecran, le raccourci menait
 * au scellement d un pacte sans nom, et a un bouton mort.
 */
export function pacteDeclare(etat: EtatDuRite): boolean {
  return (
    etat.nomDuPacte.trim().length > 0 &&
    etat.mantra.trim().length > 0 &&
    etat.symbole.length > 0 &&
    etat.couleur.length > 0
  );
}
