/**
 * LE PARCOURS DU MOIS.
 *
 * Valider un mois se faisait en deux booleens : « les depenses sont
 * conformes », « les revenus sont conformes ». On declarait donc en
 * bloc, sans jamais dire quelles lignes etaient parties, ni laquelle
 * avait coute autre chose que prevu. Un panneau en bas de page portait
 * cela, et il fallait defiler tout l ecran pour l atteindre.
 *
 * Le parcours prend sa place : on ouvre depuis le bouton du palmares,
 * on coche ligne par ligne, on corrige ce qui n est pas tombe juste,
 * et on valide. Une fois valide, le bouton se ferme — il n y a plus
 * rien a faire, et un bouton qui reste appelant apres coup fait douter
 * d avoir bien fini.
 *
 * CORRIGER : DEUX PORTEES, ET IL FAUT CHOISIR.
 *
 * L essence prevue a 150 qui part a 120 peut vouloir dire deux choses
 * opposees : « ce mois-ci, exceptionnellement » ou « c est 120
 * desormais ». Deviner serait fautif dans les deux sens — corriger la
 * recurrence sur un mois creux la fausserait pour toujours, et ne
 * corriger que le mois laisserait mentir tous les suivants. On demande
 * donc, et les deux boutons disent exactement ce qu ils font.
 *
 * AJOUTER : CE QUI ENTRE ICI SE RECONDUIT.
 *
 * Un prelevement decouvert en pointant est presque toujours un
 * prelevement qui reviendra. On cree donc une vraie ligne recurrente,
 * pointee du meme geste pour le mois en cours.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Plus, Pencil, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import {
  useRecurringExpenses, useRecurringIncome,
  useUpdateRecurringExpense, useUpdateRecurringIncome,
  useAddRecurringExpense, useAddRecurringIncome,
  useMonthlyValidation, useUpsertMonthlyValidation,
} from '@/hooks/useFinance';
import { usePointages, useEcrirePointage, useEffacerPointage } from '@/hooks/usePointages';
import { montantDuMois, tombeEn, dateDeMouvement, dejaPasse } from '@/lib/finance/cadence';
import { lireNom, lireMontant, placeDisponible, direLeRefus } from '@/lib/finance/garde';
import { MarqueCreancier } from './MarqueCreancier';
import { useDateFnsLocale } from '@/i18n/useDateFnsLocale';
import type { FinancialItem } from '@/types/finance';

type Etape = 'expense' | 'income' | 'bilan';
const ETAPES: Etape[] = ['expense', 'income', 'bilan'];

interface Props {
  /** Le premier du mois, au format yyyy-MM-01. */
  mois: string;
  ouvert: boolean;
  onFermer: () => void;
}

/** Une ligne telle qu elle se presente au pointage. */
interface Rang {
  item: FinancialItem;
  prevu: number;
  reel: number;
  pointe: boolean;
  /* LA DATE OU L ARGENT BOUGE, ET S IL A DEJA BOUGE.
     Nulles quand la ligne ne dit pas son jour : on ne peut alors ni
     l affirmer ni le nier, et se taire vaut mieux que supposer. */
  quand: Date | null;
  passe: boolean | null;
}

export function ParcoursDuMois({ mois, ouvert, onFermer }: Props) {
  const { t, i18n } = useTranslation();
  const locale = useDateFnsLocale();
  const { user } = useAuth();
  const { currency } = useCurrency();

  const { data: depenses = [] } = useRecurringExpenses(user?.id);
  const { data: revenus = [] } = useRecurringIncome(user?.id);
  const { data: pointages = [] } = usePointages(user?.id, mois);
  const { data: validation } = useMonthlyValidation(user?.id, mois);

  const ecrire = useEcrirePointage();
  const effacer = useEffacerPointage();
  const majDepense = useUpdateRecurringExpense();
  const majRevenu = useUpdateRecurringIncome();
  const ajoutDepense = useAddRecurringExpense();
  const ajoutRevenu = useAddRecurringIncome();
  const valider = useUpsertMonthlyValidation();

  const [etape, setEtape] = useState<Etape>('expense');
  const [enCorrection, setEnCorrection] = useState<string | null>(null);
  const [saisie, setSaisie] = useState('');
  const [ajout, setAjout] = useState<Etape | null>(null);
  const [nomAjout, setNomAjout] = useState('');
  const [montantAjout, setMontantAjout] = useState('');

  useEffect(() => {
    if (ouvert) { setEtape('expense'); setEnCorrection(null); setAjout(null); }
  }, [ouvert]);

  const dateMois = useMemo(() => parseISO(mois), [mois]);

  /* « 3 sept. » plutot qu une date complete : dans une liste, le mois
     suffit a situer, et l annee encombre. */
  const nommerJour = useMemo(() => {
    const f = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' });
    return (d: Date) => f.format(d).replace('.', '');
  }, [i18n.language]);

  /* CE QU ON POINTE : CE QUI TOMBE CE MOIS-LA.
     Une charge trimestrielle n a rien a faire dans la liste d aout si
     elle tombe en octobre — la cocher n aurait aucun sens, et la
     laisser non cochee ferait croire a un oubli. */
  const rangs = useMemo(() => {
    const parLigne = new Map(pointages.filter((p) => p.ligne_id).map((p) => [p.ligne_id!, p]));
    const construire = (items: FinancialItem[]): Rang[] => items
      .filter((i) => i.is_active && tombeEn(i, dateMois))
      .map((item) => {
        const p = parLigne.get(item.id);
        const prevu = montantDuMois(item, dateMois);
        return {
          item, prevu, reel: p ? p.montant_reel : prevu, pointe: !!p?.pointe,
          quand: dateDeMouvement(item, dateMois),
          passe: dejaPasse(item, dateMois),
        };
      });
    return { expense: construire(depenses), income: construire(revenus) };
  }, [depenses, revenus, pointages, dateMois]);

  const courant = etape === 'income' ? rangs.income : rangs.expense;
  const totalReel = (rs: Rang[]) => Math.round(rs.reduce((s, r) => s + r.reel * 100, 0)) / 100;
  const totalPointe = (rs: Rang[]) => Math.round(rs.filter((r) => r.pointe).reduce((s, r) => s + r.reel * 100, 0)) / 100;

  const basculer = async (r: Rang, genre: Etape) => {
    if (genre === 'bilan') return;
    if (r.pointe) {
      await effacer.mutateAsync({ ligneId: r.item.id, mois });
    } else {
      await ecrire.mutateAsync({
        mois, ligne_id: r.item.id, genre,
        nom: r.item.name, montant_prevu: r.prevu, montant_reel: r.reel, pointe: true,
      });
    }
  };

  /* Tout cocher d un coup : quand le mois s est passe comme prevu — ce
     qui est le cas courant — pointer douze lignes une par une est un
     peage, pas une verification. */
  const toutPointer = async (genre: Etape) => {
    if (genre === 'bilan') return;
    const rs = genre === 'income' ? rangs.income : rangs.expense;
    /* On ne coche que ce qui a eu lieu : cocher une ligne a venir
       inscrirait un mouvement qui na pas eu lieu. */
    for (const r of oubliees(rs)) {
      await ecrire.mutateAsync({
        mois, ligne_id: r.item.id, genre,
        nom: r.item.name, montant_prevu: r.prevu, montant_reel: r.reel, pointe: true,
      });
    }
  };

  const ouvrirCorrection = (r: Rang) => {
    setEnCorrection(r.item.id);
    setSaisie(String(r.reel));
  };

  /* DEUX LECTURES, ET LA DIFFERENCE EST VOULUE.
   *
   * Un POINTAGE a zero a un sens, et un bon : « ce mois-ci, ca n est
   * pas parti ». L interdire obligerait a decocher la ligne, ce qui ne
   * dit pas la meme chose — decoche veut dire « je n ai pas verifie ».
   *
   * Une LIGNE RECURRENTE a zero n en a pas : elle ne coute rien, ne
   * rapporte rien, et encombre la liste. « Desormais » ecrit dans cette
   * colonne-la, et doit donc etre plus severe que « Ce mois-ci ». Les
   * deux boutons ne partagent pas la meme regle, et c est normal :
   * ils n ecrivent pas au meme endroit. */
  const pourLeMois = () => lireMontant(saisie, { zeroAdmis: true });
  const pourLaRecurrence = () => lireMontant(saisie);

  const refuser = (raison: Parameters<typeof direLeRefus>[0]) => {
    const { cle, valeurs } = direLeRefus(raison);
    toast.error(t(cle, valeurs));
  };

  /** Corriger ce mois-ci : le pointage porte le vrai montant. */
  const corrigerLeMois = async (r: Rang, genre: Etape) => {
    const lu = pourLeMois();
    if (!lu.ok) return refuser(lu.raison);
    const v = lu.valeur;
    if (genre === 'bilan') return;
    await ecrire.mutateAsync({
      mois, ligne_id: r.item.id, genre,
      nom: r.item.name, montant_prevu: r.prevu, montant_reel: v, pointe: true,
    });
    setEnCorrection(null);
  };

  /** Corriger desormais : la recurrence change, et ce mois avec elle. */
  const corrigerDesormais = async (r: Rang, genre: Etape) => {
    const lu = pourLaRecurrence();
    if (!lu.ok) return refuser(lu.raison);
    const v = lu.valeur;
    if (genre === 'bilan') return;
    const maj = genre === 'income' ? majRevenu : majDepense;
    await maj.mutateAsync({ id: r.item.id, amount: v });
    await ecrire.mutateAsync({
      mois, ligne_id: r.item.id, genre,
      nom: r.item.name, montant_prevu: v, montant_reel: v, pointe: true,
    });
    setEnCorrection(null);
    toast.success(t('finance.parcours.recurrenceMaj', { nom: r.item.name, defaultValue: `${r.item.name} vaut ${v} désormais.` }));
  };

  const ajouter = async (genre: Etape) => {
    if (genre === 'bilan') return;

    /* LE PLAFOND VAUT ICI AUSSI.
       Il n etait verifie qu a l ajout depuis un bloc : on pouvait donc
       depasser trente lignes en passant par le parcours, ce qui n est
       pas un choix mais un oubli. */
    const place = placeDisponible((genre === 'income' ? revenus : depenses).length);
    if (!place.ok) return refuser(place.raison);

    const luNom = lireNom(nomAjout);
    if (!luNom.ok) return refuser(luNom.raison);
    const luMontant = lireMontant(montantAjout);
    if (!luMontant.ok) return refuser(luMontant.raison);
    const v = luMontant.valeur;

    const creer = genre === 'income' ? ajoutRevenu : ajoutDepense;
    /* Sans identifiant, useUpsert insere et rend la ligne creee : son
       id sert immediatement a pointer le mois en cours. Mensuelle par
       defaut, parce qu un prelevement decouvert en pointant est
       presque toujours un prelevement qui reviendra — c est tout le
       sens de « et tous les mois ». */
    const cree = await creer.mutateAsync({
      name: luNom.valeur,
      amount: v,
      periode_mois: 1,
      mois_ancre: null,
      is_active: true,
    });
    if (cree?.id) {
      await ecrire.mutateAsync({
        mois, ligne_id: cree.id, genre,
        nom: luNom.valeur, montant_prevu: v, montant_reel: v, pointe: true,
      });
    }
    setNomAjout(''); setMontantAjout(''); setAjout(null);
  };

  /* CE QUI RESTE N EST PAS CE QUI MANQUE.
   *
   * Une ligne non pointee dont l argent n a pas encore bouge n est pas
   * un oubli : le loyer d aout encaisse le 3 septembre ne peut pas
   * etre coche le 21 aout. Les compter ensemble faisait reprocher un
   * retard a qui n avait rien oublie — et poussait a cocher pour faire
   * taire le compteur, ce qui est exactement ce qu un pointage ne doit
   * pas encourager.
   *
   * On les separe donc : « a venir » d un cote, « oubliees » de
   * l autre, et seules les secondes appellent une action. */
  const aVenir = (rs: Rang[]) => rs.filter((r) => !r.pointe && r.passe === false);
  const oubliees = (rs: Rang[]) => rs.filter((r) => !r.pointe && r.passe !== false);

  const reelDepenses = totalPointe(rangs.expense);
  const reelRevenus = totalPointe(rangs.income);
  const restant = (rs: Rang[]) => oubliees(rs).length;

  const conclure = async () => {
    try {
      await valider.mutateAsync({
        month: mois,
        confirmed_expenses: restant(rangs.expense) === 0,
        confirmed_income: restant(rangs.income) === 0,
        unplanned_expenses: 0,
        unplanned_income: 0,
        actual_total_income: reelRevenus,
        actual_total_expenses: reelDepenses,
        validated_at: new Date().toISOString(),
      });
      toast.success(t('finance.monthly.monthValidated'));
      onFermer();
    } catch {
      toast.error(t('finance.monthly.validationFailed'));
    }
  };

  /* ═══════════════════════════════════════════════════════════
     UN CALQUE QUI SE DIT MODAL DOIT L ETRE

     Il portait deja role="dialog" et aria-modal="true" — une promesse
     que rien ne tenait. Trois manques, tous du meme ordre :

       LE FOND DEFILAIT. Un calque plein ecran par-dessus une page qui
       continue de rouler donne l impression que le clic a rate. On
       verrouille le corps, en compensant la largeur de la barre de
       defilement : sans cette compensation, toute la page saute de
       quinze pixels a l ouverture.

       ECHAP NE FERMAIT PAS, et rien non plus au clic sur les marges.
       Ce sont les deux sorties qu on essaie d instinct devant un
       calque, et leur absence donne le sentiment d etre coince.

       LE FOCUS S ECHAPPAIT. Trois tabulations et l on pilotait la page
       de dessous, invisible. Pour un lecteur d ecran, aria-modal
       promettait exactement le contraire.

     Et l on rend le focus a ce qui a ouvert le parcours : revenir
     ailleurs qu au bouton qu on vient de quitter desoriente.
     ═══════════════════════════════════════════════════════════ */
  const calque = useRef<HTMLDivElement | null>(null);
  const departHorsPanneau = useRef(false);

  useEffect(() => {
    if (!ouvert) return;
    const rendreLeFocusA = document.activeElement as HTMLElement | null;

    const debordement = document.body.style.overflow;
    const compensation = document.body.style.paddingRight;
    const largeurBarre = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (largeurBarre > 0) document.body.style.paddingRight = `${largeurBarre}px`;

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onFermer(); return; }
      if (e.key !== 'Tab' || !calque.current) return;
      /* Le piege : on ramene la tabulation au premier element quand
         elle sort par la fin, et au dernier quand elle sort par le
         debut. */
      const cibles = calque.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!cibles.length) return;
      const premier = cibles[0];
      const dernier = cibles[cibles.length - 1];
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    };
    document.addEventListener('keydown', auClavier, true);

    return () => {
      document.body.style.overflow = debordement;
      document.body.style.paddingRight = compensation;
      document.removeEventListener('keydown', auClavier, true);
      rendreLeFocusA?.focus?.();
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  const indexEtape = ETAPES.indexOf(etape);
  const genreCourant: Etape = etape;

  const contenu = (
    <motion.div
      ref={calque}
      className="cy-parc"
      onPointerDown={(e) => { departHorsPanneau.current = e.target === e.currentTarget; }}
      onClick={(e) => {
        if (departHorsPanneau.current && e.target === e.currentTarget) onFermer();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label={t('finance.parcours.titre', 'Valider le mois')}
    >
      <header className="cy-parc-tete">
        <span className="cy-parc-mois">{format(dateMois, 'MMMM yyyy', { locale })}</span>
        <h2>{t('finance.parcours.titre', 'Valider le mois')}</h2>
        <ol className="cy-parc-fil">
          {ETAPES.map((e, i) => (
            <li key={e} data-etat={i < indexEtape ? 'fait' : i === indexEtape ? 'ici' : 'a-venir'}>
              {t(`finance.parcours.etape.${e}`, e)}
            </li>
          ))}
        </ol>
        <button type="button" className="cy-parc-fermer" onClick={onFermer} aria-label={t('common.cancel')}>
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="cy-parc-corps">
        {etape !== 'bilan' ? (
          <>
            <div className="cy-parc-consigne">
              <p>
                {etape === 'expense'
                  ? t('finance.parcours.consigneDepenses', 'Coche ce qui est bien parti. Corrige ce qui n’est pas tombé juste.')
                  : t('finance.parcours.consigneRevenus', 'Coche ce qui est bien rentré. Corrige ce qui n’est pas tombé juste.')}
              </p>
              <span className="cy-parc-compte">
                {t('finance.parcours.pointees', {
                  faits: courant.filter((r) => r.pointe).length,
                  total: courant.length,
                  defaultValue: `${courant.filter((r) => r.pointe).length} / ${courant.length}`,
                })}
              </span>
              {aVenir(courant).length > 0 && (
                <span className="cy-parc-avenir-compte">
                  {t('finance.parcours.aVenir', {
                    count: aVenir(courant).length,
                    defaultValue: `${aVenir(courant).length} pas encore arrivée(s)`,
                  })}
                </span>
              )}

              {restant(courant) > 0 && (
                <button type="button" className="cy-parc-tout" onClick={() => toutPointer(genreCourant)}>
                  <Check aria-hidden="true" />
                  {t('finance.parcours.toutPointer', 'Tout cocher')}
                </button>
              )}
            </div>

            <ul className="cy-parc-liste">
              {courant.map((r) => {
                const corrige = Math.abs(r.reel - r.prevu) >= 0.005;
                const enCours = enCorrection === r.item.id;
                return (
                  <li
                    key={r.item.id}
                    className="cy-parc-rang"
                    data-pointe={r.pointe ? '1' : '0'}
                    data-avenir={!r.pointe && r.passe === false ? '1' : '0'}
                  >
                    <button
                      type="button"
                      className="cy-parc-case"
                      role="checkbox"
                      aria-checked={r.pointe}
                      onClick={() => basculer(r, genreCourant)}
                      aria-label={r.item.name}
                    >
                      {r.pointe && <Check aria-hidden="true" />}
                    </button>

                    <MarqueCreancier
                      nom={r.item.name}
                      iconUrl={r.item.icon_url}
                      categorie={r.item.category}
                      cadre={r.item.icon_cadre}
                      taille={30}
                    />

                    <span className="cy-parc-nom">
                      {r.item.name}
                      {/* L echeance, dite seulement quand elle apprend
                          quelque chose : une ligne deja passee n a pas
                          besoin de rappeler sa date. */}
                      {r.passe === false && r.quand && (
                        <u className="cy-parc-avenir">
                          {t('finance.parcours.prevuLe', {
                            date: nommerJour(r.quand),
                            defaultValue: `prévu le ${nommerJour(r.quand)}`,
                          })}
                        </u>
                      )}
                    </span>

                    {enCours ? (
                      <div className="cy-parc-correction">
                        <label className="cy-parc-champ">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={saisie}
                            autoFocus
                            onChange={(e) => setSaisie(e.target.value.replace(/[^0-9.,]/g, ''))}
                            aria-label={t('finance.parcours.montantReel', 'Montant réel')}
                          />
                          <b>{getCurrencySymbol(currency)}</b>
                        </label>
                        {/* Les deux portees, dites en toutes lettres.
                            Deviner serait fautif dans les deux sens. */}
                        <button type="button" onClick={() => corrigerLeMois(r, genreCourant)} disabled={!pourLeMois().ok}>
                          {t('finance.parcours.ceMoisSeulement', 'Ce mois-ci')}
                        </button>
                        <button type="button" className="cy-parc-desormais" onClick={() => corrigerDesormais(r, genreCourant)} disabled={!pourLaRecurrence().ok}>
                          {t('finance.parcours.desormais', 'Désormais')}
                        </button>
                        <button type="button" className="cy-parc-annuler" onClick={() => setEnCorrection(null)} aria-label={t('common.cancel')}>
                          <X aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="cy-parc-montant" data-corrige={corrige ? '1' : '0'}>
                          {corrige && <s>{formatCurrency(r.prevu, currency)}</s>}
                          {formatCurrency(r.reel, currency)}
                        </span>
                        <button
                          type="button"
                          className="cy-parc-corriger"
                          onClick={() => ouvrirCorrection(r)}
                          title={t('finance.parcours.corriger', 'Corriger le montant')}
                          aria-label={t('finance.parcours.corriger', 'Corriger le montant')}
                        >
                          <Pencil aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}

              {courant.length === 0 && (
                <li className="cy-parc-vide">
                  {t('finance.parcours.rien', 'Rien ne tombe ce mois-ci de ce côté.')}
                </li>
              )}
            </ul>

            {ajout === etape ? (
              <div className="cy-parc-ajout">
                <input
                  type="text"
                  value={nomAjout}
                  autoFocus
                  onChange={(e) => setNomAjout(e.target.value)}
                  placeholder={t('finance.parcours.nomNouveau', 'Nom du paiement')}
                  aria-label={t('finance.parcours.nomNouveau', 'Nom du paiement')}
                />
                <label className="cy-parc-champ">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={montantAjout}
                    onChange={(e) => setMontantAjout(e.target.value.replace(/[^0-9.,]/g, ''))}
                    placeholder="0"
                    aria-label={t('finance.ligne.montant')}
                  />
                  <b>{getCurrencySymbol(currency)}</b>
                </label>
                <button type="button" onClick={() => ajouter(genreCourant)}>
                  <Check aria-hidden="true" />
                  {t('finance.parcours.ajouterEtReconduire', 'Ajouter — et tous les mois')}
                </button>
                <button type="button" className="cy-parc-annuler" onClick={() => setAjout(null)} aria-label={t('common.cancel')}>
                  <X aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button type="button" className="cy-parc-ouvrir-ajout" onClick={() => setAjout(etape)}>
                <Plus aria-hidden="true" />
                {t('finance.parcours.ajouter', 'Ajouter un paiement oublié')}
              </button>
            )}
          </>
        ) : (
          <div className="cy-parc-bilan">
            <p className="cy-parc-consigne">
              {t('finance.parcours.consigneBilan', 'Voici ce que le mois a réellement coûté.')}
            </p>
            <dl className="cy-parc-comptes">
              <div>
                <dt>{t('finance.monthly.income', 'Revenus')}</dt>
                <dd data-signe="plus">{formatCurrency(reelRevenus, currency)}</dd>
                <u>{t('finance.parcours.surN', { n: rangs.income.length, defaultValue: `sur ${rangs.income.length}` })}</u>
              </div>
              <div>
                <dt>{t('finance.monthly.expenses', 'Dépenses')}</dt>
                <dd data-signe="moins">{formatCurrency(reelDepenses, currency)}</dd>
                <u>{t('finance.parcours.surN', { n: rangs.expense.length, defaultValue: `sur ${rangs.expense.length}` })}</u>
              </div>
              <div className="cy-parc-solde">
                <dt>{t('finance.monthly.monthlyBalance', 'Solde du mois')}</dt>
                <dd data-signe={reelRevenus - reelDepenses >= 0 ? 'plus' : 'moins'}>
                  {formatCurrency(reelRevenus - reelDepenses, currency)}
                </dd>
              </div>
            </dl>

            {/* On ne bloque pas sur une ligne non pointee : un
                prelevement peut n avoir pas encore eu lieu, et forcer a
                cocher pour pouvoir clore ferait cocher a tort. On le
                dit, et on laisse decider. */}
            {(restant(rangs.expense) > 0 || restant(rangs.income) > 0) && (
              <p className="cy-parc-reserve">
                {t('finance.parcours.reste', {
                  n: restant(rangs.expense) + restant(rangs.income),
                  defaultValue: `${restant(rangs.expense) + restant(rangs.income)} ligne(s) non cochée(s) — elles ne comptent pas dans le total.`,
                })}
              </p>
            )}

            {validation?.validated_at && (
              <p className="cy-parc-deja">
                <CheckCircle2 aria-hidden="true" />
                {t('finance.parcours.dejaValide', 'Ce mois était déjà validé — valider à nouveau le corrigera.')}
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="cy-parc-pied">
        {indexEtape > 0 ? (
          <button type="button" className="cy-parc-retour" onClick={() => setEtape(ETAPES[indexEtape - 1])}>
            <ArrowLeft aria-hidden="true" />
            {t('common.back', 'Retour')}
          </button>
        ) : <span />}

        <span className="cy-parc-total">
          {etape !== 'bilan' && (
            <>
              {t('finance.parcours.totalPointe', 'Pointé')}
              <strong>{formatCurrency(totalPointe(courant), currency)}</strong>
              <u>{t('finance.parcours.surTotal', { total: formatCurrency(totalReel(courant), currency), defaultValue: `sur ${formatCurrency(totalReel(courant), currency)}` })}</u>
            </>
          )}
        </span>

        {etape === 'bilan' ? (
          <button type="button" className="cy-parc-conclure" onClick={conclure} disabled={valider.isPending}>
            {valider.isPending ? <Loader2 className="cy-tourne" aria-hidden="true" /> : <Check aria-hidden="true" />}
            {t('finance.palmares.validerLeMois', 'Valider le mois')}
          </button>
        ) : (
          <button type="button" className="cy-parc-suite" onClick={() => setEtape(ETAPES[indexEtape + 1])}>
            {t('common.next', 'Suivant')}
            <ArrowRight aria-hidden="true" />
          </button>
        )}
      </footer>
    </motion.div>
  );

  /* Porte sur le corps du document : sans cela, la barre laterale et
     son z-index passeraient devant. */
  return createPortal(<AnimatePresence>{contenu}</AnimatePresence>, document.body);
}
