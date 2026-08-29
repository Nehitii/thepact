/* Les trois formes viennent du fichier de types, pas du hook qui les
   reexporte : une couche basse qui remonte vers un hook pour un type
   est le meme defaut, dix-septieme fois. */
import type { TodoHistory, TodoTask, TodoInsight } from "@/domaines/taches/types";

/* CE QUE LA CONSOLE REMARQUE.
 *
 * Trois observations tirees de l historique, et rien d autre : elles
 * ne conseillent pas, elles CONSTATENT. Sorties du hook, ou elles
 * etaient une fonction de trente lignes derriere quatre cents lignes
 * de mutations — donc jamais eprouvees.
 *
 * Un seuil mal place ne casse rien : il fait dire a l application une
 * chose fausse sur toi, ce qui est pire.
 */
export function genererAnalyses(history: TodoHistory[], activeTasks: TodoTask[]): TodoInsight[] {
  const analyses: TodoInsight[] = [];

  if (history.length < 5) return analyses;

  const heures = history.map((h) => new Date(h.completed_at).getHours());
  const matin = heures.filter((h) => h >= 6 && h < 12).length;
  const apresMidi = heures.filter((h) => h >= 12 && h < 18).length;
  const soir = heures.filter((h) => h >= 18 || h < 6).length;

  const total = matin + apresMidi + soir;
  if (total > 0) {
    if (matin / total > 0.5) analyses.push({ cle: 'todo.insights.morning' });
    else if (apresMidi / total > 0.5) analyses.push({ cle: 'todo.insights.afternoon' });
    else if (soir / total > 0.5) analyses.push({ cle: 'todo.insights.evening' });
  }

  const souventReportees = activeTasks.filter((t) => t.postpone_count >= 3);
  if (souventReportees.length > 0) {
    analyses.push({ cle: 'todo.insights.postponed', params: { count: souventReportees.length } });
  }

  const hautesTerminees = history.filter((h) => h.priority === 'high').length;
  if (hautesTerminees > 0 && history.length > 10 && hautesTerminees / history.length < 0.2) {
    analyses.push({ cle: 'todo.insights.fewHighPriority' });
  }

  return analyses.slice(0, 3);
}
