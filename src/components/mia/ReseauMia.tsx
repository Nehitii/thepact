/* La feuille de M.I.A est importee ICI et non par la console : la
   vignette porte le meme sigle et vit dans la mise en page globale,
   alors que la console est en import paresseux. Sans cela la vignette
   reste sans style tant qu on ne l a pas ouverte une fois. */
import "@/styles/mia.css";

/**
 * Le sigle de M.I.A : neuf cellules, un réseau.
 *
 * L'icône « Bot » de lucide — le petit robot à antennes — servait de
 * marque à M.I.A. On la trouve dans dix mille applications, et surtout
 * elle ne disait jamais rien : ni que la machine travaillait, ni qu'une
 * réponse attendait.
 *
 * Le réseau porte le nom (Array) et il porte l'état :
 *
 *   repos     une seule cellule allumée, au centre
 *   ecoute    une onde traverse la grille
 *   travail   un balayage cellule par cellule
 *   reponse   tout allumé — une réponse attend
 *
 * La couleur vient de `currentColor` : le sigle prend la teinte de son
 * hôte, et le même composant sert dans l'en-tête, dans la vignette et
 * dans la signature de chaque réponse.
 */
export type EtatMia = "repos" | "ecoute" | "travail" | "reponse";

interface ReseauMiaProps {
  etat?: EtatMia;
  /** Côté du carré, en pixels. 18 par défaut. */
  taille?: number;
  className?: string;
}

const CELLULES = Array.from({ length: 9 });

export function ReseauMia({ etat = "repos", taille, className }: ReseauMiaProps) {
  return (
    <span
      className={`mia-reseau${className ? ` ${className}` : ""}`}
      data-etat={etat === "repos" ? undefined : etat}
      style={taille ? ({ ["--mia-reseau-taille" as string]: `${taille}px` }) : undefined}
      aria-hidden="true"
    >
      {CELLULES.map((_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}
