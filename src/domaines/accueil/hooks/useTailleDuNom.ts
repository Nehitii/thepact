import { useEffect, useRef, useState } from "react";

/* LA TAILLE QUI FAIT TENIR UN NOM SUR SA LIGNE.
 *
 * Un nom de pacte va de trois lettres a cinquante, et chaque variante
 * du bandeau le pose en tres grand. Un corps fixe fait deborder
 * « Transformation Personnelle 2026 » ou noie « Io » dans le vide. Le
 * corps en « vw » ne suffit pas non plus : il suit la fenetre, pas la
 * carte, et ignore que JetBrains Mono est deux fois plus large que
 * Rajdhani.
 *
 * On MESURE donc le nom, dans sa vraie police, a 100 px sur un canevas,
 * et on en deduit le corps qui remplit la part voulue du cadre. La
 * mesure attend la police : mesuree sur la police de repli, la taille
 * serait juste pour une autre fonte. En dessous du plancher, le nom
 * passe a la ligne plutot que de devenir illisible.
 *
 * UNE MARGE DE 2 %. Mesure au canevas, le nom tombait au pixel pres sur
 * la largeur du cadre — 316,7 pour 317 — et le moindre arrondi du rendu
 * le faisait passer a la ligne : « ANAN / TA ». « tient » dit si le nom
 * entre sur une ligne ; tant qu il entre, le composant interdit la
 * coupure. */

interface Options {
  texte: string;
  /** La famille CSS, telle que « familleDeLaPolice » la rend. */
  famille: string;
  graisse?: number;
  /** L interlettrage, en « em ». */
  espacement?: number;
  majuscules?: boolean;
  /** La part de la largeur du cadre que le nom doit occuper. */
  part?: number;
  min: number;
  max: number;
}

export function useTailleDuNom<T extends HTMLElement>({
  texte, famille, graisse = 900, espacement = 0, majuscules = true, part = 1, min, max,
}: Options) {
  const cadre = useRef<T>(null);
  const [taille, setTaille] = useState(max);
  const [tient, setTient] = useState(true);

  useEffect(() => {
    const el = cadre.current;
    const toile = document.createElement("canvas").getContext("2d");
    if (!el || !toile) return;
    const mot = majuscules ? texte.toLocaleUpperCase("fr-FR") : texte;
    const police = `${graisse} 100px ${famille}`;
    let vivant = true;

    const mesurer = () => {
      if (!vivant) return;
      toile.font = police;
      const a100 = toile.measureText(mot).width + espacement * 100 * [...mot].length;
      const style = getComputedStyle(el);
      const dispo = (el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) * part;
      if (a100 <= 0 || dispo <= 0) return;
      const ideale = (dispo * 0.98 / a100) * 100;
      setTaille(Math.floor(Math.max(min, Math.min(max, ideale)) * 10) / 10);
      setTient(ideale >= min);
    };

    const suivi = new ResizeObserver(mesurer);
    suivi.observe(el);
    mesurer();
    document.fonts?.load(police, mot).then(mesurer, mesurer);
    return () => {
      vivant = false;
      suivi.disconnect();
    };
  }, [texte, famille, graisse, espacement, majuscules, part, min, max]);

  return { cadre, taille, tient };
}
