import { computeFrameTransform } from "@/components/ui/unified-frame-renderer";
import type { Cadre } from "@/hooks/community/useCadres";
import { Initiales, nomAffichable, teinteAvatar } from "./vocabulaire";

/* LA PASTILLE D UN MEMBRE.
 *
 * Elle etait ecrite trois fois — dans la ligne de classement, dans le
 * post, dans la video — avec chaque fois la meme logique et un rendu
 * legerement different. Une seule definition, et la teinte tiree de
 * l identifiant s applique partout du meme coup.
 *
 * LE CADRE COSMETIQUE. L application entretient dix-sept cadres, que
 * la boutique vend et que le profil arbore ; Community les ignorait,
 * ici comme dans le classement. Le calcul de la transformation vient
 * de unified-frame-renderer — celui-la meme qui sert a la boutique, a
 * la salle d essayage et au profil : une decoration doit tomber au
 * meme endroit partout, sinon c est un autre cadre. */

interface Props {
  /** Sert a deriver la teinte : stable, propre a chaque membre. */
  identifiant?: string | null;
  nom?: string | null;
  image?: string | null;
  petite?: boolean;
  repli?: string;
  /** La decoration portee par ce membre, s il en a une. */
  cadre?: Cadre | null;
}

export function Pastille({ identifiant, nom, image, petite = false, repli = "··", cadre }: Props) {
  const classe = petite ? "co-avatar co-avatar--petit" : "co-avatar";
  const teinte = teinteAvatar(identifiant || nom);

  const rond = image ? (
    <img className={classe} src={image} alt="" loading="lazy" />
  ) : (
    <span
      className={classe}
      aria-hidden="true"
      style={{
        ["--co-avatar-fond" as string]: teinte.fond,
        ["--co-avatar-texte" as string]: teinte.texte,
      }}
    >
      {Initiales(nomAffichable(nom, repli))}
    </span>
  );

  if (!cadre) return rond;

  const { transform, transformOrigin } = computeFrameTransform({
    frameScale: cadre.echelle,
    frameOffsetX: cadre.decalageX,
    frameOffsetY: cadre.decalageY,
  });

  const bordure =
    cadre.montrerBordure && cadre.bordure
      ? { boxShadow: "0 0 0 2px " + cadre.bordure }
      : undefined;

  return (
    <span className={petite ? "co-cadre co-cadre--petit" : "co-cadre"}>
      {cadre.lueur && (
        <span className="co-cadre-lueur" style={{ background: cadre.lueur }} aria-hidden="true" />
      )}
      <span className="co-cadre-rond" style={bordure}>
        {rond}
      </span>
      {cadre.image && (
        <img
          className="co-cadre-deco"
          src={cadre.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ transform, transformOrigin }}
        />
      )}
    </span>
  );
}
