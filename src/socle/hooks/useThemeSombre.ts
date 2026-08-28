import { useEffect, useState } from "react";

/**
 * Le thème courant, pour ce que le CSS ne peut pas atteindre.
 *
 * Trois endroits de l'application peignent en JavaScript : le canevas
 * du fond de Focus, le fond animé de sa page, et les couches de la
 * Singularité. Un style inline ou un `fillStyle` ne se corrige par
 * aucune feuille de style — même préfixée `.light`, même chargée en
 * dernier.
 *
 * Le thème change sans passer par une prop : basculer clair/sombre
 * ajoute ou retire une classe sur `<html>`, rien de plus. Sans ce
 * guetteur, ces trois surfaces garderaient les couleurs de l'ancien
 * thème jusqu'au prochain rendu déclenché par autre chose.
 */
export function useThemeSombre(): boolean {
  const [sombre, setSombre] = useState(
    () => typeof document === "undefined" || document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const racine = document.documentElement;
    const suivre = () => setSombre(racine.classList.contains("dark"));
    suivre();
    const guetteur = new MutationObserver(suivre);
    guetteur.observe(racine, { attributes: true, attributeFilter: ["class"] });
    return () => guetteur.disconnect();
  }, []);

  return sombre;
}
