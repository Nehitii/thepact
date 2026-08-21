import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Flame, Lock, Rocket, Trophy } from 'lucide-react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';
import { useMonthlyValidations } from '@/hooks/useFinance';

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
 */

interface MoisPalmaresProps {
  /** Le solde des lignes recurrentes : ce que le mois devrait verser. */
  netPrevu: number;
  /** Ce qu il reste a financer sur le pacte. */
  restantPacte: number;
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

export function MoisPalmares({ netPrevu, restantPacte, onOuvrirParcours }: MoisPalmaresProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: validations = [] } = useMonthlyValidations(user?.id);

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

  const bande = useMemo(() => {
    const debut = startOfMonth(new Date());
    return Array.from({ length: CASES }, (_, i) => {
      const d = subMonths(debut, CASES - 1 - i);
      const cle = format(d, 'yyyy-MM');
      const v = validations.find((x) => x.month.slice(0, 7) === cle);
      const solde = v ? (v.actual_total_income ?? 0) - (v.actual_total_expenses ?? 0) : null;
      return {
        cle,
        premier: format(d, 'yyyy-MM-01'),
        lettre: format(d, 'MMM').slice(0, 1).toUpperCase(),
        libelle: format(d, 'MMM yyyy'),
        solde,
        valide: valides.has(cle),
        encours: cle === format(debut, 'yyyy-MM'),
      };
    });
  }, [valides, validations]);

  const versement = Math.max(0, netPrevu);
  const part = restantPacte > 0 ? Math.min(100, (versement / restantPacte) * 100) : 0;
  const rythme = versement > 0 && restantPacte > 0 ? Math.ceil(restantPacte / versement) : null;

  const lectures = [
    {
      cle: 'versement',
      icone: Rocket,
      valeur: formatCurrency(versement, currency),
      aide: t('finance.palmares.versementAide', { pct: part.toFixed(1) }),
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
      <div className="cy-palm-bande" role="group" aria-label={t('finance.palmares.bandeAide', { count: valides.size })}>
        {bande.map((m, i) => (
          <motion.button
            key={m.cle}
            type="button"
            data-valide={m.valide ? '1' : '0'}
            data-encours={m.encours ? '1' : '0'}
            title={m.solde !== null
              ? `${m.libelle} — ${formatCurrency(m.solde, currency)}`
              : t('finance.palmares.ouvrirMois', { mois: m.libelle, defaultValue: m.libelle })}
            aria-label={t('finance.palmares.ouvrirMois', { mois: m.libelle, defaultValue: m.libelle })}
            onClick={() => onOuvrirParcours(m.premier)}
            initial={{ opacity: 0, scaleY: 0.4 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: 0.2 + i * 0.03, duration: 0.26 }}
          >
            <u>{m.lettre}</u>
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
              {t('finance.palmares.moisValide', { mois: format(new Date(), 'MMMM') })}
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
              {t('finance.palmares.moisAValider', { mois: format(new Date(), 'MMMM') })}
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
