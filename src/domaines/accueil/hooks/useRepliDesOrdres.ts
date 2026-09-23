import { useState } from "react";
import { PREF } from "@/socle/outils/preferencesAffichage";

/* LE REPLI DES ORDRES DU JOUR, UNE PREFERENCE QUI DURE.
 *
 * Deplie par defaut, et c est delibere : le panneau des ordres sortait
 * d un repli ou il n etait jamais vu. Seul un choix explicite le
 * referme — et ce choix tient d une visite a l autre, sous la meme cle
 * que l ancien panneau : qui l avait replie le retrouve replie. */
export function useRepliDesOrdres() {
  const [replie, setReplie] = useState(() => {
    try {
      return localStorage.getItem(PREF.ORDRES_REPLIES) === "1";
    } catch {
      return false; /* navigation privee, quota, politique */
    }
  });

  const basculer = () =>
    setReplie((v) => {
      const suivant = !v;
      try {
        localStorage.setItem(PREF.ORDRES_REPLIES, suivant ? "1" : "0");
      } catch {
        /* le pli tiendra le temps de la session, pas plus */
      }
      return suivant;
    });

  return { replie, basculer };
}
