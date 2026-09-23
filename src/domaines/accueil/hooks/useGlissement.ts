import { useLayoutEffect, useRef, type RefObject } from "react";

/* LE GLISSEMENT D UNE CARTE D UN CASIER A L AUTRE.
 *
 * Quand une carte change de place — pointee, elle passe du casier « À
 * pointer » a celui des « Pointées » —, React la demonte d un parent et
 * la remonte dans l autre : sans rien faire, elle disparait ici et
 * apparait la. Ce crochet la fait voyager.
 *
 * Apres chaque rendu, il releve la position de chaque element marque
 * `data-glisse="<id>"`, relative au conteneur (un defilement de page ne
 * doit pas passer pour un deplacement). Si un meme id a bouge depuis le
 * rendu d avant, il le replace d ou il venait et le laisse glisser
 * jusqu a sa nouvelle place (la technique dite FLIP : premier, dernier,
 * inverser, jouer).
 *
 * Un conteneur qui a change de largeur — la fenetre, un repli — fausse
 * tout : on ne joue rien ce tour-la. Sans mouvement, rien non plus. */
export function useGlissement(conteneur: RefObject<HTMLElement | null>) {
  const avant = useRef<{ largeur: number; places: Map<string, { x: number; y: number }> } | null>(null);

  useLayoutEffect(() => {
    const racine = conteneur.current;
    if (!racine) return;
    const base = racine.getBoundingClientRect();
    const places = new Map<string, { x: number; y: number }>();
    const precedent = avant.current;
    const immobile =
      document.documentElement.getAttribute("data-reduce-motion") === "true"
      || window.matchMedia("(prefers-reduced-motion: reduce)").matches
      || !precedent
      || Math.abs(precedent.largeur - base.width) > 1;

    racine.querySelectorAll<HTMLElement>("[data-glisse]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const id = el.dataset.glisse ?? "";
      const ici = { x: r.left - base.left, y: r.top - base.top };
      places.set(id, ici);
      const la = precedent?.places.get(id);
      if (immobile || !la) return;
      const dx = la.x - ici.x;
      const dy = la.y - ici.y;
      if (Math.abs(dx) + Math.abs(dy) < 2) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 }, { transform: "none", zIndex: 2 }],
        { duration: 680, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    });

    avant.current = { largeur: base.width, places };
  });
}
