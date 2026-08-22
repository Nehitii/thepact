import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  useRecurringExpenses,
  useRecurringIncome,
  useAddRecurringExpense,
  useAddRecurringIncome,
  useUpdateRecurringExpense,
  useUpdateRecurringIncome,
  useDeleteRecurringExpense,
  useDeleteRecurringIncome,
} from '@/hooks/useFinance';
import { format, startOfMonth } from 'date-fns';
import { totalDuMois, provisionMensuelle, tombeEn } from '@/lib/finance/cadence';
import { etatDuMois, peutModifier } from '@/lib/finance/moisAffiche';
import { CorrigerLeMois } from './CorrigerLeMois';
import { placeDisponible, LIGNES_MAX } from '@/lib/finance/garde';
import { LigneRecurrente, type ValeursLigne } from './LigneRecurrente';
import { EcheancesParticulieres } from './EcheancesParticulieres';
import type { FinancialItem } from '@/types/finance';
import { toast } from 'sonner';
import { MonthlyBalanceHero } from './MonthlyBalanceHero';
import { MoisPalmares } from './MoisPalmares';
import { FinancialBlock } from './FinancialBlock';
import { ParcoursDuMois } from './ParcoursDuMois';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  calculateActiveTotal,
} from '@/lib/financeCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMonthlyValidation, useUpsertMonthlyValidation, useFinanceSettings, useMonthlyValidations } from '@/hooks/useFinance';

interface MonthlyDashboardProps {
  salaryPaymentDay: number;
  /** Ce qu il reste a financer : le palmares en tire la part versee. */
  restantPacte: number;
}

/* Le panneau des echeances particulieres ouvre la fenetre de saisie
   sur une grille vide : on y ajoute une ligne precisement parce qu elle
   n est pas mensuelle. Constante de module, sinon le tableau neuf a
   chaque rendu relancerait l effet de la fenetre sans fin. */
const AUCUN_MOIS: number[] = [];

/* Une charge est « particuliere » des qu elle ne tombe pas chaque
   mois : une cadence longue, ou un nombre d echeances. C est la meme
   frontiere que celle du calcul, ce qui evite d en inventer une
   seconde.

   Elle vit hors du composant parce qu elle ne capture rien : la
   redeclarer a chaque rendu la rendait instable pour rien, et
   compliquait les dependances de ce qui s en sert. */
const estMensuelle = (l: { periode_mois?: number | null; echeances?: number | null }) =>
  (l.periode_mois ?? 1) === 1 && l.echeances == null;

export function MonthlyDashboard({ salaryPaymentDay, restantPacte }: MonthlyDashboardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { data: finSettings } = useFinanceSettings(user?.id);

  const { data: expenses = [], isLoading: expensesLoading } = useRecurringExpenses(user?.id);
  const { data: income = [], isLoading: incomeLoading } = useRecurringIncome(user?.id);

  const addExpense = useAddRecurringExpense();
  const addIncome = useAddRecurringIncome();
  const updateExpense = useUpdateRecurringExpense();
  const updateIncome = useUpdateRecurringIncome();
  const deleteExpense = useDeleteRecurringExpense();
  const deleteIncome = useDeleteRecurringIncome();
  const upsertValidation = useUpsertMonthlyValidation();

  // Editing past month state

  /* LE PARCOURS REMPLACE LE PANNEAU DU BAS.
   *
   * Valider se faisait dans un module en pied de page : le bouton du
   * palmares n etait qu un ascenseur, il fallait defiler tout l ecran,
   * et le module restait la une fois le mois valide, sans plus rien a
   * dire. Le bouton ouvre desormais le parcours lui-meme.
   *
   * Le mois en cours par defaut, mais l etat porte un mois : cliquer
   * une case de la frise du palmares ouvre le parcours de ce mois-la,
   * ce qui remplace l historique en pied de page. */
  const [moisAPointer, setMoisAPointer] = useState<string | null>(null);

  /* DEUX LECTURES, ET ELLES NE DISENT PAS LA MEME CHOSE.
   *
   * Le total du mois est la tresorerie : ce qui part reellement ce
   * mois-ci. Une assurance annuelle pese six cents euros le mois ou
   * elle tombe et rien les onze autres — la ou, avant, elle gonflait
   * chaque mois de six cents. C est lui qui commande le solde, parce
   * que c est lui qui repond a « ai-je de quoi ce mois-ci ».
   *
   * La provision repond a une autre question — « combien mettre de
   * cote pour absorber ce qui vient » — et ne se melange donc pas au
   * total. Six cents euros annuels valent cinquante euros de
   * provision.
   */
  /* LE MOIS QU ON REGARDE N EST PAS LE MOIS QU ON VIT.
   *
   * La page ne connaissait qu une date : aujourd hui. Regarder octobre
   * n etait donc pas possible — la frise ne savait qu ouvrir le
   * pointage, ce qui repondait a une question qu on ne posait pas.
   *
   * Deux dates desormais. « aujourdHui » ancre ce qui appartient au
   * present : la serie, le rattrapage, le droit de modifier. Et
   * « moisAffiche » commande tout ce qui se lit : soldes, listes, poche.
   */
  const aujourdHui = useMemo(() => new Date(), []);
  const [moisAffiche, setMoisAffiche] = useState(() => startOfMonth(new Date()));

  const { data: validations = [] } = useMonthlyValidations(user?.id);
  const validationAffichee = useMemo(
    () => validations.find((v) => v.month.slice(0, 7) === format(moisAffiche, 'yyyy-MM')),
    [validations, moisAffiche],
  );
  const etat = etatDuMois(moisAffiche, aujourdHui, !!validationAffichee?.validated_at);
  /* Une ligne recurrente vaut pour les douze mois : la modifier depuis
     octobre reecrirait janvier. Le verrou n est donc pas une precaution,
     c est ce qui empeche un geste dont la portee ne se voit pas. */
  const verrouille = !peutModifier(etat);

  /* LE CONSTATE PREND LE PAS SUR LE PREVU.
     Un mois valide a ete pointe ligne a ligne : ses totaux sont des
     faits. Continuer d afficher la prevision effacerait justement ce
     que le pointage avait servi a etablir. */
  const totalExpenses = etat === 'valide'
    ? (validationAffichee?.actual_total_expenses ?? 0)
    : totalDuMois(expenses, moisAffiche);
  const totalIncome = etat === 'valide'
    ? (validationAffichee?.actual_total_income ?? 0)
    : totalDuMois(income, moisAffiche);

  /* DEUX PANNEAUX, PARCE QUE CE NE SONT PAS LES MEMES CHARGES.
   *
   * Les mensuelles se ressemblent : meme montant, tous les mois, on
   * les lit comme un bloc. Un impot foncier de cinq cent cinquante-
   * quatre euros preleve quatre fois par an n a rien a faire au milieu
   * d un abonnement a sept euros — il ecrase la liste onze mois sur
   * douze sans y peser, et le douzieme il la fait mentir.
   *
   * Une charge est « particuliere » des qu elle ne tombe pas chaque
   * mois : une cadence longue, ou un nombre d echeances. C est la
   * meme frontiere que celle du calcul, ce qui evite d en inventer
   * une seconde. */
  const depensesParticulieres = useMemo(() => expenses.filter((l) => !estMensuelle(l)), [expenses]);

  /* MAIS LE MOIS OU ELLE TOMBE, UNE CHARGE PARTICULIERE EST DU MOIS.
   *
   * L exclure toute l annee revenait a mentir douze fois pour eviter
   * de deranger onze fois. Le mois ou PayPal se preleve, il se
   * preleve : il doit figurer dans la liste qu on lit pour savoir ce
   * qu on paie, au meme titre que le loyer.
   *
   * La regle est donc temporelle et non structurelle : la liste
   * montre CE QUI TOMBE CE MOIS-CI. Une trimestrielle y parait quatre
   * fois par an et disparait le reste du temps — ce qui est
   * exactement ce qu elle fait sur le compte en banque.
   *
   * Le panneau des echeances particulieres, lui, garde toute l annee :
   * il repond a « qu est-ce qui m attend », pas a « que dois-je ce
   * mois-ci ». Les deux questions sont distinctes, et une charge peut
   * legitimement apparaitre dans les deux. */
  /* LE CALCUL ETAIT JUSTE, MAIS RIEN NE LE GARANTISSAIT. tombeCeMois
     etait recreee a chaque rendu et absente des dependances des deux
     memos ; ceux-ci listaient moisAffiche, qui se trouve etre
     exactement ce que la fonction capture. Vrai par coincidence : lui
     ajouter une dependance aurait fige les listes sans un bruit.
     Declaree en useCallback, la relation devient verifiable — et le
     linter la verifie. */
  const tombeCeMois = useCallback(
    (l: FinancialItem) => estMensuelle(l) || tombeEn(l, moisAffiche),
    [moisAffiche],
  );
  const depensesDuMois = useMemo(
    () => expenses.filter(tombeCeMois),
    [expenses, tombeCeMois],
  );
  const revenusDuMois = useMemo(
    () => income.filter(tombeCeMois),
    [income, tombeCeMois],
  );

  const poche = provisionMensuelle(depensesParticulieres);

  /* Le panneau particulier a besoin de la meme fenetre de saisie que
     les blocs. Elle est montee ici plutot que dupliquee dedans : une
     seule fenetre, un seul comportement. */
  /* Rouvrir un mois clos se demande, se confirme, et n arrive donc
     jamais par megarde. */
  const [moisACorriger, setMoisACorriger] = useState<string | null>(null);
  const [fenetreParticuliere, setFenetreParticuliere] = useState(false);
  const [ligneParticuliere, setLigneParticuliere] = useState<FinancialItem | null>(null);


  /* La cadence part avec le reste : c est un champ de la ligne, pas
     un reglage a cote. */
  const versLaBase = (v: ValeursLigne) => ({
    name: v.name,
    amount: v.amount,
    /* ?? null PARTOUT, ET PAS SEULEMENT SUR L IMAGE.
       Le client Supabase OMET les cles a undefined : un champ vide
       n effacait donc pas la valeur en base, il la laissait
       intacte. Retirer un logo ne fonctionnait pas pour cette raison,
       et une categorie ou une emoji retiree se serait tue de la meme
       facon. Dire null, c est dire « efface ». */
    category: v.category ?? null,
    icon_emoji: v.iconEmoji ?? null,
    icon_url: v.iconUrl ?? null,
    icon_cadre: v.iconCadre ?? null,
    periode_mois: v.periodeMois ?? 1,
    mois_ancre: v.moisAncre ?? null,
    jour_echeance: v.jourEcheance ?? null,
    decalage_mois: v.decalageMois ?? 0,
    echeances: v.echeances ?? null,
    montant_total: v.montantTotal ?? null,
  });

  const handleAddExpense = async (v: ValeursLigne) => {
    if (!placeDisponible(expenses.length).ok) { toast.error(t('finance.garde.tropDeLignes', { lignesMax: LIGNES_MAX })); return; }
    try { await addExpense.mutateAsync(versLaBase(v)); toast.success(t('finance.recurring.expenseAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleAddIncome = async (v: ValeursLigne) => {
    if (!placeDisponible(income.length).ok) { toast.error(t('finance.garde.tropDeLignes', { lignesMax: LIGNES_MAX })); return; }
    try { await addIncome.mutateAsync(versLaBase(v)); toast.success(t('finance.recurring.incomeAdded')); }
    catch { toast.error(t('finance.recurring.addFailed')); }
  };

  const handleUpdateExpense = async (id: string, v: ValeursLigne) => {
    try { await updateExpense.mutateAsync({ id, ...versLaBase(v) }); toast.success(t('finance.recurring.expenseUpdated')); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleUpdateIncome = async (id: string, v: ValeursLigne) => {
    try { await updateIncome.mutateAsync({ id, ...versLaBase(v) }); toast.success(t('finance.recurring.incomeUpdated')); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleToggleExpense = async (id: string, isActive: boolean) => {
    try { await updateExpense.mutateAsync({ id, is_active: isActive }); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  const handleToggleIncome = async (id: string, isActive: boolean) => {
    try { await updateIncome.mutateAsync({ id, is_active: isActive }); }
    catch { toast.error(t('finance.recurring.updateFailed')); }
  };

  return (
    <div className="space-y-8">
      <MonthlyBalanceHero
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        poche={poche}
      />

      <MoisPalmares
        netPrevu={totalIncome - totalExpenses}
        restantPacte={restantPacte}
        expenses={expenses}
        income={income}
        moisAffiche={moisAffiche}
        etat={etat}
        onChoisirMois={setMoisAffiche}
        onPointer={() => setMoisAPointer(format(moisAffiche, 'yyyy-MM-01'))}
        onCorriger={() => setMoisACorriger(format(moisAffiche, 'yyyy-MM-01'))}
        onRevenirAuMoisCourant={() => setMoisAffiche(startOfMonth(new Date()))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <FinancialBlock
            title={t('finance.recurring.expensesOfMonth', 'Dépenses du mois')}
            type="expense"
            items={depensesDuMois}
            moisCourant={moisAffiche}
            verrouille={verrouille}
            categories={EXPENSE_CATEGORIES}
            isLoading={expensesLoading}
            onAdd={handleAddExpense}
            onUpdate={handleUpdateExpense}
            onDelete={(id) => deleteExpense.mutate(id)}
            onToggleActive={handleToggleExpense}
            isPending={addExpense.isPending}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <FinancialBlock
            title={t('finance.recurring.incomeOfMonth', 'Revenus du mois')}
            type="income"
            items={revenusDuMois}
            moisCourant={moisAffiche}
            verrouille={verrouille}
            categories={INCOME_CATEGORIES}
            isLoading={incomeLoading}
            onAdd={handleAddIncome}
            onUpdate={handleUpdateIncome}
            onDelete={(id) => deleteIncome.mutate(id)}
            onToggleActive={handleToggleIncome}
            isPending={addIncome.isPending}
          />
        </motion.div>
      </div>

      {/* Ce qui ne tombe pas tous les mois, et la poche qu il
          demande. Le panneau ne parait que s il a quelque chose a
          dire : un pacte sans charge particuliere n a pas a porter un
          cadre vide. */}
      {depensesParticulieres.length > 0 && (
        <EcheancesParticulieres
          items={depensesParticulieres}
          onAdd={() => { setLigneParticuliere(null); setFenetreParticuliere(true); }}
          onEdit={(item) => { setLigneParticuliere(item); setFenetreParticuliere(true); }}
          onDelete={(id) => deleteExpense.mutate(id)}
          onToggleActive={handleToggleExpense}
        />
      )}

      <LigneRecurrente
        ouvert={fenetreParticuliere}
        onOuvert={setFenetreParticuliere}
        type="expense"
        categories={EXPENSE_CATEGORIES}
        ligne={ligneParticuliere}
        moisParDefaut={AUCUN_MOIS}
        onEnregistrer={async (v) => {
          if (ligneParticuliere) await handleUpdateExpense(ligneParticuliere.id, v);
          else await handleAddExpense(v);
        }}
        enCours={addExpense.isPending || updateExpense.isPending}
      />

      <CorrigerLeMois
        mois={moisACorriger}
        onAnnuler={() => setMoisACorriger(null)}
        onConfirmer={async () => {
          const mois = moisACorriger;
          setMoisACorriger(null);
          if (!mois) return;
          try {
            await upsertValidation.mutateAsync({ month: mois, validated_at: null });
            toast.success(t('finance.palmares.moisRouvert', 'Le mois est rouvert.'));
          } catch { toast.error(t('finance.recurring.updateFailed')); }
        }}
      />

      {/* Le parcours du mois. Porte hors de larbre, il recouvre lecran :
          valider est un geste qui merite toute la page, et non un
          module en pied de liste quon atteint en defilant. */}
      {moisAPointer && (
        <ParcoursDuMois
          mois={moisAPointer}
          ouvert
          onFermer={() => setMoisAPointer(null)}
        />
      )}
    </div>
  );
}
