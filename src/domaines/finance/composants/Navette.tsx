import { useRef } from "react";

/* LA NAVETTE
 *
 * Trois ecrans, un seul a la fois. Chaque bouton porte sa lecture —
 * le pourcentage finance, les pieces en attente, le solde du mois —
 * de sorte que les chiffres du pacte restent sous les yeux meme quand
 * on travaille dans un autre ecran. C etait le seul reproche a faire
 * a cette disposition : elle les cachait.
 *
 * Les fleches deplacent la selection, « Debut » et « Fin » vont aux
 * extremites : c est ce qu on attend d une barre d onglets.
 */

export interface Ecran {
  cle: string;
  index: string;
  nom: string;
  lecture: string;
}

interface NavetteProps {
  ecrans: Ecran[];
  actif: string;
  onChange: (cle: string) => void;
  /** Nomme la barre pour qui ne la voit pas. */
  libelle: string;
}

export function Navette({ ecrans, actif, onChange, libelle }: NavetteProps) {
  const boutons = useRef<(HTMLButtonElement | null)[]>([]);

  const surTouche = (e: React.KeyboardEvent, i: number) => {
    const n = ecrans.length;
    let cible = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") cible = (i + 1) % n;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") cible = (i - 1 + n) % n;
    if (e.key === "Home") cible = 0;
    if (e.key === "End") cible = n - 1;
    if (cible === -1) return;
    e.preventDefault();
    onChange(ecrans[cible].cle);
    boutons.current[cible]?.focus();
  };

  return (
    <div className="cy-navette" role="tablist" aria-label={libelle}>
      {ecrans.map((e, i) => (
        <button
          key={e.cle}
          ref={(n) => { boutons.current[i] = n; }}
          type="button"
          role="tab"
          id={`cy-onglet-${e.cle}`}
          aria-selected={actif === e.cle}
          aria-controls={`cy-ecran-${e.cle}`}
          tabIndex={actif === e.cle ? 0 : -1}
          onClick={() => onChange(e.cle)}
          onKeyDown={(ev) => surTouche(ev, i)}
        >
          <span className="cy-navette-index" aria-hidden="true">{e.index}</span>
          <span className="cy-navette-corps">
            <span className="cy-navette-nom">{e.nom}</span>
            <span className="cy-navette-lecture">{e.lecture}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
