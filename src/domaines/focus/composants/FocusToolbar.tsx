import type { ReactNode } from "react";
import { Target, ListTodo, Settings, Music, BarChart3, History, Link2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FocusPanels } from "./FocusPanels";
import type { Goal } from "@/hooks/useGoals";
import type { TodoTask } from "@/hooks/useTodoList";
import type { ObjetClause } from "@/domaines/focus/types";

export type FocusPanel = "config" | "media" | "stats" | "history" | null;

interface FocusToolbarProps {
  goals: Goal[];
  todos: TodoTask[];
  workMin: number;
  onWorkChange: (m: number) => void;
  /* Un seul emplacement : deux champs a l ecran, mais une seule valeur
     derriere. Choisir dans l un vide l autre parce que le modele n a
     qu une place, pas parce qu un gestionnaire y pense. */
  objet: ObjetClause;
  onObjetChange: (o: ObjetClause) => void;
  activePanel: FocusPanel;
  onPanelChange: (panel: FocusPanel) => void;
  /** Les quatre panneaux, dans l ordre des onglets. */
  panneaux: { id: Exclude<FocusPanel, null>; contenu: ReactNode }[];
}

const ONGLETS: { id: Exclude<FocusPanel, null>; cle: string; icone: typeof Settings }[] = [
  { id: "config", cle: "focus.toolbar.config", icone: Settings },
  { id: "media", cle: "focus.toolbar.audio", icone: Music },
  { id: "stats", cle: "focus.toolbar.stats", icone: BarChart3 },
  { id: "history", cle: "focus.toolbar.history", icone: History },
];

/* LA PLAQUE D AVANT-SEANCE
 *
 * Les panneaux s ajoutaient SOUS le composeur : la page s allongeait et
 * il fallait defiler pour voir ce qu on venait d ouvrir. Or composer la
 * clause et regler le son sont deux surfaces d avant-seance — on n a
 * jamais besoin des deux a la fois.
 *
 * Une seule plaque, donc, dont le CORPS glisse : la clause, puis les
 * quatre panneaux, sur la meme piste. L en-tete nomme ce qui est dessous
 * et la rangee d onglets reste en bas. La page ne grandit plus que de la
 * difference de hauteur entre deux vues, au lieu de s allonger de la
 * hauteur entiere du panneau ouvert.
 */
export function FocusToolbar({
  goals,
  todos,
  workMin,
  onWorkChange,
  objet,
  onObjetChange,
  activePanel,
  onPanelChange,
  panneaux,
}: FocusToolbarProps) {
  const { t } = useTranslation();
  const objectifs = goals.filter((g) => g.status === "in_progress" || g.status === "not_started");

  const basculer = (onglet: Exclude<FocusPanel, null>) =>
    onPanelChange(activePanel === onglet ? null : onglet);

  const valeur = (type: "goal" | "todo") => (objet?.type === type ? objet.id : "none");
  const choisir = (type: "goal" | "todo") => (v: string) =>
    onObjetChange(v === "none" ? null : { type, id: v });

  const titre = activePanel
    ? t("focus.panneau." + activePanel)
    : t("focus.clause.compose");

  const corpsClause = (
    <div className="sc-composeur-corps">
      <div className="sc-ligne">
        <span className="sc-lab" id="lab-objet">{t("focus.field.target")}</span>
        <Select value={valeur("goal")} onValueChange={choisir("goal")}>
          <SelectTrigger className="cyb-select" data-lie={objet?.type === "goal"} aria-labelledby="lab-objet">
            {objet?.type === "goal"
              ? <Link2 className="h-3.5 w-3.5 shrink-0 sc-maillon" aria-hidden="true" />
              : <Target className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
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
        <Select value={valeur("todo")} onValueChange={choisir("todo")}>
          <SelectTrigger className="cyb-select" data-lie={objet?.type === "todo"} aria-labelledby="lab-tache">
            {objet?.type === "todo"
              ? <Link2 className="h-3.5 w-3.5 shrink-0 sc-maillon" aria-hidden="true" />
              : <ListTodo className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
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
  );

  const vues = [
    { id: "clause" as const, contenu: corpsClause },
    ...panneaux.map((p) => ({ id: p.id, contenu: p.contenu })),
  ];

  /* La plaque dit quel panneau est ouvert : la feuille de style lui
     donne la largeur qui va avec. Un panneau de reglages n a pas la
     meme forme qu une clause a composer — 520 px sont justes pour
     une colonne de quatre champs, etroits pour juger un fond. */
  return (
    <section
      className="sc-composeur"
      data-panneau={activePanel ?? "clause"}
      aria-label={t("focus.clause.compose")}
    >
      <header className="sc-composeur-tete">
        <span aria-hidden="true">◈</span>
        <h2>{titre}</h2>
        <span className="sc-composeur-fil" aria-hidden="true" />
      </header>

      <FocusPanels actif={activePanel ?? "clause"} vues={vues} />

      <nav className="sc-panneaux" aria-label={t("focus.clause.compose")}>
        {ONGLETS.map(({ id, cle, icone: Icone }) => (
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
