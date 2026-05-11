/**
 * Reviews archive — historique de tous les rituels (daily / weekly / monthly /
 * quarterly / annual) avec filtre par type, recherche full-text et trigger d'un
 * nouveau rituel (relié aux hotkeys F7/F8/F9).
 */
import { useMemo, useState } from "react";
import { Search, Plus, Calendar, Sparkles, Star } from "lucide-react";
import { useReviews, type ReviewType, type Review } from "@/hooks/useReviews";
import { ReviewRitualModal } from "@/components/reflect/ReviewRitualModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModuleHeader } from "@/components/layout/ModuleHeader";

const TYPES: { value: ReviewType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

export default function Reviews() {
  const [filter, setFilter] = useState<ReviewType | "all">("all");
  const [search, setSearch] = useState("");
  const [openType, setOpenType] = useState<ReviewType | null>(null);

  const { data: reviews = [], isLoading } = useReviews(
    filter === "all" ? undefined : { type: filter },
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter((r) => {
      const blob = JSON.stringify(r.answers).toLowerCase();
      return (
        blob.includes(q) ||
        (r.highlights ?? "").toLowerCase().includes(q) ||
        (r.lowlights ?? "").toLowerCase().includes(q) ||
        (r.next_focus ?? "").toLowerCase().includes(q)
      );
    });
  }, [reviews, search]);

  return (
    <div className="page-px page-py space-y-6 max-w-5xl mx-auto">
      <ModuleHeader
        systemLabel="REFLECT · ARCHIVE"
        title="Reflect"
        titleAccent="Archive"
      />

      <div className="flex flex-wrap gap-2 items-center">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 rounded-sm text-xs font-orbitron uppercase tracking-wider border transition-all ${
              filter === t.value
                ? "bg-primary/15 border-primary text-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/40"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="hud-primary" onClick={() => setOpenType("daily")}>
            <Plus className="h-4 w-4 mr-1" /> Daily (F7)
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpenType("monthly")}>
            Monthly (F8)
          </Button>
          <Button size="sm" variant="outline" onClick={() => setOpenType("quarterly")}>
            Quarterly (F9)
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans l'archive…"
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12 font-rajdhani">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/40 rounded-sm">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary/60" />
          <p className="font-orbitron text-sm uppercase text-foreground">Aucune revue</p>
          <p className="text-sm text-muted-foreground mt-1">
            Lance ton premier rituel avec F7 (Daily Shutdown).
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </ul>
      )}

      {openType && (
        <ReviewRitualModal open={!!openType} onClose={() => setOpenType(null)} type={openType} />
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: Review }) {
  return (
    <li className="border border-border/40 bg-card/40 rounded-sm p-4 hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-orbitron text-[10px] uppercase">
            {review.type}
          </Badge>
          <span className="font-rajdhani text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {review.period_start}
            {review.period_end !== review.period_start ? ` → ${review.period_end}` : ""}
          </span>
          <Badge
            variant={review.status === "completed" ? "default" : "secondary"}
            className="text-[10px]"
          >
            {review.status}
          </Badge>
        </div>
        {typeof review.mood === "number" && (
          <span className="flex items-center gap-1 text-amber-400 text-xs">
            <Star className="h-3.5 w-3.5 fill-current" />
            {review.mood}/5
          </span>
        )}
      </div>
      {(review.highlights || review.next_focus) && (
        <div className="space-y-1 text-sm text-foreground/80 font-rajdhani">
          {review.highlights && <p className="line-clamp-2">✦ {review.highlights}</p>}
          {review.next_focus && (
            <p className="line-clamp-2 text-primary/80">→ {review.next_focus}</p>
          )}
        </div>
      )}
    </li>
  );
}