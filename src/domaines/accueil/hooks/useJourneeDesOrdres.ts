import { useMemo, useState } from "react";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import {
  genreDe, laCloture, lireLaJournee, lireLOrdre, type Genre, type LectureDOrdre,
} from "@/domaines/accueil/logique/ordresDuJour";
import type { OrdreAffiche, ProprietesDesOrdres } from "@/domaines/accueil/types";

/** Un ordre avec tout ce qu une refonte en dessine. */
export type OrdreLu = OrdreAffiche & LectureDOrdre & {
  genre: Genre;
  /** Sa reclamation est partie ; la base n a pas encore repondu. */
  enReclamation: boolean;
};

/* LA JOURNEE DES ORDRES, telle que toutes les refontes la lisent : la
 * prime, l etat, chaque ordre avec sa part faite et son genre, et le
 * temps avant la cloture.
 *
 * L heure avance d une minute a la fois — on affiche des heures et des
 * minutes, pas des secondes — et s arrete quand l onglet est cache : un
 * compte a rebours pour personne ne sert a rien. Au banc, une heure
 * imposee la remplace. */
export function useJourneeDesOrdres(p: ProprietesDesOrdres) {
  const [horloge, setHorloge] = useState(() => Date.now());
  useVisibleInterval(() => setHorloge(Date.now()), 60_000);
  const maintenant = p.maintenant ?? horloge;

  const journee = useMemo(() => lireLaJournee(p.ordres), [p.ordres]);
  const lignes = useMemo<OrdreLu[]>(
    () => p.ordres.map((o) => ({
      ...o,
      ...lireLOrdre(o),
      genre: genreDe(o.kind),
      enReclamation: p.enReclamation === o.id,
    })),
    [p.ordres, p.enReclamation],
  );

  return { journee, lignes, cloture: laCloture(maintenant), maintenant };
}
