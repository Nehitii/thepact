import type { ReactNode } from "react";

interface Props {
  /** Ce que la fenetre annonce, en tete — « SYSTEME », « PORTEUR »… */
  entete: string;
  children: ReactNode;
  /** Le refus prend le rouge : c est le seul moment ou la couleur change. */
  ton?: "normal" | "alerte";
}

/**
 * LA FENETRE DU SYSTEME.
 *
 * Le cadre a coins tronques de l ancienne etape 0, devenu la forme
 * unique du rite : tout ce que le SYSTEME dit passe par la, en
 * Orbitron. M.I.A., elle, parle sans cadre et en Rajdhani — deux
 * registres qu on ne melange jamais, sinon on ne sait plus qui parle.
 *
 * La coupe est un « clip-path », pas une bordure : une bordure
 * suivrait le rectangle et non les coins tronques. Le lisere est donc
 * un frere en dessous, decale d un pixel.
 */
export function FenetreSysteme({ entete, children, ton = "normal" }: Props) {
  /* L ENTETE EST LE TITRE DE L ECRAN, pas une decoration.
     Les huit ecrans du rite n en avaient AUCUN : pour un lecteur
     d ecran, chacun etait un bloc de texte sans hierarchie, et la
     navigation par titres ne menait nulle part. Un « h1 » par ecran —
     ils ne coexistent jamais, chacun EST sa page.
     Les crochets restent decoratifs : ils disent « le systeme parle »
     a l oeil, et n ont rien a dicter a la voix. */
  return (
    <section className="ob-fenetre" data-ton={ton}>
      <header>
        <h1 className="ob-fenetre-tete">
          <span aria-hidden="true">[</span>
          {entete}
          <span aria-hidden="true">]</span>
          <i aria-hidden="true" />
        </h1>
      </header>
      <div className="ob-fenetre-corps">{children}</div>
    </section>
  );
}
