import { Target, ListTodo, Settings, Music, BarChart3, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Goal } from "@/hooks/useGoals";
import type { TodoTask } from "@/hooks/useTodoList";

export type FocusPanel = "config" | "media" | "stats" | "history" | null;

interface FocusToolbarProps {
  goals: Goal[];
  todos: TodoTask[];
  workMin: number;
  onWorkChange: (m: number) => void;
  linkedGoalId: string | null;
  linkedTodoId: string | null;
  onLinkGoal: (id: string | null) => void;
  onLinkTodo: (id: string | null) => void;
  activePanel: FocusPanel;
  onPanelChange: (panel: FocusPanel) => void;
}

const PANNEAUX: { id: Exclude<FocusPanel, null>; cle: string; icone: typeof Settings }[] = [
  { id: "config", cle: "focus.toolbar.config", icone: Settings },
  { id: "media", cle: "focus.toolbar.audio", icone: Music },
  { id: "stats", cle: "focus.toolbar.stats", icone: BarChart3 },
  { id: "history", cle: "focus.toolbar.history", icone: History },
];

/* LE COMPOSEUR DE CLAUSE
 *
 * Les quatre rangees — intitule, objet, tache, duree — flottaient sans
 * cadre ni alignement, et une classe destinee a UNE rangee de champs
 * avait ete posee sur le conteneur DES rangees : elles etaient devenues
 * des elements flex qui s enroulaient, d ou l intitule a gauche, les deux
 * selecteurs a droite, et la quatrieme puce de duree seule sur sa ligne.
 *
 * C est maintenant une plaque : un en-tete, une grille libelle/champ ou
 * tout s aligne sur une meme colonne, et les panneaux repartis en quatre
 * parts egales. La clause se compose ici, et se lit au-dessus, dans le
 * sceau.
 */
export function FocusToolbar({
  goals,
  todos,
  workMin,
  onWorkChange,
  linkedGoalId,
  linkedTodoId,
  onLinkGoal,
  onLinkTodo,
  activePanel,
  onPanelChange,
}: FocusToolbarProps) {
  const { t } = useTranslation();
  const objectifs = goals.filter((g) => g.status === "in_progress" || g.status === "not_started");

  const basculer = (panneau: Exclude<FocusPanel, null>) =>
    onPanelChange(activePanel === panneau ? null : panneau);

  return (
    <section className="sc-composeur" aria-label={t("focus.clause.compose")}>
      <header className="sc-composeur-tete">
        <span aria-hidden="true">◈</span>
        <h2>{t("focus.clause.compose")}</h2>
        <span className="sc-composeur-fil" aria-hidden="true" />
      </header>

      <div className="sc-composeur-corps">
        <div className="sc-ligne">
          <span className="sc-lab" id="lab-objet">{t("focus.field.target")}</span>
          <Select
            value={linkedGoalId || "none"}
            onValueChange={(v) => {
              onLinkGoal(v === "none" ? null : v);
              if (v !== "none") onLinkTodo(null);
            }}
          >
            <SelectTrigger className="cyb-select" aria-labelledby="lab-objet">
              <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <SelectValue placeholder={t("focus.linker.goal")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("focus.linker.noGoal")}</SelectItem>
              {objectifs.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sc-ligne">
          <span className="sc-lab" id="lab-tache">{t("focus.field.task")}</span>
          <Select
            value={linkedTodoId || "none"}
            onValueChange={(v) => {
              onLinkTodo(v === "none" ? null : v);
              if (v !== "none") onLinkGoal(null);
            }}
          >
            <SelectTrigger className="cyb-select" aria-labelledby="lab-tache">
              <ListTodo className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <SelectValue placeholder={t("focus.linker.task")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("focus.linker.noTask")}</SelectItem>
              {todos.map((td) => (
                <SelectItem key={td.id} value={td.id}>{td.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sc-ligne">
          <span className="sc-lab">{t("focus.config.work")}</span>
          <div className="sc-durees" role="group" aria-label={t("focus.config.work")}>
            {[15, 25, 30, 45].map((m) => (
              <button
                key={m}
                type="button"
                className="cyb cyb--petit"
                aria-pressed={workMin === m}
                onClick={() => onWorkChange(m)}
              >
                {m}′
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="sc-panneaux" aria-label={t("focus.clause.compose")}>
        {PANNEAUX.map(({ id, cle, icone: Icone }) => (
          <button
            key={id}
            type="button"
            className={`cyb cyb--petit${activePanel === id ? " est-actif" : ""}`}
            aria-pressed={activePanel === id}
            onClick={() => basculer(id)}
          >
            <Icone className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t(cle)}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
