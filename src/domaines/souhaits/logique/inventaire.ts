import type { PactWishlistItem } from "@/domaines/souhaits/types";
import type { Goal } from "@/domaines/objectifs";
import { prixEnregistre } from "@/domaines/souhaits/logique/prix";

/* L INVENTAIRE : CE QU IL Y A, ET CE QU ON EN MONTRE.
 *
 * Deux blocs sortis de la page. Ni l un ni l autre ne rend quoi que ce
 * soit : le premier compte, le second choisit et ordonne.
 *
 * CE SONT DES NOMBRES ET UN ORDRE — les deux se trompent sans bruit.
 * Un total qui oublie une categorie s affiche comme un total ; une
 * liste mal triee s affiche comme une liste.
 */

/* ── LES COMPTES ──
   Une seule source pour toute la page : chaque chiffre affiche descend
   de ce bloc, et aucun n est recalcule ailleurs. */
export function compterLesArticles(items: PactWishlistItem[], goals: Goal[]) {
    const duPacte = items.filter((i) => i.source_goal_cost_id);
    const libres = items.filter((i) => !i.source_goal_cost_id);
    /* Un article sans objectif ET sans liste ne s affiche que dans
       « Global ». La migration n en a laisse aucun, mais rien
       n empeche d en creer un : il ne doit pas devenir invisible. */
    const parListe = new Map<string, PactWishlistItem[]>();
    for (const i of libres) {
      const cle = i.list_id ?? "";
      if (!cle) continue;
      const p = parListe.get(cle);
      if (p) p.push(i); else parListe.set(cle, [i]);
    }
    /* UN SEUL NaN CONTAMINE TOUT LE TOTAL, et l ecran affiche « NaN € »
     au lieu d une somme. `Number(x || 0)` ne protege que du vide :
     sur une valeur illisible il rend NaN, qui est truthy et traverse
     donc le `||`. `Number(x) || 0` ferme les deux cas d un coup.
     Trouve par un test qui echouait — la base ne devrait pas produire
     un cout illisible, mais un total d argent ne doit pas dependre
     de ce qu elle ne devrait pas faire. */
  const somme = (liste: PactWishlistItem[]) =>
      liste.reduce((s, i) => s + prixEnregistre(i.estimated_cost), 0);

    return {
      duPacte, libres, parListe,
      total: somme(items),
      totalPacte: somme(duPacte),
      totalLibre: somme(libres),
      paye: somme(items.filter((i) => i.acquired)),
      payePacte: somme(duPacte.filter((i) => i.acquired)),
      payeLibre: somme(libres.filter((i) => i.acquired)),
      nbPaye: items.filter((i) => i.acquired).length,
      /* Le cout des objectifs du pacte, pour ce qu il est : une
         verification. Il doit egaler la somme des pieces. */
      coutObjectifs: goals.reduce((s, g) => s + prixEnregistre(g.estimated_cost), 0),
      nbObjectifs: new Set(duPacte.map((i) => i.goal_id)).size,
    };
}

export type Comptes = ReturnType<typeof compterLesArticles>;
export type Vue = "pacte" | "tout" | string;
export type Tri = "cher" | "abordable" | "visuel" | string;

/* ── LE FILTRE ──
   La recherche s applique a la vue courante ; elle ne cherche pas
   ailleurs que ce qu on regarde. */
export function filtrerEtTrier({
  vue, items, comptes, recherche, tri,
}: {
  vue: Vue;
  items: PactWishlistItem[];
  /* Le filtre ne lit du comptage que deux champs : le dire evite de
     croire qu il depend des dix autres. */
  comptes: Pick<Comptes, "duPacte" | "parListe">;
  recherche: string;
  tri: Tri;
}) {
    const base = vue === "pacte"
      ? comptes.duPacte
      : vue === "tout"
        ? items
        : (comptes.parListe.get(vue) ?? []);
    const mot = recherche.trim().toLowerCase();
    const filtres = mot
      ? base.filter((i) =>
        i.name.toLowerCase().includes(mot)
        || (i.category ?? "").toLowerCase().includes(mot)
        || (i.goal?.name ?? "").toLowerCase().includes(mot)
        || (i.notes ?? "").toLowerCase().includes(mot))
      : base;

    const recence = (a: PactWishlistItem, b: PactWishlistItem) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    const ordonnes = [...filtres].sort((a, b) => {
      if (tri === "cher") return prixEnregistre(b.estimated_cost) - prixEnregistre(a.estimated_cost);
      if (tri === "abordable") return prixEnregistre(a.estimated_cost) - prixEnregistre(b.estimated_cost);
      if (tri === "visuel") {
        /* Une photo achete une case : encore faut-il la voir. Sans
           ce tri, les quatre articles photographies tombaient a deux
           mille pixels du haut. */
        const ecart = Number(Boolean(b.image_url)) - Number(Boolean(a.image_url));
        return ecart !== 0 ? ecart : recence(a, b);
      }
      return recence(a, b);
    });

    return {
      tous: ordonnes,
      actifs: ordonnes.filter((i) => !i.acquired),
      acquis: ordonnes.filter((i) => i.acquired),
    };
}
