import { useDailyQuests, useGenerateDailyQuests, useClaimQuest } from "@/hooks/useDailyQuests";
import { Button } from "@/components/ui/button";
import { BondIcon } from "@/components/ui/bond-icon";
import { Sparkles, Sword, Check } from "lucide-react";

/**
 * Quetes du jour, en bande compacte.
 *
 * Etait un panneau de 255px : un titre, puis une carte par quete avec
 * titre, description, barre de progression pleine largeur et ligne de
 * pied. Deux quetes remplissaient un quart d'ecran pour une information
 * qui tient en une ligne — un nom, un avancement, une recompense.
 *
 * Devient une rangee de pastilles. L'avancement passe dans un anneau
 * construit en conic-gradient, la meme grammaire que l'anneau
 * d'accretion de la Singularite : le tableau de bord parle d'une seule
 * voix quand il montre une progression.
 *
 * La description n'est plus affichee en permanence — elle passe en
 * attribut title. Une quete se lit a son nom.
 */
export function DailyQuestsPanel() {
  const { data: quests = [], isLoading } = useDailyQuests();
  const generate = useGenerateDailyQuests();
  const claim = useClaimQuest();

  const aReclamer = quests.some((q) => q.progress >= q.target && q.status !== "claimed");

  return (
    <div
      className="relative flex flex-wrap items-center gap-x-4 gap-y-2"
      style={{
        background: "var(--nexus-bg)",
        border: "1px solid var(--nexus-border)",
        borderRadius: 4,
        boxShadow: "var(--nexus-shadow)",
        padding: "9px 14px",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px nexus-glow-top" />

      <span className="flex items-center gap-2 shrink-0">
        <Sword className="h-3.5 w-3.5" style={{ color: aReclamer ? "#ffd700" : "hsl(var(--primary))" }} />
        <span
          className="ds-t-label font-mono uppercase"
          style={{ letterSpacing: 3, color: "var(--nexus-text-dim)" }}
        >
          Quêtes
        </span>
      </span>

      {isLoading ? (
        <span className="ds-t-label font-mono" style={{ color: "var(--nexus-text-dimmer)" }}>
          Chargement…
        </span>
      ) : quests.length === 0 ? (
        <>
          <span className="ds-t-label font-mono" style={{ color: "var(--nexus-text-dimmer)" }}>
            Aucune quête active aujourd'hui
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 ml-auto"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            <Sparkles className="h-3 w-3 mr-1.5" /> Générer
          </Button>
        </>
      ) : (
        quests.map((q) => {
          const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
          const prete = q.progress >= q.target && q.status !== "claimed";
          const reclamee = q.status === "claimed";
          const teinte = reclamee ? "#34d399" : prete ? "#ffd700" : "hsl(var(--primary))";

          return (
            <span
              key={q.id}
              title={q.description || q.title}
              className="flex items-center gap-2 shrink-0"
              style={{ opacity: reclamee ? 0.55 : 1 }}
            >
              {/* Anneau d'avancement : le conic-gradient s'arrete au
                  pourcentage reel, comme l'anneau du c(oe)ur. */}
              <span
                className="quest-ring shrink-0"
                style={{
                  ["--q-c" as string]: teinte,
                  ["--q-pct" as string]: `${pct}%`,
                }}
                aria-hidden="true"
              >
                {reclamee ? <Check className="h-2.5 w-2.5" style={{ color: teinte }} /> : null}
              </span>

              <span className="flex flex-col leading-tight min-w-0">
                <span
                  className="ds-t-label font-mono truncate"
                  style={{ letterSpacing: 0.5, color: "var(--nexus-text-label)", maxWidth: "11rem" }}
                >
                  {q.title}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="ds-t-label font-mono" style={{ color: "var(--nexus-text-dimmer)" }}>
                    {q.progress}/{q.target}
                  </span>
                  <BondIcon size={10} />
                  <span className="ds-t-label font-mono" style={{ color: "var(--nexus-text-dimmer)" }}>
                    {q.reward_bonds}
                  </span>
                </span>
              </span>

              {prete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 border-[#ffd700]/50 text-[#ffd700] hover:bg-[#ffd700]/10"
                  onClick={() => claim.mutate(q.id)}
                  disabled={claim.isPending}
                >
                  Réclamer
                </Button>
              )}
            </span>
          );
        })
      )}
    </div>
  );
}
