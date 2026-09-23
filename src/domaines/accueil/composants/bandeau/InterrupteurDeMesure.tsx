import { useEffect, useRef, useState } from "react";
import { useCompteur } from "@/domaines/accueil/hooks/useCompteur";
import type { IdInterrupteur } from "@/domaines/accueil/logique/interrupteurs";
import type { Lecture } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/interrupteur-de-mesure.css";
import { CommandeDeMesure } from "@/domaines/accueil/composants/bandeau/interrupteurs/CommandeDeMesure";

/* LE COMPTEUR ET SA COMMANDE.
 *
 * ═══ POURQUOI PLUS DE PLAQUE ═══
 *
 * La bascule entre objectifs atteints et etapes franchies etait une
 * plaque emaillee. Elle ne disait pas qu on pouvait appuyer dessus, et
 * rien ne se passait entre les deux etats : le chiffre sautait.
 *
 * C est desormais un OBJET QUI SE MANOEUVRE, visse au mur a cote du
 * pourcentage — un levier, une cle, des touches de poste… sept modeles,
 * dans « interrupteurs/ », que l utilisateur choisit au banc. Un objet
 * qui se manoeuvre dit de lui-meme qu il se manoeuvre.
 *
 * ═══ LA BASCULE EST UNE COUPURE DE COURANT ═══
 *
 * L objet bouge, l etiquette quittee gresille et s eteint, l autre
 * s amorce. Le pourcentage baisse de tension, son compteur defile de
 * l ancienne valeur a la nouvelle, puis le tube se rallume. Moins
 * d une seconde, et chaque etape dit quelque chose : on a coupe, on a
 * change de registre, c est reparti.
 *
 * Ce conteneur porte ce qui ne depend pas du modele : « data-mesure »
 * (la position), « data-tour » (au moins une bascule depuis le
 * montage : les mouvements de bascule remplacent ceux de l allumage),
 * et le chiffre, qui se remonte a chaque bascule (« key ») — c est ce
 * qui rejoue son animation.
 */

export function InterrupteurDeMesure({
  lecture, onChanger, famille, modele = "levier",
}: {
  lecture: Lecture;
  onChanger?: () => void;
  famille: string;
  modele?: IdInterrupteur;
}) {
  const affiche = useCompteur(lecture.progression, 640);
  const [tour, setTour] = useState(0);
  const derniere = useRef(lecture.mesure);
  useEffect(() => {
    if (derniere.current === lecture.mesure) return;
    derniere.current = lecture.mesure;
    setTour((t) => t + 1);
  }, [lecture.mesure]);

  return (
    <div className="en-compteur" data-mesure={lecture.mesure} data-tour={tour || undefined} data-modele={modele}>
      <span key={tour} className="en-chiffre" style={{ fontFamily: famille }} aria-hidden="true">
        {Math.round(affiche)}<small>%</small>
      </span>
      {/* Le lecteur d ecran entend la valeur d arrivee, pas le defilement. */}
      <span className="en-lu" aria-live="polite">{lecture.progression} % des {lecture.mesureLue}</span>
      <CommandeDeMesure
        modele={modele}
        objectifs={lecture.mesure !== "steps"}
        onChanger={onChanger}
        lecture={lecture}
      />
    </div>
  );
}
