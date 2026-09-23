import { useEffect } from "react";

/* « ?mouvement=0 » : LE BANC S AFFICHE SANS MOUVEMENT.
 *
 * Il pose « data-reduce-motion="true" » sur la racine, comme le reglage
 * du profil : chaque variante s affiche d emblee dans son etat final.
 * C est ce qu il faut pour une capture — volet masque, les transitions
 * ne s achevent jamais.
 *
 * LE PROFIL ECRIT LE MEME ATTRIBUT. Quand la session charge le profil
 * apres le montage du banc, elle remet « false » par-dessus, et le banc
 * se rallume au milieu de la capture : il le reprend donc tant qu il est
 * monte. Au demontage, la racine retrouve la valeur qu elle avait. */
export function useSansMouvementAuBanc(actif: boolean) {
  useEffect(() => {
    if (!actif) return;
    const racine = document.documentElement;
    const avant = racine.getAttribute("data-reduce-motion");
    const imposer = () => {
      if (racine.getAttribute("data-reduce-motion") !== "true") racine.setAttribute("data-reduce-motion", "true");
    };
    imposer();
    const veille = new MutationObserver(imposer);
    veille.observe(racine, { attributes: true, attributeFilter: ["data-reduce-motion"] });
    return () => {
      veille.disconnect();
      if (avant === null) racine.removeAttribute("data-reduce-motion");
      else racine.setAttribute("data-reduce-motion", avant);
    };
  }, [actif]);
}
