import { useCallback, useEffect, useState } from "react";
import { PREF } from "@/socle/outils/preferencesAffichage";
import { PROPOSITIONS, type IdDuFond } from "@/socle/ds/fonds/catalogue";

/* LE FOND DU TABLEAU DE BORD, CHOISI DANS LES OPTIONS.
 *
 * UNE PREFERENCE DE LECTURE, PAS UNE COLONNE. Comme le fond de Focus :
 * elle dit comment on regarde, sur cet ecran-ci. Elle vit dans le
 * navigateur, et la remise a zero des preferences l emporte avec les
 * autres — le tableau de bord revient alors au ciel classique.
 *
 * L ATLAS RESTE AU BANC. Il y garde sa place de proposition ; il n a
 * pas ete retenu pour les options.
 *
 * L AVIS D EVENEMENT, comme pour les objets flottants : le reglage vit
 * dans les options et le fond dans le tableau de bord, deux arbres
 * React sans ancetre commun. Un autre onglet l apprend par `storage`. */

export const FONDS_AU_CHOIX: readonly IdDuFond[] = PROPOSITIONS
  .map((p) => p.id)
  .filter((id) => id !== "atlas");

/** Une valeur lue du stockage, ramenee a un choix possible. Tout ce qui
 *  n en est pas un — absent, ancien, retire des options — donne le ciel
 *  classique. */
export function lireLeFond(brut: string | null | undefined): IdDuFond {
  return FONDS_AU_CHOIX.find((id) => id === brut) ?? "classique";
}

const AVIS = "overwrite-fond-du-tableau";

function lire(): IdDuFond {
  try {
    return lireLeFond(localStorage.getItem(PREF.HUB_FOND));
  } catch {
    return "classique";
  }
}

export function useFondDuTableau(): [IdDuFond, (id: IdDuFond) => void] {
  const [fond, setFond] = useState(lire);

  const choisir = useCallback((id: IdDuFond) => {
    const sur = lireLeFond(id);
    try {
      /* Le ciel classique n est pas un choix qu on retient : c est
         l absence de choix. Le compte des preferences posees reste
         juste. */
      if (sur === "classique") localStorage.removeItem(PREF.HUB_FOND);
      else localStorage.setItem(PREF.HUB_FOND, sur);
    } catch {
      /* navigation privee : le choix ne tiendra que la session */
    }
    setFond(sur);
    window.dispatchEvent(new CustomEvent(AVIS, { detail: sur }));
  }, []);

  useEffect(() => {
    const ici = (e: Event) => setFond(lireLeFond((e as CustomEvent<string>).detail));
    const ailleurs = (e: StorageEvent) => {
      if (e.key === PREF.HUB_FOND || e.key === null) setFond(lire());
    };
    window.addEventListener(AVIS, ici);
    window.addEventListener("storage", ailleurs);
    return () => {
      window.removeEventListener(AVIS, ici);
      window.removeEventListener("storage", ailleurs);
    };
  }, []);

  return [fond, choisir];
}
