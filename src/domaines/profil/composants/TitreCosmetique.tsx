import "@/styles/titre-cosmetique.css";

/* LE TITRE COSMETIQUE, A UN SEUL ENDROIT.
 *
 * Il etait peint deux fois — dans la grande carte du profil et dans la
 * petite carte partagee que reutilisent la cabine d essayage et le
 * survol d un ami — avec chacune sa copie de la gelule. Les deux
 * avaient deja commence a diverger.
 *
 * Le rendu vit maintenant ici, et le style dans une feuille dediee. */

export type RareteTitre = "common" | "rare" | "epic" | "legendary";

interface Props {
  texte: string;
  /* `cosmetic_titles.text_color` — la couleur porte tout le degrade. */
  couleur?: string | null;
  /* `cosmetic_titles.glow_color` — la lueur du legendaire. */
  lueur?: string | null;
  /* Sans rarete connue, on retombe sur le cran le plus sobre plutot que
     d offrir gratuitement le traitement des legendaires. */
  rarete?: string | null;
  taille?: "carte" | "compacte";
}

const RARETES: RareteTitre[] = ["common", "rare", "epic", "legendary"];

export function TitreCosmetique({ texte, couleur, lueur, rarete, taille = "carte" }: Props) {
  if (!texte) return null;

  const cran: RareteTitre = RARETES.includes(rarete as RareteTitre)
    ? (rarete as RareteTitre)
    : "common";
  const c = couleur || "#5bb4ff";
  const l = lueur || "transparent";

  const mot = (
    <span
      className="tc"
      data-r={cran}
      data-taille={taille}
      style={{ "--c": c, "--l": l } as React.CSSProperties}
    >
      {/* La floraison et l aberration sont purement decoratives : sans
          `aria-hidden`, un lecteur d ecran annoncerait le titre trois
          fois de suite. */}
      <span className="tc-bloom" aria-hidden="true">{texte}</span>
      <span className="tc-chroma" aria-hidden="true">{texte}</span>
      <span className="tc-texte">{texte}</span>
    </span>
  );

  /* Les rails n encadrent que le dernier cran — c est la moitie de ce
     qui le distingue d un epique. */
  if (cran !== "legendary") return mot;

  return (
    <span
      className="tc-rangee"
      data-taille={taille}
      style={{ "--c": c, "--l": l } as React.CSSProperties}
    >
      <i className="tc-rail" aria-hidden="true" />
      <i className="tc-losange" aria-hidden="true" />
      {mot}
      <i className="tc-losange" aria-hidden="true" />
      <i className="tc-rail" aria-hidden="true" />
    </span>
  );
}
