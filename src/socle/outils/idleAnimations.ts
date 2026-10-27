/**
 * Suspend les animations quand l'onglet n'est pas regarde.
 *
 * L'application entretient une cinquantaine d'animations perpetuelles —
 * pulsations, anneaux, balayages — qui ne s'arretent jamais d'elles-memes.
 * Les navigateurs ralentissent les timers d'un onglet cache, mais pas les
 * animations CSS ni celles de Framer : elles continuent de composer des
 * images pour personne, et sur mobile c'est de la batterie.
 *
 * On pose un attribut sur <html> ; le CSS fait le reste. Aucun changement
 * visible : au retour, tout reprend ou ca s'etait arrete.
 */

const ATTR = "data-idle";

function sync() {
  const idle = document.hidden;
  if (idle) document.documentElement.setAttribute(ATTR, "");
  else document.documentElement.removeAttribute(ATTR);
}

export function watchIdleAnimations() {
  if (typeof document === "undefined") return;
  sync();
  document.addEventListener("visibilitychange", sync);
}
