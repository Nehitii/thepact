import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Tag, Type, Coins, X, Repeat, CalendarClock, Layers, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbol } from '@/lib/currency';
import { getCategoryLabel, type FinanceCategory } from '@/domaines/finance/logique/categories';
import { CadreurDImage } from '../CadreurDImage';
import { normaliserCadre, cadreAEnregistrer, CADRE_PAR_DEFAUT, type CadreImage } from '@/domaines/finance/logique/cadre';
import { couleurDe } from '@/domaines/finance/logique/marque';
import { lireNom, lireMontant, direLeRefus, NOM_MAX } from '@/domaines/finance/logique/garde';
import { SelecteurDeMois } from './SelecteurDeMois';
import { moisDeChute, motifDepuisMois } from '@/domaines/finance/logique/cadence';
import type { FinancialItem } from '@/domaines/finance/types';

/* UNE LIGNE RECURRENTE
 *
 * L ajout et la modification se faisaient EN LIGNE, dans une colonne
 * de quatre cents pixels : une vignette, un menu deroulant de cent
 * trente pixels, deux champs et deux boutons sur une seule rangee.
 * Le formulaire debordait de son cadre, les libelles disparaissaient
 * derriere des indices grises, et le menu de categorie ne montrait
 * qu une valeur a la fois.
 *
 * Les deux gestes passent dans une fenetre, ou il y a la place de
 * nommer les choses. Les categories deviennent une grille : on les
 * voit toutes, avec leur nom, d un coup d oeil — c est un choix, pas
 * une liste a derouler.
 */

export interface ValeursLigne {
  name: string;
  /** Ce qui part a chaque echeance. Pour un echeancier, c est la part. */
  amount: number;
  category?: string;
  iconEmoji?: string;
  /* NUL EST UNE VALEUR, ET « INDEFINI » N EN EST PAS UNE.
     Retirer une image ne fonctionnait pas : on envoyait undefined, que
     le client Supabase OMET de la requete — la colonne n etait donc
     jamais touchee et l ancien logo restait. Il faut dire null pour
     effacer, et le type doit le permettre. */
  iconUrl?: string | null;
  /* Comment l image se pose. Nul quand rien n a ete regle : ecrire le
     defaut partout ferait croire a une intention. */
  iconCadre?: CadreImage | null;
  /* LA CADENCE. Un abonnement trimestriel et un paiement en plusieurs
     fois sont la meme mecanique : une charge qui ne tombe pas tous les
     mois. Voir src/lib/finance/cadence.ts. */
  periodeMois?: number;
  moisAncre?: string | null;
  echeances?: number | null;
  montantTotal?: number | null;
  /** Le jour du mois ou l argent bouge, et de combien de mois il suit. */
  jourEcheance?: number | null;
  decalageMois?: number;
}

/* DEUX FACONS DE PAYER, ET UNE SEULE QUESTION A POSER.
 *
 * On proposait cinq cadences sur une rangee : mensuel, trimestriel,
 * semestriel, annuel, echeancier. Les quatre premieres sont la meme
 * chose a des rythmes differents ; la cinquieme est d une autre
 * nature — elle a une fin. Les mettre cote a cote melangeait la
 * question « a quel rythme » et la question « jusqu a quand ».
 *
 * On demande donc d abord la seule chose qui les separe : est-ce que
 * ca revient, ou est-ce que ca se termine. Le rythme se regle ensuite
 * a la grille, et le nombre de fois au compteur.
 */
/* Hissees en constantes de module, et non ecrites en litteral a
   l appel : un tableau neuf a chaque rendu changerait d identite,
   l effet qui en depend se relancerait sans fin, et la saisie en
   cours serait remise a zero a chaque frappe. */
const TOUS_LES_MOIS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const MODES = ['recurrent', 'echeancier'] as const;
type Mode = typeof MODES[number];

const moisCourantISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

interface LigneRecurrenteProps {
  ouvert: boolean;
  onOuvert: (v: boolean) => void;
  type: 'expense' | 'income';
  categories: FinanceCategory[];
  /** Nulle pour une creation. */
  ligne: FinancialItem | null;
  onEnregistrer: (v: ValeursLigne) => Promise<void>;
  enCours?: boolean;
  /* LES MOIS D UNE LIGNE NEUVE.
     La fenetre sert deux entrees qui n ont pas la meme intention. On
     ajoute une depense mensuelle depuis le bloc des mensuelles : douze
     cases cochees, il n y a rien a faire. On ajoute depuis le panneau
     des echeances particulieres precisement parce que ce n est PAS
     mensuel : la grille part vide, et deux clics suffisent.
     C est l entree qui sait, pas la fenetre. */
  moisParDefaut?: number[];
}

export function LigneRecurrente({
  ouvert, onOuvert, type, categories, ligne, onEnregistrer, enCours,
  moisParDefaut = TOUS_LES_MOIS,
}: LigneRecurrenteProps) {
  const { t } = useTranslation();
  const { currency } = useCurrency();

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
  const partsEcheancier = (() => {
    if (!estEcheancier || !Number.isFinite(valeur) || valeur <= 0) return [];
    const total = Math.round(valeur * 100);
    const part = Math.floor(total / nEcheances);
    return Array.from({ length: nEcheances }, (_, i) =>
      (i < nEcheances - 1 ? part : total - part * (nEcheances - 1)) / 100);
  })();

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

  return (
    <Dialog open={ouvert} onOpenChange={onOuvert}>
      <DialogContent className="cy-reg [&>button]:hidden">
        <DialogTitle className="sr-only">
          {ligne ? t('finance.ligne.titreEdition') : t(`finance.ligne.titreAjout.${type}`)}
        </DialogTitle>

        <header className="cy-reg-tete">
          <span className="cy-index" aria-hidden="true">{type === 'expense' ? '−' : '+'}</span>
          <h2 className="cy-nom">
            {ligne ? t('finance.ligne.titreEdition') : t(`finance.ligne.titreAjout.${type}`)}
          </h2>
          <span className="cy-conduite" aria-hidden="true" />
          <button
            type="button"
            className="cy-outil"
            onClick={() => onOuvert(false)}
            aria-label={t('common.cancel')}
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="cy-reg-corps">
          {/* ── La categorie : toutes visibles, avec leur nom ── */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Tag aria-hidden="true" />
              {t('finance.recurring.category')}
            </span>
            <div className="cy-cats" role="radiogroup" aria-label={t('finance.recurring.category')}>
              {categories.map((c) => {
                const Icone = c.icon;
                const choisie = categorie === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={choisie}
                    className="cy-cat"
                    style={{ ['--cy-cat' as string]: c.hexColor }}
                    onClick={() => setCategorie(c.value)}
                  >
                    <Icone aria-hidden="true" />
                    <span>{getCategoryLabel(c, t)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Le libelle ─────────────────────────────────── */}
          <div className="cy-reg-rang">
            <label className="cy-reg-nom" htmlFor="ligne-nom">
              <Type aria-hidden="true" />
              {t('finance.ligne.libelle')}
            </label>
            <div className="cy-reg-champ">
              <input
                id="ligne-nom"
                type="text"
                className="cy-saisie"
                value={nom}
                maxLength={NOM_MAX}
                onChange={(e) => setNom(e.target.value)}
                placeholder={t('finance.recurring.namePlaceholder')}
                autoComplete="off"
              />
            </div>
          </div>

          {/* ── Le montant ─────────────────────────────────── */}
          <div className="cy-reg-rang">
            <label className="cy-reg-nom" htmlFor="ligne-montant">
              <Coins aria-hidden="true" />
              {t('finance.ligne.montant')}
            </label>
            <div className="cy-reg-champ">
              <input
                id="ligne-montant"
                type="text"
                className="cy-saisie"
                inputMode="decimal"
                value={montant}
                onChange={(e) => setMontant(e.target.value.replace(/[^0-9.,]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') enregistrer(); }}
                placeholder="0"
              />
              <b>{getCurrencySymbol(currency)}</b>
            </div>
            <p className="cy-reg-aide">
              {estEcheancier
                ? t('finance.ligne.montantTotalAide', "Le prix payé — l'app répartit sur les échéances.")
                : t('finance.ligne.montantAide')}
            </p>
          </div>

          {/* ── LA CADENCE ─────────────────────────────────
              Une seule question ici, et c est la seule qui separe
              vraiment les deux cas : est-ce que ca revient, ou est-ce
              que ca se termine. Le rythme vient apres, a la grille. */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">
              <Repeat aria-hidden="true" />
              {t('finance.ligne.cadence', 'Cadence')}
            </span>
            <div className="cy-modes" role="radiogroup" aria-label={t('finance.ligne.cadence', 'Cadence')}>
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  className="cy-mode"
                  onClick={() => setMode(m)}
                >
                  <b>{t(`finance.ligne.mode.${m}`, m === 'recurrent' ? 'Elle revient' : 'En plusieurs fois')}</b>
                  <u>
                    {m === 'recurrent'
                      ? t('finance.ligne.mode.recurrentAide', 'un loyer, un abonnement, un impôt')
                      : t('finance.ligne.mode.echeancierAide', 'un achat payé en 3 ou 4 fois')}
                  </u>
                </button>
              ))}
            </div>
          </div>

          {/* LA GRILLE.
              « Tous les trois mois » ne designe aucun mois en
              particulier : il faut bien dire lesquels. On les coche
              plutot que de les deduire d une periode et d une date
              d ancrage — et deux clics suffisent, le second complete
              le motif. */}
          {!estEcheancier && (
            <div className="cy-reg-rang">
              <span className="cy-reg-nom">
                <CalendarClock aria-hidden="true" />
                {t('finance.ligne.quandElleTombe', 'Quand elle tombe')}
              </span>
              <SelecteurDeMois
                mois={moisChoisis}
                onChange={setMoisChoisis}
                moisCourant={new Date().getMonth()}
              />
            </div>
          )}

          {/* LE JOUR, ET LE MOIS OU L ARGENT BOUGE VRAIMENT.
              Un loyer d aout encaisse le 3 septembre n est pas en
              retard : il n a pas encore eu lieu. Sans ce jour, le
              parcours ne peut pas faire la difference entre « pas
              encore » et « manquant », et reproche un oubli a qui n a
              rien oublie. */}
          <div className="cy-reg-rang">
            <label className="cy-reg-nom" htmlFor="ligne-jour">
              <CalendarClock aria-hidden="true" />
              {t('finance.ligne.jourEcheance', 'Le jour où l’argent bouge')}
            </label>
            <div className="cy-jour">
              <label className="cy-reg-champ cy-jour-champ">
                <span>{t('finance.ligne.leJour', 'Le')}</span>
                <input
                  id="ligne-jour"
                  type="text"
                  inputMode="numeric"
                  className="cy-saisie"
                  value={jour}
                  placeholder="—"
                  onChange={(e) => setJour(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                />
              </label>
              <div className="cy-jour-quand" role="radiogroup" aria-label={t('finance.ligne.quelMois', 'Quel mois')}>
                {[0, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={decalage === d}
                    onClick={() => setDecalage(d)}
                  >
                    {d === 0
                      ? t('finance.ligne.ceMoisLa', 'du mois même')
                      : t('finance.ligne.duMoisSuivant', 'du mois suivant')}
                  </button>
                ))}
              </div>
            </div>
            <p className="cy-reg-aide">
              {jour
                ? decalage === 1
                  ? t('finance.ligne.jourAideSuivant', { jour, defaultValue: `Le mois d’août sera compté le ${jour} septembre.` })
                  : t('finance.ligne.jourAideMeme', { jour, defaultValue: `Chaque mois, le ${jour}.` })
                : t('finance.ligne.jourAideVide', 'Facultatif. Sans jour, le parcours ne peut pas distinguer « pas encore » de « manquant ».')}
            </p>
          </div>

          {/* Un echeancier ne se decrit pas par un motif d annee : ses
              echeances se suivent et peuvent franchir le 31 decembre.
              C est donc bien une date qu il lui faut. */}
          {estEcheancier && (
            <div className="cy-reg-rang">
              <label className="cy-reg-nom" htmlFor="ligne-ancre">
                <CalendarClock aria-hidden="true" />
                {t('finance.ligne.premiereEcheance', 'Première échéance')}
              </label>
              <div className="cy-reg-champ">
                <input
                  id="ligne-ancre"
                  type="month"
                  className="cy-saisie"
                  value={ancre}
                  onChange={(e) => setAncre(e.target.value)}
                />
              </div>
            </div>
          )}

          {estEcheancier && (
            <div className="cy-reg-rang">
              <label className="cy-reg-nom" htmlFor="ligne-echeances">
                <Layers aria-hidden="true" />
                {t('finance.ligne.enCombienDeFois', 'En combien de fois')}
              </label>
              <div className="cy-reg-champ">
                <input
                  id="ligne-echeances"
                  type="number"
                  min={2}
                  max={60}
                  className="cy-saisie"
                  value={nbEcheances}
                  onChange={(e) => setNbEcheances(e.target.value)}
                />
                <b>×</b>
              </div>
              {/* Ce qui sera reellement preleve. La derniere echeance
                  absorbe le reste de la division ; on le montre ici
                  plutot que de laisser la surprise au releve. */}
              {partsEcheancier.length > 0 && (
                <p className="cy-echeancier-apercu">
                  {partsEcheancier.map((part, i) => (
                    <span key={i}>
                      {formatCurrency(part, currency)}
                      {i < partsEcheancier.length - 1 && <u aria-hidden="true">·</u>}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

          {/* ── LE LOGO, ET COMMENT IL SE POSE ──────────────
              Televerser ne suffisait pas : limage etait posee de la
              seule facon prevue, et le resultat dependait de la chance
              quon avait eue avec le fichier. */}
          <div className="cy-reg-rang">
            <span className="cy-reg-nom">{t('finance.ligne.icone')}</span>
            <CadreurDImage
              url={urlIcone || null}
              cadre={cadre}
              onUrl={(u) => setUrlIcone(u ?? '')}
              onCadre={setCadre}
              teinte={couleurDe(categorie)}
            />
          </div>
        </div>

        {/* LE REFUS SE DIT, IL NE SE DEVINE PAS.
            Un bouton grise sans explication laisse chercher ce qui
            cloche — et la premiere hypothese est rarement la bonne. */}
        {refus && (
          <p className="cy-reg-refus" role="status">
            <AlertTriangle aria-hidden="true" />
            {t(direLeRefus(refus).cle, direLeRefus(refus).valeurs)}
          </p>
        )}

        <footer className="cy-reg-pied">
          <button type="button" className="cy-reg-annuler" onClick={() => onOuvert(false)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="cy-valider" onClick={enregistrer} disabled={!valide || enCours}>
            <Check aria-hidden="true" />
            {enCours ? '…' : ligne ? t('finance.ligne.enregistrer') : t('finance.ligne.ajouter')}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
