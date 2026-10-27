import { useNavigate } from "react-router-dom";
import { ACCES, etatDAcces, type Acces, type EtatDAcces } from "@/domaines/accueil/logique/accesRapides";
import type { ProprietesAccesRapide } from "@/domaines/accueil/types";

/* LES ACCES RAPIDES, VIVANTS : leur etat et ce que fait leur appui.
 *
 * Chaque refonte de la barre dessine les memes six accès ; aucune ne
 * decide ou mene un verrou ni quand le tirage est pris. Le verrou mene
 * a la boutique, la revue et le tirage ouvrent leur outil sur la page,
 * les autres naviguent. Au banc, « onNaviguer » intercepte la
 * navigation : on voit ou l on serait alle, sans quitter le banc. */

export type AccesVivant = Acces & EtatDAcces & { activer: () => void };

export function useAccesRapides(p: ProprietesAccesRapide): AccesVivant[] {
  const naviguer = useNavigate();
  const aller = p.onNaviguer ?? ((route: string) => naviguer(route));
  const tirage = {
    ouvert: p.missionRandomizerOuvert ?? false,
    disponible: p.missionRandomizerDisponible ?? true,
  };

  return ACCES.map((a) => {
    const etat = etatDAcces(a, p.ownedModules, tirage);
    const activer = () => {
      if (etat.indisponible) return;
      if (etat.verrouille) return aller("/shop");
      if (a.id === "revue") return p.onWeeklyReview?.();
      if (a.id === "tirage") return p.onMissionRandomizer?.();
      if (a.route) aller(a.route);
    };
    return { ...a, ...etat, activer };
  });
}
