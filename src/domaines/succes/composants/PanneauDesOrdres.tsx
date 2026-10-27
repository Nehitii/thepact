import { Button } from "@/socle/ui/button";
import type { DailyQuest } from "@/domaines/succes/hooks/useDailyQuests";

const OR = "#ffd700";
const VERT = "#34d399";

/** Ce que le panneau dessine d un ordre — une `DailyQuest` s y range. */
export type OrdreDuPanneau = Pick<
  DailyQuest,
  "id" | "title" | "description" | "target" | "progress" | "reward_bonds" | "status"
>;

interface Proprietes {
  quests: readonly OrdreDuPanneau[];
  isLoading: boolean;
  onReclamer: (id: string) => void;
  reclamationEnCours: boolean;
  maintenant: number;
  replie: boolean;
  onBasculerRepli: () => void;
}

/**
 * Ordres du jour — LE DESSIN, sans les requetes.
 *
 * Detache de `DailyQuestsPanel` le 23/09, tel quel : le panneau garde
 * ses requetes et son repli, celui-ci ne fait que dessiner ce qu on lui
 * donne. C est ce qui permet au banc des ordres de le montrer a cote
 * de ses refontes, sur les memes ordres feints.
 *
 * ═══════════════════════════════════════════════════════════════
 * TROIS CHOSES QUE L'EN-TÊTE DOIT DIRE :
 *
 *   CE QUI EST EN JEU. La prime du jour, acquise sur totale, avec sa
 *   barre. C'est la seule mesure qui résume les trois ordres d'un coup
 *   d'œil.
 *
 *   COMBIEN DE TEMPS IL RESTE. La journée des ordres est celle d'UTC :
 *   à Paris ils tombent à deux heures du matin l'été. Un temps restant
 *   est vrai partout.
 *
 *   QUAND TOUT EST FAIT. La journée close méritait mieux que trois
 *   lignes grisées.
 * ═══════════════════════════════════════════════════════════════
 */
export function PanneauDesOrdres({
  quests, isLoading, onReclamer, reclamationEnCours, maintenant, replie, onBasculerRepli,
}: Proprietes) {
  const aReclamer = quests.some((q) => q.progress >= q.target && q.status !== "claimed");
  const primeTotale = quests.reduce((s, q) => s + (q.reward_bonds || 0), 0);
  const primeAcquise = quests
    .filter((q) => q.status === "claimed")
    .reduce((s, q) => s + (q.reward_bonds || 0), 0);
  const toutFait = quests.length > 0 && quests.every((q) => q.status === "claimed");
  const pctPrime = primeTotale > 0 ? Math.round((primeAcquise / primeTotale) * 100) : 0;

  /* Les ordres portent la date UTC et les déclencheurs de progression
     aussi : ils tombent donc à minuit UTC, pas à minuit ici. */
  const d = new Date(maintenant);
  const resteMs =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - maintenant;
  const resteH = Math.floor(resteMs / 3_600_000);
  const resteMin = Math.floor((resteMs % 3_600_000) / 60_000);
  const reste = resteH > 0 ? `${resteH} h ${String(resteMin).padStart(2, "0")}` : `${resteMin} min`;

  const teinteTitre = toutFait ? VERT : aReclamer ? OR : "var(--nexus-text-label)";

  return (
    <section
      className="od-carte"
      aria-label="Ordres du jour"
      data-etat={toutFait ? "clos" : aReclamer ? "a-reclamer" : "en-cours"}
      data-replie={replie ? "" : undefined}
    >
      <header className="od-tete">
        <span className="od-titre" style={{ color: teinteTitre }}>
          Ordres du jour
        </span>

        <div className="od-droite">
          {quests.length > 0 && (
            <>
              <span className="od-prime">
                <b style={{ color: teinteTitre }}>{primeAcquise}</b>
                <s>/{primeTotale}</s>
                <em>bonds</em>
              </span>
              <span className="od-reste" title="Les ordres du jour tombent à minuit UTC">
                {toutFait ? "journée close" : `reste ${reste}`}
              </span>
            </>
          )}

          <button
            type="button"
            className="od-bascule"
            onClick={onBasculerRepli}
            aria-expanded={!replie}
            aria-controls="od-corps"
            aria-label={replie ? "Déplier les ordres du jour" : "Replier les ordres du jour"}
            title={replie ? "Déplier" : "Replier"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </header>

      {quests.length > 0 && (
        <div className="od-jauge" aria-hidden="true">
          <i style={{ width: `${pctPrime}%`, background: toutFait ? VERT : OR }} />
        </div>
      )}

      {/* Tout ce qui se replie tient ici. La jauge et l en-tete
          restent dehors : repliee, la carte doit encore dire ce
          qu il y a a prendre. */}
      <div className="od-corps" id="od-corps">
        <div>
          {isLoading ? (
            <p className="od-mot">Ouverture des ordres…</p>
          ) : quests.length === 0 ? (
            /* Devenu rare : il faut n'avoir ni pas à franchir, ni rituel
               tenu, et avoir déjà tout réclamé. On le dit sans impasse —
               aucun bouton, puisqu'il n'y a rien à déclencher. */
            <p className="od-mot">
              Rien à ordonner aujourd'hui. Ouvre une mission et les ordres suivront.
            </p>
          ) : (
            <div className="od-liste">
              {quests.map((q) => {
                const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
                const prete = q.progress >= q.target && q.status !== "claimed";
                const reclamee = q.status === "claimed";
                const teinte = reclamee ? VERT : prete ? OR : "hsl(var(--primary))";

                return (
                  <div
                    key={q.id}
                    className="quest-order"
                    data-reclamee={reclamee ? "" : undefined}
                    style={{
                      ["--qo-c" as string]: teinte,
                      ["--qo-pct" as string]: `${pct}%`,
                    }}
                  >
                    <span className="quest-seal">
                      <span>{reclamee ? "✓" : prete ? "✦" : `${pct}%`}</span>
                    </span>

                    <div className="quest-body">
                      <h3>{q.title}</h3>
                      {q.description && <p>{q.description}</p>}
                      <div className="quest-track">
                        <i />
                      </div>
                    </div>

                    {prete ? (
                      <Button
                        size="sm"
                        className="od-reclamer h-8 px-3.5 shrink-0"
                        onClick={() => onReclamer(q.id)}
                        disabled={reclamationEnCours}
                      >
                        Réclamer <b>{q.reward_bonds}</b>
                      </Button>
                    ) : (
                      <span className="quest-prime">
                        <b>{q.progress}/{q.target}</b>
                        <span>{q.reward_bonds} bonds</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
