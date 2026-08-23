import { Initiales, nomAffichable, teinteAvatar } from "./vocabulaire";

/* LA PASTILLE D UN MEMBRE.
 *
 * Elle etait ecrite trois fois — dans la ligne de classement, dans le
 * post, dans la video — avec chaque fois la meme logique et un rendu
 * legerement different. Une seule definition, et la teinte tiree de
 * l identifiant s applique partout du meme coup. */

interface Props {
  /** Sert a deriver la teinte : stable, propre a chaque membre. */
  identifiant?: string | null;
  nom?: string | null;
  image?: string | null;
  petite?: boolean;
  repli?: string;
}

export function Pastille({ identifiant, nom, image, petite = false, repli = "··" }: Props) {
  const classe = petite ? "co-avatar co-avatar--petit" : "co-avatar";

  if (image) {
    return <img className={classe} src={image} alt="" loading="lazy" />;
  }

  const teinte = teinteAvatar(identifiant || nom);
  return (
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
}
