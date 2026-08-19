import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/* LA PISTE DE PANNEAUX
 *
 * Le fondu croise montait les deux panneaux en meme temps dans un
 * conteneur en colonne : le temps de la bascule ils s empilaient, la page
 * s allongeait puis se retractait, et le defilement sautait. Ils sont
 * maintenant cote a cote sur une piste qu on fait glisser.
 *
 * ET LE DEFILEMENT SUIT LA MEME ANIMATION.
 *
 * Il se faisait « en deux temps » : la hauteur s animait en CSS, puis un
 * scrollIntoView partait de son cote quatre cents millisecondes plus
 * tard. Deux mouvements pour un geste, chacun avec sa courbe.
 *
 * Ici une seule boucle interpole les trois valeurs — hauteur du hublot,
 * glissement de la piste, position de defilement — avec la meme duree et
 * la meme courbe. La page n avance donc que de ce que le menu s elargit,
 * exactement au meme rythme.
 */

export interface Vue {
  id: string;
  contenu: ReactNode;
}

interface FocusPanelsProps {
  /** L identifiant de la vue montree. Null replie la piste. */
  actif: string | null;
  vues: Vue[];
}

const DUREE = 420;
/** Deceleration franche : la valeur arrive et se pose, elle ne derive pas. */
const adoucir = (t: number) => 1 - Math.pow(1 - t, 4);

/** Le premier ancetre qui defile vraiment. Dans cette application c est
 *  le <main> de la coque, pas le document. */
function ascenseur(el: HTMLElement | null): HTMLElement {
  let n = el?.parentElement ?? null;
  while (n) {
    const d = getComputedStyle(n).overflowY;
    if ((d === "auto" || d === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
    n = n.parentElement;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

export function FocusPanels({ actif, vues }: FocusPanelsProps) {
  const mouvementReduit = useReducedMotion();
  const hublotRef = useRef<HTMLDivElement | null>(null);
  const pisteRef = useRef<HTMLDivElement | null>(null);
  const vueRefs = useRef(new Map<string, HTMLDivElement>());
  const animRef = useRef(0);

  // Ce qui a deja ete ouvert reste monte : monter les quatre d emblee
  // ferait tourner un graphique, un historique et une iframe pour rien.
  const [montees, setMontees] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!actif) return;
    setMontees((m) => (m.has(actif) ? m : new Set(m).add(actif)));
  }, [actif]);

  const index = actif ? vues.findIndex((v) => v.id === actif) : -1;

  /* Une seule animation pour les trois valeurs. */
  useLayoutEffect(() => {
    const hublot = hublotRef.current;
    const piste = pisteRef.current;
    if (!hublot || !piste) return;

    const vue = actif ? vueRefs.current.get(actif) : null;
    const h0 = hublot.getBoundingClientRect().height;
    const h1 = actif && vue ? vue.offsetHeight : 0;
    const x0 = -(parseFloat(piste.dataset.x || "0"));
    const x1 = index < 0 ? 0 : index * 100;

    const sc = ascenseur(hublot);
    const s0 = sc.scrollTop;

    /* De combien la page doit-elle avancer ? De la difference entre ce
       que la plaque va occuper et la place qui lui reste — pas plus. */
    const plaque = hublot.closest(".sc-composeur") as HTMLElement | null;
    const cible = plaque ?? hublot;
    const marge = 16;
    const rect = cible.getBoundingClientRect();
    const hauteurVisible = sc === document.documentElement || sc === document.body
      ? window.innerHeight
      : sc.getBoundingClientRect().height;
    const hautVisible = sc === document.documentElement || sc === document.body
      ? 0
      : sc.getBoundingClientRect().top;
    const basApres = rect.bottom + (h1 - h0);
    let ds = 0;
    if (basApres > hautVisible + hauteurVisible - marge) {
      ds = basApres - (hautVisible + hauteurVisible - marge);
      // Jamais au point de faire sortir le haut de la plaque.
      ds = Math.min(ds, rect.top - hautVisible - marge);
    }
    /* Pas de bornage ici : la page n est pas encore scrollable, elle le
       devient EN grandissant. Borner sur la plage d avant reduisait le
       deplacement a zero — la plaque debordait de 150 px sans que la page
       bouge d un pixel. La borne est recalculee a chaque image. */
    ds = Math.max(0, ds);

    cancelAnimationFrame(animRef.current);

    if (mouvementReduit) {
      hublot.style.height = `${h1}px`;
      piste.style.transform = `translate3d(${-x1}%, 0, 0)`;
      piste.dataset.x = String(x1);
      sc.scrollTop = Math.min(s0 + ds, sc.scrollHeight - sc.clientHeight);
      return;
    }

    let annule = false;
    const stop = () => { annule = true; };
    // Un geste de l utilisateur reprend la main : on ne se bat pas avec lui.
    sc.addEventListener("wheel", stop, { passive: true, once: true });
    sc.addEventListener("touchstart", stop, { passive: true, once: true });

    const t0 = performance.now();
    const pas = (now: number) => {
      const t = Math.min(1, (now - t0) / DUREE);
      const e = adoucir(t);
      hublot.style.height = `${h0 + (h1 - h0) * e}px`;
      piste.style.transform = `translate3d(${-(x0 + (x1 - x0) * e)}%, 0, 0)`;
      if (!annule && ds !== 0) {
        const max = sc.scrollHeight - sc.clientHeight;
        sc.scrollTop = Math.min(s0 + ds * e, max);
      }
      if (t < 1) animRef.current = requestAnimationFrame(pas);
      else {
        // Remise a zero indispensable : l observateur de redimensionnement
        // se garde sur cette valeur, et un identifiant oublie le laissait
        // muet pour de bon.
        animRef.current = 0;
        piste.dataset.x = String(x1);
        sc.removeEventListener("wheel", stop);
        sc.removeEventListener("touchstart", stop);
      }
    };
    animRef.current = requestAnimationFrame(pas);

    return () => {
      cancelAnimationFrame(animRef.current);
      animRef.current = 0;
      sc.removeEventListener("wheel", stop);
      sc.removeEventListener("touchstart", stop);
    };
  }, [actif, index, mouvementReduit, montees]);

  /* La hauteur suit aussi les changements de contenu d une vue deja
     ouverte — un historique qu on deplie, par exemple. */
  useEffect(() => {
    if (!actif) return;
    const vue = vueRefs.current.get(actif);
    const hublot = hublotRef.current;
    if (!vue || !hublot) return;
    const obs = new ResizeObserver(() => {
      // Pendant l animation, c est elle qui commande.
      if (animRef.current) return;
      const h = vue.offsetHeight;
      if (Math.abs(hublot.getBoundingClientRect().height - h) < 1) return;
      /* Deplier un contenu — l historique, par exemple — doit agrandir la
         plaque tout de suite, et avec la meme douceur que le reste. */
      hublot.style.transition = "height 260ms cubic-bezier(0.3, 0.85, 0.25, 1)";
      hublot.style.height = `${h}px`;
      window.setTimeout(() => { hublot.style.transition = ""; }, 300);
    });
    obs.observe(vue);
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
    <div ref={hublotRef} className="sc-diapo" style={{ height: 0 }}>
      <div ref={pisteRef} className="sc-diapo-piste" data-x="0">
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
