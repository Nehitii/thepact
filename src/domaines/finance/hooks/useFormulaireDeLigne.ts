import { useEffect, useState } from "react";
import { normaliserCadre, cadreAEnregistrer, CADRE_PAR_DEFAUT, type CadreImage } from "@/domaines/finance/logique/cadre";
import { lireNom, lireMontant } from "@/domaines/finance/logique/garde";
import { moisDeChute, motifDepuisMois, partsDeLEcheancier, nombreDEcheances } from "@/domaines/finance/logique/cadence";
import type { FinanceCategory } from "@/domaines/finance/logique/categories";
import type { FinancialItem, ValeursLigne } from "@/domaines/finance/types";

/* DEUX CADENCES, ET RIEN ENTRE : ou la ligne revient, ou elle se paie
   en un nombre fini de fois. */
const MODES = ["recurrent", "echeancier"] as const;
export type Mode = typeof MODES[number];

export interface FormulaireDeLigne {
  ouvert: boolean;
  onOuvert: (v: boolean) => void;
  categories: FinanceCategory[];
  /** Nulle pour une creation. */
  ligne: FinancialItem | null;
  onEnregistrer: (v: ValeursLigne) => Promise<void>;
  enCours?: boolean;
  /** Les mois coches d une ligne neuve. */
  moisParDefaut: number[];
}

/* LA MACHINE A ETATS DU FORMULAIRE DE LIGNE.
 *
 * Onze champs, la relecture de la cadence enregistree, trois regles de
 * refus et l apercu de l echeancier. Tout cela vivait dans le composant,
 * devant trois cents lignes de rendu.
 *
 * LA MACHINE A ETATS D UN FORMULAIRE N EST PAS SON DESSIN. Ici la
 * distinction porte plus loin qu ailleurs : ce formulaire decide de ce
 * qui sera preleve sur un compte, et son apercu est ce sur quoi on
 * s appuie pour valider.
 */

/** Le mois en cours, en « aaaa-mm ». */
const moisCourantISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function useFormulaireDeLigne({
  ouvert, ligne, categories, moisParDefaut, onEnregistrer, onOuvert, enCours,
}: FormulaireDeLigne) {
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [categorie, setCategorie] = useState(categories[0]?.value ?? '');
  const [urlIcone, setUrlIcone] = useState('');
  const [cadre, setCadre] = useState<CadreImage>(CADRE_PAR_DEFAUT);
  const [mode, setMode] = useState<Mode>('recurrent');
  const [moisChoisis, setMoisChoisis] = useState<number[]>([]);
  const [ancre, setAncre] = useState(moisCourantISO());
  const [nbEcheances, setNbEcheances] = useState('4');
  /* LE JOUR OU L ARGENT BOUGE, ET SON DECALAGE.
     Vide par defaut : la plupart des lignes n ont pas de jour connu, et
     l exiger serait demander une precision que personne n a. */
  const [jour, setJour] = useState('');
  const [decalage, setDecalage] = useState(0);

  useEffect(() => {
    if (!ouvert) return;
    setNom(ligne?.name ?? '');
    setMontant(ligne ? String(ligne.amount) : '');
    setCategorie(ligne?.category ?? categories[0]?.value ?? '');
    setUrlIcone(ligne?.icon_url ?? '');
    /* Le cadre vient dune colonne jsonb : il peut contenir nimporte
       quoi, et normaliserCadre est le seul point de passage. */
    setCadre(normaliserCadre(ligne?.icon_cadre));

    /* La cadence se relit de ce qui est enregistre : un echeancier se
       reconnait a son nombre d echeances, tout le reste revient. Les
       mois se rallument dans la grille — on retrouve exactement ce
       qu on avait coche, et non une periode a re-decoder. */
    const n = ligne?.echeances ?? null;
    setMode(n != null ? 'echeancier' : 'recurrent');
    setMoisChoisis(
      ligne
        ? moisDeChute({ amount: ligne.amount, is_active: true, periode_mois: ligne.periode_mois, mois_ancre: ligne.mois_ancre })
        : moisParDefaut,
    );
    setAncre(ligne?.mois_ancre ? String(ligne.mois_ancre).slice(0, 7) : moisCourantISO());
    setNbEcheances(n != null ? String(n) : '4');
    setJour(ligne?.jour_echeance != null ? String(ligne.jour_echeance) : '');
    setDecalage(ligne?.decalage_mois ?? 0);
    /* Pour un echeancier, le champ du montant porte le prix paye et
       non la part : c est ainsi qu on achete, donc ainsi qu on s en
       souvient. */
    if (n != null && ligne?.montant_total != null) setMontant(String(ligne.montant_total));
  }, [ouvert, ligne, categories, moisParDefaut]);

  const estEcheancier = mode === 'echeancier';
  const motif = motifDepuisMois(moisChoisis);
  const nEcheances = Math.max(2, Math.min(60, parseInt(nbEcheances, 10) || 2));

  /* LES MEMES BORNES QUE PARTOUT AILLEURS.
     Les regles vivaient ici, et avaient donc derive : la correction
     « Desormais » du parcours ecrivait dans la meme colonne en
     acceptant zero, et rien ne bornait le haut — une faute de frappe a
     sept zeros passait, puis faussait l horizon et l historique. Voir
     lib/finance/garde.ts, et la migration qui pose les memes bornes en
     base. */
  const lectureNom = lireNom(nom);
  const lectureMontant = lireMontant(montant);
  const valeur = lectureMontant.ok ? lectureMontant.valeur : NaN;

  /* Un motif irregulier ne s enregistre pas non plus : il ne saurait
     pas se repeter l annee suivante. Le bouton reste bloque, et la
     grille propose juste au-dessus de quoi le rattraper en un clic. */
  const valide = lectureNom.ok && lectureMontant.ok && (estEcheancier || motif !== null);

  /* Le refus se dit, il ne se devine pas. Un bouton grise sans raison
     laisse chercher ce qui cloche. */
  const refus = !lectureNom.ok ? lectureNom.raison
    : (!lectureMontant.ok && montant.trim() !== '') ? lectureMontant.raison
    : null;

  /* L apercu de l echeancier : ce qui sera reellement preleve, mois
     par mois. Deux cents euros en trois fois ne tombent pas juste — la
     derniere echeance absorbe le reste, et on le montre plutot que de
     laisser la surprise au releve bancaire. */
  /* L APERCU PREND LA MEME DIVISION QUE LE PRELEVEMENT.
     Elle etait ecrite ici une seconde fois — deux cents euros en
     trois fois font 66,66 puis 66,66 puis 66,68, et deux ecritures
     de cette regle sont deux facons de deriver. C est l apercu qui
     sert a decider ; il ne peut pas dire autre chose que la base. */
  const partsEcheancier = estEcheancier && Number.isFinite(valeur) && valeur > 0
    ? partsDeLEcheancier(valeur, nEcheances)
    : [];

  const enregistrer = async () => {
    if (!valide || enCours || !lectureNom.ok) return;
    await onEnregistrer({
      name: lectureNom.ok ? lectureNom.valeur : '',
      /* Ce qu on enregistre dans « amount », c est toujours ce qui part
         a une echeance : pour un echeancier, la part et non le total. */
      amount: estEcheancier ? partsEcheancier[0] : valeur,
      category: categorie || undefined,
      iconUrl: urlIcone || null,
      /* Sans image, le cadre ne cadre rien : linscrire laisserait un
         reglage orphelin derriere une ligne qui na plus de logo. */
      iconCadre: urlIcone ? cadreAEnregistrer(cadre) : null,
      /* Un echeancier se preleve mois apres mois : sa periode vaut un,
         et c est sa premiere echeance qui le situe. Une charge qui
         revient tient dans le motif lu sur la grille. */
      periodeMois: estEcheancier ? 1 : (motif?.periode ?? 1),
      /* Une cadence mensuelle sans fin n a pas besoin d ancre : elle
         tombe de toute facon, et l exiger serait demander une
         information que personne n a envie de saisir. Une cadence plus
         longue s ancre dans l annee en cours — le motif se repete
         ensuite indefiniment, l annee de depart n a donc pas a etre
         choisie. */
      moisAncre: estEcheancier
        ? `${ancre}-01`
        : !motif || motif.periode === 1
          ? null
          : `${new Date().getFullYear()}-${String(motif.ancre + 1).padStart(2, '0')}-01`,
      /* Un jour hors de 1-31 n a pas de sens : on prefere ne rien
         dire plutot que d ecrire une valeur fausse. */
      jourEcheance: (() => {
        const j = parseInt(jour, 10);
        return Number.isFinite(j) && j >= 1 && j <= 31 ? j : null;
      })(),
      decalageMois: decalage,
      echeances: estEcheancier ? nEcheances : null,
      montantTotal: estEcheancier ? valeur : null,
    });
    onOuvert(false);
  };
  return {
    nom, setNom, montant, setMontant, categorie, setCategorie,
    urlIcone, setUrlIcone, cadre, setCadre, mode, setMode,
    moisChoisis, setMoisChoisis, ancre, setAncre, nbEcheances, setNbEcheances,
    jour, setJour, decalage, setDecalage,
    estEcheancier, motif, nEcheances, valeur, valide, refus, partsEcheancier,
    enregistrer,
  };
}
