/* Ce composant n avait aucun import : il ne dessine qu avec des
   classes, et ses classes vivaient dans une feuille globale portant le
   nom d un autre decor. Elles sont ici desormais, et elles arrivent
   avec lui. */
import "@/domaines/succes/rang.css";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { normaliserTeinte } from "@/domaines/succes/logique/teinte";

interface RankCoreProps {
  level: number;
  rankName: string;
  /* L IMAGE DU RANG, CHOISIE PAR L UTILISATEUR.
     `ranks.logo_url` est editable depuis les reglages du pacte et
     n avait jusqu ici aucun endroit ou s afficher : la carte publique
     retombait sur un bouclier generique, et le noyau du hub montrait le
     numero de niveau. Quand l image existe, elle prend le centre ; sinon
     le niveau reste. */
  logoUrl?: string | null;
  /* LA TEINTE DU PALIER.
     Le noyau ne connaissait que `--primary`, en dur dans la feuille :
     la lueur, les graduations, l arc et l ombre du logo etaient de la
     meme couleur pour tous les paliers, alors que chaque palier porte
     la sienne depuis toujours en base. Elle se pose ici en variable, et
     `--primary` reste le repli quand elle est absente ou illisible. */
  teinte?: string | null;
  /* « hub » : 7rem, le noyau du tableau de bord.
     « carte » : 5,5rem, le pied de la carte publique.
     « echelle » : 3,25rem, une ligne de l echelle des reglages. */
  taille?: "hub" | "carte" | "echelle";
  /** Rang suivant, ou null au palier maximal. */
  nextRankName?: string | null;
  /** Avancement dans le rang courant, en pourcentage. */
  progress: number;
  currentXP: number;
  targetXP: number;
  /** Le pied — XP et rang suivant. Absent sur l echelle, qui les dit deja. */
  pied?: boolean;
}

/**
 * Noyau de rang.
 *
 * Remplace le panneau de 355px qui repetait le nom du rang trois fois
 * et le niveau deja present dans les statistiques du hub, puis la ligne
 * discrete qui lui avait succede dans le coin du bandeau — trop maigre
 * pour ce qu'elle porte.
 *
 * Construit dans la grammaire de la Singularite : lueur qui respire,
 * graduations radiales, arc d'avancement en conic-gradient. L'XP est un
 * arc et non une barre, pour que la page montre toutes ses progressions
 * de la meme facon — du c(oe)ur d'etoile jusqu'aux quetes du jour.
 */
export function RankCore({
  level,
  rankName,
  logoUrl,
  teinte,
  taille = "hub",
  nextRankName,
  progress,
  currentXP,
  targetXP,
  pied = true,
}: RankCoreProps) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.max(0, progress));
  /* Une teinte illisible ne se pose pas : la variable reste absente et
     la feuille retombe sur `--primary`. C est ce qui rattrape les
     paliers enregistres avec l ancienne variable CSS. */
  const encre = normaliserTeinte(teinte);
  const style = {
    ...(encre ? { ["--rank-encre" as string]: encre } : {}),
  } as CSSProperties;

  return (
    <div className="rank-bloc" style={style}>
      <div className="rank-core" data-taille={taille} style={{ ["--rank-pct" as string]: `${pct}%` }}>
        <div className="rank-core-glow" aria-hidden="true" />
        <div className="rank-core-ticks" aria-hidden="true" />
        <div className="rank-core-arc" aria-hidden="true" />
        <div className="rank-core-center">
          {logoUrl ? (
            /* Le nom du rang est deja annonce juste dessous : l image
               n a rien a repeter. */
            <img className="rank-core-logo" src={logoUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <>
              <b>{level}</b>
              <i
                className="ds-t-label font-mono not-italic"
                style={{ letterSpacing: 3, color: "var(--nexus-text-dimmer)" }}
              >
                {t("ranks.noyau.niveau")}
              </i>
            </>
          )}
        </div>
      </div>

      <span className="rank-core-nom">{rankName}</span>

      {pied && (
        <span className="rank-core-pied">
          <span
            className="ds-t-label font-mono"
            style={{ letterSpacing: 1.4, color: "var(--nexus-text-dim)", fontVariantNumeric: "tabular-nums" }}
          >
            {currentXP.toLocaleString("fr-FR")}
            {targetXP > 0 && ` / ${targetXP.toLocaleString("fr-FR")}`} XP
          </span>
          <span
            className="ds-t-label font-mono truncate max-w-[10rem]"
            style={{ letterSpacing: 1.4, color: "var(--nexus-text-dimmer)" }}
          >
            {nextRankName
              ? t("ranks.noyau.prochain", { nom: nextRankName })
              : t("ranks.noyau.maximal")}
          </span>
        </span>
      )}
    </div>
  );
}
