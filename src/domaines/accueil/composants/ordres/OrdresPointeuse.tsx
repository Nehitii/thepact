import { useId, type CSSProperties } from "react";
import { useJourneeDesOrdres, type OrdreLu } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { perforation } from "@/domaines/accueil/logique/ordresDuJour";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import "@/domaines/accueil/composants/ordres/ordres-pointeuse.css";

const SPECIAL_ELITE = "https://fonts.googleapis.com/css2?family=Special+Elite&display=swap";

/* PROPOSITION B — LA POINTEUSE.
 *
 * La langue du cordon et du pupitre : de l acier, des vis, des
 * compteurs a tambours. Chaque ordre est une CARTE DE POINTAGE rangee
 * dans le casier, tapee a la machine, avec une grille de trous : un
 * trou par unite — deux pour le rituel, vingt-cinq pour le focus, en
 * rangees de cinq. Chaque geste en perce un ; on voit l acier a travers.
 *
 * On pointe quand la carte est pleine : le bouton rouge apparait, et
 * la prime tombe avec un coup de tampon violet — « Perçu », l heure,
 * la somme — de travers, comme un vrai.
 *
 * L en-tete est l horodateur : la prime acquise sur des tambours, le
 * temps avant la cloture sur d autres, et l heure locale de cette
 * cloture. Replie, les cartes rentrent dans le casier : on ne voit plus
 * que leur tete. */

function Tambours({ texte }: { texte: string }) {
  return (
    <span className="op-tambours" aria-hidden="true">
      {[...texte].map((c, i) =>
        /\d/.test(c) ? (
          <span key={i} className="op-tambour">
            <span style={{ "--d": Number(c) } as CSSProperties}>
              {"0123456789".split("").map((n) => <i key={n}>{n}</i>)}
            </span>
          </span>
        ) : (
          <span key={i} className="op-separe">{c}</span>
        ),
      )}
    </span>
  );
}

function Carte({ o, n, onReclamer }: { o: OrdreLu; n: number; onReclamer: (id: string) => void }) {
  const t = perforation(o.progress, o.target);
  const etat = o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours";
  const heure = o.reclamee && o.updated_at
    ? new Date(o.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const mesure = `${o.progress}/${o.target}${o.genre.unite ? ` ${o.genre.unite}` : ""}`;
  return (
    <article
      className="op-carte"
      data-etat={etat}
      style={{ "--op-c": o.genre.couleur, "--op-col": t.colonnes } as CSSProperties}
      aria-label={`${o.title}, ${mesure}`}
    >
      <header className="op-carte-tete">
        <span className="op-no">N° {n}</span>
        <span className="op-genre">{o.genre.court}</span>
        <span className="op-etiquette">{o.reclamee ? "Perçu" : o.prete ? "À pointer" : mesure}</span>
      </header>
      <h3 className="op-nom">{o.title}</h3>
      {o.description && <p className="op-desc">{o.description}</p>}
      <div className="op-trous" data-seul={t.trous === 1 || undefined} aria-hidden="true">
        {Array.from({ length: t.trous }, (_, i) => <i key={i} data-perce={i < t.perces || undefined} />)}
      </div>
      <footer className="op-pied">
        <span className="op-mesure">{mesure}</span>
        <span className="op-prime">Prime {o.reward_bonds} B</span>
      </footer>
      {o.prete && (
        <button
          type="button"
          className="op-pointer"
          onClick={() => onReclamer(o.id)}
          disabled={o.enReclamation || undefined}
          aria-label={`Pointer : prendre la prime de ${o.reward_bonds} bonds`}
        >
          {o.enReclamation ? "…" : "Pointer"} <b>+{o.reward_bonds}</b>
        </button>
      )}
      {o.reclamee && (
        <span className="op-tampon" aria-label={`Prime perçue${heure ? ` à ${heure}` : ""} : ${o.reward_bonds} bonds`}>
          <span>Perçu</span>
          {heure && <small>{heure}</small>}
          <b>+{o.reward_bonds} B</b>
        </span>
      )}
    </article>
  );
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function OrdresPointeuse(p: ProprietesDesOrdres) {
  usePoliceDuBanc(SPECIAL_ELITE);
  const { journee: j, lignes, cloture } = useJourneeDesOrdres(p);
  const corps = useId();
  const prime = (v: number) => String(v).padStart(3, "0");

  return (
    <section
      className={`op ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <header className="op-tete">
        <span className="op-plaque">Ordres du jour</span>
        <span className="op-voyant" data-etat={j.etat} aria-hidden="true" />
        <div className="op-droite">
          {lignes.length > 0 && (
            <>
              <span className="op-releve" aria-label={`Prime : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
                <small>Prime</small>
                <Tambours texte={`${prime(j.primeAcquise)}/${prime(j.primeTotale)}`} />
                <small>B</small>
              </span>
              <span className="op-releve" title="Les ordres tombent à minuit UTC"
                aria-label={j.etat === "close" ? "Journée close" : `Clôture dans ${cloture.texte}, à ${cloture.heureLocale}`}>
                <small>{j.etat === "close" ? "Close" : `Clôture ${cloture.heureLocale}`}</small>
                <Tambours texte={j.etat === "close" ? "00:00" : cloture.horloge} />
              </span>
            </>
          )}
          <button
            type="button"
            className="op-bascule"
            onClick={p.onBasculerRepli}
            aria-expanded={!p.replie}
            aria-controls={corps}
            aria-label={p.replie ? "Déplier les ordres du jour" : "Replier les ordres du jour"}
            title={p.replie ? "Déplier" : "Replier"}
          >
            <Chevron />
          </button>
        </div>
      </header>

      <div className="op-casier" id={corps}>
        {p.chargement ? (
          <p className="op-mot" data-attente="">Les cartes arrivent…</p>
        ) : lignes.length === 0 ? (
          <p className="op-mot">Aucune carte aujourd’hui. Ouvre une mission et les ordres suivront.</p>
        ) : (
          lignes.map((o, i) => <Carte key={o.id} o={o} n={i + 1} onReclamer={p.onReclamer} />)
        )}
      </div>
    </section>
  );
}
