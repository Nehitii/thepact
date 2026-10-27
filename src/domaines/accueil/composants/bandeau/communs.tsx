import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { PactVisual, RosaceDuPacte } from "@/domaines/objectifs";
import type { Lecture } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/bandeau.css";

/* LES DEUX COMPOSANTS QUE LES VARIANTES DU BANDEAU PARTAGENT : la
 * bascule de mesure et le sceau a n importe quelle taille. Ce qu elles
 * lisent en commun est dans « lecture.ts ». */

/**
 * LA BASCULE DE MESURE, dans la matiere de chaque variante.
 *
 * Le bandeau actuel laisse passer des objectifs atteints aux etapes
 * franchies en cliquant sur le pourcentage. Chaque variante garde ce
 * geste : c est un vrai bouton, qui repond au clavier et dit ce qu il
 * fait. Sans « onChanger », la valeur n est qu un texte — comme dans
 * le bandeau, ou la page decide si la bascule existe.
 */
export function BasculeDeMesure({
  lecture, onChanger, className, style, children,
}: {
  lecture: Lecture;
  onChanger?: () => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (!onChanger) return <span className={className} style={style}>{children}</span>;
  return (
    <button type="button" className={className} style={style} onClick={onChanger} title={lecture.basculeLue}>
      {children}
    </button>
  );
}

/**
 * Le sceau et l embleme, a n importe quelle taille.
 *
 * La rosace reserve en son centre une monture pour le logo : un disque
 * de 0,34 sur un rayon de 1,2, soit 28 % du diametre. « PactVisual »
 * ne connait que trois tailles, la plus petite de 64 px ; on le met
 * donc a l echelle de la monture, plutot que de laisser un logo de
 * 64 px deborder d un sceau de 90.
 */
export function SceauDuPacte({
  taille, nom, valeurs, version, part, elan, symbole, enCours = 0, className, style,
}: {
  /** En pixels. Absente, le sceau remplit son parent et se mesure. */
  taille?: number;
  nom: string;
  valeurs: readonly string[];
  version?: number;
  part: number;
  elan: number;
  symbole?: string;
  enCours?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const boite = useRef<HTMLDivElement>(null);
  const [cote, setCote] = useState(taille ?? 0);
  useEffect(() => {
    if (taille !== undefined) {
      setCote(taille);
      return;
    }
    const el = boite.current;
    if (!el) return;
    const suivi = new ResizeObserver(([e]) => setCote(e.contentRect.width));
    suivi.observe(el);
    return () => suivi.disconnect();
  }, [taille]);
  const echelle = (cote * 0.27) / 64;
  return (
    <div
      ref={boite}
      className={className}
      style={{ position: "relative", width: taille ?? "100%", height: taille ?? "100%", flex: "none", ...style }}
    >
      <RosaceDuPacte
        nom={nom}
        valeurs={valeurs}
        version={version}
        progression={part}
        elan={elan}
        alt={`Sceau de ${nom}`}
        className="bdx-rosace"
      />
      <div className="bdx-embleme" style={{ transform: `translate(-50%, -50%) scale(${echelle.toFixed(3)})` }}>
        <PactVisual
          symbol={symbole}
          size="sm"
          progress={part * 100}
          elan={elan}
          titre={enCours > 0
            ? `${enCours} ${enCours > 1 ? "objectifs en cours" : "objectif en cours"}`
            : "Aucun objectif en cours"}
        />
      </div>
    </div>
  );
}
