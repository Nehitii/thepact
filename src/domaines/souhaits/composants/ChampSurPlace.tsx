import { useEffect, useRef, useState } from "react";

interface ChampSurPlaceProps {
  /** Ce qui s affiche tant qu on n edite pas. */
  children: React.ReactNode;
  /** La valeur brute, telle qu on la modifie. */
  valeur: string;
  onValider: (valeur: string) => void;
  className?: string;
  classeChamp?: string;
  inputMode?: "decimal" | "url" | "text";
  placeholder?: string;
  titre?: string;
  /** Rien a editer : on rend l affichage tel quel. */
  desactive?: boolean;
}

/**
 * MODIFIER SANS OUVRIR DE FENETRE.
 *
 * Le prix est le seul chiffre dont dependent le cout de l objectif,
 * le financement du pacte et les trois totaux de la page — et il
 * fallait ouvrir une fenetre pour le corriger. Le lien de la
 * boutique, lui, manque a soixante-neuf articles sur soixante-et-onze
 * et se colle en une seconde.
 *
 * Un clic ouvre le champ, Entree valide, Echap annule, et perdre le
 * focus vaut validation — c est le geste qu on attend d une case de
 * tableur, et ce sont les deux valeurs qu on corrige le plus souvent.
 */
export function ChampSurPlace({
  children, valeur, onValider, className, classeChamp,
  inputMode = "text", placeholder, titre, desactive,
}: ChampSurPlaceProps) {
  const [ouvert, setOuvert] = useState(false);
  const [brouillon, setBrouillon] = useState(valeur);
  const champ = useRef<HTMLInputElement>(null);
  /* Echap doit annuler SANS que la perte de focus revalide derriere. */
  const annule = useRef(false);

  useEffect(() => { if (ouvert) { setBrouillon(valeur); } }, [ouvert, valeur]);
  useEffect(() => {
    if (!ouvert) return;
    champ.current?.focus();
    champ.current?.select();
  }, [ouvert]);

  const fermer = (valider: boolean) => {
    setOuvert(false);
    if (valider && !annule.current && brouillon !== valeur) onValider(brouillon);
    annule.current = false;
  };

  if (desactive) return <span className={className}>{children}</span>;

  if (!ouvert) {
    return (
      <button
        type="button"
        className={className}
        title={titre}
        onClick={(e) => { e.stopPropagation(); setOuvert(true); }}
      >
        {children}
      </button>
    );
  }

  return (
    <input
      ref={champ}
      className={classeChamp}
      value={brouillon}
      inputMode={inputMode}
      placeholder={placeholder}
      onChange={(e) => setBrouillon(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={() => fermer(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); fermer(true); }
        if (e.key === "Escape") { e.preventDefault(); annule.current = true; setOuvert(false); }
      }}
    />
  );
}
