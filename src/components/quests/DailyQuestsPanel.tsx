import { useDailyQuests, useGenerateDailyQuests, useClaimQuest } from "@/hooks/useDailyQuests";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const OR = "#ffd700";
const VERT = "#34d399";

/**
 * Quetes du jour — ordres de mission.
 *
 * Direction retenue apres maquette de trois variantes. Chaque quete est
 * une directive : sceau hexagonal portant l'avancement, objectif au
 * centre avec sa description et sa piste, prime a droite. L'arete
 * coloree sur le flanc donne le statut sans qu'on ait a lire.
 *
 * L'hexagone plutot qu'un cercle est deliberé : la page compte deja
 * quatre anneaux — le c(oe)ur, le rang, les trois jauges du monitoring
 * — et un cinquieme s'y serait confondu.
 *
 * Le passage a l'or est le seul moment ou cette bande demande une
 * action plutot que d'informer. Il doit se voir de loin, d'ou l'arete,
 * le sceau et le bouton qui virent ensemble.
 */
export function DailyQuestsPanel() {
  const { data: quests = [], isLoading } = useDailyQuests();
  const generate = useGenerateDailyQuests();
  const claim = useClaimQuest();

  const aReclamer = quests.some((q) => q.progress >= q.target && q.status !== "claimed");
  const primeTotale = quests.reduce((s, q) => s + (q.reward_bonds || 0), 0);
  const primeAcquise = quests
    .filter((q) => q.status === "claimed")
    .reduce((s, q) => s + (q.reward_bonds || 0), 0);

  return (
    <div
      className="relative"
      style={{
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "13px 15px 14px",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      <div className="flex items-center gap-2.5 mb-2.5">
        <span
          className="ds-t-label font-mono uppercase shrink-0"
          style={{ letterSpacing: 3, color: aReclamer ? OR : "var(--nexus-text-dim)" }}
        >
          // Ordres du jour
        </span>
        <span
          className="flex-1 h-px"
          style={{ background: "linear-gradient(90deg, var(--nexus-separator), transparent)" }}
        />
        <span
          className="ds-t-label font-mono shrink-0"
          style={{ letterSpacing: 1.4, color: "var(--nexus-text-dimmer)", fontVariantNumeric: "tabular-nums" }}
        >
          {quests.length > 0 ? `${primeAcquise} / ${primeTotale} BONDS` : "EXPIRE À MINUIT"}
        </span>
      </div>

      {isLoading ? (
        <p className="ds-t-label font-mono" style={{ color: "var(--nexus-text-dimmer)" }}>
          Chargement…
        </p>
      ) : quests.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="ds-t-label font-mono" style={{ color: "var(--nexus-text-dimmer)" }}>
            Aucun ordre actif aujourd'hui.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            <Sparkles className="h-3 w-3 mr-1.5" /> Générer
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {quests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
            const prete = q.progress >= q.target && q.status !== "claimed";
            const reclamee = q.status === "claimed";
            const teinte = reclamee ? VERT : prete ? OR : "hsl(var(--primary))";

            return (
              <div
                key={q.id}
                className="quest-order"
                style={{
                  ["--qo-c" as string]: teinte,
                  ["--qo-pct" as string]: `${pct}%`,
                  opacity: reclamee ? 0.6 : 1,
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
                    variant="outline"
                    className="h-7 px-3 shrink-0"
                    style={{
                      borderColor: `color-mix(in srgb, ${OR} 55%, transparent)`,
                      color: OR,
                      background: `color-mix(in srgb, ${OR} 12%, transparent)`,
                    }}
                    onClick={() => claim.mutate(q.id)}
                    disabled={claim.isPending}
                  >
                    Réclamer {q.reward_bonds}
                  </Button>
                ) : (
                  <span className="quest-prime">
                    <b>{q.progress}/{q.target}</b>
                    <span>{q.reward_bonds} BONDS</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
