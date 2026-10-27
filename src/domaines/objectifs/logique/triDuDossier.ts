/* LE TRI DU DOSSIER, SES ICONES, ET LE RANG A DEUX CHIFFRES.
 *
 * Sortis de `DossierVolets.tsx` pour la meme raison que les canaux de
 * raid : des constantes exportees a cote de composants cassent le Fast
 * Refresh. Ils sont lus par les deux volets qui trient.
 */
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ListOrdered } from "lucide-react";

export const deuxChiffres = (n: number) => String(n).padStart(2, "0");

export const TRIS = ["ordre", "avance", "retard"] as const;

export type Tri = (typeof TRIS)[number];

export const ICONE_TRI = {
  ordre: ListOrdered,
  avance: ArrowDownWideNarrow,
  retard: ArrowUpNarrowWide,
} as const;
