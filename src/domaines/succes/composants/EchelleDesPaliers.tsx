import { useTranslation } from "react-i18next";
import { MoreVertical, Edit2, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/socle/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/socle/ui/dropdown-menu";
import { RankCore } from "@/domaines/succes/composants/RankCore";
import { construireLEchelle } from "@/domaines/succes/logique/echelleDesPaliers";
import { teinteDuPalier } from "@/domaines/succes/logique/teinte";
import type { Rank } from "@/domaines/succes/types";
import "@/domaines/succes/rang.css";

interface Props {
  paliers: Rank[];
  currentXP: number;
  totalMaxXP: number;
  /** Le niveau du palier courant — le meme calcul que partout ailleurs. */
  niveau: number;
  onModifier?: (palier: Rank) => void;
  onSupprimer?: (palier: Rank) => void;
}

/**
 * L ECHELLE DES PALIERS.
 *
 * Une seule representation, la ou il y en avait trois. Elle se lit EN
 * MONTANT : le plus haut seuil en tete, le premier en bas, et l ecart
 * au palier precedent ecrit sur le montant qui les relie.
 *
 * La position courante est MARQUEE sur l echelle — un lisere a gauche
 * du barreau — au lieu d etre repetee dans une carte separee au-dessus.
 *
 * Le plafond atteignable est le haut de l echelle : un palier pose
 * au-dessus se VOIT hors de portee, au lieu d etre refuse par une
 * notification apres coup.
 *
 * Chaque barreau porte son noyau, dans le troisieme cran de taille.
 * `RankCard` n existe plus : le noyau tient les deux roles.
 */
export function EchelleDesPaliers({
  paliers, currentXP, totalMaxXP, niveau, onModifier, onSupprimer,
}: Props) {
  const { t } = useTranslation();
  const echelle = construireLEchelle(paliers, currentXP, totalMaxXP);

  return (
    <ol className="rg-echelle" aria-label={t("ranks.titre")}>
      {echelle.barreaux.map((b, i) => {
        const teinte = teinteDuPalier(b.palier);
        const dernier = i === echelle.barreaux.length - 1;
        return (
          <li key={b.palier.id}>
            <div
              className="rg-barreau"
              data-courant={b.courant ? "1" : undefined}
              data-hors={b.horsDePortee ? "1" : undefined}
              style={teinte ? { ["--rg-teinte" as string]: teinte } : undefined}
            >
              <RankCore
                taille="echelle"
                level={b.courant ? niveau : echelle.barreaux.length - i}
                rankName=""
                logoUrl={b.palier.logo_url}
                teinte={teinte}
                progress={b.avancement}
                currentXP={0}
                targetXP={0}
                pied={false}
              />

              <div className="rg-barreau-corps">
                <div className="flex items-center gap-2">
                  <span className="rg-barreau-nom">{b.palier.name}</span>
                  {b.courant && (
                    <span className="ds-t-label font-mono uppercase tracking-wider text-primary">
                      {t("ranks.vousEtesIci")}
                    </span>
                  )}
                  {b.horsDePortee && (
                    <span
                      className="flex items-center gap-1 ds-t-label font-mono uppercase tracking-wider text-muted-foreground"
                      title={t("ranks.horsDePorteeAide")}
                    >
                      <TriangleAlert className="h-3 w-3" />
                      {t("ranks.horsDePortee")}
                    </span>
                  )}
                </div>
                <div className="ds-t-label font-mono tracking-wider text-muted-foreground tabular-nums">
                  {t("ranks.seuil", { n: b.palier.min_points.toLocaleString("fr-FR") })}
                </div>
                <div className="rg-jauge" aria-hidden="true">
                  <i style={{ width: `${b.avancement}%` }} />
                </div>
              </div>

              {(onModifier || onSupprimer) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t("ranks.actions", { nom: b.palier.name })}
                      className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 border-primary/30 bg-card">
                    {onModifier && (
                      <DropdownMenuItem onClick={() => onModifier(b.palier)} className="cursor-pointer gap-2">
                        <Edit2 className="h-3.5 w-3.5" />{t("ranks.modifier")}
                      </DropdownMenuItem>
                    )}
                    {onSupprimer && (
                      <DropdownMenuItem
                        onClick={() => onSupprimer(b.palier)}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />{t("ranks.supprimer")}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Le montant qui relie ce barreau au precedent porte l ecart.
                Le dernier n a rien sous lui. */}
            {!dernier && b.ecart !== null && (
              <div className="rg-montant">
                <span className="ds-t-label font-mono tracking-wider text-muted-foreground tabular-nums">
                  {t("ranks.ecart", { n: b.ecart.toLocaleString("fr-FR") })}
                </span>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
