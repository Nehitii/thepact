import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicTemplates, useRateTemplate, useTemplateRatings, type GoalTemplate } from "@/hooks/useGoalTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { DSPanel, DSBadge, DSEmptyState, DSLoadingState } from "@/components/ds";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Search, ArrowLeft, Sparkles, TrendingUp, Clock, Check } from "lucide-react";

const CATEGORIES = ["all", "general", "health", "finance", "career", "personal", "habit", "creative"];

export default function TemplatesMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"rating" | "popular" | "recent">("rating");
  const [active, setActive] = useState<GoalTemplate | null>(null);

  const { data: templates = [], isLoading } = usePublicTemplates({ category, search, sort });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour
      </button>

      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.25em] text-primary/80 font-display flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> Marketplace
        </div>
        <h1 className="text-3xl font-display tracking-wide">Templates communautaires</h1>
        <p className="text-sm text-muted-foreground">Découvre des modèles d'objectifs partagés par la communauté.</p>
      </div>

      <DSPanel className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-8" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Mieux notés</SelectItem>
            <SelectItem value="popular">Plus populaires</SelectItem>
            <SelectItem value="recent">Récents</SelectItem>
          </SelectContent>
        </Select>
      </DSPanel>

      {isLoading ? (
        <DSLoadingState message="LOADING TEMPLATES" />
      ) : templates.length === 0 ? (
        <DSEmptyState message="NO TEMPLATES" description="Aucun modèle ne correspond à ces filtres." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t)}
              className="text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] p-4 transition space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display tracking-wide line-clamp-2">{t.name}</h3>
                <DSBadge variant={t.is_featured ? "new" : "live"} label={t.difficulty} />
              </div>
              {t.description && <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{Number(t.rating_avg).toFixed(1)}</span>
                  <span className="text-muted-foreground/60">({t.rating_count})</span>
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {t.use_count}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <TemplateDetailModal template={active} onClose={() => setActive(null)} />
    </div>
  );
}

function TemplateDetailModal({ template, onClose }: { template: GoalTemplate | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ratings = [] } = useTemplateRatings(template?.id);
  const rate = useRateTemplate();
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");

  if (!template) return null;
  const myRating = ratings.find((r) => r.user_id === user?.id);

  const submit = async () => {
    if (!template) return;
    await rate.mutateAsync({ templateId: template.id, rating: stars, review });
    setStars(0); setReview("");
  };

  const useTemplate = () => {
    onClose();
    navigate(`/goals/new?templateId=${template.id}`);
  };

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}

          <div className="flex flex-wrap gap-1.5">
            <DSBadge variant="live" label={template.difficulty} />
            <DSBadge variant="standby" label={template.category} />
            {template.tags?.map((t) => <DSBadge key={t} variant="stale" label={t} />)}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded border border-white/[0.06] p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Note</div>
              <div className="font-mono">{Number(template.rating_avg).toFixed(1)} <span className="text-[10px] text-muted-foreground">/5</span></div>
            </div>
            <div className="rounded border border-white/[0.06] p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Avis</div>
              <div className="font-mono">{template.rating_count}</div>
            </div>
            <div className="rounded border border-white/[0.06] p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Étapes</div>
              <div className="font-mono">{Array.isArray(template.steps) ? template.steps.length : 0}</div>
            </div>
          </div>

          {Array.isArray(template.steps) && template.steps.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Étapes incluses</div>
              <ol className="space-y-1 list-decimal list-inside">
                {template.steps.slice(0, 10).map((s, i) => (
                  <li key={i} className="text-sm">{s.title}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="border-t border-white/[0.06] pt-3 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {myRating ? "Modifier ta note" : "Noter ce modèle"}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className="p-0.5"
                  aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                >
                  <Star className={`w-5 h-5 ${(stars || myRating?.rating || 0) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Input value={review} onChange={(e) => setReview(e.target.value)} placeholder="Avis (optionnel)" />
            <Button size="sm" onClick={submit} disabled={!stars || rate.isPending}>
              <Check className="w-3.5 h-3.5 mr-1" /> Enregistrer ma note
            </Button>
          </div>

          {ratings.length > 0 && (
            <div className="border-t border-white/[0.06] pt-3 space-y-2 max-h-40 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avis récents</div>
              {ratings.slice(0, 10).map((r) => (
                <div key={r.id} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${r.rating >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />)}
                    <Clock className="w-3 h-3 text-muted-foreground ml-2" />
                    <span className="text-muted-foreground/60">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.review && <p className="text-muted-foreground italic">« {r.review} »</p>}
                </div>
              ))}
            </div>
          )}

          <Button onClick={useTemplate} className="w-full">
            Utiliser ce modèle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}