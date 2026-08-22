import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight,
  CornerUpLeft, Eye, Flame, Lock, Rocket, Trophy,
} from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { useMonthlyValidations } from '@/hooks/useFinance';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';
import { totalDuMois, montantDuMois, tombeEn } from '@/lib/finance/cadence';
import { peutPointer, estLeMoisCourant, type EtatDuMois } from '@/lib/finance/moisAffiche';
import type { FinancialItem } from '@/types/finance';

/* LE PALMARES DU MOIS
 *
 * Le mois etait une comptabilite : deux colonnes de lignes et un
 * solde. Il ne disait jamais a quoi il servait.
 *
 * Trois lectures le rattachent au pacte, et toutes les trois sortent
 * de donnees reelles — rien n est decoratif :
 *
 *   LE VERSEMENT  ce que ce mois donne au pacte, et la part que cela
 *                 represente de ce qui reste a trouver ;
 *   LA SERIE      les mois valides d affilee, comptes en base ;
 *   LE RYTHME     a ce solde, le nombre de mois avant de boucler.
 *
 * Et une bande de douze cases : un an de tenue, d un coup d oeil. Le
 * mois en cours ne casse pas la serie tant qu il n est pas fini — on
 * ne valide pas un mois qui n a pas eu lieu.
 *
 * LA BANDE REGARDE DEVANT, PAS SEULEMENT DERRIERE.
 *
 * Elle montrait les douze DERNIERS mois : un registre, tourne vers le
 * passe. On y lisait ce qu on avait tenu, jamais ce qui arrivait — et
 * c est pourtant la question qu on se pose en regardant ses comptes.
 *
 * Elle couvre donc l ANNEE CIVILE, de janvier a decembre. La moitie
 * gauche reste un registre : les mois valides gardent leur solde
 * REEL, celui qu on a constate en pointant. La moitie droite devient
 * une prevision : ce que le mois pesera si rien ne change.
 *
 * LES DEUX NE SE MELANGENT PAS. Un solde constate et un solde suppose
 * ne valent pas la meme chose, et les confondre ferait croire a une
 * tenue qu on n a pas. Les cases a venir sont donc marquees comme
 * telles, et leur chiffre se lit comme une annonce, pas comme un
 * resultat.
 *
 * UN MOIS CHARGE SE VOIT AVANT D Y ETRE.
 *
 * Octobre porte les deux coproprietes et la derniere echeance PayPal —
 * neuf cent cinquante-quatre euros de plus qu un mois ordinaire. Le
 * savoir en aout change ce qu on fait en septembre. La case le dit.
 *
 * ET L ANNEE SE CHANGE, parce qu une annee civile enferme : en
 * janvier, tout le registre de l an passe sortirait du cadre. Les
 * fleches le ramenent — meme geste que le calendrier des echeances,
 * qui les a deja pour la meme raison.
 */

interface MoisPalmaresProps {
  /** Le solde des lignes recurrentes : ce que le mois devrait verser. */
  netPrevu: number;
  /** Ce qu il reste a financer sur le pacte. */
  restantPacte: number;
  /** Les lignes, pour prevoir le poids des mois a venir. */
  expenses: FinancialItem[];
  income: FinancialItem[];
  /* LA FRISE CHOISIT, ELLE N OUVRE PLUS.
      Chaque case etait une porte vers le pointage — pour un mois clos
      comme pour un mois qui n avait pas eu lieu. On cliquait donc pour
      REGARDER et on se retrouvait a VALIDER.
      Une case designe desormais le mois que la page affiche. Le
      pointage redevient un geste volontaire, propose ci-dessous et
      seulement quand le mois se pointe. */
  moisAffiche: Date;
  etat: EtatDuMois;
  onChoisirMois: (mois: Date) => void;
  onPointer: () => void;
  onCorriger: () => void;
  onRevenirAuMoisCourant: () => void;
}

const CASES = 12;

/** Une charge est « particuliere » des qu elle ne tombe pas chaque mois. */
const estMensuelle = (l: FinancialItem) =>
  (l.periode_mois ?? 1) === 1 && l.echeances == null;

export function MoisPalmares({
  netPrevu, restantPacte, expenses, income,
  moisAffiche, etat, onChoisirMois, onPointer, onCorriger, onRevenirAuMoisCourant,
}: MoisPalmaresProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: validations = [] } = useMonthlyValidations(user?.id);
  /* Sans locale, date-fns rend « Jul 2026 » dans une interface
     francaise. Le hook existe : il suffisait de s en servir. */
  const locale = useDateFnsLocale();

  /* L annee regardee. On ouvre sur celle en cours — c est la reponse a
     « et apres ? », qui est la question du jour. */
  const [annee, setAnnee] = useState(() => new Date().getFullYear());

  /* Quand le mois affiche change par un autre chemin que la frise — le
     retour au mois courant, par exemple — la frise doit le suivre,
     sinon elle designe une case invisible. */
  useEffect(() => { setAnnee(moisAffiche.getFullYear()); }, [moisAffiche]);

  const valides = useMemo(
    () => new Set(validations.filter((v) => v.validated_at).map((v) => v.month.slice(0, 7))),
    [validations],
  );

  const serie = useMemo(() => {
    let n = 0;
    let curseur = startOfMonth(new Date());
    /* Le mois en cours n a pas encore eu lieu : son absence ne compte
       pas contre la serie. */
    if (!valides.has(format(curseur, 'yyyy-MM'))) curseur = subMonths(curseur, 1);
    while (valides.has(format(curseur, 'yyyy-MM'))) {
      n++;
      curseur = subMonths(curseur, 1);
    }
    return n;
  }, [valides]);

  /* Les charges qui ne tombent pas chaque mois : ce sont elles qui
     font les mois lourds, et elles seules meritent l alerte. */
  const particulieres = useMemo(() => expenses.filter((l) => !estMensuelle(l)), [expenses]);

  const bande = useMemo(() => {
    const cleCourante = format(startOfMonth(new Date()), 'yyyy-MM');
    return Array.from({ length: CASES }, (_, i) => {
      const d = new Date(annee, i, 1);
      const cle = format(d, 'yyyy-MM');
      const v = validations.find((x) => x.month.slice(0, 7) === cle);
      const valide = valides.has(cle);
      const encours = cle === cleCourante;
      const choisi = cle === format(moisAffiche, 'yyyy-MM');
      const passe = cle < cleCourante;

      /* LE REEL D ABORD, LA PREVISION ENSUITE.
         Un mois valide a un solde CONSTATE : c est celui qu on montre,
         meme s il s ecarte de ce que la cadence prevoyait — c est
         justement l ecart qui a de la valeur.
         Un mois passe sans validation n a rien a dire : on ne va pas
         lui inventer un resultat apres coup.
         Le reste — le mois en cours et ceux d apres — se calcule. */
      const reel = valide && !!v;
      const solde = reel
        ? (v.actual_total_income ?? 0) - (v.actual_total_expenses ?? 0)
        : passe
          ? null
          : totalDuMois(income, d) - totalDuMois(expenses, d);

      /* Ce que le mois porte d exceptionnel, et qui le rend lourd. */
      const surcharge = particulieres
        .filter((l) => tombeEn(l, d))
        .reduce((s, l) => s + montantDuMois(l, d), 0);

      return {
        cle,
        date: d,
        premier: format(d, 'yyyy-MM-01'),
        lettre: format(d, 'MMM', { locale }).slice(0, 1).toUpperCase(),
        libelle: format(d, 'MMM yyyy', { locale }),
        solde,
        reel,
        valide,
        encours,
        choisi,
        passe,
        surcharge,
      };
    });
  }, [annee, valides, validations, expenses, income, particulieres, locale, moisAffiche]);

  /* LA PHRASE ET SON ICONE, PAR ETAT.
     Chacune dit la situation ET sa consequence : « rien n est
     modifiable » vaut mieux qu un bouton absent sans explication. */
  const nomDuMoisAffiche = format(moisAffiche, 'MMMM', { locale });
  const nomDuMoisCourant = format(new Date(), 'MMMM', { locale });
  const estCourant = estLeMoisCourant(moisAffiche, new Date());

  const [Icone, phrase] = ((): [typeof Flame, string] => {
    switch (etat) {
      case 'valide':
        return [CheckCircle2, t('finance.palmares.moisValide', { mois: nomDuMoisAffiche })];
      case 'venir':
        return [Eye, t('finance.palmares.moisAVenir', {
          mois: nomDuMoisAffiche,
          defaultValue: `${nomDuMoisAffiche} n’a pas encore eu lieu — prévisionnel, rien n’est modifiable.`,
        })];
      case 'retard':
        return [AlertTriangle, t('finance.palmares.moisEnRetard', {
          mois: nomDuMoisAffiche,
          defaultValue: `${nomDuMoisAffiche} n’a jamais été validé.`,
        })];
      default:
        return [Flame, t('finance.palmares.moisAValider', { mois: nomDuMoisAffiche })];
    }
  })();

  const versement = Math.max(0, netPrevu);
  const part = restantPacte > 0 ? Math.min(100, (versement / restantPacte) * 100) : 0;
  const rythme = versement > 0 && restantPacte > 0 ? Math.ceil(restantPacte / versement) : null;

  const lectures = [
    {
      cle: 'versement',
      icone: Rocket,
      valeur: formatCurrency(versement, currency),
      /* toFixed rend « 7.0 » dans une interface francaise, ou le
         separateur decimal est la virgule. */
      aide: t('finance.palmares.versementAide', {
        pct: part.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      }),
    },
    {
      cle: 'serie',
      icone: Flame,
      valeur: t('finance.palmares.serieValeur', { count: serie }),
      aide: t('finance.palmares.serieAide'),
    },
    {
      cle: 'rythme',
      icone: Trophy,
      valeur: rythme === null ? '—' : t('finance.palmares.rythmeValeur', { count: rythme }),
      aide: rythme === null ? t('finance.palmares.rythmeVide') : t('finance.palmares.rythmeAide'),
    },
  ];

  return (
    <section className="cy-palm" aria-label={t('finance.palmares.titre')}>
      <div className="cy-palm-grille">
        {lectures.map(({ cle, icone: Icone, valeur, aide }, i) => (
          <motion.div
            key={cle}
            className="cy-palm-lect"
            data-cle={cle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="cy-palm-nom">
              <Icone aria-hidden="true" />
              {t(`finance.palmares.${cle}`)}
            </span>
            <strong>{valeur}</strong>
            <em>{aide}</em>
          </motion.div>
        ))}
      </div>

{/* DOUZE CASES : UN AN DE TENUE, ET DOUZE PORTES.
          Elles ne faisaient que montrer. Un module d historique en pied
          de page portait la meme information en plus long, avec un
          bouton pour rouvrir un mois — deux endroits pour une seule
          chose, et le plus discret etait le mieux place. Les cases
          ouvrent donc le parcours du mois qu elles designent, et
          l historique disparait. */}
      {/* L ANNEE, ET SES DEUX FLECHES.
          Elles ne sont pas un ornement : une annee civile enferme, et
          sans elles le registre de l an passe deviendrait inatteignable
          des le 1er janvier. */}
      <div className="cy-palm-annee">
        <button
          type="button"
          onClick={() => setAnnee((a) => a - 1)}
          aria-label={t('finance.palmares.anneePrecedente', { annee: annee - 1, defaultValue: String(annee - 1) })}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <b>{annee}</b>
        <button
          type="button"
          onClick={() => setAnnee((a) => a + 1)}
          aria-label={t('finance.palmares.anneeSuivante', { annee: annee + 1, defaultValue: String(annee + 1) })}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      {/* La bande ne couvre plus « les douze derniers mois » mais une
          annee datee : son resume doit compter DANS cette annee, sinon
          il annonce un total qui ne correspond a rien de visible. */}
      <div
        className="cy-palm-bande"
        role="group"
        aria-label={t('finance.palmares.bandeAide', {
          count: bande.filter((m) => m.valide).length,
          annee,
        })}
      >
        {bande.map((m, i) => (
          <motion.button
            key={m.cle}
            type="button"
            data-valide={m.valide ? '1' : '0'}
            data-encours={m.encours ? '1' : '0'}
            /* « Aujourd hui » et « ce que je regarde » sont deux
               notions differentes qui partageaient la meme case. */
            data-choisi={m.choisi ? '1' : '0'}
            aria-current={m.choisi ? 'true' : undefined}
            /* Un solde constate et un solde suppose ne se lisent pas
               pareil : la case le dit, le style s en sert. */
            data-reel={m.reel ? '1' : '0'}
            data-avenir={!m.passe && !m.encours ? '1' : '0'}
            data-charge={m.surcharge > 0 ? '1' : '0'}
            title={[
              m.libelle,
              m.solde === null
                ? null
                : `${m.reel ? '' : '≈ '}${formatCurrency(m.solde, currency)}`,
              m.surcharge > 0
                ? t('finance.palmares.moisCharge', {
                    montant: formatCurrency(m.surcharge, currency),
                    defaultValue: `dont ${formatCurrency(m.surcharge, currency)} de charges particulières`,
                  })
                : null,
            ].filter(Boolean).join(' — ')}
            aria-label={t('finance.palmares.ouvrirMois', { mois: m.libelle, defaultValue: m.libelle })}
            onClick={() => onChoisirMois(m.date)}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.2 + i * 0.03, duration: 0.26 }}
          >
            <u>{m.lettre}</u>
            {/* Le point qui previent. Il ne porte pas de chiffre : la
                case est trop petite pour en lire un, et l infobulle le
                donne. Il dit seulement « regarde ce mois-la ». */}
            {m.surcharge > 0 && <i className="cy-palm-alerte" aria-hidden="true" />}
          </motion.button>
        ))}
      </div>

      {/* La boucle se ferme ici : c est la validation qui fait monter
          la serie, elle ne doit pas etre a deux ecrans de son chiffre. */}
      {/* LA BARRE D ETAT DU MOIS AFFICHE.
          Elle disait toujours la meme chose du mois courant, meme
          quand on en regardait un autre : deux appels a l action se
          contredisaient. Elle parle desormais du mois qu on regarde,
          dit ou l on est, et ne propose que ce qui est permis. */}
      <div className="cy-palm-appel" data-etat={etat}>
        <p>
          <Icone aria-hidden="true" />
          {phrase}
        </p>

        <div className="cy-palm-gestes">
          {!estCourant && (
            <button type="button" className="cy-palm-retour" onClick={onRevenirAuMoisCourant}>
              <CornerUpLeft aria-hidden="true" />
              {t('finance.palmares.revenirAuMois', { mois: nomDuMoisCourant, defaultValue: nomDuMoisCourant })}
            </button>
          )}

          {/* VERROUILLE, ET NON DISPARU.
              Un mois clos ne se remodifie pas — mais un pointage se
              fait a la main, donc il se trompe. Sans issue, une coche
              erronee fausserait le palmares pour toujours. La porte
              existe, elle demande confirmation, et elle est la seule. */}
          {etat === 'valide' && (
            <button type="button" className="cy-palm-refaire" onClick={onCorriger}>
              <Lock aria-hidden="true" />
              {t('finance.palmares.corrigerLeMois', 'Corriger ce mois')}
            </button>
          )}

          {peutPointer(etat) && (
            <button type="button" onClick={onPointer}>
              {etat === 'cours'
                ? t('finance.palmares.validerLeMois')
                : t('finance.palmares.pointerLeMois', { mois: nomDuMoisAffiche, defaultValue: `Pointer ${nomDuMoisAffiche}` })}
              <ArrowRight aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
