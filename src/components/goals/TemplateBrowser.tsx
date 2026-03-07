import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGoalTemplates, GoalTemplate } from "@/hooks/useGoalTemplates";
import { GOAL_TAGS, DIFFICULTY_OPTIONS, getTagLabel, getDifficultyLabel } from "@/lib/goalConstants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  BookTemplate,
  Search,
  Star,
  Users,
  ListOrdered,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TemplateBrowserProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: GoalTemplate) => void;
}

const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "health", label: "Health & Fitness" },
  { value: "career", label: "Career" },
  { value: "learning", label: "Learning" },
  { value: "finance", label: "Finance" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "creative", label: "Creative" },
  { value: "general", label: "General" },
];

export function TemplateBrowser({ open, onClose, onSelect }: TemplateBrowserProps) {
  const { t } = useTranslation();
  const { data: templates = [], isLoading } = useGoalTemplates();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = templates.filter((tpl) => {
    const matchesSearch =
      !search ||
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || tpl.category === category;
    return matchesSearch && matchesCategory;
  });

  const featured = filtered.filter((t) => t.is_featured);
  const community = filtered.filter((t) => !t.is_featured);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 bg-card border-white/10 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-3 text-lg font-orbitron tracking-wider">
            <BookTemplate className="h-5 w-5 text-primary" />
            Goal Templates
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Start from a proven blueprint — customize it your way
          </p>
        </DialogHeader>

        <div className="px-6 py-3 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-background/50 border-white/10"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant="ghost"
                size="sm"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "text-xs shrink-0 rounded-full",
                  category === cat.value
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-[50vh]">
          <div className="px-6 py-4 space-y-6">
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookTemplate className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No templates found</p>
                <p className="text-sm mt-1">Try adjusting your search or category filter</p>
              </div>
            )}

            {featured.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h3 className="text-sm font-bold font-orbitron uppercase tracking-wider text-foreground">Featured</h3>
                </div>
                <div className="space-y-2">
                  {featured.map((tpl) => (
                    <TemplateCard key={tpl.id} template={tpl} onSelect={onSelect} t={t} />
                  ))}
                </div>
              </div>
            )}

            {community.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-bold font-orbitron uppercase tracking-wider text-foreground">
                    {featured.length > 0 ? "Community" : "Templates"}
                  </h3>
                </div>
                <div className="space-y-2">
                  {community.map((tpl) => (
                    <TemplateCard key={tpl.id} template={tpl} onSelect={onSelect} t={t} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onSelect,
  t,
}: {
  template: GoalTemplate;
  onSelect: (t: GoalTemplate) => void;
  t: any;
}) {
  const diffOption = DIFFICULTY_OPTIONS.find((d) => d.value === template.difficulty);
  const steps = typeof template.steps === "string" ? JSON.parse(template.steps) : template.steps || [];

  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={() => onSelect(template)}
      className="w-full text-left p-4 rounded-xl border border-white/10 bg-background/30 hover:bg-white/5 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-foreground truncate">{template.name}</h4>
            {template.is_featured && <Sparkles className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{template.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {diffOption && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold"
                style={{ borderColor: diffOption.color, color: diffOption.color }}
              >
                {getDifficultyLabel(template.difficulty, t)}
              </Badge>
            )}
            {template.tags?.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {getTagLabel(tag, t)}
              </Badge>
            ))}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ListOrdered className="h-3 w-3" />
              {steps.length} steps
            </span>
            {template.use_count > 0 && (
              <span className="text-[10px] text-muted-foreground">
                Used {template.use_count}x
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}
