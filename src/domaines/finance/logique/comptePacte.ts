import type { Goal } from "@/domaines/objectifs";
import type { CostItem } from "@/hooks/useCostItems";

/* CE QUE COUTE LE PACTE, CE QUI EST PAYE, CE QUI RESTE.
 *
 * « Paye » ne se devine plus : c est la somme des pieces reellement
 * acquises, plus l apport declare. Un objectif termine compte pour son
 * cout entier — sinon un objectif boucle avant que les pieces existent
 * disparaitrait du compte.
 */

export interface ComptePacte {
  total: number;
  finance: number;
  restant: number;
  /** Ce qui vient d objectifs deja termines. */
  partObjectifs: number;
  /** Ce qui vient de pieces cochees une a une. */
  partPieces: number;
  partApport: number;
  piecesAcquises: number;
  piecesTotal: number;
}

export function calculerComptePacte(
  goals: Goal[],
  pieces: CostItem[],
  cibleManuelle: number,
  apport: number,
): ComptePacte {
  const coutObjectifs = goals.reduce((s, g) => s + (g.estimated_cost || 0), 0);
  const total = cibleManuelle > 0 ? cibleManuelle : coutObjectifs;

  const estTermine = (g: Goal) =>
    g.status === "completed" || g.status === "fully_completed" || g.status === "validated";

  const parObjectif = new Map<string, CostItem[]>();
  for (const p of pieces) {
    const l = parObjectif.get(p.goal_id) ?? [];
    l.push(p);
    parObjectif.set(p.goal_id, l);
  }

  let partObjectifs = 0;
  let partPieces = 0;
  for (const g of goals) {
    const liste = parObjectif.get(g.id) ?? [];
    if (estTermine(g)) {
      /* Un objectif termine est paye, que ses pieces soient cochees ou non. */
      partObjectifs += g.estimated_cost || liste.reduce((s, p) => s + p.price, 0);
    } else {
      partPieces += liste.filter((p) => p.acquired_at).reduce((s, p) => s + p.price, 0);
    }
  }

  const finance = Math.min(partObjectifs + partPieces + apport, total);
  return {
    total,
    finance,
    restant: Math.max(total - finance, 0),
    partObjectifs,
    partPieces,
    partApport: apport,
    piecesAcquises: pieces.filter((p) => p.acquired_at).length,
    piecesTotal: pieces.length,
  };
}
