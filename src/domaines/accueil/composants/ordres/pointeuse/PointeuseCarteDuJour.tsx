import { useId, type CSSProperties } from "react";
import { useJourneeDesOrdres } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import { Bascule, BoutonPointer, Trous } from "@/domaines/accueil/composants/ordres/pointeuse/communs";
import { dateDHorodateur, heureDuGeste, mesureDe, surTrois } from "@/domaines/accueil/composants/ordres/pointeuse/lecture";
import "@/domaines/accueil/composants/ordres/pointeuse/carte-du-jour.css";

const JOUR_MS = 86_400_000;

/* VARIANTE B3 — LA CARTE DU JOUR.
 *
 * Une vraie carte de pointage n a pas une carte par geste : c est UNE
 * carte, reglee en lignes, et la machine imprime l heure dans la bonne
 * case. Les trois ordres deviennent trois lignes de la carte du jour —
 * numero, ordre tape a la machine, une rangee de trous, la prime, et la
 * colonne « Pointage ».
 *
 * C est la plus compacte des pointeuses, et la plus facile a parcourir :
 * on lit la carte de haut en bas comme un tableau. La case de pointage
 * dit l etat — vide, le bouton rouge quand l ordre est plein, puis
 * l heure frappee en violet a l aiguille, comme un vrai horodateur.
 * Le total du jour est frappe de la meme encre au pied de la carte. */

export function PointeuseCarteDuJour(p: ProprietesDesOrdres) {
  const { journee: j, lignes, cloture, maintenant } = useJourneeDesOrdres(p);
  const corps = useId();
  const close = j.etat === "close";
  const numero = String((Math.floor(maintenant / JOUR_MS) * 7919) % 10000).padStart(4, "0");
  const date = dateDHorodateur(maintenant);

  return (
    <section
      className={`pj ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <div className="pj-porte pt-acier">
        <span className="pj-pince" aria-hidden="true" />
        <article className="pj-carte">
          <header className="pj-entete">
            <span className="pj-titres">
              <span className="pj-titre">Carte de pointage</span>
              <span className="pj-sous">Ordres du jour</span>
            </span>
            <span className="pj-infos">
              <span>{date}</span>
              <span>N° {numero}</span>
              <span>{close ? "Journée close" : `Clôture ${cloture.heureLocale} · reste ${cloture.texte}`}</span>
            </span>
            <Bascule replie={p.replie} onBasculer={p.onBasculerRepli} controle={corps} />
          </header>

          <div className="pj-corps" id={corps}>
            <div>
              {p.chargement ? (
                <p className="pj-mot" data-attente="">La carte s’imprime…</p>
              ) : lignes.length === 0 ? (
                <p className="pj-mot">Carte vierge aujourd’hui. Ouvre une mission et les ordres suivront.</p>
              ) : (
                <table className="pj-table">
                  <thead>
                    <tr>
                      <th scope="col">N°</th>
                      <th scope="col">Ordre</th>
                      <th scope="col">Avancement</th>
                      <th scope="col">Prime</th>
                      <th scope="col">Pointage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lignes.map((o, i) => {
                      const heure = heureDuGeste(o);
                      return (
                        <tr
                          key={o.id}
                          className="pj-ligne"
                          data-etat={o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours"}
                          style={{ "--pt-c": o.genre.couleur } as CSSProperties}
                        >
                          <td className="pj-no">{i + 1}</td>
                          <td className="pj-ordre">
                            <span className="pj-nom">{o.title}</span>
                            {o.description && <span className="pj-desc">{o.description}</span>}
                          </td>
                          <td className="pj-avance">
                            <Trous o={o} rangee />
                            <span className="pj-mesure">{mesureDe(o, o.genre.unite)}</span>
                          </td>
                          <td className="pj-prime">{o.reward_bonds} B</td>
                          <td className="pj-pointage">
                            {o.reclamee ? (
                              <span className="pj-frappe" aria-label={`Pointé${heure ? ` à ${heure}` : ""}, ${o.reward_bonds} bonds`}>
                                <span>{date.split(" ")[0]} {heure ?? ""}</span>
                                <b>+{o.reward_bonds}</b>
                              </span>
                            ) : o.prete ? (
                              <BoutonPointer o={o} onReclamer={p.onReclamer} avecPrime={false} />
                            ) : (
                              <span className="pj-case" aria-label="Pas encore pointé" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={3}>Total du jour</th>
                      <td colSpan={2} aria-label={`${j.primeAcquise} sur ${j.primeTotale} bonds`}>
                        <span className="pj-frappe pj-frappe--total">{surTrois(j.primeAcquise)}</span>
                        <span className="pj-sur"> / {surTrois(j.primeTotale)} bonds</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
