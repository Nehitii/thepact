import type { ReactNode } from "react";

/* UNE BAIE DE L APPAREIL
 *
 * Un index, un nom, une ligne de conduite, une lecture a droite.
 * L index n est pas une decoration : les trois baies se lisent dans
 * l ordre — ou en est le pacte, quoi acheter, ce qui rentre et sort.
 */

interface BaieProps {
  index: string;
  nom: string;
  /** La lecture de droite : un chiffre, jamais une phrase. */
  lecture?: string;
  /** Un temoin qui bat, pour la baie qui suit une valeur vivante. */
  vivant?: boolean;
  children: ReactNode;
}

export function Baie({ index, nom, lecture, vivant, children }: BaieProps) {
  return (
    <section className="cy-baie">
      <header className="cy-tete">
        <span className="cy-index" aria-hidden="true">{index}</span>
        <h2 className="cy-nom">{nom}</h2>
        <span className="cy-conduite" aria-hidden="true" />
        {lecture && (
          <p className="cy-lecture">
            {vivant && <i aria-hidden="true" />}
            <b>{lecture}</b>
          </p>
        )}
      </header>
      <div className="cy-baie-corps">{children}</div>
    </section>
  );
}
