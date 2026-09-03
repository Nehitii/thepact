import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { TexteEcrit } from "@/domaines/onboarding/composants/TexteEcrit";

interface Props {
  /** Ce que le systeme constate. Vide : il ne dit rien. */
  texte: string;
}

/**
 * LE TEMOIN.
 *
 * Le systeme accuse reception. Pas un message de succes, pas une
 * felicitation : un CONSTAT, dans son registre — froid, procedural,
 * en Orbitron et en capitales. « > PORTEUR ENREGISTRE : NEHITI. »
 *
 * C EST CE QUI TIENT LA PLACE DE M.I.A. PENDANT LA FORGE. Elle n arrive
 * qu apres le pacte, dans le noir qui suit — c est une decision de la
 * spec, et la bonne. Mais cinq ecrans ou personne ne repond ne sont
 * pas dramatiques, ils sont administratifs. Une machine qui accuse
 * reception sans jamais s adresser a personne, six ecrans durant :
 * c est exactement ce qui fait que « Il y a quelqu un. » tombe.
 *
 * IL S ECRIT UNE FOIS. La ligne se tape lettre a lettre quand elle
 * parait ; ensuite elle SUIT ce qu on tape — le nom change dans la
 * ligne sans qu elle se reecrive a chaque touche. Le texte entier est
 * donne aux lecteurs d ecran d un bloc, hors de la frappe.
 */
export function Temoin({ texte }: Props) {
  const [ecrit, setEcrit] = useState(false);
  const ligne = useRef<HTMLParagraphElement>(null);
  const sobre = useReducedMotion();

  /* La ligne qui s efface se retapera quand elle reviendra. */
  useEffect(() => {
    if (!texte) setEcrit(false);
  }, [texte]);

  /* IL SE FAIT VOIR QUAND IL PARLE. La voie a une hauteur fixe et son
     corps defile : sur l ecran du sceau, le temoin tombait SOUS LE PLI —
     le systeme repondait hors de vue. « nearest » ne bouge rien quand
     la ligne est deja visible. */
  useEffect(() => {
    if (!texte) return;
    ligne.current?.scrollIntoView({ block: "nearest", behavior: sobre ? "auto" : "smooth" });
  }, [texte, sobre]);

  if (!texte) return null;

  return (
    <p className="ob-temoin" role="status" ref={ligne}>
      <span className="sr-only">{texte}</span>
      <span aria-hidden="true">
        {ecrit ? texte : <TexteEcrit texte={texte} cadence={16} onFini={() => setEcrit(true)} />}
      </span>
    </p>
  );
}
