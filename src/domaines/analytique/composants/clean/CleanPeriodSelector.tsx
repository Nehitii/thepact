import type { AnalyticsPeriod } from "@/domaines/analytique/composants/PeriodSelector";

/* Selecteur de periode.
 *
 * Deux choses ont ete corrigees ici.
 *
 * Le scintillement : la pastille active etait un motion.span porteur d'un
 * layoutId. A chaque changement de periode la page repassait en chargement,
 * le selecteur etait demonte, et l'animation partagee redemarrait de zero —
 * d'ou le flash. La pastille est desormais un fond CSS : il n'y a plus rien
 * a animer entre deux montages. L'autre moitie du correctif est dans
 * useAnalytics, ou keepPreviousData empeche le demontage.
 *
 * Les libelles : "30 derniers jours" etalait le selecteur sur toute la
 * largeur de l'en-tete. Un releve technique est terse.
 */

interface Props {
  value: AnalyticsPeriod;
  onChange: (v: AnalyticsPeriod) => void;
}

const OPTIONS: { value: AnalyticsPeriod; label: string; titre: string }[] = [
  { value: "30d", label: "30J", titre: "30 derniers jours" },
  { value: "90d", label: "90J", titre: "3 derniers mois" },
  { value: "6m", label: "6M", titre: "6 derniers mois" },
  { value: "all", label: "TOUT", titre: "Depuis le début" },
];

export function CleanPeriodSelector({ value, onChange }: Props) {
  return (
    <div role="tablist" aria-label="Période" className="cp-periode">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={opt.value === value}
          title={opt.titre}
          onClick={() => onChange(opt.value)}
          className="cp-periode-seg"
          data-actif={opt.value === value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
