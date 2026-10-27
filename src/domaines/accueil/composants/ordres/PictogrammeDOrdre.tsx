import type { ReactNode } from "react";

/* LES PICTOGRAMMES DES QUATRE GENRES D ORDRES.
 *
 * Le meme trait que ceux de la rue d enseignes — une epaisseur, des
 * bouts ronds, « currentColor » — pour que la barre et le panneau se
 * lisent d une seule main. Avancer un pas est un escalier, le rituel la
 * boucle qui revient, la conscience ecrite une plume, le focus un
 * sablier. Un genre inconnu prend une etoile. */

const TRACES: Readonly<Record<string, ReactNode>> = {
  complete_steps: <path d="M3 20h4.5v-4.5H12V11h4.5V6.5H21" />,
  log_habit: (
    <>
      <path d="M17 2.5 20.5 6 17 9.5" />
      <path d="M20.5 6H9a5 5 0 0 0-5 5v.5" />
      <path d="M7 21.5 3.5 18 7 14.5" />
      <path d="M3.5 18H15a5 5 0 0 0 5-5v-.5" />
    </>
  ),
  journal_entry: (
    <>
      <path d="M4 20.5 5 16 16.2 4.8a2.2 2.2 0 0 1 3.1 3.1L8 19.2Z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  focus_minutes: (
    <>
      <path d="M6 2.5h12M6 21.5h12" />
      <path d="M7.5 2.5c0 5 4.5 6.2 4.5 9.5s-4.5 4.5-4.5 9.5M16.5 2.5c0 5-4.5 6.2-4.5 9.5s4.5 4.5 4.5 9.5" />
    </>
  ),
};

const ETOILE = <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7Z" />;

export function PictogrammeDOrdre({ genre, taille = 24, epaisseur = 1.7, className }: {
  genre: string;
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
      {TRACES[genre] ?? ETOILE}
    </svg>
  );
}
