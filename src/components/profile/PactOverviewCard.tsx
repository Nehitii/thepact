import { BarChart3, Calendar, Target, Flame, Trophy } from "lucide-react";
import { DataPanel } from "./settings-ui";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useRankXP } from "@/hooks/useRankXP";
import { differenceInDays, format, parseISO, isValid } from "date-fns";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { cn } from "@/lib/utils";

interface PactOverviewCardProps {
  userId: string;
}

export function PactOverviewCard({ userId }: PactOverviewCardProps) {
  const { data: pact } = usePact(userId);
  const { data: goals } = useGoals(pact?.id);
  const { data: rankData } = useRankXP(userId, pact?.id);
  const locale = useDateFnsLocale();

  if (!pact) return null;

  const createdDate = pact.created_at ? parseISO(pact.created_at) : null;
  const daysActive = createdDate && isValid(createdDate) ? differenceInDays(new Date(), createdDate) : 0;
  const totalGoals = goals?.length ?? 0;

  /* AUCUN OBJECTIF N A JAMAIS PORTE LE STATUT « completed ».
     C est celui des ETAPES. Un objectif termine est « fully_completed »,
     ou « validated » quand il a ete valide par un tiers — c est ce que
     retiennent la vitrine, le compte du pacte et `xp_du_membre`.
     Le filtre rendait donc toujours zero : 14 objectifs termines
     s affichaient « 0 / 38 ». */
  const completedGoals =
    goals?.filter((g) => g.status === "fully_completed" || g.status === "validated").length ?? 0;

  /* `pacts.points` n est ecrit par personne — la colonne existe, vaut
     zero, et l XP reelle est calculee par `xp_du_membre`, dont
     `useRankXP` est le miroir. La carte annoncait « 0 XP » a cote d un
     noyau de rang qui en affichait 1 210. */
  const xp = rankData?.currentXP ?? 0;

  const stats = [
    /* La date suivait le format anglais faute de locale : « Nov 22,
       2025 » au milieu d une interface francaise. */
    { icon: Calendar, label: "Scellé le", value: createdDate && isValid(createdDate) ? format(createdDate, "d MMMM yyyy", { locale }) : "—" },
    { icon: Flame, label: "Jours tenus", value: daysActive.toLocaleString("fr-FR") },
    { icon: Target, label: "Objectifs", value: `${completedGoals} / ${totalGoals}` },
    { icon: Trophy, label: "Expérience", value: `${xp.toLocaleString("fr-FR")} XP` },
  ];

  return (
    <DataPanel
      code="MODULE_01"
      title="Vue d’ensemble"
      taille="demi"
      rang="primaire"
      statusText={<span className="text-muted-foreground">{daysActive} jours</span>}
      footerLeft={<><span>Objectifs : <b className="text-primary">{totalGoals}</b></span><span>Terminés : <b className="text-primary">{completedGoals}</b></span></>}
      footerRight={<span>XP : <b className="text-primary">{xp.toLocaleString("fr-FR")}</b></span>}
    >
      <div className="py-4 grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="relative border border-primary/15 bg-primary/[0.03] p-3 transition-colors hover:border-primary/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-primary/60" />
              <span className="ds-t-label font-mono text-primary/40 tracking-[0.15em] uppercase">{label}</span>
            </div>
            <span className="text-sm font-bold text-foreground font-rajdhani">{value}</span>
          </div>
        ))}
      </div>

      {rankData?.currentRank && (
        <div className="pb-4">
          <div className="border border-primary/20 bg-primary/[0.04] p-3 flex items-center gap-3">
            <Trophy className="h-5 w-5" style={{ color: rankData.currentRank.frame_color || 'hsl(var(--primary))' }} />
            <div className="min-w-0 flex-1">
              <span className="ds-t-label font-mono text-primary/40 tracking-[0.15em] block uppercase">Rang actuel</span>
              <span className="text-sm font-orbitron font-semibold uppercase tracking-wide" style={{ color: rankData.currentRank.frame_color || 'hsl(var(--primary))' }}>{rankData.currentRank.name}</span>
            </div>
          </div>
        </div>
      )}
    </DataPanel>
  );
}
