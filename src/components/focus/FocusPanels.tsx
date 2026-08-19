import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { FocusPanel } from "./FocusToolbar";

/* LA PISTE DE PANNEAUX
 *
 * Le fondu croise montait les deux panneaux en meme temps dans un
 * conteneur en colonne : le temps de la bascule ils s empilaient, la page
 * s allongeait puis se retractait, et le defilement sautait. C est ce qui
 * « buguait parfois » — pas parfois, a chaque fois que les deux panneaux
 * n avaient pas la meme hauteur.
 *
 * Ici les panneaux sont cote a cote sur une piste qu on FAIT GLISSER. Le
 * mouvement porte sur une transformation, que le compositeur traite sans
 * repeindre ni recalculer la mise en page. La hauteur du hublot suit
 * celle du panneau actif, mesuree par un observateur de redimensionnement
 * plutot que devinee.
 *
 * Un panneau n est monte qu a sa premiere ouverture, et il reste ensuite :
 * monter les quatre d emblee ferait tourner un graphique, un historique et
 * une iframe pour rien.
 */

export interface Vue {
  id: Exclude<FocusPanel, null>;
  contenu: ReactNode;
}

interface FocusPanelsProps {
  actif: FocusPanel;
  vues: Vue[];
}

export function FocusPanels({ actif, vues }: FocusPanelsProps) {
  const mouvementReduit = useReducedMotion();
  const hublotRef = useRef<HTMLDivElement | null>(null);
  const vueRefs = useRef(new Map<string, HTMLDivElement>());
  const [hauteur, setHauteur] = useState(0);

  // Ce qui a deja ete ouvert reste monte.
  const [montees, setMontees] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!actif) return;
    setMontees((m) => (m.has(actif) ? m : new Set(m).add(actif)));
  }, [actif]);

  const index = actif ? vues.findIndex((v) => v.id === actif) : -1;

  /* La hauteur du hublot suit le panneau actif. Mesuree, jamais devinee :
     figer une hauteur commune reviderait la page pour les panneaux
     courts, et la deviner la ferait sauter des qu un contenu change. */
  useLayoutEffect(() => {
    if (!actif) { setHauteur(0); return; }
    const el = vueRefs.current.get(actif);
    if (!el) return;
    const mesurer = () => setHauteur(el.offsetHeight);
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, [actif, montees]);

  /* Les panneaux hors champ ne doivent etre ni atteignables au clavier ni
     annonces : ils sont derriere un debord cache, pas absents. */
  useEffect(() => {
    for (const v of vues) {
      const el = vueRefs.current.get(v.id);
      if (!el) continue;
      const horsChamp = v.id !== actif;
      el.toggleAttribute("inert", horsChamp);
      el.setAttribute("aria-hidden", horsChamp ? "true" : "false");
    }
  }, [actif, vues, montees]);

  return (
    <div
      ref={hublotRef}
      className="sc-diapo"
      style={{
        height: hauteur,
        transitionDuration: mouvementReduit ? "0ms" : undefined,
      }}
    >
      <div
        className="sc-diapo-piste"
        style={{
          transform: `translate3d(${index < 0 ? 0 : -index * 100}%, 0, 0)`,
          transitionDuration: mouvementReduit ? "0ms" : undefined,
        }}
      >
        {vues.map((v) => (
          <div
            key={v.id}
            ref={(el) => {
              if (el) vueRefs.current.set(v.id, el);
              else vueRefs.current.delete(v.id);
            }}
            className="sc-diapo-vue"
          >
            {montees.has(v.id) ? v.contenu : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FocusPanels;
