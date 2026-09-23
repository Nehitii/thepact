import { useEffect, useId, useState, type CSSProperties } from "react";
import { useJourneeDesOrdres, type OrdreLu } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import { lettresAllumees } from "@/domaines/accueil/logique/ordresDuJour";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import { PictogrammeDOrdre } from "@/domaines/accueil/composants/ordres/PictogrammeDOrdre";
import "@/domaines/accueil/composants/ordres/ordres-vitrine.css";

const TILT_NEON = "https://fonts.googleapis.com/css2?family=Tilt+Neon&display=swap";

/* PROPOSITION A — LA VITRINE.
 *
 * Sous la rue d enseignes, sur le meme beton : chaque ordre est une
 * enseigne dont les lettres s allument A MESURE qu on avance. Focus
 * profond a douze minutes sur vingt-cinq, c est « FOCUS » allume et
 * « PROFOND » encore en verre gris — la progression se lit sans
 * jauge, et la derniere lettre attend le geste qui finit.
 *
 * LE NEON DIT L ETAT, comme dans une rue la nuit.
 *   La prime d un ordre en cours est un tube eteint : elle n est pas
 *   encore allumee.
 *   Atteint, l ordre allume un petit panneau « À prendre » qui
 *   clignote comme un « OPEN » : c est le seul geste de la carte.
 *   Pris, le panneau devient un « Pris » vert, fixe.
 *   Journee close : le titre lui-meme passe au vert.
 *
 * L en-tete garde ce que la carte d avant disait : la prime acquise
 * sur la totale, et le temps avant la cloture — sur un afficheur a
 * diodes, celui du bandeau de l enseigne. */

function NomEnTubes({ o }: { o: OrdreLu }) {
  const allumees = lettresAllumees(o.title, o.fraction);
  let rang = 0;
  return (
    <span className="ov-nom" aria-hidden="true">
      {[...o.title].map((c, i) => {
        if (!/\S/.test(c)) return <span key={i} className="ov-espace"> </span>;
        const k = rang++;
        return (
          <span key={i} className="ov-l" data-allumee={k < allumees || undefined} style={{ "--i": k } as CSSProperties}>
            {c}
          </span>
        );
      })}
    </span>
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

export function OrdresVitrine(p: ProprietesDesOrdres) {
  usePoliceDuBanc(TILT_NEON);
  const { journee: j, lignes, cloture } = useJourneeDesOrdres(p);
  const corps = useId();

  /* L allumage d ouverture attend la rue du dessus ; passe ce moment,
     une lettre gagnee s allume tout de suite. */
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOuvert(true), 3200);
    return () => window.clearTimeout(t);
  }, []);

  const close = j.etat === "close";

  return (
    <section
      className={`ov ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
      data-ouvert={ouvert || undefined}
    >
      <header className="ov-tete">
        <h2 className="ov-titre">{close ? "Journée close" : "Ordres du jour"}</h2>
        <div className="ov-releves">
          {j.primeTotale > 0 && (
            <span className="ov-prime" aria-label={`Prime : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
              <b>{j.primeAcquise}</b>
              <s>/{j.primeTotale}</s>
              <em>bonds</em>
            </span>
          )}
          {lignes.length > 0 && (
            <span className="ov-afficheur" title={`Les ordres tombent à minuit UTC — ${cloture.heureLocale} à ta montre`}>
              <span className="ov-matrice">{close ? "À demain" : `Reste ${cloture.texte}`}</span>
            </span>
          )}
          <button
            type="button"
            className="ov-bascule"
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

      <div className="ov-corps" id={corps}>
        <div>
          {p.chargement ? (
            <p className="ov-mot" data-attente="">Ouverture des ordres…</p>
          ) : lignes.length === 0 ? (
            <p className="ov-mot">Rien à ordonner aujourd’hui. Ouvre une mission et les ordres suivront.</p>
          ) : (
            <ol className="ov-liste">
              {lignes.map((o, k) => {
                const mesure = `${o.progress}/${o.target}${o.genre.unite ? ` ${o.genre.unite}` : ""}`;
                const etat = o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours";
                return (
                  <li key={o.id} className="ov-ordre" data-etat={etat} style={{ "--ov-c": o.genre.couleur, "--k": k } as CSSProperties}>
                    <PictogrammeDOrdre genre={o.kind} taille={30} epaisseur={1.6} className="ov-tube" />
                    <span className="ov-textes">
                      <NomEnTubes o={o} />
                      <span className="sr-only">{o.title}, {mesure}</span>
                      {o.description && <span className="ov-precision">{o.description}</span>}
                    </span>
                    <span className="ov-mesure" aria-hidden="true">{mesure}</span>
                    {o.prete ? (
                      <button
                        type="button"
                        className="ov-prendre"
                        onClick={() => p.onReclamer(o.id)}
                        disabled={o.enReclamation || undefined}
                        aria-label={`Prendre la prime de ${o.reward_bonds} bonds : ${o.title}`}
                      >
                        {o.enReclamation ? "…" : "À prendre"} <b>+{o.reward_bonds}</b>
                      </button>
                    ) : o.reclamee ? (
                      <span className="ov-pris">Pris <b>+{o.reward_bonds}</b></span>
                    ) : (
                      <span className="ov-prix" aria-label={`Prime : ${o.reward_bonds} bonds`}>+{o.reward_bonds}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
