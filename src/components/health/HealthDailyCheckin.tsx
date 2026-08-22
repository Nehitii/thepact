import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { ClipboardCheck, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/contexts/AuthContext";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { useHealthByDate, useHealthSettings, useUpsertHealthData } from "@/hooks/useHealth";
import { cleDuJour, laVeille } from "@/lib/health/journee";
import "@/styles/health.css";

/* ═══════════════════════════════════════════════════════════════
   LE RELEVE, A DEUX VITESSES

   Sept ecrans a enchainer chaque matin, quinze champs, et une langue
   graphique qui n etait plus celle de la page. Rattraper treize jours,
   c etait quatre-vingt-onze ecrans.

   Avant de discuter du nombre d etapes, on a regarde a quoi sert chaque
   champ. Sur quinze : dix nourrissent Analytics ou le rythme suggere,
   trois ne ressortent que dans l export CSV, et mood_journal — « qu
   as-tu en tete ? » — n etait lu par personne, pas meme par l export.
   Ce qu on y ecrivait tombait dans le vide ; il est retire, le module
   Journal faisant deja cela avec un editeur et une recherche.

   LE RELEVE RAPIDE TIENT SUR UN ECRAN. Six champs — ceux qui nourrissent
   Analytics et la suggestion de rythme. Trente secondes.

   LE DETAIL EST UN SUPPLEMENT, PAS UNE SECONDE MOITIE. On valide sans
   jamais l ouvrir et le releve compte. La courbe d energie d Analytics
   s affiche donc les jours ou le pli a ete ouvert, et se tait les
   autres — plus honnete qu une courbe faite de valeurs par defaut.

   ET RIEN N EST PRESELECTIONNE. Chaque champ partait d une valeur
   inventee : sommeil a sept heures, tout le reste a trois. Enchainer
   les etapes sans rien toucher inscrivait quinze mesures imaginaires
   comme si elles avaient ete constatees. Une journee finie SE RACONTE.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La journee relevee. La veille par defaut. */
  date?: string;
}

const CHAMPS = [
  "sleep_quality", "mood_level", "stress_level", "activity_level",
  "hydration_glasses", "mental_load",
  "energy_morning", "energy_afternoon", "energy_evening",
  "sleep_hours", "wake_energy", "movement_minutes", "meal_balance",
] as const;

type Champ = (typeof CHAMPS)[number];
type Valeurs = Record<Champ, number | null>;

const VIDE: Valeurs = CHAMPS.reduce((o, c) => ({ ...o, [c]: null }), {} as Valeurs);

export function HealthDailyCheckin({ open, onOpenChange, date }: Props) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const { user } = useAuth();

  const { data: settings } = useHealthSettings(user?.id);
  const cible = date ?? cleDuJour(laVeille());
  const { data: existant } = useHealthByDate(user?.id, cible);
  const upsert = useUpsertHealthData(user?.id);

  const [valeurs, setValeurs] = useState<Valeurs>(VIDE);
  const [notes, setNotes] = useState("");
  const [detailOuvert, setDetailOuvert] = useState(false);

  useEffect(() => {
    if (!existant) return;
    const rempli = { ...VIDE };
    for (const c of CHAMPS) {
      const v = (existant as unknown as Record<string, number | null>)[c];
      rempli[c] = v ?? null;
    }
    setValeurs(rempli);
    setNotes(existant.notes ?? "");
    /* Si la journee porte deja du detail, on ouvre le pli : sinon on
       cacherait a l utilisateur ce qu il a lui-meme saisi. */
    const detail: Champ[] = ["energy_morning", "energy_afternoon", "energy_evening",
      "sleep_hours", "wake_energy", "movement_minutes", "meal_balance"];
    if (detail.some((c) => rempli[c] !== null)) setDetailOuvert(true);
  }, [existant]);

  const poser = (champ: Champ, valeur: number | null) =>
    /* Recliquer sur le cran deja choisi le relache : on peut defaire
       une erreur sans avoir a fermer la fenetre. */
    setValeurs((v) => ({ ...v, [champ]: v[champ] === valeur ? null : valeur }));

  const qualite = useMemo(() => [
    t("health.checkin.quality.poor"), t("health.checkin.quality.fair"),
    t("health.checkin.quality.okay"), t("health.checkin.quality.good"),
    t("health.checkin.quality.great"),
  ], [t]);

  const tension = useMemo(() => [
    t("health.checkin.stress.minimal"), t("health.checkin.stress.low"),
    t("health.checkin.stress.moderate"), t("health.checkin.stress.high"),
    t("health.checkin.stress.overwhelming"),
  ], [t]);

  const humeur = useMemo(() => [
    t("health.mood.veryLow"), t("health.mood.low"), t("health.mood.neutral"),
    t("health.mood.good"), t("health.mood.great"),
  ], [t]);

  const VISAGES = ["\u{1F614}", "\u{1F615}", "\u{1F610}", "\u{1F642}", "\u{1F60A}"];

  /* Des fonctions, pas des composants : un composant defini dans le
     rendu est remonte a chaque frappe, et le champ perd son focus. */
  const echelle = (champ: Champ, libelles: string[], visages?: string[]) => (
    <div className="hlt-crans" role="group" aria-label={libelles.join(", ")}>
      {libelles.map((libelle, i) => (
        <button
          key={libelle}
          type="button"
          className="hlt-cran"
          aria-pressed={valeurs[champ] === i + 1}
          onClick={() => poser(champ, i + 1)}
        >
          {visages && <em aria-hidden="true">{visages[i]}</em>}
          {libelle}
        </button>
      ))}
    </div>
  );

  const nombre = (champ: Champ, min: number, max: number, pas: number, unite: string, defaut: number) => (
    <div className="hlt-nombre">
      <span>
        <Slider
          value={[valeurs[champ] ?? defaut]}
          onValueChange={(v) => setValeurs((x) => ({ ...x, [champ]: v[0] }))}
          min={min} max={max} step={pas}
          aria-label={unite}
        />
      </span>
      <b data-vide={valeurs[champ] === null ? "1" : "0"}>
        {valeurs[champ] === null ? "—" : valeurs[champ]}
        <i>{unite}</i>
      </b>
    </div>
  );

  const champ = (titre: string, controle: React.ReactNode, aide?: string) => (
    <div className="hlt-champ">
      <u>{titre}</u>
      {controle}
      {aide && <s>{aide}</s>}
    </div>
  );

  const enregistrer = async () => {
    await upsert.mutateAsync({
      entry_date: cible,
      ...valeurs,
      notes: notes || null,
    } as unknown as Parameters<typeof upsert.mutateAsync>[0]);
    onOpenChange(false);
  };

  const dejaReleve = Boolean(existant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="hlt hlt-fenetre max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("health.dailyCheckin")}</DialogTitle>
        </DialogHeader>

        <div className="hlt-releve-tete">
          {format(parseISO(cible), "EEEE d MMMM", { locale })}
          <b data-fait={dejaReleve ? "1" : "0"}>
            {dejaReleve ? t("health.checkin.logged", "relevé") : t("health.checkin.notLogged", "non relevé")}
          </b>
        </div>

        <p className="hlt-releve-q">{t("health.log.todo")}</p>

        {/* LES SIX QUI COMPTENT. Ce sont exactement ceux que lisent
            Analytics et la suggestion de rythme. */}
        <div className="hlt-grille">
          {champ(t("health.metrics.sleepQuality"), echelle("sleep_quality", qualite))}
          {champ(t("health.metrics.activityLevel"), echelle("activity_level", qualite))}
          {champ(t("health.mood.title"), echelle("mood_level", humeur, VISAGES))}
          {champ(t("health.checkin.stressLevel"), echelle("stress_level", tension))}
          {champ(t("health.metrics.mentalLoad"), echelle("mental_load", tension))}
          {champ(
            t("health.checkin.hydrationLevel"),
            nombre("hydration_glasses", 0, 16, 1, t("health.settings.glasses"), 4),
            `${t("health.settings.hydrationGoal")} ${settings?.hydration_goal_glasses || 8}`,
          )}
        </div>

        <button
          type="button"
          className="hlt-pli"
          aria-expanded={detailOuvert}
          onClick={() => setDetailOuvert((v) => !v)}
        >
          <span>
            {t("health.checkin.detail", "Le détail")} — {t("common.optional")}
          </span>
          <b>
            {detailOuvert ? t("health.checkin.fold", "Replier") : t("health.checkin.unfold", "Déplier")}
            <ChevronDown
              aria-hidden="true"
              style={{
                width: 12, height: 12, display: "inline", marginLeft: 6, verticalAlign: -2,
                transform: detailOuvert ? "rotate(180deg)" : "none",
              }}
            />
          </b>
        </button>

        {detailOuvert && (
          <div className="hlt-pli-corps">
            <div>
              <div className="hlt-section">{t("health.checkin.sectionEnergy", "L’énergie, dans la journée")}</div>
              <div className="hlt-grille" data-colonnes="3">
                {champ(t("health.energy.morning"), echelle("energy_morning", ["1", "2", "3", "4", "5"]))}
                {champ(t("health.energy.afternoon"), echelle("energy_afternoon", ["1", "2", "3", "4", "5"]))}
                {champ(t("health.energy.evening"), echelle("energy_evening", ["1", "2", "3", "4", "5"]))}
              </div>
            </div>

            <div>
              <div className="hlt-section">{t("health.checkin.sectionSleep", "Le sommeil")}</div>
              <div className="hlt-grille">
                {champ(t("health.metrics.sleepHours"), nombre("sleep_hours", 0, 12, 0.5, t("health.settings.hours"), 7))}
                {champ(t("health.metrics.wakeEnergy"), echelle("wake_energy", qualite))}
              </div>
            </div>

            <div>
              <div className="hlt-section">{t("health.checkin.sectionBody", "Le corps")}</div>
              <div className="hlt-grille">
                {champ(t("health.metrics.movementMinutes"), nombre("movement_minutes", 0, 180, 5, t("health.settings.minutes"), 30))}
                {settings?.show_nutrition && champ(t("health.metrics.mealBalance"), echelle("meal_balance", qualite))}
              </div>
            </div>

            <div>
              <div className="hlt-section">{t("health.checkin.todaysNotes")}</div>
              <textarea
                className="hlt-mot"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("health.checkin.notesPlaceholder")}
                aria-label={t("health.checkin.todaysNotes")}
              />
            </div>
          </div>
        )}

        <div className="hlt-releve-pied">
          <button type="button" className="hlt-bouton" disabled={upsert.isPending} onClick={enregistrer}>
            <ClipboardCheck aria-hidden="true" />
            {upsert.isPending ? t("common.saving") : t("health.log.open")}
          </button>
          <span className="hlt-note-champ">
            {t("health.checkin.emptyStays", "Un champ laissé vide reste vide")}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
