import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Medal, Trophy, Target } from "lucide-react";

interface TopGoal {
  id: string;
  name: string;
  image_url: string | null;
  difficulty: string;
  potential_score: number;
  completion_date: string | null;
}

const PODIUM_HEIGHT = ["h-[170px]", "h-[140px]", "h-[110px]"];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd visually
const RANK_ICON = [Crown, Medal, Trophy];
const RANK_COLOR = [
  "from-amber-400 to-amber-600 text-amber-950",
  "from-slate-300 to-slate-500 text-slate-900",
  "from-orange-400 to-orange-700 text-orange-50",
];

export function GoalPodium({ goals }: { goals: TopGoal[] }) {
  const navigate = useNavigate();
  const top3 = goals.slice(0, 3);

  if (top3.length === 0) {
    return (
      <section className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 text-center">
        <Trophy className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Complète tes premiers objectifs pour apparaître au podium.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm p-5 overflow-hidden">
      <header className="mb-5">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Hall of Fame
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Tes meilleures victoires par XP
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3 items-end">
        {PODIUM_ORDER.map((rankIdx, displayIdx) => {
          const g = top3[rankIdx];
          if (!g) return <div key={displayIdx} />;
          const Icon = RANK_ICON[rankIdx];
          const colorCls = RANK_COLOR[rankIdx];
          return (
            <motion.button
              key={g.id}
              type="button"
              onClick={() => navigate(`/goals/${g.id}`)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: displayIdx * 0.12, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4 }}
              className="group flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
              aria-label={`#${rankIdx + 1} — ${g.name}`}
            >
              {/* avatar */}
              <div className="relative mb-2">
                <div
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 shadow-lg ${
                    rankIdx === 0
                      ? "border-amber-400"
                      : rankIdx === 1
                        ? "border-slate-300"
                        : "border-orange-500"
                  }`}
                >
                  {g.image_url ? (
                    <img src={g.image_url} alt={g.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Target className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* crown */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: displayIdx * 0.12 + 0.4, type: "spring", stiffness: 220 }}
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br shadow-md ${colorCls}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </motion.div>
                {/* glow ring for #1 */}
                {rankIdx === 0 && (
                  <span
                    className="absolute inset-0 rounded-full motion-reduce:hidden"
                    style={{
                      animation: "podiumGlow 2.4s ease-in-out infinite",
                      boxShadow: "0 0 24px hsl(45 95% 55% / 0.6)",
                    }}
                  />
                )}
              </div>
              <p className="text-[11px] font-medium line-clamp-2 leading-tight px-1 mb-2 max-w-full">
                {g.name}
              </p>
              <span className="text-[10px] tabular-nums text-muted-foreground mb-2">
                {g.potential_score} XP
              </span>
              {/* podium block */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                transition={{ delay: displayIdx * 0.12 + 0.2, duration: 0.6, ease: "easeOut" }}
                className={`w-full ${PODIUM_HEIGHT[rankIdx]} rounded-t-lg bg-gradient-to-b ${
                  rankIdx === 0
                    ? "from-amber-500/30 to-amber-500/5"
                    : rankIdx === 1
                      ? "from-slate-400/30 to-slate-400/5"
                      : "from-orange-500/30 to-orange-500/5"
                } border-t-2 ${
                  rankIdx === 0
                    ? "border-amber-400"
                    : rankIdx === 1
                      ? "border-slate-300"
                      : "border-orange-500"
                } flex items-start justify-center pt-2`}
              >
                <span className="text-2xl font-bold text-foreground/80">#{rankIdx + 1}</span>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
      <style>{`
        @keyframes podiumGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
      `}</style>
    </section>
  );
}