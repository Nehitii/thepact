import { useId, type CSSProperties } from "react";
import { useJourneeDesOrdres, type OrdreLu } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { paquetsDeBatons } from "@/domaines/accueil/logique/ordresDuJour";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import "@/domaines/accueil/composants/ordres/ordres-ardoise.css";

const CRAIES = "https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Caveat+Brush&family=Caveat:wght@500;700&display=swap";

/* PROPOSITION D — L ARDOISE.
 *
 * « Ordre du jour » sonne comme « plat du jour » : les ordres sont
 * ecrits a la craie sur l ardoise d un bistrot, dans son cadre de bois,
 * au bas de la rue. Chaque ordre est une ligne du menu — son nom en
 * capitales, des points de conduite, sa prime a droite comme un prix.
 *
 * ON COMPTE A LA CRAIE : des batons, par paquets de cinq, le cinquieme
 * en travers ; une case a cocher pour un ordre d un seul geste. Quand
 * l ordre est atteint, la prime est ENTOUREE — c est le bouton. Prise,
 * la ligne est barree, et « encaissé » s ecrit a cote.
 *
 * En bas, comme sur une addition, le total du jour ; en haut, l heure
 * jusqu a laquelle les ordres tiennent. */

/** Un trait de craie n est jamais droit : un leger devers par trait. */
const devers = (i: number) => ((i * 37) % 7) * 0.35 - 1;

function Batons({ n }: { n: number }) {
  return (
    <span className="oa-batons" aria-hidden="true">
      {paquetsDeBatons(n).map((taille, g) => (
        <svg key={g} width="30" height="22" viewBox="0 0 30 22">
          {Array.from({ length: Math.min(4, taille) }, (_, i) => (
            <path key={i} d={`M${5 + i * 5 + devers(g * 5 + i)} 3.5 L${4.5 + i * 5 - devers(g * 5 + i)} 18.5`} />
          ))}
          {taille === 5 && <path d="M1.5 15.5 L26.5 5" />}
        </svg>
      ))}
    </span>
  );
}

function Case({ cochee }: { cochee: boolean }) {
  return (
    <svg className="oa-case" width="24" height="22" viewBox="0 0 24 22" aria-hidden="true">
      <path d="M3.5 4.2 L19.8 3.6 L20.4 19 L4 19.6 Z" />
      {cochee && <path d="M6.5 11 L10.5 15.5 L21.5 2" />}
    </svg>
  );
}

function Ligne({ o, onReclamer }: { o: OrdreLu; onReclamer: (id: string) => void }) {
  const etat = o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours";
  return (
    <li className="oa-ligne" data-etat={etat} style={{ "--oa-c": o.genre.couleur } as CSSProperties}>
      <span className="oa-nom">
        <span className="oa-puce" aria-hidden="true" />
        {o.title}
      </span>
      <span className="oa-points" aria-hidden="true" />
      {o.prete ? (
        <button
          type="button"
          className="oa-prix"
          onClick={() => onReclamer(o.id)}
          disabled={o.enReclamation || undefined}
          aria-label={`Prendre la prime de ${o.reward_bonds} bonds : ${o.title}`}
        >
          <span>{o.reward_bonds} bonds</span>
          <svg className="oa-cercle" viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength={100} d="M14 30 C 8 12, 52 3, 88 7 C 118 11, 121 38, 84 44 C 50 49, 9 44, 12 24" />
          </svg>
          <small>{o.enReclamation ? "…" : "à prendre"}</small>
        </button>
      ) : (
        <span className="oa-prix" aria-label={`Prime : ${o.reward_bonds} bonds`}>
          <span>{o.reward_bonds} bonds</span>
          {o.reclamee && <small>encaissé ✓</small>}
        </span>
      )}
      <span className="oa-sous">
        {o.description && <span className="oa-desc">{o.description}</span>}
        <span className="oa-compte" aria-label={`${o.progress} sur ${o.target}${o.genre.unite ? ` ${o.genre.unite}` : ""}`}>
          {o.target <= 1 ? <Case cochee={o.progress >= 1} /> : <Batons n={o.progress} />}
          {o.target > 1 && <span className="oa-sur" aria-hidden="true">/{o.target}{o.genre.unite ? ` ${o.genre.unite}` : ""}</span>}
        </span>
      </span>
    </li>
  );
}

export function OrdresArdoise(p: ProprietesDesOrdres) {
  usePoliceDuBanc(CRAIES);
  const { journee: j, lignes, cloture } = useJourneeDesOrdres(p);
  const corps = useId();
  const close = j.etat === "close";

  return (
    <section
      className={`oa ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <div className="oa-ardoise">
        <header className="oa-tete">
          <h2 className="oa-titre">{close ? "Journée close" : "Ordres du jour"}</h2>
          {lignes.length > 0 && (
            <span className="oa-heure" title="Les ordres tombent à minuit UTC">
              {close ? "à demain !" : `jusqu’à ${cloture.heureLocale} — encore ${cloture.texte}`}
            </span>
          )}
          <button
            type="button"
            className="oa-bascule"
            onClick={p.onBasculerRepli}
            aria-expanded={!p.replie}
            aria-controls={corps}
            aria-label={p.replie ? "Déplier les ordres du jour" : "Replier les ordres du jour"}
            title={p.replie ? "Déplier" : "Replier"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </header>

        <div className="oa-corps" id={corps}>
          <div>
            {p.chargement ? (
              <p className="oa-mot" data-attente="">On écrit l’ardoise…</p>
            ) : lignes.length === 0 ? (
              <p className="oa-mot">Rien à l’ardoise aujourd’hui. Ouvre une mission et les ordres suivront.</p>
            ) : (
              <>
                <ol className="oa-menu">
                  {lignes.map((o) => <Ligne key={o.id} o={o} onReclamer={p.onReclamer} />)}
                </ol>
                <p className="oa-total" aria-label={`Total du jour : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
                  Total du jour <b>{j.primeAcquise}</b> / {j.primeTotale} bonds
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
