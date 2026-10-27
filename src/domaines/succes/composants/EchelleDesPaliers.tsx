import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, TriangleAlert } from "lucide-react";
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
  /** L identifiant du palier ouvert a l edition, s il y en a un. */
  enEdition?: string | null;
  /** L editeur, rendu SOUS le barreau qu il modifie. */
  editeur?: ReactNode;
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
 * ═══ L EDITION SE FAIT SUR LE BARREAU, ET SANS DETOUR ═══
 *
 * L editeur s ouvrait en TETE du panneau. Modifier un palier du bas
 * obligeait donc a remonter, et le palier lui-meme — son embleme
 * compris — sortait de l ecran : on le modifiait a l aveugle.
 *
 * Il s ouvre desormais SOUS SON BARREAU, dans un tiroir qui se deplie.
 * Le barreau reste visible juste au-dessus, et comme l echelle recoit
 * le palier en cours d edition, il EST l apercu : le nom, la teinte et
 * l embleme s y voient changer a chaque frappe.
 *
 * ET IL N Y A PLUS DE MENU. Le barreau se clique — modifier etait la
 * seule action qu on voulait vraiment, et il fallait deux gestes pour
 * l atteindre. Ne restait au menu deroulant que la suppression : un
 * menu pour une seule entree est un detour a l ouverture comme a la
 * fermeture. Elle devient un bouton discret, qui parait quand la
 * souris est sur le barreau ou quand le clavier y entre.
 */
export function EchelleDesPaliers({
  paliers, currentXP, totalMaxXP, niveau, enEdition, editeur, onModifier, onSupprimer,
}: Props) {
  const { t } = useTranslation();
  const echelle = construireLEchelle(paliers, currentXP, totalMaxXP);
  const ouvert = useRef<HTMLLIElement>(null);
  const liste = useRef<HTMLOListElement>(null);
  const positions = useRef(new Map<string, number>());

  /* Le barreau ouvert vient a l ecran s il n y est pas — c est la
     derniere chose qui pouvait encore obliger a chercher. */
  useEffect(() => {
    if (!enEdition) return;
    ouvert.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [enEdition]);

  /* ═══ LES BARREAUX GLISSENT A LEUR PLACE ═══
   *
   * Taper un seuil reordonne l echelle. Sans rien, les barreaux SAUTENT
   * d une position a l autre et l on perd de vue celui qu on deplace —
   * or c est justement le moment ou l on regarde.
   *
   * On releve donc leur position avant le rendu, on la compare apres,
   * et on rejoue l ecart A L ENVERS : chacun part d ou il etait et
   * rejoint sa nouvelle place. Rien n est anime en permanence, et rien
   * ne se declenche sans DEPLACEMENT reel.
   *
   * Sous `prefers-reduced-motion`, rien ne bouge du tout. Le halo du
   * noyau y est deja coupe, et ajouter du mouvement ici reviendrait a
   * defaire cette coupure par la bande.
   */
  useLayoutEffect(() => {
    const doux = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const avant = positions.current;
    const apres = new Map<string, number>();
    for (const element of Array.from(liste.current?.children ?? [])) {
      const li = element as HTMLElement;
      const cle = li.dataset.palier;
      if (!cle) continue;
      const y = li.getBoundingClientRect().top;
      apres.set(cle, y);
      const ancien = avant.get(cle);
      if (doux || ancien === undefined || Math.abs(ancien - y) < 1) continue;
      li.animate(
        [{ transform: "translateY(" + (ancien - y) + "px)" }, { transform: "none" }],
        { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
    positions.current = apres;
  });

  return (
    <ol className="rg-echelle" ref={liste} aria-label={t("ranks.titre")}>
      {echelle.barreaux.map((b, i) => {
        const teinte = teinteDuPalier(b.palier);
        const dernier = i === echelle.barreaux.length - 1;
        const edite = enEdition === b.palier.id;
        return (
          <li key={b.palier.id} data-palier={b.palier.id} ref={edite ? ouvert : undefined}>
            <div
              className="rg-barreau"
              data-courant={b.courant ? "1" : undefined}
              data-hors={b.horsDePortee ? "1" : undefined}
              data-edite={edite ? "1" : undefined}
              style={teinte ? { ["--rg-teinte" as string]: teinte } : undefined}
            >
              {/* Le barreau entier ouvre l edition. La porte est une
                  couche posee SOUS le contenu : un bouton qui
                  envelopperait les autres serait du balisage invalide,
                  et illisible au clavier. */}
              {onModifier && !edite && (
                <button
                  type="button"
                  className="rg-barreau-porte"
                  aria-label={t("ranks.modifierCePalier", { nom: b.palier.name })}
                  onClick={() => onModifier(b.palier)}
                />
              )}

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

              {/* LA SEULE ACTION QUI RESTAIT A DEMANDER. */}
              {onSupprimer && (
                <button
                  type="button"
                  className="rg-barreau-jeter"
                  aria-label={t("ranks.supprimerCePalier", { nom: b.palier.name })}
                  title={t("ranks.supprimer")}
                  onClick={() => onSupprimer(b.palier)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* L EDITEUR, DANS UN TIROIR QUI SE DEPLIE. Une grille de
                0fr a 1fr : la seule facon d animer une hauteur qu on ne
                connait pas d avance. */}
            <div className="rg-tiroir" data-ouvert={edite ? "1" : undefined}>
              <div>{edite && editeur}</div>
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
