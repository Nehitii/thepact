import type { CSSProperties, ReactNode } from "react";
import type { OrdreLu } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { perforation } from "@/domaines/accueil/logique/ordresDuJour";
import { heureDuGeste, mesureDe } from "@/domaines/accueil/composants/ordres/pointeuse/lecture";
import "@/domaines/accueil/composants/ordres/pointeuse/communs.css";

/* LES PIECES DES POINTEUSES.
 *
 * Les variantes de la pointeuse changent la machine, le casier, la
 * lumiere — pas la carte, ni le trou, ni le tampon, qui sont ce qu on
 * a aime dans la premiere. Ils vivent donc ici, une fois. */

/** Un nombre sur des tambours de compteur : chaque chiffre roule jusqu au suivant. */
export function Tambours({ texte }: { texte: string }) {
  return (
    <span className="pt-tambours" aria-hidden="true">
      {[...texte].map((c, i) =>
        /\d/.test(c) ? (
          <span key={i} className="pt-tambour">
            <span style={{ "--d": Number(c) } as CSSProperties}>
              {"0123456789".split("").map((n) => <i key={n}>{n}</i>)}
            </span>
          </span>
        ) : (
          <span key={i} className="pt-separe">{c}</span>
        ),
      )}
    </span>
  );
}

/** La grille de trous d une carte ; « rangee » les aligne sur une seule ligne, par paquets de cinq.
 *  « maximum » plafonne le nombre de trous : au-dela, un trou vaut plusieurs unites. */
export function Trous({ o, rangee = false, maximum = 25 }: { o: OrdreLu; rangee?: boolean; maximum?: number }) {
  const t = perforation(o.progress, o.target, maximum);
  return (
    <span
      className="pt-trous"
      data-rangee={rangee || undefined}
      data-seul={t.trous === 1 || undefined}
      style={{ "--pt-col": rangee ? t.trous : t.colonnes } as CSSProperties}
      aria-hidden="true"
    >
      {Array.from({ length: t.trous }, (_, i) => <i key={i} data-perce={i < t.perces || undefined} />)}
    </span>
  );
}

/** Le coup de tampon violet : « Perçu », l heure, la somme. */
export function Tampon({ o, className = "" }: { o: OrdreLu; className?: string }) {
  const heure = heureDuGeste(o);
  return (
    <span className={`pt-tampon ${className}`} aria-label={`Prime perçue${heure ? ` à ${heure}` : ""} : ${o.reward_bonds} bonds`}>
      <span>Perçu</span>
      {heure && <small>{heure}</small>}
      <b>+{o.reward_bonds} B</b>
    </span>
  );
}

/** Le bouton rouge : on pointe, la prime tombe. */
export function BoutonPointer({ o, onReclamer, avecPrime = true }: {
  o: OrdreLu;
  onReclamer: (id: string) => void;
  avecPrime?: boolean;
}) {
  return (
    <button
      type="button"
      className="pt-pointer"
      onClick={() => onReclamer(o.id)}
      disabled={o.enReclamation || undefined}
      aria-label={`Pointer : prendre la prime de ${o.reward_bonds} bonds, ${o.title}`}
    >
      {o.enReclamation ? "…" : "Pointer"}
      {avecPrime && <b>+{o.reward_bonds}</b>}
    </button>
  );
}

/** Le bouton d acier qui replie le panneau. */
export function Bascule({ replie, onBasculer, controle }: { replie: boolean; onBasculer: () => void; controle: string }) {
  return (
    <button
      type="button"
      className="pt-bascule"
      onClick={onBasculer}
      aria-expanded={!replie}
      aria-controls={controle}
      aria-label={replie ? "Déplier les ordres du jour" : "Replier les ordres du jour"}
      title={replie ? "Déplier" : "Replier"}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

/** La carte de pointage : liseré du genre, tete imprimee en rouge, nom tape, trous, pied, bouton ou tampon. */
export function Carte({ o, n, onReclamer, avant }: {
  o: OrdreLu;
  n: number;
  onReclamer: (id: string) => void;
  /** Ce qui se pose sur la carte en plus — un talon, une etiquette. */
  avant?: ReactNode;
}) {
  const etat = o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours";
  const mesure = mesureDe(o, o.genre.unite);
  return (
    <article
      className="pt-carte"
      data-etat={etat}
      data-pointage={o.enReclamation || undefined}
      data-glisse={o.id}
      style={{ "--pt-c": o.genre.couleur } as CSSProperties}
      aria-label={`${o.title}, ${mesure}`}
    >
      {avant}
      <header className="pt-carte-tete">
        <span>N° {n}</span>
        <span className="pt-genre">{o.genre.court}</span>
        <span className="pt-etiquette">{o.reclamee ? "Perçu" : o.prete ? "À pointer" : mesure}</span>
      </header>
      <h3 className="pt-nom">{o.title}</h3>
      {o.description && <p className="pt-desc">{o.description}</p>}
      <Trous o={o} />
      <footer className="pt-pied">
        <span className="pt-mesure">{mesure}</span>
        <span>Prime {o.reward_bonds} B</span>
      </footer>
      {o.prete && <BoutonPointer o={o} onReclamer={onReclamer} />}
      {o.reclamee && <Tampon o={o} />}
    </article>
  );
}
