/**
 * Un pli de la bande de pied.
 *
 * Notes, contrats, dependances : ils existent, mais ils ne meritent
 * pas un panneau plein chacun tant qu ils sont vides. Trois barres de
 * trente-quatre pixels remplacent trois cartes.
 */
import React, { useId, useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface Props {
  nom: string;
  icone: LucideIcon;
  compte?: string | number;
  ouvertParDefaut?: boolean;
  children: React.ReactNode;
}

export function DossierPli({ nom, icone: Icone, compte, ouvertParDefaut = false, children }: Props) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut);
  const idCorps = useId();

  return (
    <div>
      <button
        type="button"
        className="gd-pli"
        aria-expanded={ouvert}
        aria-controls={idCorps}
        onClick={() => setOuvert((v) => !v)}
      >
        <ChevronRight size={13} aria-hidden="true" />
        <Icone size={13} aria-hidden="true" />
        {nom}
        {compte !== undefined && <b>{compte}</b>}
      </button>
      {ouvert && (
        <div className="gd-pli-corps" id={idCorps}>
          {children}
        </div>
      )}
    </div>
  );
}
