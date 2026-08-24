import { useTranslation } from "react-i18next";

/* UNE SEULE SOURCE POUR LES PROMESSES DES MODULES.
 *
 * Elles etaient ecrites deux fois, en anglais, avec des formulations
 * differentes : `ModuleCard` affichait « Track income & expenses
 * monthly » pendant que `ModulesShop` cherchait dans « Track income &
 * expenses ». Chercher une phrase visible a l ecran pouvait donc ne
 * rien trouver. Les deux lisent maintenant la meme liste traduite.
 *
 * Le module `wishlist` n etait present dans aucune des deux cartes :
 * il s affichait sans aucune promesse. */
export function useModuleFeatures() {
  const { t } = useTranslation();

  return (cle: string): string[] => {
    const lu = t(`shop.modules.features.${cle}`, { returnObjects: true });
    return Array.isArray(lu) ? (lu as string[]) : [];
  };
}
