/**
 * REPRENDRE LA PAGE OU ON L AVAIT LAISSEE.
 *
 * L onglet, la page et la recherche se gardent dans useGoalFilters :
 * ce sont des etats que ce hook-la possede. Le defilement, lui,
 * n appartient a personne — c est une propriete du document. Il se
 * garde donc a part.
 *
 * DEUX PIEGES, TOUS DEUX MESURES.
 *
 * Entrer dans un objectif remet le document en haut. Cette remise a
 * zero declenche un evenement de defilement alors que la page de
 * liste est encore montee : l ecouteur enregistrait donc « 0 » au
 * moment precis ou l on quittait, et detruisait la position qu il
 * venait de garder. Releve avant correction : la memoire tombait a
 * « 0 » a chaque depart, et ce qui revenait a l ecran etait la valeur
 * de l avant-derniere visite. On ne note donc que tant que l adresse
 * est encore celle de la liste — au depart, elle a deja change.
 *
 * On ne restaure qu une fois par montage, et pas avant que la page
 * ait la hauteur voulue : demander un defilement de trois cents
 * pixels a une page qui n en fait pas encore autant fait ecreter la
 * valeur en silence. On attend donc que la course disponible suffise,
 * sur quelques images au plus, plutot que de parier sur un delai.
 */
import { useEffect, useRef } from "react";

const CLE = "goals-page-scroll";
const IMAGES_MAX = 12;

export function useRepriseDefilement(pret: boolean, chemin: string) {
  const restaure = useRef(false);

  useEffect(() => {
    if (!pret || restaure.current) return;
    restaure.current = true;

    let y = 0;
    try {
      y = Number(sessionStorage.getItem(CLE) || 0);
    } catch { /* un stockage refuse ne doit pas casser la page */ }
    if (y <= 0) return;

    let image = 0;
    const viser = () => {
      const doc = document.scrollingElement;
      if (!doc) return;
      const course = doc.scrollHeight - doc.clientHeight;
      if (course >= y || image >= IMAGES_MAX) {
        doc.scrollTop = y;
        return;
      }
      image += 1;
      requestAnimationFrame(viser);
    };
    requestAnimationFrame(viser);
  }, [pret]);

  useEffect(() => {
    let demande = 0;
    const noter = () => {
      /* Le depart vers un objectif remet la page en haut. A cet
         instant l adresse a deja change : c est ce qui distingue un
         vrai defilement de l utilisateur de la remise a zero du
         changement de page. */
      if (window.location.pathname !== chemin) return;
      if (demande) return;
      demande = requestAnimationFrame(() => {
        demande = 0;
        const doc = document.scrollingElement;
        if (!doc || window.location.pathname !== chemin) return;
        try {
          sessionStorage.setItem(CLE, String(Math.round(doc.scrollTop)));
        } catch { /* idem */ }
      });
    };

    window.addEventListener("scroll", noter, { passive: true });
    return () => {
      window.removeEventListener("scroll", noter);
      if (demande) cancelAnimationFrame(demande);
    };
  }, [chemin]);
}
