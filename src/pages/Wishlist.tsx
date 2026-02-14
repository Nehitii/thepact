import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CyberBackground } from "@/components/CyberBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import {
  PactWishlistItemType,
  useCreatePactWishlistItem,
  useDeletePactWishlistItem,
  usePactWishlistItems,
  useUpdatePactWishlistItem,
} from "@/hooks/usePactWishlist";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useWishlistGoalSync } from "@/hooks/useWishlistGoalSync";
import { ArrowLeft, Check, Edit, ExternalLink, Link, Plus, Trophy } from "lucide-react";
import { DuplicateMergeDialog, type DuplicateMergePreview } from "@/components/wishlist/DuplicateMergeDialog";
import { NeedVsWantChart } from "@/components/wishlist/NeedVsWantChart";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { AnimatePresence } from "framer-motion";

function normalizeWishlistName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findDuplicateByNameAndGoal(opts: {
  items: Array<{ id: string; name: string; goal_id: string | null }>;
  name: string;
  goalId: string | null;
  excludeId?: string | null;
}) {
  const needle = normalizeWishlistName(opts.name);
  const goalKey = opts.goalId ?? null;
  return (
    opts.items.find(
      (i) =>
        i.id !== (opts.excludeId ?? null) &&
        normalizeWishlistName(i.name) === needle &&
        (i.goal_id ?? null) === goalKey
    ) ?? null
  );
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();

  const { data: items = [], isLoading } = usePactWishlistItems(user?.id);
  const createItem = useCreatePactWishlistItem();
  const updateItem = useUpdatePactWishlistItem();
  const deleteItem = useDeletePactWishlistItem();

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);

  // Goal sync
  useWishlistGoalSync(user?.id, pact?.id, items);

  const [filterType, setFilterType] = useState<"all" | PactWishlistItemType>("all");
  const [sortBy, setSortBy] = useState<"recent" | "cost_desc" | "cost_asc">("recent");
  const [search, setSearch] = useState("");

  // New item form
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newType, setNewType] = useState<PactWishlistItemType>("optional");
  const [newCategory, setNewCategory] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // Edit form
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editType, setEditType] = useState<PactWishlistItemType>("optional");
  const [editNotes, setEditNotes] = useState("");
  const [editGoalId, setEditGoalId] = useState("none");
  const [editUrl, setEditUrl] = useState("");

  // Merge state
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeMode, setMergeMode] = useState<"create" | "edit" | null>(null);
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string | null>(null);
  const [mergeExistingPreview, setMergeExistingPreview] = useState<DuplicateMergePreview | null>(null);
  const [mergeIncomingPreview, setMergeIncomingPreview] = useState<DuplicateMergePreview | null>(null);

  const editingItem = useMemo(
    () => (editId ? items.find((i) => i.id === editId) ?? null : null),
    [editId, items]
  );

  const openEdit = (item: (typeof items)[number]) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.category ?? "");
    setEditCost(String(item.estimated_cost ?? 0));
    setEditType(item.item_type);
    setEditNotes(item.notes ?? "");
    setEditGoalId(item.goal_id ?? "none");
    setEditUrl(item.url ?? "");
    setEditOpen(true);
  };

  const saveEdit = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user || !editId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    const parsedCost = Number((editCost || "0").replace(",", "."));
    const nextGoalId = editGoalId === "none" ? null : editGoalId;

    if (!opts?.skipDuplicateCheck) {
      const dupe = findDuplicateByNameAndGoal({ items, name: trimmed, goalId: nextGoalId, excludeId: editId });
      if (dupe) {
        const dupeFull = items.find((i) => i.id === dupe.id);
        setMergeMode("edit");
        setMergeDuplicateId(dupe.id);
        setMergeExistingPreview({
          name: dupeFull?.name ?? dupe.name,
          goalId: dupeFull?.goal_id ?? null,
          goalName: dupeFull?.goal?.name ?? null,
          category: dupeFull?.category ?? null,
          estimatedCost: Number(dupeFull?.estimated_cost ?? 0),
          itemType: (dupeFull?.item_type ?? "optional") as any,
          notes: dupeFull?.notes ?? null,
        });
        setMergeIncomingPreview({
          name: trimmed,
          goalId: nextGoalId,
          goalName: nextGoalId ? goals.find((g) => g.id === nextGoalId)?.name ?? null : null,
          category: editCategory.trim() || null,
          estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
          itemType: editType,
          notes: editNotes.trim() || null,
        });
        setMergeOpen(true);
        return;
      }
    }

    await updateItem.mutateAsync({
      userId: user.id,
      id: editId,
      patch: {
        name: trimmed,
        category: editCategory.trim() || null,
        estimated_cost: Number.isFinite(parsedCost) ? parsedCost : 0,
        item_type: editType,
        notes: editNotes.trim() || null,
        goal_id: nextGoalId,
        url: editUrl.trim() || null,
      },
    });
    setEditOpen(false);
  };

  const derived = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const active = items.filter((i) => !i.acquired);
    const acquired = items.filter((i) => i.acquired);

    let filtered = active;
    if (filterType !== "all") {
      filtered = filtered.filter((i) => i.item_type === filterType);
    }
    if (normalizedSearch) {
      filtered = filtered.filter((i) => {
        const goalName = i.goal?.name ?? "";
        return (
          i.name.toLowerCase().includes(normalizedSearch) ||
          (i.category ?? "").toLowerCase().includes(normalizedSearch) ||
          goalName.toLowerCase().includes(normalizedSearch)
        );
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "cost_desc") return Number(b.estimated_cost) - Number(a.estimated_cost);
      if (sortBy === "cost_asc") return Number(a.estimated_cost) - Number(b.estimated_cost);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const requiredTotal = active.reduce((sum, i) => sum + (i.item_type === "required" ? Number(i.estimated_cost || 0) : 0), 0);
    const optionalTotal = active.reduce((sum, i) => sum + (i.item_type === "optional" ? Number(i.estimated_cost || 0) : 0), 0);

    return { list: sorted, acquired, totals: { required: requiredTotal, optional: optionalTotal } };
  }, [items, filterType, sortBy, search]);

  const createNew = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    const parsedCost = Number((newCost || "0").replace(",", "."));

    if (!opts?.skipDuplicateCheck) {
      const dupe = findDuplicateByNameAndGoal({ items, name: trimmed, goalId: null });
      if (dupe) {
        const dupeFull = items.find((i) => i.id === dupe.id);
        setMergeMode("create");
        setMergeDuplicateId(dupe.id);
        setMergeExistingPreview({
          name: dupeFull?.name ?? dupe.name, goalId: dupeFull?.goal_id ?? null, goalName: dupeFull?.goal?.name ?? null,
          category: dupeFull?.category ?? null, estimatedCost: Number(dupeFull?.estimated_cost ?? 0),
          itemType: (dupeFull?.item_type ?? "optional") as any, notes: dupeFull?.notes ?? null,
        });
        setMergeIncomingPreview({
          name: trimmed, goalId: null, goalName: null, category: newCategory.trim() || null,
          estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0, itemType: newType, notes: null,
        });
        setMergeOpen(true);
        return;
      }
    }

    await createItem.mutateAsync({
      userId: user.id, name: trimmed,
      estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
      itemType: newType, category: newCategory.trim() || null,
      url: newUrl.trim() || null,
    });
    setNewName(""); setNewCost(""); setNewCategory(""); setNewType("optional"); setNewUrl(""); setNewOpen(false);
  };

  const performMerge = async () => {
    if (!user || !mergeMode || !mergeDuplicateId || !mergeExistingPreview || !mergeIncomingPreview) return;
    try {
      setMergeBusy(true);
      const dupeItem = items.find((i) => i.id === mergeDuplicateId);
      const currentItem = editId ? items.find((i) => i.id === editId) : null;
      const mergedCost = Number(dupeItem?.estimated_cost ?? 0) + Number(mergeIncomingPreview.estimatedCost ?? 0);
      const mergedType: PactWishlistItemType =
        (dupeItem?.item_type === "required" || mergeIncomingPreview.itemType === "required") ? "required" : "optional";
      const mergedCategory = (dupeItem?.category ?? "").trim() || (mergeIncomingPreview.category ?? "").trim() || null;
      const mergedNotes = [dupeItem?.notes?.trim(), mergeIncomingPreview.notes?.trim()].filter(Boolean).join("\n\n") || null;

      await updateItem.mutateAsync({
        userId: user.id, id: mergeDuplicateId,
        patch: { name: dupeItem?.name ?? mergeIncomingPreview.name, goal_id: dupeItem?.goal_id ?? mergeIncomingPreview.goalId ?? null,
          estimated_cost: mergedCost, item_type: mergedType, category: mergedCategory, notes: mergedNotes },
      });

      if (mergeMode === "edit" && currentItem && currentItem.id !== mergeDuplicateId) {
        await deleteItem.mutateAsync({ userId: user.id, id: currentItem.id });
        setEditOpen(false);
      }

      toast({ title: "Merged", description: "Duplicates combined into a single wishlist item." });
      setMergeOpen(false); setMergeMode(null); setMergeDuplicateId(null);
      setMergeExistingPreview(null); setMergeIncomingPreview(null); setNewOpen(false);
    } finally {
      setMergeBusy(false);
    }
  };

  const keepBoth = async () => {
    if (!mergeMode) return;
    setMergeOpen(false);
    if (mergeMode === "create") { await createNew({ skipDuplicateCheck: true }); return; }
    await saveEdit({ skipDuplicateCheck: true });
  };

  const handleToggleAcquired = (id: string, acquired: boolean) => {
    if (!user) return;
    updateItem.mutate({ userId: user.id, id, patch: { acquired } });
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    deleteItem.mutate({ userId: user.id, id });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />

      <DuplicateMergeDialog
        open={mergeOpen} onOpenChange={setMergeOpen}
        existing={mergeExistingPreview ?? { name: "", estimatedCost: 0, itemType: "optional", category: null, goalName: null, notes: null } as any}
        incoming={mergeIncomingPreview ?? { name: "", estimatedCost: 0, itemType: "optional", category: null, goalName: null, notes: null } as any}
        isBusy={mergeBusy} onMerge={performMerge} onKeepBoth={keepBoth}
      />

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card/90 backdrop-blur-2xl border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-primary tracking-wider">Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Running shoes" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Estimated cost</Label>
                <Input value={editCost} onChange={(e) => setEditCost(e.target.value)} placeholder="0" inputMode="decimal" />
              </div>
              <div className="space-y-2">
                <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Category</Label>
                <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="e.g. Equipment" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5" /> URL (optional)
              </Label>
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." type="url" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-rajdhani font-semibold">Required for Pact</p>
                <p className="text-xs text-muted-foreground">Mark necessities that support goal completion.</p>
              </div>
              <Switch checked={editType === "required"} onCheckedChange={(v) => setEditType(v ? "required" : "optional")} />
            </div>
            <div className="space-y-2">
              <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Link to Goal</Label>
              <Select value={editGoalId} onValueChange={setEditGoalId}>
                <SelectTrigger><SelectValue placeholder="Select a goal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Notes</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Why is this needed?" rows={3} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => saveEdit()} disabled={!editName.trim() || updateItem.isPending} className="flex-1">
                <Check className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 backdrop-blur-sm border border-border text-primary/70 font-rajdhani font-medium tracking-wider transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button variant="hud" className="rounded-xl font-orbitron text-xs tracking-wider">
                <Plus className="h-4 w-4 mr-2" /> ADD ITEM
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card/90 backdrop-blur-2xl border-primary/20">
              <DialogHeader>
                <DialogTitle className="font-orbitron text-primary tracking-wider">New Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Running shoes" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Estimated cost</Label>
                    <Input value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="0" inputMode="decimal" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground">Category</Label>
                    <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Equipment" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-rajdhani uppercase text-xs tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Link className="h-3.5 w-3.5" /> URL (optional)
                  </Label>
                  <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." type="url" />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-rajdhani font-semibold">Required for Pact</p>
                    <p className="text-xs text-muted-foreground">Use this for goal-linked necessities.</p>
                  </div>
                  <Switch checked={newType === "required"} onCheckedChange={(v) => setNewType(v ? "required" : "optional")} />
                </div>
                <Button onClick={() => createNew()} disabled={!newName.trim() || createItem.isPending} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add to Wishlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-orbitron font-bold tracking-wider text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
            Wishlist
          </h1>
          <p className="text-sm text-muted-foreground font-rajdhani">
            Strategic acquisition planning — separate needs from wants.
          </p>
        </div>

        {/* Need vs Want visualization */}
        <NeedVsWantChart
          requiredTotal={derived.totals.required}
          optionalTotal={derived.totals.optional}
          currency={currency}
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item, category, or goal…"
            className="bg-card/50 backdrop-blur-sm border-primary/15"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="md:w-48 bg-card/50 backdrop-blur-sm border-primary/15">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="required">Required</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="md:w-48 bg-card/50 backdrop-blur-sm border-primary/15">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="cost_desc">Cost (high → low)</SelectItem>
              <SelectItem value="cost_asc">Cost (low → high)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active items */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground font-rajdhani">Loading…</div>
        ) : derived.list.length === 0 ? (
          <div className="py-10 text-center space-y-2 rounded-2xl border border-dashed border-primary/20 bg-card/30 backdrop-blur-xl">
            <p className="text-sm text-muted-foreground font-rajdhani">No active wishlist items.</p>
            <p className="text-xs text-muted-foreground">Add an item or link a goal cost to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {derived.list.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  currency={currency}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleAcquired={handleToggleAcquired}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Victory Archive (acquired items) */}
        {derived.acquired.length > 0 && (
          <Accordion type="single" collapsible className="mt-12">
            <AccordionItem value="history" className="border-none">
              <AccordionTrigger className="hover:no-underline py-2 px-4 bg-muted/20 rounded-t-xl border border-border">
                <span className="font-orbitron text-xs tracking-[0.15em] uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Acquisition Archive
                  <Badge variant="outline" className="ml-2 text-[10px]">{derived.acquired.length}</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-muted/10 p-4 rounded-b-xl border-x border-b border-border space-y-3">
                {derived.acquired.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-card/30 opacity-70"
                  >
                    <div className="min-w-0">
                      <p className="font-rajdhani text-sm line-through text-muted-foreground truncate">{item.name}</p>
                      {item.goal?.name && (
                        <p className="text-xs text-muted-foreground/60 truncate">{item.goal.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-orbitron text-muted-foreground">
                        {formatCurrency(Number(item.estimated_cost || 0), currency)}
                      </span>
                      <Switch
                        checked={item.acquired}
                        onCheckedChange={(v) => handleToggleAcquired(item.id, v)}
                        className="scale-75"
                      />
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}
