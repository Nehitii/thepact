/**
 * LA MARQUE D UN CREANCIER.
 *
 * Le panneau ne disait rien de QUI prelevait : trois lignes de texte
 * sur fond noir, et Amazon Prime ressemblait a un impot foncier.
 *
 * LE VRAI SUJET N EST PAS LE LOGO, C EST SON ABSENCE.
 *
 * Amazon Prime a une image. Copropriete Citya, Pichet et les impots
 * fonciers n en auront jamais — il n existe pas de logo a telecharger
 * pour un syndic. Une grille de logos serait donc a moitie belle et a
 * moitie cassee, et ce qui remplit la case vide n est pas un detail :
 * c est ce qui decide si le panneau tient debout.
 *
 * A defaut d image, on dessine donc une plaque : les initiales en
 * Orbitron sur la couleur de la categorie, tramee en diagonale. Ce
 * n est pas un logo manquant, c est un objet — et une ligne sans
 * image ne se lit pas comme une ligne incomplete.
 */
import { useMemo } from 'react';
import { initialesDe, couleurDe } from '@/lib/finance/marque';
import { normaliserCadre, styleDuCadre } from '@/lib/finance/cadre';

interface Props {
  nom: string;
  iconUrl?: string | null;
  categorie?: string | null;
  /** Le cadrage enregistre, tel quil sort de la base. */
  cadre?: unknown;
  /** Le cote de la plaque, en pixels. Le portrait d une fiche est rectangulaire : passer null. */
  taille?: number | null;
  className?: string;
  /* EN FILIGRANE : LA MARQUE SANS SA PLAQUE.
     Une ligne-affiche laisse deborder la marque dans son propre fond,
     tres basse. Le fond blanc du cadrage n a alors plus rien a faire
     la — il ferait une tache pale au lieu d un filigrane — et la
     trame du monogramme non plus, invisible a cette opacite. */
  filigrane?: boolean;
}

export function MarqueCreancier({ nom, iconUrl, categorie, cadre, taille = 44, className = '', filigrane = false }: Props) {
  const initiales = useMemo(() => initialesDe(nom), [nom]);
  const couleur = useMemo(() => couleurDe(categorie), [categorie]);
  const dimension = taille == null ? undefined : { width: taille, height: taille };

  if (iconUrl) {
    /* Le cadrage decide du fond, du recadrage, du point garde au
       centre et du zoom. Sans reglage enregistre, normaliserCadre rend
       le defaut — une image contenue sur fond clair. */
    const pose = styleDuCadre(normaliserCadre(cadre), couleur);
    /* En filigrane, on garde le cadrage — position, zoom, ajustement —
       mais on retire le fond : c est l image qu on veut voir affleurer,
       pas sa plaque. */
    const style = filigrane ? { ...dimension, ...pose, background: 'transparent' } : { ...dimension, ...pose };
    return (
      <span className={`cy-marque cy-marque-photo ${filigrane ? 'cy-marque-filigrane ' : ''}${className}`} style={style}>
        {/* L image d un creancier est un logo, pas une photographie :
            elle doit tenir entiere dans sa plaque plutot que d etre
            recadree, et on la pose donc sur du blanc — c est le fond
            sur lequel les logos sont dessines. */}
        <img src={iconUrl} alt="" loading="lazy" />
      </span>
    );
  }

  return (
    <span
      className={`cy-marque cy-marque-lettres ${filigrane ? 'cy-marque-filigrane ' : ''}${className}`}
      style={{ ...dimension, '--marque-couleur': couleur } as React.CSSProperties}
      aria-hidden="true"
    >
      <b>{initiales}</b>
    </span>
  );
}
