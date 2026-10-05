import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Crown, Medal, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DSPanel, DSBadge, DSEmptyState, DSLoadingState } from "@/components/ds";
import { Button } from "@/components/ui/button";

interface SeasonRow {
  id: string;
  slug: string;
  name: string;
  theme: string | null;
  starts_at: string;
  ends_at: string;
}

interface HofRow {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  points: number;
  goals_completed: number;
  prestige_awarded: number;
}

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-zinc-300" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-orange-400" />;
  return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
}

export default function HallOfFame() {
  const { data: seasons, isLoading: loadingSeasons } = useQuery({
    queryKey: ["seasons-archive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, slug, name, theme, starts_at, ends_at")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SeasonRow[];
    },
    staleTime: 60_000,
  });

  const endedSeasons = useMemo(
    () => (seasons ?? []).filter((s) => new Date(s.ends_at) < new Date()),
    [seasons],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const seasonId = selected ?? endedSeasons[0]?.id ?? null;

  const { data: leaderboard, isLoading: loadingHof } = useQuery({
    queryKey: ["hall-of-fame", seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hall_of_fame")
        .select("rank, user_id, display_name, avatar_url, points, goals_completed, prestige_awarded")
        .eq("season_id", seasonId!)
        .order("rank", { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as HofRow[];
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Retour">
          <Link to="/leaderboard"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-yellow-400" />
          <div>
            <h1 className="font-orbitron text-2xl tracking-wide">Hall of Fame</h1>
            <p className="text-sm text-muted-foreground">Champions des saisons passées</p>
          </div>
        </div>
      </div>

      {loadingSeasons ? (
        <DSLoadingState message="LOADING SEASONS" />
      ) : endedSeasons.length === 0 ? (
        <DSEmptyState
          visual="icon"
          icon={Sparkles}
          message="NO SEASON ARCHIVED"
          description="La première saison sera archivée ici à sa fin."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {endedSeasons.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  seasonId === s.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <DSPanel className="p-0 overflow-hidden">
            {loadingHof ? (
              <div className="p-6"><DSLoadingState message="LOADING LEADERBOARD" /></div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <div className="p-6">
                <DSEmptyState
                  visual="icon"
                  icon={Trophy}
                  message="SNAPSHOT UNAVAILABLE"
                  description="Cette saison n'a pas encore été archivée."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {leaderboard.map((row) => (
                  <li
                    key={row.user_id}
                    className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center">
                      {rankIcon(row.rank)}
                    </div>
                    {row.avatar_url ? (
                      <img
                        src={row.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full border border-border bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-rajdhani text-base">
                        {row.display_name ?? "Anonyme"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.goals_completed} missions accomplies
                      </div>
                    </div>
                    {row.prestige_awarded > 0 && (
                      <DSBadge variant="new" label={`+${row.prestige_awarded} PRESTIGE`} />
                    )}
                    <div className="font-mono text-sm tabular-nums text-primary">
                      {row.points.toLocaleString()} pts
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DSPanel>
        </>
      )}
    </div>
  );
}