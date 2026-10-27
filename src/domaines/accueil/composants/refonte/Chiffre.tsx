import { useCompteur } from "@/domaines/accueil/composants/refonte/communs";

/** Un nombre pret a poser dans une phrase, qui roule quand il change.
 *  `depart` le fait compter depuis cette valeur au premier rendu. */
export function Chiffre({ valeur, format, depart, duree }: {
  valeur: number;
  format?: (n: number) => string;
  depart?: number;
  duree?: number;
}) {
  const n = useCompteur(valeur, duree, depart);
  return <>{format ? format(n) : Math.round(n).toLocaleString("fr-FR")}</>;
}
