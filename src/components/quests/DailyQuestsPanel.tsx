import { useState } from "react";
import { useDailyQuests, useClaimQuest } from "@/hooks/useDailyQuests";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";
import { Button } from "@/components/ui/button";

const OR = "#ffd700";
const VERT = "#34d399";

/**
 * Ordres du jour.
 *
 * ═══════════════════════════════════════════════════════════════
 * CE QUI CLOCHAIT N'ÉTAIT PAS LE DESSIN DES LIGNES.
 *
 * Le sceau hexagonal, l'arête colorée et la piste étaient déjà justes.
 * Mais on ne les voyait jamais : la génération des ordres était cassée
 * (voir useDailyQuests), donc la carte vivait en permanence dans son
 * ÉTAT VIDE — une phrase grise et un bouton « Générer » qui demandait
 * à l'utilisateur de s'écrire lui-même sa journée.
 *
 * Une carte n'a pas à demander la permission d'exister. Les ordres se
 * posent seuls à l'ouverture, le bouton disparaît, et il reste à
 * dessiner ce qu'on voit désormais tous les jours.
 *
 * TROIS CHOSES QUE L'EN-TÊTE DOIT DIRE, et qu'il ne disait pas :
 *
 *   CE QUI EST EN JEU. La prime du jour, acquise sur totale, avec sa
 *   barre. C'est la seule mesure qui résume les trois ordres d'un coup
 *   d'œil, et c'est elle qui donne du corps à une carte qui n'était
 *   qu'un filet de texte.
 *
 *   COMBIEN DE TEMPS IL RESTE. Le libellé disait « expire à minuit ».
 *   C'était faux : la journée des ordres est celle d'UTC, donc à Paris
 *   ils tombent à deux heures du matin l'été. Un temps restant est vrai
 *   partout, et il pousse davantage qu'une heure fixe.
 *
 *   QUAND TOUT EST FAIT. La journée close méritait mieux que trois
 *   lignes grisées.
 * ═══════════════════════════════════════════════════════════════
 */
export function DailyQuestsPanel() {
  const { data: quests = [], isLoading } = useDailyQuests();
  const claim = useClaimQuest();

  /* Une minute suffit : on affiche des heures et des minutes, pas des
     secondes. Et `useVisibleInterval` s'arrête quand l'onglet est
     caché — un compte à rebours pour personne ne sert à rien. */
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useVisibleInterval(() => setMaintenant(Date.now()), 60_000);

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
    >
      <header className="od-tete">
        <span className="od-titre" style={{ color: teinteTitre }}>
          Ordres du jour
        </span>

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
      </header>

      {quests.length > 0 && (
        <div className="od-jauge" aria-hidden="true">
          <i style={{ width: `${pctPrime}%`, background: toutFait ? VERT : OR }} />
        </div>
      )}

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
                    onClick={() => claim.mutate(q.id)}
                    disabled={claim.isPending}
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
    </section>
  );
}
