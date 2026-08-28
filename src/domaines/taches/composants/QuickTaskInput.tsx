import { useState, useRef, useCallback, useMemo } from "react";
import { CornerDownLeft } from "lucide-react";
import { TodoPriority, CreateTaskInput, TodoTaskType } from "@/domaines/taches/hooks/useTodoList";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { IDS_CATEGORIE } from "@/domaines/taches/logique/categories";
import { addDays } from "date-fns";

/* L INVITE
 *
 * Ce n est plus un champ pose en haut de la page : c est la ligne de
 * commande de la console. Elle comprend une petite grammaire — !high,
 * #work, @today — analysee a la frappe et colorisee derriere le curseur.
 *
 * Le champ reel est transparent, une surcouche affiche le texte
 * colorise. Le procede est courant, mais la surcouche ne suivait pas le
 * defilement du champ : au-dela de sa largeur, les deux se
 * desalignaient. Elle le suit desormais.
 */

interface QuickTaskInputProps {
  onSubmit: (input: CreateTaskInput & { category: string; task_type: TodoTaskType }) => void;
  isLoading: boolean;
  disabled: boolean;
}

const PRIORITE = /!(high|med|low)\b/gi;
const CATEGORIE = /#(\w+)\b/g;
const ECHEANCE = /@(today|tomorrow|nextweek)\b/gi;

/* Les identifiants viennent de la liste unique : sans ca, une
   categorie ajoutee au formulaire n aurait pas ete reconnue ici. */

function analyser(brut: string) {
  let priority: TodoPriority = "medium";
  let category = "general";
  let deadline: string | null = null;
  let task_type: TodoTaskType = "flexible";

  const p = brut.match(PRIORITE);
  if (p) {
    const v = p[0].slice(1).toLowerCase();
    priority = v === "high" ? "high" : v === "low" ? "low" : "medium";
  }

  const c = brut.match(CATEGORIE);
  if (c) {
    const v = c[0].slice(1).toLowerCase();
    if (IDS_CATEGORIE.includes(v)) category = v;
  }

  const e = brut.match(ECHEANCE);
  if (e) {
    /* « @today » posait l echeance a l heure qu il etait : ecrit a 14 h,
       aujourd hui voulait dire 14 h aujourd hui, deja a moitie passe. */
    const finDeJournee = (j: number) => {
      const d = addDays(new Date(), j);
      d.setHours(23, 59, 0, 0);
      return d.toISOString();
    };
    const v = e[0].slice(1).toLowerCase();
    if (v === "today") { deadline = finDeJournee(0); task_type = "deadline"; }
    else if (v === "tomorrow") { deadline = finDeJournee(1); task_type = "deadline"; }
    else if (v === "nextweek") { deadline = finDeJournee(7); task_type = "deadline"; }
  }

  const name = brut
    .replace(PRIORITE, "")
    .replace(CATEGORIE, "")
    .replace(ECHEANCE, "")
    .replace(/\s+/g, " ")
    .trim();

  return { name, priority, category, deadline, task_type };
}

/** Le texte, decoupe en morceaux ordinaires et en jetons colorises. */
function morceaux(texte: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const combine = /(!(?:high|med|low)|#\w+|@(?:today|tomorrow|nextweek))/gi;
  let dernier = 0;
  let m: RegExpExecArray | null;

  while ((m = combine.exec(texte)) !== null) {
    if (m.index > dernier) {
      parts.push(<span key={`t${dernier}`} className="tsk-invite-texte">{texte.slice(dernier, m.index)}</span>);
    }
    const jeton = m[0];
    const classe = jeton.startsWith("!") ? "tsk-jeton-prio"
      : jeton.startsWith("#") ? "tsk-jeton-cat"
      : "tsk-jeton-ech";
    parts.push(<span key={`j${m.index}`} className={classe}>{jeton}</span>);
    dernier = combine.lastIndex;
  }
  if (dernier < texte.length) {
    parts.push(<span key={`t${dernier}`} className="tsk-invite-texte">{texte.slice(dernier)}</span>);
  }
  return parts;
}

export function QuickTaskInput({ onSubmit, isLoading, disabled }: QuickTaskInputProps) {
  const { t } = useTranslation();
  const [valeur, setValeur] = useState("");
  const ombreRef = useRef<HTMLDivElement>(null);

  const analyse = useMemo(() => analyser(valeur), [valeur]);

  const envoyer = useCallback(() => {
    if (!analyse.name || isLoading || disabled) return;
    onSubmit({
      name: analyse.name,
      priority: analyse.priority,
      is_urgent: analyse.priority === "high",
      category: analyse.category,
      task_type: analyse.task_type,
      deadline: analyse.deadline,
    });
    setValeur("");
  }, [analyse, isLoading, disabled, onSubmit]);

  /* La surcouche suit le defilement du champ, sinon les deux se
     desalignent des que le texte depasse la largeur visible. */
  const suivreDefilement = (e: React.UIEvent<HTMLInputElement>) => {
    if (ombreRef.current) ombreRef.current.scrollLeft = e.currentTarget.scrollLeft;
  };

  const aDesJetons = /(!(?:high|med|low)|#\w+|@(?:today|tomorrow|nextweek))/i.test(valeur);

  return (
    <>
      {/* Les trois indices tenaient une ligne pleine au-dessus du champ,
          en permanence, pour une syntaxe qui s apprend une fois : ils
          sont passes derriere le bouton d aide de la barre. */}
      <div className={cn("tsk-invite est-ligne", disabled && "opacity-60")}>
        <span className="tsk-sigle" aria-hidden="true">tsk&nbsp;&gt;</span>

        <div className="tsk-invite-champ">
          <div ref={ombreRef} className="tsk-invite-ombre" aria-hidden="true">
            {valeur ? morceaux(valeur) : null}
          </div>
          <input
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
            onScroll={suivreDefilement}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
            disabled={disabled || isLoading}
            aria-label={t("todo.neuralInput.label")}
            placeholder={t("todo.neuralInput.placeholder")}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          type="button"
          onClick={envoyer}
          disabled={!analyse.name || isLoading}
          aria-label={t("todo.neuralInput.submit")}
          className={cn("tsk-outil est-icone", analyse.name ? "est-primaire" : "est-inerte")}
        >
          <CornerDownLeft className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {valeur.trim() && aDesJetons && (
        <div className="tsk-apercu">
          {analyse.priority !== "medium" && (
            <span className="tsk-badge est-teinte" style={{
              ["--tsk-teinte" as string]: analyse.priority === "high" ? "var(--tsk-haute)" : "var(--tsk-basse)",
            } as React.CSSProperties}>
              {t("todo.priorities." + analyse.priority)}
            </span>
          )}
          {analyse.category !== "general" && (
            <span className="tsk-badge est-teinte" style={{ ["--tsk-teinte" as string]: "var(--tsk-basse)" } as React.CSSProperties}>
              {t("todo.categories." + analyse.category)}
            </span>
          )}
          {analyse.deadline && (
            <span className="tsk-badge est-teinte" style={{ ["--tsk-teinte" as string]: "hsl(var(--ds-accent-special))" } as React.CSSProperties}>
              {t("todo.taskTypes.deadline")}
            </span>
          )}
        </div>
      )}
    </>
  );
}
