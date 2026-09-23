import { useEffect, useRef, useState } from "react";
import { useCompteur } from "@/domaines/accueil/hooks/useCompteur";
import type { Lecture } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/interrupteur-de-mesure.css";

/* L INTERRUPTEUR DE MESURE.
 *
 * ═══ POURQUOI PLUS DE PLAQUE ═══
 *
 * La bascule entre objectifs atteints et etapes franchies etait une
 * plaque emaillee. Elle ne disait pas qu on pouvait appuyer dessus, et
 * rien ne se passait entre les deux etats : le chiffre sautait.
 *
 * C est desormais un INTERRUPTEUR A LEVIER, avec ses deux positions
 * ecrites en tubes de neon. Le levier montre l etiquette allumee : en
 * haut les objectifs, en bas les etapes. Un objet qui se manoeuvre dit
 * de lui-meme qu il se manoeuvre.
 *
 * ═══ LA BASCULE EST UNE COUPURE DE COURANT ═══
 *
 * Le levier claque en passant devant — a mi-course on ne voit que sa
 * bille. L etiquette quittee gresille et s eteint, l autre s amorce.
 * Le pourcentage baisse de tension, son compteur defile de l ancienne
 * valeur a la nouvelle, puis le tube se rallume. Moins d une seconde,
 * et chaque etape dit quelque chose : on a coupe, on a change de
 * registre, c est reparti.
 *
 * Le chiffre se remonte a chaque bascule (« key ») : c est ce qui
 * rejoue son animation. Le premier montage garde l allumage de
 * l enseigne.
 */

export function InterrupteurDeMesure({
  lecture, onChanger, famille,
}: {
  lecture: Lecture;
  onChanger?: () => void;
  famille: string;
}) {
  const affiche = useCompteur(lecture.progression, 640);
  const [tour, setTour] = useState(0);
  const derniere = useRef(lecture.mesure);
  useEffect(() => {
    if (derniere.current === lecture.mesure) return;
    derniere.current = lecture.mesure;
    setTour((t) => t + 1);
  }, [lecture.mesure]);
  const objectifs = lecture.mesure !== "steps";

  const levier = (
    <>
      <span className="en-interrupteur" aria-hidden="true">
        <i className="en-vis" />
        <i className="en-vis" />
        <span className="en-manette" />
        <span className="en-bague" />
      </span>
      <span className="en-positions" aria-hidden="true">
        <span className="en-position" data-actif={objectifs || undefined}>Objectifs atteints</span>
        <span className="en-position" data-actif={!objectifs || undefined}>Étapes franchies</span>
      </span>
    </>
  );

  return (
    <div className="en-compteur" data-mesure={lecture.mesure} data-tour={tour || undefined}>
      <span key={tour} className="en-chiffre" style={{ fontFamily: famille }} aria-hidden="true">
        {Math.round(affiche)}<small>%</small>
      </span>
      {/* Le lecteur d ecran entend la valeur d arrivee, pas le defilement. */}
      <span className="en-lu" aria-live="polite">{lecture.progression} % des {lecture.mesureLue}</span>
      {onChanger ? (
        <button
          type="button"
          className="en-levier"
          onClick={onChanger}
          title={lecture.basculeLue}
          aria-label={lecture.basculeLue}
        >
          {levier}
        </button>
      ) : (
        <span className="en-levier">{levier}</span>
      )}
    </div>
  );
}
