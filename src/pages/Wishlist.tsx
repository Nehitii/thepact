import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CyberBackground } from "@/components/CyberBackground";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Check, Edit, Plus, ShoppingBag, Target, Trash2 } from "lucide-react";
import { DuplicateMergeDialog, type DuplicateMergePreview } from "@/components/wishlist/DuplicateMergeDialog";

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
        (i.goal_id ?? null) === goalKey,
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

  const [filterType, setFilterType] = useState<"all" | PactWishlistItemType>("all");
  const [sortBy, setSortBy] = useState<"recent" | "cost_desc" | "cost_asc">("recent");
  const [search, setSearch] = useState("");

  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState<string>("");
  const [newType, setNewType] = useState<PactWishlistItemType>("optional");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newOpen, setNewOpen] = useState(false);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCost, setEditCost] = useState<string>("");
  const [editType, setEditType] = useState<PactWishlistItemType>("optional");
  const [editNotes, setEditNotes] = useState("");
  const [editGoalId, setEditGoalId] = useState<string>("none");

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeMode, setMergeMode] = useState<"create" | "edit" | null>(null);
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string | null>(null);
  const [mergeExistingPreview, setMergeExistingPreview] = useState<DuplicateMergePreview | null>(null);
  const [mergeIncomingPreview, setMergeIncomingPreview] = useState<DuplicateMergePreview | null>(null);

  const editingItem = useMemo(() => (editId ? (items.find((i) => i.id === editId) ?? null) : null), [editId, items]);

  const openEdit = (item: (typeof items)[number]) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditCategory(item.category ?? "");
    setEditCost(String(item.estimated_cost ?? 0));
    setEditType(item.item_type);
    setEditNotes(item.notes ?? "");
    setEditGoalId(item.goal_id ?? "none");
    setEditOpen(true);
  };

  const saveEdit = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user || !editId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    const parsedCost = Number((editCost || "0").replace(",", "."));
    const nextGoalId = editGoalId === "none" ? null : editGoalId;

    if (!opts?.skipDuplicateCheck) {
      const dupe = findDuplicateByNameAndGoal({
        items,
        name: trimmed,
        goalId: nextGoalId,
        excludeId: editId,
      });
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
          goalName: nextGoalId ? (goals.find((g) => g.id === nextGoalId)?.name ?? null) : null,
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
      },
    });

    setEditOpen(false);
  };

  const derived = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let filtered = items;
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

    const requiredTotal = items
      .filter((i) => i.item_type === "required")
      .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);
    const optionalTotal = items
      .filter((i) => i.item_type === "optional")
      .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);

    return {
      list: sorted,
      totals: {
        required: requiredTotal,
        optional: optionalTotal,
        all: requiredTotal + optionalTotal,
      },
    };
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
          goalId: null,
          goalName: null,
          category: newCategory.trim() || null,
          estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
          itemType: newType,
          notes: null,
        });
        setMergeOpen(true);
        return;
      }
    }

    await createItem.mutateAsync({
      userId: user.id,
      name: trimmed,
      estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
      itemType: newType,
      category: newCategory.trim() || null,
    });

    setNewName("");
    setNewCost("");
    setNewCategory("");
    setNewType("optional");
    setNewOpen(false);
  };

  const performMerge = async () => {
    if (!user || !mergeMode || !mergeDuplicateId || !mergeExistingPreview || !mergeIncomingPreview) return;
    try {
      setMergeBusy(true);

      const dupeItem = items.find((i) => i.id === mergeDuplicateId);
      const currentItem = editId ? items.find((i) => i.id === editId) : null;

      const mergedCost = Number(dupeItem?.estimated_cost ?? 0) + Number(mergeIncomingPreview.estimatedCost ?? 0);
      const mergedType: PactWishlistItemType =
        dupeItem?.item_type === "required" || mergeIncomingPreview.itemType === "required" ? "required" : "optional";
      const mergedCategory = (dupeItem?.category ?? "").trim() || (mergeIncomingPreview.category ?? "").trim() || null;
      const mergedNotes =
        [dupeItem?.notes?.trim(), mergeIncomingPreview.notes?.trim()].filter(Boolean).join("\n\n") || null;

      await updateItem.mutateAsync({
        userId: user.id,
        id: mergeDuplicateId,
        patch: {
          name: dupeItem?.name ?? mergeIncomingPreview.name,
          goal_id: dupeItem?.goal_id ?? mergeIncomingPreview.goalId ?? null,
          estimated_cost: mergedCost,
          item_type: mergedType,
          category: mergedCategory,
          notes: mergedNotes,
        },
      });

      if (mergeMode === "edit" && currentItem && currentItem.id !== mergeDuplicateId) {
        await deleteItem.mutateAsync({ userId: user.id, id: currentItem.id });
        setEditOpen(false);
      }

      toast({
        title: "Merged",
        description: "Duplicates combined into a single wishlist item.",
      });

      setMergeOpen(false);
      setMergeMode(null);
      setMergeDuplicateId(null);
      setMergeExistingPreview(null);
      setMergeIncomingPreview(null);
      setNewOpen(false);
    } finally {
      setMergeBusy(false);
    }
  };

  const keepBoth = async () => {
    if (!mergeMode) return;
    setMergeOpen(false);
    if (mergeMode === "create") {
      await createNew({ skipDuplicateCheck: true });
      return;
    }
    await saveEdit({ skipDuplicateCheck: true });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />

      <DuplicateMergeDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        existing={
          mergeExistingPreview ??
          ({
            name: "",
            estimatedCost: 0,
            itemType: "optional",
            category: null,
            goalName: null,
            notes: null,
          } as any)
        }
        incoming={
          mergeIncomingPreview ??
          ({
            name: "",
            estimatedCost: 0,
            itemType: "optional",
            category: null,
            goalName: null,
            notes: null,
          } as any)
        }
        isBusy={mergeBusy}
        onMerge={performMerge} // Ajouté pour corriger l'erreur TS
        onKeepBoth={keepBoth} // Ajouté pour corriger l'erreur TS
      />

      {/* Edit modal (single instance for smooth UX) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="animate-enter">
          <DialogHeader>
            <DialogTitle>Edit wishlist item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Running shoes" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated cost</Label>
                <Input
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="e.g. Equipment"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Required for Pact</p>
                <p className="text-xs text-muted-foreground">Mark necessities that support goal completion.</p>
              </div>
              <Switch
                checked={editType === "required"}
                onCheckedChange={(v) => setEditType(v ? "required" : "optional")}
              />
            </div>

            <div className="space-y-2">
              <Label>Link to Goal (optional)</Label>
              <Select value={editGoalId} onValueChange={setEditGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingItem?.goal?.name && (
                <p className="text-xs text-muted-foreground">
                  Currently linked: <span className="text-foreground/80">{editingItem.goal.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Why is this needed? When do you want it?"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={() => saveEdit()} disabled={!editName.trim() || updateItem.isPending} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
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
              <Button variant="hud" className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New wishlist item</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Running shoes"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estimated cost</Label>
                    <Input
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      placeholder="0"
                      inputMode="decimal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category (optional)</Label>
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g. Equipment"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Required for Pact</p>
                    <p className="text-xs text-muted-foreground">Use this for goal-linked necessities.</p>
                  </div>
                  <Switch
                    checked={newType === "required"}
                    onCheckedChange={(v) => setNewType(v ? "required" : "optional")}
                  />
                </div>

                <Button onClick={() => createNew()} disabled={!newName.trim() || createItem.isPending}>
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-orbitron font-bold tracking-wider text-primary">Wishlist</h1>
          <p className="text-sm text-muted-foreground font-rajdhani">
            A calm planning space to separate what moves your pact forward from what can wait.
          </p>
        </div>

        <Card className="bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Financial overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Required</p>
                <p className="text-lg font-semibold">{formatCurrency(derived.totals.required, currency)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Optional</p>
                <p className="text-lg font-semibold">{formatCurrency(derived.totals.optional, currency)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-lg font-semibold">{formatCurrency(derived.totals.all, currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item, category, or goal…"
              />

              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="md:w-48">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="cost_desc">Cost (high → low)</SelectItem>
                  <SelectItem value="cost_asc">Cost (low → high)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : derived.list.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No wishlist items yet.</p>
                <p className="text-xs text-muted-foreground">
                  Add one to start clarifying what’s essential vs optional.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {derived.list.map((item) => {
                  const required = item.item_type === "required";
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col md:flex-row md:items-center gap-3 animate-fade-in"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{item.name}</p>
                          <Badge variant={required ? "default" : "secondary"} className="font-rajdhani">
                            {required ? "Required" : "Optional"}
                          </Badge>
                          {item.category && (
                            <Badge variant="outline" className="font-rajdhani">
                              {item.category}
                            </Badge>
                          )}
                        </div>
                        {item.goal?.name && (
                          <button
                            onClick={() => navigate(`/goals/${item.goal?.id}`)}
                            className="inline-flex items-center gap-2 text-sm text-primary/80 hover:text-primary font-rajdhani"
                          >
                            <Target className="h-4 w-4" />
                            <span className="truncate">{item.goal.name}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatCurrency(Number(item.estimated_cost || 0), currency)}
                          </p>
                          <div className="flex items-center gap-2 justify-end mt-1">
                            <Label className="text-xs text-muted-foreground">Already acquired?</Label>
                            <Switch
                              checked={item.acquired}
                              onCheckedChange={(v) => {
                                if (!user) return;
                                updateItem.mutate({
                                  userId: user.id,
                                  id: item.id,
                                  patch: { acquired: v },
                                });
                              }}
                            />
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(item)}
                          className="text-primary/70 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => user && deleteItem.mutate({ userId: user.id, id: item.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
