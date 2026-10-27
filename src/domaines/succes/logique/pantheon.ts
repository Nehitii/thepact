import { format } from "date-fns";
import { moisLocal } from "@/socle/outils/jour";
import type { Locale } from "date-fns";
import { RARETES, rangDeRarete, type Rarete } from "@/domaines/succes/logique/rarete";
import type { Succes } from "@/domaines/succes/types";

/** La categorie qui n en filtre aucune. */
export const TOUT = "__tout__";

/* LE PANTHEON : CE QU IL Y A, ET DANS QUEL ORDRE.
 *
 * Cinq calculs sortis de la page. Aucun ne rend quoi que ce soit — ils
 * comptent, classent et regroupent. Ce sont donc cinq facons de se
 * tromper sans bruit : une liste mal triee ressemble a une liste, un
 * compteur faux ressemble a un compteur.
 */
/* L ORDRE DU PANTHEON, A QUATRE DEPARTAGES.
 Les nouveaux d abord — ils sont la raison d ouvrir la page. Puis ce
 qui n est pas encore obtenu, puis le plus avance, puis le plus rare.
 Chaque niveau ne tranche que ce que le precedent laisse a egalite ;
 en changer l ordre change la page sans rien casser. */
export function ordonnerLesSucces({
succes, categorie, cacherObtenus, neufs,
}: {
succes: Succes[];
categorie: string;
cacherObtenus: boolean;
neufs?: Set<string> | null;
}): Succes[] {
  return succes
    .filter((s) => categorie === TOUT || s.categorie === categorie)
    .filter((s) => !cacherObtenus || !s.obtenu)
    .sort((a, b) =>
      Number(neufs?.has(b.cle) ?? false) - Number(neufs?.has(a.cle) ?? false)
      || Number(a.obtenu) - Number(b.obtenu)
      || b.avancement - a.avancement
      || rangDeRarete(b.rarete) - rangDeRarete(a.rarete));
}


/* LES QUATRE COMPTEURS DE L EN-TETE. */
export function compterLePantheon(succes: Succes[], coffres: { complet: boolean }[]) {
const obtenus = succes.filter((s) => s.obtenu).length;
const points = succes.filter((s) => s.obtenu).reduce((n, s) => n + s.points, 0);
const trophees = coffres.filter((c) => c.complet).length;
const part = succes.length ? Math.round((obtenus / succes.length) * 100) : 0;
return { obtenus, points, trophees, part };
}


/* Le rang affichait « Élite » en dur, quel que soit l avancement :
   une statistique fictive posee entre deux vraies. On montre la
   rarete la plus haute effectivement obtenue — un fait verifiable a
   l ecran. */
export function plusHauteRareteObtenue(succes: Succes[]): Rarete | null {
  for (let i = RARETES.length - 1; i >= 0; i--) {
    if (succes.some((s) => s.obtenu && s.rarete === RARETES[i])) return RARETES[i];
  }
  return null;
}


/* 5 · LES DATES EXISTENT, LA PAGE NE LES MONTRAIT NULLE PART.
   Rangees par mois, elles racontent l annee — et un pantheon est
   d abord un recit. */
export function chroniqueParMois(succes: Succes[], locale: Locale) {
  const par = new Map<string, { titre: string; quand: Date; succes: Succes[] }>();
  for (const x of succes) {
    if (!x.obtenu || !x.obtenu_le) continue;
    const d = new Date(x.obtenu_le);
    const cle = moisLocal(d);
    const groupe = par.get(cle) ?? {
      titre: format(d, "LLLL yyyy", { locale }),
      quand: new Date(d.getFullYear(), d.getMonth(), 1),
      succes: [],
    };
    groupe.succes.push(x);
    par.set(cle, groupe);
  }
  return [...par.values()]
    .map((g) => ({
      ...g,
      succes: g.succes.sort((a, b) => rangDeRarete(b.rarete) - rangDeRarete(a.rarete)),
    }))
    .sort((a, b) => b.quand.getTime() - a.quand.getTime());
}


/* LES TROIS PLUS PROCHES. Un succes cache ne se montre pas ; un
   succes a zero pour cent n est pas « proche », c est un succes. */
export function lesPlusProches(succes: Succes[]): Succes[] {
return succes
    .filter((s) => !s.obtenu && !s.cache && s.avancement > 0)
    .sort((a, b) => b.avancement - a.avancement)
    .slice(0, 3);
}
