import { lazy, Suspense } from "react";
import { SpaceBackdrop } from "@/socle/ds/SpaceBackdrop";
import { PROPOSITIONS, type IdDuFond } from "@/socle/ds/fonds/catalogue";
import type { MesureDuRendu } from "@/socle/ds/fonds/useRenduDuFond";
import "@/socle/ds/fonds/fond-vivant.css";

/* UN FOND, PAR SON NOM.
 *
 * Le tableau de bord, l apercu des options et le banc demandent tous un
 * fond par son identifiant ; c est ici qu il devient un composant.
 *
 * CHAQUE FOND EST CHARGE A LA DEMANDE. Les shaders, les soixante mille
 * graines de l essaim, le catalogue de l atlas : rien de cela ne doit
 * peser sur quelqu un qui garde le ciel classique — et c est le cas par
 * defaut. Un choix ne telecharge que lui-meme, la premiere fois.
 *
 * EN CADRE, le fond se peint dans son conteneur au lieu de couvrir
 * l ecran : c est l apercu des options. Voir la feuille. */

const FondNebuleuse = lazy(() => import("@/socle/ds/fonds/FondShader").then((m) => ({ default: m.FondNebuleuse })));
const FondHorizon = lazy(() => import("@/socle/ds/fonds/FondShader").then((m) => ({ default: m.FondHorizon })));
const FondAurore = lazy(() => import("@/socle/ds/fonds/FondShader").then((m) => ({ default: m.FondAurore })));
const FondOrbite = lazy(() => import("@/socle/ds/fonds/FondShader").then((m) => ({ default: m.FondOrbite })));
const FondEssaim = lazy(() => import("@/socle/ds/fonds/FondEssaim").then((m) => ({ default: m.FondEssaim })));
const FondDerive = lazy(() => import("@/socle/ds/fonds/FondDerive").then((m) => ({ default: m.FondDerive })));
const FondConstellation = lazy(() =>
  import("@/socle/ds/fonds/FondConstellation").then((m) => ({ default: m.FondConstellation })));
const FondAtlas = lazy(() => import("@/socle/ds/fonds/FondAtlas").then((m) => ({ default: m.FondAtlas })));

/** Le sceau d un pacte, tel que `rosaceDuPacte` le rend. */
export interface SceauDuPacte {
  ordre: number;
  pas: number;
  medaillons: readonly { valeur: string; sommet: number }[];
}

/* Un pacte pas encore charge : un ciel sans sceau, qui se tracera
   quand ses donnees arriveront. */
const SANS_SCEAU: SceauDuPacte = { ordre: 0, pas: 1, medaillons: [] };

interface Props {
  id: IdDuFond;
  /** La teinte du pacte, en hexadecimal. */
  teinte: string;
  intensite?: number;
  /** Faux : une image fixe. Le mouvement reduit, lui, est lu par la boucle. */
  mouvement?: boolean;
  sceau?: SceauDuPacte;
  /** La part des objectifs accomplis, de 0 a 1 : ce qui allume le sceau. */
  progression?: number;
  /** L atlas en encre sur papier. */
  jour?: boolean;
  cadre?: boolean;
  surMesure?: (m: MesureDuRendu) => void;
  surCarte?: (nom: string | null) => void;
}

export function FondVivant({
  id, teinte, intensite = 0.7, mouvement = true, sceau = SANS_SCEAU, progression = 0,
  jour = false, cadre = false, surMesure, surCarte,
}: Props) {
  const cadence = PROPOSITIONS.find((p) => p.id === id)?.cadence || 30;
  const commun = { teinte, intensite, mouvement, cadence, surMesure, surCarte };
  const dessin = { ordre: sceau.ordre, pas: sceau.pas, medaillons: sceau.medaillons, progression };

  const fond = (() => {
    switch (id) {
      case "classique": return <SpaceBackdrop />;
      case "nebuleuse": return <FondNebuleuse {...commun} />;
      case "horizon": return <FondHorizon {...commun} />;
      case "constellation": return <FondConstellation {...commun} {...dessin} />;
      case "derive": return <FondDerive {...commun} />;
      case "aurore": return <FondAurore {...commun} />;
      case "orbite": return <FondOrbite {...commun} />;
      case "essaim": return <FondEssaim {...commun} />;
      case "atlas": return <FondAtlas {...commun} {...dessin} jour={jour} />;
    }
  })();

  return (
    <div className="fond-du-ciel" data-cadre={cadre ? "" : undefined}>
      <Suspense fallback={<div className="fond-vivant fond-vivant--attente" />}>{fond}</Suspense>
    </div>
  );
}
