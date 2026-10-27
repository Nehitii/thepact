import { useEffect } from "react";

/**
 * Pose une feuille Google Fonts, une seule fois par adresse.
 *
 * LES BANCS SEULEMENT. La politique de securite admet
 * fonts.googleapis.com et fonts.gstatic.com ; le lien n est pose qu une
 * fois, et il reste — une police chargee ne coute plus rien. Une police
 * retenue pour de bon s embarque dans « public/fonts », comme les
 * quatre du titre : l application ne doit pas dependre d un tiers pour
 * ecrire le nom d un pacte.
 */
export function usePoliceDuBanc(href: string): void {
  useEffect(() => {
    if (document.querySelector(`link[data-police-du-banc="${href}"]`)) return;
    const lien = document.createElement("link");
    lien.rel = "stylesheet";
    lien.href = href;
    lien.dataset.policeDuBanc = href;
    document.head.appendChild(lien);
  }, [href]);
}
