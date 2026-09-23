import type { ReactNode } from "react";
import type { IdAcces } from "@/domaines/accueil/logique/accesRapides";

/* LES SIX PICTOGRAMMES DES ACCES RAPIDES.
 *
 * Un trait, une epaisseur, des bouts ronds : le meme dessin sert de
 * tube de neon, de gravure et d icone d ecran selon la refonte qui le
 * pose. Il ne porte aucune couleur — « currentColor » — et c est la
 * refonte qui l allume.
 *
 * La sante est la croix des pharmacies : l enseigne la plus lisible
 * d une rue, la nuit. */

const TRACES: Readonly<Record<IdAcces, ReactNode>> = {
  objectif: (
    <>
      <circle cx="11" cy="13" r="8.5" />
      <circle cx="11" cy="13" r="4" />
      <path d="M11 13 21.5 2.5M17 2.5h4.5V7" />
    </>
  ),
  taches: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="m7.5 12.5 3 3 6-6.5" />
    </>
  ),
  journal: (
    <>
      <path d="M12 6.5C9.5 4.8 6.2 4.5 3 5.3v13.5c3.2-.8 6.5-.5 9 1.2 2.5-1.7 5.8-2 9-1.2V5.3c-3.2-.8-6.5-.5-9 1.2Z" />
      <path d="M12 6.5V20" />
    </>
  ),
  sante: (
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z" />
  ),
  revue: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
      <path d="m8.5 15 2.5 2.5 4.5-4.5" />
    </>
  ),
  tirage: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.3" cy="8.3" r="1.1" fill="currentColor" />
      <circle cx="15.7" cy="8.3" r="1.1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      <circle cx="8.3" cy="15.7" r="1.1" fill="currentColor" />
      <circle cx="15.7" cy="15.7" r="1.1" fill="currentColor" />
    </>
  ),
};

export function PictogrammeDAcces({ id, taille = 24, epaisseur = 1.7, className }: {
  id: IdAcces;
  taille?: number;
  epaisseur?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRACES[id]}
    </svg>
  );
}
