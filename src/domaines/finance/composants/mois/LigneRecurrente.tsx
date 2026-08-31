import { useEffect, useState } from 'react';
import { moisLocal } from "@/socle/outils/jour";
import { useTranslation } from 'react-i18next';
import { Check, Tag, Type, Coins, X, Repeat, CalendarClock, Layers, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/socle/outils/currency';
import { Dialog, DialogContent, DialogTitle } from '@/socle/ui/dialog';
import { useCurrency } from '@/socle/contextes/CurrencyContext';
import { getCurrencySymbol } from '@/socle/outils/currency';
import { getCategoryLabel, type FinanceCategory } from '@/domaines/finance/logique/categories';
import { CadreurDImage } from '../CadreurDImage';
import { normaliserCadre, cadreAEnregistrer, CADRE_PAR_DEFAUT, type CadreImage } from '@/domaines/finance/logique/cadre';
import { couleurDe } from '@/domaines/finance/logique/marque';
import { lireNom, lireMontant, direLeRefus, NOM_MAX } from '@/domaines/finance/logique/garde';
import { useFormulaireDeLigne } from "@/domaines/finance/hooks/useFormulaireDeLigne";
import { SelecteurDeMois } from './SelecteurDeMois';
import { moisDeChute, motifDepuisMois } from '@/domaines/finance/logique/cadence';
import type { FinancialItem } from '@/domaines/finance/types';
import type { ValeursLigne } from "@/domaines/finance/types";
/* Reexporte : deux tableaux de bord l importaient d ici. */
export type { ValeursLigne };

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

const moisCourantISO = () => moisLocal();

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

  /* La machine a etats vit dans `hooks/useFormulaireDeLigne.ts` :
     onze champs, la relecture de la cadence enregistree, les regles
     de refus, et l apercu de l echeancier. Ce qui reste ici est le
     rendu. */
  const f = useFormulaireDeLigne({ ouvert, ligne, categories, moisParDefaut, onEnregistrer, onOuvert, enCours });
  const {
    nom, setNom, montant, setMontant, categorie, setCategorie,
    urlIcone, setUrlIcone, cadre, setCadre, mode, setMode,
    moisChoisis, setMoisChoisis, ancre, setAncre, nbEcheances, setNbEcheances,
    jour, setJour, decalage, setDecalage,
    estEcheancier, motif, nEcheances, valeur, valide, refus, partsEcheancier,
    enregistrer,
  } = f;

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
