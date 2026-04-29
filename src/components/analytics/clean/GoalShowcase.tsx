import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Sparkles, Target } from "lucide-react";

interface GoalItem {
  id: string;
  name: string;
  image_url: string | null;
  status: string;
  difficulty: string;
  potential_score: number;
  completion_date: string | null;
  progress: number;
}

const DIFFICULTY_HUE: Record<string, string> = {
  easy: "142 70% 50%",
  medium: "45 95% 55%",
  hard: "25 100% 60%",
  extreme: "0 90% 65%",
  impossible: "280 75% 55%",
  custom: "320 70% 55%",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    fully_completed: { label: "Complété", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    validated: { label: "Validé", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    in_progress: { label: "En cours", cls: "bg-primary/20 text-primary border-primary/30" },
    not_started: { label: "À faire", cls: "bg-muted/40 text-muted-foreground border-border" },
  };
  const m = map[status] ?? map.not_started;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${m.cls}`}>
      {m.label}
    </span>
  );
}

/** Horizontal animated gallery of goals with hero images and difficulty halos. */
export function GoalShowcase({ goals }: { goals: GoalItem[] }) {
  const navigate = useNavigate();
  const items = useMemo(() => goals.slice(0, 12), [goals]);

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 text-center">
        <Target className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Aucun objectif à afficher pour le moment.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-5">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Tes objectifs en images
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Galerie défilante — clique pour ouvrir
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{items.length}</span>
      </header>

      <div className="relative -mx-5 px-5 overflow-x-auto scrollbar-thin">
        <div className="flex gap-4 pb-2">
          {items.map((g, i) => {
            const hue = DIFFICULTY_HUE[g.difficulty] ?? DIFFICULTY_HUE.easy;
            const isCompleted = g.status === "fully_completed" || g.status === "validated";
            return (
              <motion.button
                key={g.id}
                type="button"
                onClick={() => navigate(`/goals/${g.id}`)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative flex-shrink-0 w-[200px] rounded-xl overflow-hidden text-left bg-muted/30 border border-border/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Ouvrir l'objectif ${g.name}`}
                style={{
                  boxShadow: `0 8px 24px -12px hsl(${hue} / 0.35)`,
                }}
              >
                {/* Image / placeholder */}
                <div className="relative h-[140px] w-full overflow-hidden">
                  {g.image_url ? (
                    <img
                      src={g.image_url}
                      alt={g.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, hsl(${hue} / 0.25), hsl(${hue} / 0.05))`,
                      }}
                    >
                      <Target className="h-8 w-8 text-foreground/40" />
                    </div>
                  )}
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                  {/* halo by difficulty */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 100%, hsl(${hue} / 0.4), transparent 70%)`,
                    }}
                  />
                  {/* trophy for completed */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.05 + 0.3, type: "spring", stiffness: 200 }}
                      className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/90 text-amber-950 shadow-lg"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </div>

                {/* footer */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={g.status} />
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {g.potential_score} XP
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                    {g.name}
                  </p>
                  {/* progress bar */}
                  <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${g.progress}%` }}
                      transition={{ delay: i * 0.05 + 0.2, duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `hsl(${hue})` }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}