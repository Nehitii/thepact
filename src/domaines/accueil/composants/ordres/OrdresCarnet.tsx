import { useId, type CSSProperties } from "react";
import { useJourneeDesOrdres, type OrdreLu } from "@/domaines/accueil/hooks/useJourneeDesOrdres";
import { usePoliceDuBanc } from "@/domaines/accueil/hooks/usePoliceDuBanc";
import type { ProprietesDesOrdres } from "@/domaines/accueil/types";
import "@/domaines/accueil/composants/ordres/ordres-carnet.css";

const BIG_SHOULDERS = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&display=swap";

/* PROPOSITION C — LE CARNET A SOUCHES.
 *
 * Un carnet de tickets, comme au vestiaire ou a la tombola : une
 * couverture imprimee en rouge, et un ticket par ordre, de la couleur
 * de son genre. Chaque ticket a son TALON, a gauche, et son COUPON,
 * separes par une ligne de perforation.
 *
 * TOUCHER LA PRIME, C EST DETACHER LE COUPON. Quand l ordre est
 * atteint, le coupon porte des ciseaux : on tire, il se souleve, et
 * une fois la prime versee il n y a plus que le talon — « Détaché »,
 * la somme, l heure — comme dans un vrai carnet, ou le talon garde la
 * trace de ce qui est parti.
 *
 * Les petites cases a cocher disent l avancement quand la cible est
 * courte ; au-dela de dix, une regle imprimee. La couverture porte le
 * numero du carnet, la date, la prime et la validite restante. */

const JOUR_MS = 86_400_000;

function Coupon({ o, onReclamer }: { o: OrdreLu; onReclamer: (id: string) => void }) {
  const cases = o.target <= 10;
  const mesure = `${o.progress}/${o.target}${o.genre.unite ? ` ${o.genre.unite}` : ""}`;
  return (
    <div className="oc-coupon" data-tire={o.enReclamation || undefined}>
      <div className="oc-lignes">
        <span className="oc-nom">{o.title}</span>
        {o.description && <span className="oc-desc">{o.description}</span>}
      </div>
      <div className="oc-avance" aria-label={mesure}>
        {cases ? (
          <span className="oc-cases" aria-hidden="true">
            {Array.from({ length: o.target }, (_, i) => <i key={i} data-cochee={i < o.progress || undefined} />)}
          </span>
        ) : (
          <span className="oc-regle" aria-hidden="true" style={{ "--oc-p": o.fraction } as CSSProperties}><i /></span>
        )}
        <span className="oc-mesure" aria-hidden="true">{mesure}</span>
      </div>
      <span className="oc-valeur"><b>{o.reward_bonds}</b> bonds</span>
      {o.prete && (
        <button
          type="button"
          className="oc-detacher"
          onClick={() => onReclamer(o.id)}
          disabled={o.enReclamation || undefined}
          aria-label={`Détacher le coupon : prendre la prime de ${o.reward_bonds} bonds`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
          </svg>
          {o.enReclamation ? "…" : "Détacher"}
        </button>
      )}
    </div>
  );
}

export function OrdresCarnet(p: ProprietesDesOrdres) {
  usePoliceDuBanc(BIG_SHOULDERS);
  const { journee: j, lignes, cloture, maintenant } = useJourneeDesOrdres(p);
  const corps = useId();

  /* Un numero de carnet par jour d UTC — celui des ordres — et le meme
     toute la journee. */
  const carnet = String((Math.floor(maintenant / JOUR_MS) * 7919) % 10000).padStart(4, "0");
  const date = new Date(maintenant).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section
      className={`oc ${p.className ?? ""}`}
      aria-label="Ordres du jour"
      data-etat={j.etat}
      data-replie={p.replie || undefined}
    >
      <header className="oc-couverture">
        <span className="oc-titre">Ordres du jour</span>
        <span className="oc-date">{date} · carnet n° {carnet}</span>
        <span className="oc-droite">
          {lignes.length > 0 && (
            <>
              <span className="oc-prime" aria-label={`Prime : ${j.primeAcquise} sur ${j.primeTotale} bonds`}>
                <b>{j.primeAcquise}</b>/{j.primeTotale} B
              </span>
              <span className="oc-validite" title={`Les ordres tombent à minuit UTC — ${cloture.heureLocale} à ta montre`}>
                {j.etat === "close" ? "Carnet épuisé" : `Valable ${cloture.texte}`}
              </span>
            </>
          )}
          <button
            type="button"
            className="oc-bascule"
            onClick={p.onBasculerRepli}
            aria-expanded={!p.replie}
            aria-controls={corps}
            aria-label={p.replie ? "Déplier les ordres du jour" : "Replier les ordres du jour"}
            title={p.replie ? "Déplier" : "Replier"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </span>
      </header>

      <div className="oc-corps" id={corps}>
        <div>
          {p.chargement ? (
            <p className="oc-mot" data-attente="">On imprime le carnet…</p>
          ) : lignes.length === 0 ? (
            <p className="oc-mot">Carnet vide aujourd’hui. Ouvre une mission et les ordres suivront.</p>
          ) : (
            <ol className="oc-tickets">
              {lignes.map((o, i) => {
                const heure = o.reclamee && o.updated_at
                  ? new Date(o.updated_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                  : null;
                return (
                  <li
                    key={o.id}
                    className="oc-ticket"
                    data-etat={o.reclamee ? "reclamee" : o.prete ? "prete" : "en-cours"}
                    style={{ "--oc-c": o.genre.couleur } as CSSProperties}
                  >
                    <span className="oc-talon">
                      <span className="oc-numero">N° {carnet}-{i + 1}</span>
                      <span className="oc-genre">{o.genre.court}</span>
                      {o.reclamee ? (
                        <span className="oc-trace">
                          Détaché <b>+{o.reward_bonds}</b>{heure && <small>{heure}</small>}
                        </span>
                      ) : (
                        <span className="oc-trace">{o.reward_bonds} B</span>
                      )}
                    </span>
                    {o.reclamee ? (
                      <span className="oc-parti" aria-label={`${o.title} : prime prise`}>{o.title}</span>
                    ) : (
                      <Coupon o={o} onReclamer={p.onReclamer} />
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
