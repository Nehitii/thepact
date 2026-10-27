/* RELEVÉ TÉLÉMÉTRIQUE
 *
 * Une ligne de donnees qui defile lentement en bas d'un bandeau.
 *
 * La regle qui gouverne ce composant : il n'affiche que des valeurs
 * calculees a partir de l'etat reel. Un faux releve — des chiffres
 * plausibles choisis pour faire technique — serait de la decoration
 * deguisee en information, et le premier coup d'oeil attentif la
 * demasquerait. Chaque segment passe par l'appelant, qui le derive de
 * ses propres donnees.
 *
 * Le contenu est duplique parce que le defilement est une boucle sans
 * couture : la piste fait deux fois la largeur, se translate de la
 * moitie, et repart. Sans le doublon on verrait un vide traverser.
 */

interface Props {
  /** Segments deja formates, dans l'ordre d'affichage. */
  segments: string[];
}

export function Telemetrie({ segments }: Props) {
  if (segments.length === 0) return null;
  const ligne = `${segments.join(" · ")} · `;

  return (
    <div className="cp-telemetrie" aria-hidden="true">
      <div className="cp-telemetrie-piste">
        <span>{ligne}</span>
        <span>{ligne}</span>
      </div>
    </div>
  );
}
