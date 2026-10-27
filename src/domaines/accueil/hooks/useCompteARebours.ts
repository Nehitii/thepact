import { useMemo, useState } from "react";
import { useVisibleInterval } from "@/socle/hooks/useVisibleInterval";
import { cadenceDuCompte, lireLeCompte } from "@/domaines/accueil/logique/compteARebours";
import type { ProprietesDuCompte } from "@/domaines/accueil/types";

/* LE COMPTE A REBOURS, TEL QUE TOUTES LES REFONTES LE LISENT.
 *
 * L heure avance a la cadence de l unite affichee — la minute tant qu on
 * compte en jours, la seconde dans les deux derniers jours —, et
 * s arrete quand l onglet est cache. Au banc, une heure imposee la
 * remplace. Rien sans date de fin : le panneau ne se montre pas. */
export function useCompteARebours(p: ProprietesDuCompte) {
  const [horloge, setHorloge] = useState(() => Date.now());
  const maintenant = p.maintenant ?? horloge;
  const lecture = useMemo(
    () => lireLeCompte(p.projectStartDate, p.projectEndDate, maintenant),
    [p.projectStartDate, p.projectEndDate, maintenant],
  );
  useVisibleInterval(() => setHorloge(Date.now()), cadenceDuCompte(lecture?.resteMs ?? Infinity));
  return { lecture, maintenant };
}
