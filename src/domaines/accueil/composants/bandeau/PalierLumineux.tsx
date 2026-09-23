import type { CSSProperties } from "react";
import { normaliserTeinte } from "@/domaines/succes";
import { useCadrageDeLImage } from "@/domaines/accueil/hooks/useCadrageDeLImage";
import { placement } from "@/domaines/accueil/logique/cadrage";
import type { ProprietesDuBandeau } from "@/domaines/accueil/types";
import { nombre } from "@/domaines/accueil/composants/bandeau/lecture";
import "@/domaines/accueil/composants/bandeau/palier-lumineux.css";

/* LE PALIER, RETROECLAIRE.
 *
 * ═══ POURQUOI PLUS DE DISQUE ═══
 *
 * Le premier caisson posait l embleme sur un disque, dans un anneau :
 * l image occupait 76 % d un disque qui occupait 74 % du caisson — un
 * peu plus de la moitie de la place. Et l embleme de l utilisateur
 * portait sa propre marge transparente, qui mangeait le reste. Il
 * paraissait « trop petit dans son cercle ».
 *
 * L embleme est desormais LE SIGNE LUI-MEME, comme un logo de facade
 * eclaire par l arriere : il est pose seul sur le mur, a pleine taille,
 * et la lumiere deborde autour de sa silhouette. On mesure ou est son
 * dessin dans l image (« useCadrageDeLImage ») et on le pose pour que
 * le dessin — pas la marge — remplisse la place.
 *
 * Sans embleme, c est le niveau qui prend la place, en grands chiffres
 * de neon.
 *
 * L AVANCEMENT DANS LE PALIER EST UNE RANGEE D AMPOULES : dix, une par
 * dixieme, allumees une a une a l ouverture — les ampoules d un fronton
 * de theatre. L anneau du caisson disait la meme chose en moins lisible.
 */

const AMPOULES = 10;

export function PalierLumineux({ p, famille, tube }: { p: ProprietesDuBandeau; famille: string; tube: string }) {
  const teinte = normaliserTeinte(p.rankTeinte) ?? tube;
  const avance = Math.min(100, Math.max(0, p.rankProgress ?? 0));
  const allumees = Math.round((avance / 100) * AMPOULES);
  const embleme = p.rankLogoUrl || null;
  const cadre = useCadrageDeLImage(embleme);
  const pose = cadre ? placement(cadre.boite, cadre.largeur, cadre.hauteur, 1, 0.96) : null;
  const suite = p.nextRankName
    ? ` ${nombre(p.rankXP ?? 0)} sur ${nombre(p.rankXPTarget ?? 0)} XP avant ${p.nextRankName}.`
    : "";

  return (
    <div className="en-rang" style={{ "--en-rang": teinte } as CSSProperties}>
      <p className="en-lu">
        Niveau {p.level}{p.rankName && `, ${p.rankName}`} : {Math.round(avance)} % du palier.{suite}
      </p>
      <div className="en-logo" data-embleme={embleme ? "1" : undefined} aria-hidden="true">
        {embleme ? (
          <img
            className="en-logo-image"
            src={embleme}
            alt=""
            decoding="async"
            style={pose ? {
              width: `${pose.largeur}%`,
              height: `${pose.hauteur}%`,
              left: `${pose.gauche}%`,
              top: `${pose.haut}%`,
            } : undefined}
          />
        ) : (
          <span className="en-logo-niveau" style={{ fontFamily: famille }}>
            <small>Niveau</small>{p.level}
          </span>
        )}
      </div>
      <div className="en-rang-textes" aria-hidden="true">
        {embleme && (
          <p className="en-niveau" style={{ fontFamily: famille }}><small>Niv</small>{p.level}</p>
        )}
        {p.rankName && <p className="en-palier">{p.rankName}</p>}
        <span className="en-ampoules">
          {Array.from({ length: AMPOULES }, (_, i) => (
            <i key={i} data-allumee={i < allumees || undefined} style={{ "--j": i } as CSSProperties} />
          ))}
        </span>
      </div>
    </div>
  );
}
