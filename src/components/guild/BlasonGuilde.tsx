import type { CSSProperties, ReactNode } from "react";
import { emblemeDe, teinteDe } from "@/components/guild/blason";

/* L IDENTITE VISUELLE D UNE GUILDE, EN UN SEUL ENDROIT.
 *
 * Elle etait dessinee a la main dans la page de guilde, et nulle part
 * ailleurs : la liste des guildes de Friends montrait une couronne
 * dans un carre teinte, sans banniere ni embleme, alors que la guilde
 * en avait. Une seule definition, quatre consommateurs — la page, la
 * liste, l apercu des reglages, la modale de fondation.
 *
 * TROIS POSES, parce qu une seule ne va pas a toutes les images :
 *
 *   coin   · l embleme mord le coin bas-gauche. Le nom a cote. C est
 *            la disposition d un profil : elle laisse la banniere
 *            entiere et respecte les images larges.
 *   centre · l embleme est pose au milieu du bord bas, le nom dessous,
 *            centre. C est un ecu. Une banniere dont le sujet occupe
 *            le centre se fait mordre — a choisir en connaissance.
 *   ruban  · la banniere se reduit a un bandeau de couleur, l embleme
 *            precede le nom sur une seule ligne. Pour une guilde sans
 *            banniere, ou pour une liste ou la hauteur compte.
 *
 * L EMBLEME DETOURE. Un fichier transparent laissait voir le gris de
 * l application. La plaque prend la couleur choisie, ou reste neutre.
 */

export interface IdentiteGuilde {
  name: string;
  icon: string | null;
  color: string | null;
  banner_url: string | null;
  emblem_url: string | null;
  emblem_bg: string | null;
  blason_pose: string;
  description?: string | null;
}

interface Props {
  guilde: IdentiteGuilde;
  /* « grand » pour la page, « moyen » pour une liste, « petit » pour un
     apercu de formulaire. */
  taille?: "grand" | "moyen" | "petit";
  /* Ce qui s affiche sous le nom : membres, role, jauge… */
  enfants?: ReactNode;
  /* Ce qui se pose a droite du nom : un bouton, une action. */
  aDroite?: ReactNode;
  /* Force une pose, quand le contexte l impose (une liste veut du
     compact quoi qu ait choisi la guilde). */
  pose?: "coin" | "centre" | "ruban";
  className?: string;
}

export function BlasonGuilde({
  guilde, taille = "grand", enfants, aDroite, pose, className,
}: Props) {
  const Embleme = emblemeDe(guilde.icon);
  const teinte = teinteDe(guilde.color);
  const disposition = pose ?? (guilde.blason_pose as "coin" | "centre" | "ruban") ?? "coin";

  const style = {
    "--gu-teinte": teinte,
    ...(guilde.emblem_bg ? { "--gu-fond-embleme": guilde.emblem_bg } : {}),
  } as CSSProperties;

  return (
    <div
      className={className ? `gu-identite ${className}` : "gu-identite"}
      data-pose={disposition}
      data-taille={taille}
      style={style}
    >
      <div className="gu-banniere">
        {guilde.banner_url && disposition !== "ruban" && (
          <img src={guilde.banner_url} alt="" aria-hidden="true" loading="lazy" />
        )}
        <span className="gu-banniere-voile" aria-hidden="true" />
      </div>

      <header className="gu-tete">
        <span className="gu-blason" data-detoure={guilde.emblem_url ? "" : undefined}>
          {guilde.emblem_url
            ? <img src={guilde.emblem_url} alt="" aria-hidden="true" />
            : <Embleme aria-hidden="true" />}
        </span>

        <div className="gu-titres">
          <h1 className="gu-nom">{guilde.name}</h1>
          {guilde.description && <p className="gu-mot">{guilde.description}</p>}
          {enfants}
        </div>

        {aDroite}
      </header>
    </div>
  );
}
