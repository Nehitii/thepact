import { useCallback, useEffect, useRef, useState } from "react";

/** Le geste demande, selon ce que l appareil offre. */
export type FormeDuGeste = "trace" | "maintien";

/** Trois secondes de maintien : assez long pour etre un engagement. */
export const DUREE_MAINTIEN = 3000;

/**
 * LE GESTE DE SIGNATURE.
 *
 * Il DEPEND DE L APPAREIL, parce que le bon geste n est pas le meme :
 *
 *   doigt    tracer le sigil — on valide un PARCOURS, pas une
 *            calligraphie, donc la tolerance est large
 *   souris   maintenir le centre ; l anneau se remplit en trois
 *            secondes, et relacher avant perd tout
 *   clavier  maintenir Espace ou Entree, meme remplissage
 *
 * RELACHER AVANT LA FIN PERD TOUT, et ce n est pas une punition : un
 * engagement qu on peut donner par accident n en est pas un. C est
 * aussi le seul endroit du rite ou l on demande un geste tenu — avec
 * la gravure de la phrase, qui l annonce.
 *
 * LE GESTE NE PEUT PAS COMMENCER SANS LES CLAUSES. « actif » est faux
 * tant que la case n est pas cochee : cocher et signer restent deux
 * actions distinctes, sans quoi le consentement cesse d etre libre.
 */
export function useGesteDeSignature({
  actif,
  onSigne,
  sansAnimation = false,
}: {
  actif: boolean;
  onSigne: () => void;
  sansAnimation?: boolean;
}) {
  const [avancement, setAvancement] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const debut = useRef(0);
  const image = useRef(0);
  const fini = useRef(false);

  /* Le doigt trace, la souris maintient. « pointer: coarse » est la
     question juste : elle porte sur la finesse du pointeur, pas sur la
     largeur de l ecran — une tablette avec un stylet n est pas un
     telephone. */
  const forme: FormeDuGeste =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
      ? "trace"
      : "maintien";

  const arreter = useCallback(() => {
    cancelAnimationFrame(image.current);
    setEnCours(false);
    if (!fini.current) setAvancement(0);
  }, []);

  const commencer = useCallback(() => {
    if (!actif || fini.current) return;
    /* SANS ANIMATION, LE GESTE RESTE — il se contente d aboutir. Le
       rite perd ses balayages, pas sa signature. */
    if (sansAnimation) {
      fini.current = true;
      setAvancement(1);
      onSigne();
      return;
    }
    setEnCours(true);
    debut.current = performance.now();
    const avancer = (t: number) => {
      const part = Math.min(1, (t - debut.current) / DUREE_MAINTIEN);
      setAvancement(part);
      if (part >= 1) {
        fini.current = true;
        setEnCours(false);
        onSigne();
        return;
      }
      image.current = requestAnimationFrame(avancer);
    };
    image.current = requestAnimationFrame(avancer);
  }, [actif, onSigne, sansAnimation]);

  /* AU CLAVIER, LE MEME GESTE. Espace ou Entree maintenus, meme
     remplissage : qui n a ni souris ni doigt signe comme les autres,
     pas par un bouton de secours. */
  useEffect(() => {
    if (!actif) return;
    const enfonce = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== " " && e.key !== "Enter")) return;
      const cible = e.target as HTMLElement | null;
      if (cible?.closest("[data-signature]")) { e.preventDefault(); commencer(); }
    };
    const relache = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") arreter();
    };
    window.addEventListener("keydown", enfonce);
    window.addEventListener("keyup", relache);
    return () => {
      window.removeEventListener("keydown", enfonce);
      window.removeEventListener("keyup", relache);
    };
  }, [actif, commencer, arreter]);

  useEffect(() => () => cancelAnimationFrame(image.current), []);

  return { forme, avancement, enCours, commencer, arreter };
}
