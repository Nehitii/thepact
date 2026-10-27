import { useState, useEffect, useCallback } from "react";

/**
 * LA QUESTION DU JOUR, ECARTEE OU NON — SORTIE DU FICHIER DE LA BANNIERE.
 *
 * Un fichier qui exporte un composant ET un crochet fait retomber Fast
 * Refresh sur un rechargement complet de la page.
 */
/* Une cle par jour : ce qui est congedie aujourd hui revient demain. */
const cleDuJour = () => `journal-prompt-dismissed-${new Date().toDateString()}`;

export function useQuestionCongediee(): [boolean, (v: boolean) => void] {
  const [congediee, setCongediee] = useState(false);
  const cle = cleDuJour();

  useEffect(() => {
    try {
      setCongediee(localStorage.getItem(cle) === "1");
      /* Une clé par jour congédié s'accumulait pour toujours. */
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("journal-prompt-dismissed-") && k !== cle) localStorage.removeItem(k);
      }
    } catch { /* stockage indisponible : la question reste visible */ }
  }, [cle]);

  const regler = useCallback((v: boolean) => {
    try {
      if (v) localStorage.setItem(cle, "1");
      else localStorage.removeItem(cle);
    } catch { /* sans conséquence : l'état de la session suffit */ }
    setCongediee(v);
    /* Les deux lecteurs — la bannière et le bouton de rappel — vivent dans
       des composants différents. Sans cet avis, celui qui n'a pas cliqué
       ne saurait jamais que l'autre a changé d'avis. */
    window.dispatchEvent(new CustomEvent("journal-question", { detail: v }));
  }, [cle]);

  useEffect(() => {
    const suivre = (e: Event) => setCongediee(!!(e as CustomEvent).detail);
    window.addEventListener("journal-question", suivre);
    return () => window.removeEventListener("journal-question", suivre);
  }, []);

  return [congediee, regler];
}
