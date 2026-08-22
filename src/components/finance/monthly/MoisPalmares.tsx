import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Flame, Lock, Rocket, Trophy,
} from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { useMonthlyValidations } from '@/hooks/useFinance';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';
import { totalDuMois, montantDuMois, tombeEn } from '@/lib/finance/cadence';
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
  /* OUVRE LE PARCOURS D UN MOIS.
      Le bouton n etait qu un ascenseur vers un module en pied de page :
      il fallait defiler tout l ecran pour valider, et le module restait
      la une fois le mois fait, sans plus rien a dire. Il ouvre
      desormais le parcours lui-meme.

      La frise s en sert aussi : cliquer une case ouvre le parcours de
      ce mois-la. C est ce qui permet de retirer l historique en pied de
      page — un an de tenue, et chaque case est sa propre porte. */
  onOuvrirParcours: (mois: string) => void;
}

const CASES = 12;

/** Une charge est « particuliere » des qu elle ne tombe pas chaque mois. */
const estMensuelle = (l: FinancialItem) =>
  (l.periode_mois ?? 1) === 1 && l.echeances == null;

export function MoisPalmares({
  netPrevu, restantPacte, expenses, income, onOuvrirParcours,
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

  /* Le mois en cours : c est lui que le panneau plus bas valide, et
     c est lui qui fera monter la serie affichee juste au-dessus. */
  const moisCourant = format(startOfMonth(new Date()), 'yyyy-MM');
  const validationCourante = validations.find((v) => v.month.slice(0, 7) === moisCourant);
  const moisValide = !!validationCourante?.validated_at;

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
        premier: format(d, 'yyyy-MM-01'),
        lettre: format(d, 'MMM', { locale }).slice(0, 1).toUpperCase(),
        libelle: format(d, 'MMM yyyy', { locale }),
        solde,
        reel,
        valide,
        encours,
        passe,
        surcharge,
      };
    });
  }, [annee, valides, validations, expenses, income, particulieres, locale]);

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
            onClick={() => onOuvrirParcours(m.premier)}
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
      <div className="cy-palm-appel" data-fait={moisValide ? '1' : '0'}>
{moisValide ? (
          <>
            <p>
              <CheckCircle2 aria-hidden="true" />
              {t('finance.palmares.moisValide', { mois: format(new Date(), 'MMMM', { locale }) })}
            </p>
            {/* VERROUILLE, ET NON DISPARU.
                Un bouton qui s efface une fois le geste fait laisse
                croire qu on ne peut plus revenir dessus. Il reste, dit
                qu il n y a plus rien a faire, et rouvre quand meme —
                une erreur de pointage se corrige. */}
            <button
              type="button"
              className="cy-palm-refaire"
              onClick={() => onOuvrirParcours(format(startOfMonth(new Date()), 'yyyy-MM-01'))}
            >
              <Lock aria-hidden="true" />
              {t('finance.palmares.revoirLeMois', 'Revoir')}
            </button>
          </>
        ) : (
          <>
            <p>
              <Flame aria-hidden="true" />
              {t('finance.palmares.moisAValider', { mois: format(new Date(), 'MMMM', { locale }) })}
            </p>
            <button
              type="button"
              onClick={() => onOuvrirParcours(format(startOfMonth(new Date()), 'yyyy-MM-01'))}
            >
              {t('finance.palmares.validerLeMois')}
              <ArrowRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
