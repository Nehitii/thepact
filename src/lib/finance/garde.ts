/**
 * LES GARDE-FOUS DE LA SAISIE.
 *
 * Les regles vivaient dans les composants, et elles avaient donc
 * derive. Le formulaire exigeait un montant strictement positif ; la
 * correction « Desormais » du parcours, qui ecrit dans la meme colonne,
 * acceptait zero. Le plafond de trente lignes etait verifie a l ajout
 * depuis un bloc, et ignore a l ajout depuis le parcours. Aucun des
 * deux ne bornait le haut : une faute de frappe a sept zeros passait
 * partout, et faussait ensuite l horizon, le versement au pacte et tout
 * l historique.
 *
 * Une regle qui vit dans un composant n est pas une regle, c est une
 * habitude. Elles sont ici, une fois, et les memes bornes sont posees
 * en base — voir la migration les_garde_fous_de_finance. Le client dit
 * pourquoi c est refuse ; la base garantit que ca l est.
 */

/** Un milliard : au-dela, un nombre ne peut plus etre qu une faute. */
export const MONTANT_MAX = 1_000_000_000;

/** Cent vingt caracteres : au-dela, aucune mise en page ne tient. */
export const NOM_MAX = 120;

/** Trente lignes par bloc, tous chemins d ajout confondus. */
export const LIGNES_MAX = 30;

/**
 * UNE LECTURE : SOIT UNE VALEUR, SOIT UNE RAISON DE REFUS.
 *
 * Une premiere version rendait deux champs dont l un etait nul, parce
 * que le projet compilait avec strictNullChecks a false et que
 * TypeScript n y reduit pas les unions par un discriminant booleen :
 * « lu.raison » etait signale inexistant a l interieur meme du test qui
 * le garantit. strict est desormais actif, et la forme juste redevient
 * possible — celle ou l on ne PEUT PAS lire une valeur refusee, parce
 * que le compilateur l interdit.
 */
export type Lecture<T> =
  | { ok: true; valeur: T; raison?: undefined }
  | { ok: false; valeur?: undefined; raison: RaisonRefus };

export type RaisonRefus =
  | 'montantVide'
  | 'montantIllisible'
  | 'montantNegatif'
  | 'montantNul'
  | 'montantEnorme'
  | 'nomVide'
  | 'nomTropLong'
  | 'tropDeLignes';

const enCentimes = (v: number) => Math.round(v * 100) / 100;

/**
 * Lit un montant saisi.
 *
 * `zeroAdmis` separe deux cas qui n ont pas les memes regles :
 *
 *   une LIGNE RECURRENTE a zero n a pas de sens — elle ne coute rien,
 *   ne rapporte rien, et encombre la liste. On la refuse ;
 *
 *   un POINTAGE a zero en a un, et un bon : « ce mois-ci, ca n est pas
 *   parti ». L interdire obligerait a decocher la ligne, ce qui ne dit
 *   pas la meme chose — decoche veut dire « je n ai pas verifie ».
 */
export function lireMontant(saisie: string, { zeroAdmis = false } = {}): Lecture<number> {
  const brut = saisie.trim();
  if (brut === '') return { ok: false, raison: 'montantVide' };

  const v = parseFloat(brut.replace(',', '.'));
  if (!Number.isFinite(v)) return { ok: false, raison: 'montantIllisible' };
  if (v < 0) return { ok: false, raison: 'montantNegatif' };
  if (v === 0 && !zeroAdmis) return { ok: false, raison: 'montantNul' };
  if (v > MONTANT_MAX) return { ok: false, raison: 'montantEnorme' };

  return { ok: true, valeur: enCentimes(v) };
}

/** Lit un nom de ligne. */
export function lireNom(saisie: string): Lecture<string> {
  const nom = saisie.trim();
  if (nom === '') return { ok: false, raison: 'nomVide' };
  if (nom.length > NOM_MAX) return { ok: false, raison: 'nomTropLong' };
  return { ok: true, valeur: nom };
}

/** Reste-t-il de la place dans ce bloc ? */
export function placeDisponible(nbLignes: number): Lecture<number> {
  return nbLignes >= LIGNES_MAX
    ? { ok: false, raison: 'tropDeLignes' }
    : { ok: true, valeur: LIGNES_MAX - nbLignes };
}

/**
 * La cle de traduction d un refus, et de quoi la remplir.
 *
 * On rend la cle plutot que le message : le module ne connait pas
 * i18next, et les bornes n ont pas a etre recopiees dans les
 * traductions — elles y arrivent en variable.
 */
const NOMBRE = new Intl.NumberFormat('fr-FR');

export function direLeRefus(raison: RaisonRefus): { cle: string; valeurs: Record<string, string | number> } {
  return {
    cle: `finance.garde.${raison}`,
    valeurs: {
      /* Groupe par milliers : « 1000000000 » demande de compter les
         zeros, ce qui est exactement ce que le message reproche. */
      max: NOMBRE.format(MONTANT_MAX),
      nomMax: NOM_MAX,
      lignesMax: LIGNES_MAX,
    },
  };
}
