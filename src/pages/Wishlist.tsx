import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import {
  PactWishlistItemType,
  WishlistPriority,
  useCreatePactWishlistItem,
  useDeletePactWishlistItem,
  usePactWishlistItems,
  useUpdatePactWishlistItem,
} from "@/hooks/usePactWishlist";
import { usePact } from "@/hooks/usePact";
import { useGoals } from "@/hooks/useGoals";
import { useWishlistGoalSync } from "@/hooks/useWishlistGoalSync";
import {
  Check, Edit, Globe, ImageIcon, Link, Package, Plus,
  ShoppingBag, ListChecks, CircleDot, Zap, AlertTriangle, Flame,
} from "lucide-react";
import { DuplicateMergeDialog, type DuplicateMergePreview } from "@/components/wishlist/DuplicateMergeDialog";
import { NeedVsWantChart } from "@/components/wishlist/NeedVsWantChart";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { AcquisitionArchive } from "@/components/wishlist/AcquisitionArchive";
import { ImportFromUrlModal, type ScrapedProduct } from "@/components/wishlist/ImportFromUrlModal";
import { DeleteConfirmDialog } from "@/components/wishlist/DeleteConfirmDialog";
import { WishlistBulkBar } from "@/components/wishlist/WishlistBulkBar";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";

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

const PRIORITY_OPTIONS: { value: WishlistPriority; label: string; icon: any; colorClass: string }[] = [
  { value: "low", label: "Low", icon: CircleDot, colorClass: "text-cyan-400" },
  { value: "med", label: "Med", icon: Zap, colorClass: "text-amber-400" },
  { value: "high", label: "High", icon: AlertTriangle, colorClass: "text-orange-400" },
  { value: "critical", label: "Critical", icon: Flame, colorClass: "text-fuchsia-400" },
];

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

  useWishlistGoalSync(user?.id, pact?.id, items);

  const [filterType, setFilterType] = useState<"all" | PactWishlistItemType>("all");
  const [sortBy, setSortBy] = useState<"recent" | "cost_desc" | "cost_asc" | "priority" | "manual">("recent");
  const [search, setSearch] = useState("");

  // New item form
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newType, setNewType] = useState<PactWishlistItemType>("optional");
  const [newCategory, setNewCategory] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newGoalId, setNewGoalId] = useState("none");
  const [newPriority, setNewPriority] = useState<WishlistPriority>("low");

  // Import modal
  const [importOpen, setImportOpen] = useState(false);

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
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPriority, setEditPriority] = useState<WishlistPriority>("low");

  // Merge state
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeMode, setMergeMode] = useState<"create" | "edit" | null>(null);
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string | null>(null);
  const [mergeExistingPreview, setMergeExistingPreview] = useState<DuplicateMergePreview | null>(null);
  const [mergeIncomingPreview, setMergeIncomingPreview] = useState<DuplicateMergePreview | null>(null);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isSynced: boolean } | null>(null);

  // Bulk select
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  // DnD sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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
    setEditImageUrl(item.image_url ?? "");
    setEditPriority(item.priority ?? "low");
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
          name: dupeFull?.name ?? dupe.name, goalId: dupeFull?.goal_id ?? null, goalName: dupeFull?.goal?.name ?? null,
          category: dupeFull?.category ?? null, estimatedCost: Number(dupeFull?.estimated_cost ?? 0),
          itemType: (dupeFull?.item_type ?? "optional") as any, notes: dupeFull?.notes ?? null,
        });
        setMergeIncomingPreview({
          name: trimmed, goalId: nextGoalId,
          goalName: nextGoalId ? goals.find((g) => g.id === nextGoalId)?.name ?? null : null,
          category: editCategory.trim() || null,
          estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
          itemType: editType, notes: editNotes.trim() || null,
        });
        setMergeOpen(true);
        return;
      }
    }

    try {
      await updateItem.mutateAsync({
        userId: user.id, id: editId,
        patch: {
          name: trimmed, category: editCategory.trim() || null,
          estimated_cost: Number.isFinite(parsedCost) ? parsedCost : 0,
          item_type: editType, notes: editNotes.trim() || null,
          goal_id: nextGoalId, url: editUrl.trim() || null,
          image_url: editImageUrl.trim() || null,
          priority: editPriority,
        },
      });
      setEditOpen(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  const financeProjectTotal = useMemo(() => {
    return goals.reduce((sum, g) => sum + Number(g.estimated_cost || 0), 0);
  }, [goals]);

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, med: 2, low: 3 };

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
      if (sortBy === "priority") return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      if (sortBy === "manual") return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const requiredTotal = active.reduce((sum, i) => sum + (i.item_type === "required" ? Number(i.estimated_cost || 0) : 0), 0);
    const optionalTotal = active.reduce((sum, i) => sum + (i.item_type === "optional" ? Number(i.estimated_cost || 0) : 0), 0);
    const acquiredTotal = acquired.reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);

    return { list: sorted, active, acquired, totals: { required: requiredTotal, optional: optionalTotal, acquired: acquiredTotal } };
  }, [items, filterType, sortBy, search]);

  const createNew = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user) return;
    const trimmed = newName.trim();
    if (!trimmed) return;
    const parsedCost = Number((newCost || "0").replace(",", "."));
    const nextGoalId = newGoalId === "none" ? null : newGoalId;

    if (!opts?.skipDuplicateCheck) {
      const dupe = findDuplicateByNameAndGoal({ items, name: trimmed, goalId: nextGoalId });
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
          name: trimmed, goalId: nextGoalId,
          goalName: nextGoalId ? goals.find((g) => g.id === nextGoalId)?.name ?? null : null,
          category: newCategory.trim() || null,
          estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0, itemType: newType, notes: null,
        });
        setMergeOpen(true);
        return;
      }
    }

    try {
      await createItem.mutateAsync({
        userId: user.id, name: trimmed,
        estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
        itemType: newType, category: newCategory.trim() || null,
        goalId: nextGoalId, url: newUrl.trim() || null,
        imageUrl: newImageUrl.trim() || null,
        priority: newPriority,
      });
      setNewName(""); setNewCost(""); setNewCategory(""); setNewType("optional");
      setNewUrl(""); setNewImageUrl(""); setNewGoalId("none"); setNewPriority("low"); setNewOpen(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleImportProduct = (product: ScrapedProduct) => {
    setNewName(product.name || "");
    setNewCost(product.price !== null ? String(product.price) : "");
    setNewUrl(product.source_url || "");
    setNewImageUrl(product.image_url || "");
    setNewType("optional"); setNewCategory(""); setNewGoalId("none"); setNewPriority("low");
    setNewOpen(true);
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

  const handleDeleteRequest = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setDeleteTarget({ id, name: item.name, isSynced: item.source_type === "goal_sync" });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!user || !deleteTarget) return;
    deleteItem.mutate({ userId: user.id, id: deleteTarget.id });
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  // Bulk actions
  const toggleBulkSelect = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAcquired = () => {
    if (!user) return;
    bulkSelected.forEach((id) => {
      updateItem.mutate({ userId: user.id, id, patch: { acquired: true } });
    });
    toast({ title: "Bulk acquired", description: `${bulkSelected.size} items marked as acquired.` });
    setBulkSelected(new Set()); setBulkMode(false);
  };

  const handleBulkDelete = () => {
    if (!user) return;
    bulkSelected.forEach((id) => {
      deleteItem.mutate({ userId: user.id, id });
    });
    toast({ title: "Bulk deleted", description: `${bulkSelected.size} items removed.` });
    setBulkSelected(new Set()); setBulkMode(false);
  };

  const cancelBulk = () => { setBulkMode(false); setBulkSelected(new Set()); };

  // DnD
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !user) return;
    const oldIndex = derived.list.findIndex((i) => i.id === active.id);
    const newIndex = derived.list.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(derived.list, oldIndex, newIndex);
    reordered.forEach((item, index) => {
      if (item.sort_order !== index) {
        updateItem.mutate({ userId: user.id, id: item.id, patch: { sort_order: index } });
      }
    });
  };

  const isManualSort = sortBy === "manual";

  // Priority selector component
  const PrioritySelector = ({ value, onChange }: { value: WishlistPriority; onChange: (v: WishlistPriority) => void }) => (
    <div className="space-y-2">
      <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Priority</Label>
      <div className="flex gap-1.5">
        {PRIORITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono tracking-wider transition-all rounded-sm ${
                isActive
                  ? `${opt.colorClass} border-current bg-current/10`
                  : "text-slate-500 border-slate-700/50 bg-slate-900/30 hover:border-slate-600"
              }`}
            >
              <Icon className="h-3 w-3" />
              {opt.label.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CyberBackground />

      <DuplicateMergeDialog
        open={mergeOpen} onOpenChange={setMergeOpen}
        existing={mergeExistingPreview ?? { name: "", estimatedCost: 0, itemType: "optional", category: null, goalName: null, notes: null } as any}
        incoming={mergeIncomingPreview ?? { name: "", estimatedCost: 0, itemType: "optional", category: null, goalName: null, notes: null } as any}
        isBusy={mergeBusy} onMerge={performMerge} onKeepBoth={keepBoth}
      />

      <ImportFromUrlModal open={importOpen} onOpenChange={setImportOpen} onImport={handleImportProduct} />

      <DeleteConfirmDialog
        open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}
        itemName={deleteTarget?.name ?? ""} isSynced={deleteTarget?.isSynced} onConfirm={handleDeleteConfirm}
      />

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border-cyan-500/20 shadow-[0_0_40px_rgba(0,200,255,0.08)]">
          <DialogHeader>
            <DialogTitle className="font-mono text-cyan-400 tracking-[0.15em] uppercase text-sm">
              ▸ Edit Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">
                Name <span className="text-cyan-400">*</span>
              </Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Running shoes"
                className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-rajdhani" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Est. cost</Label>
                <Input value={editCost} onChange={(e) => setEditCost(e.target.value)} placeholder="0" inputMode="decimal"
                  className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Category</Label>
                <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="e.g. Equipment"
                  className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-rajdhani" />
              </div>
            </div>
            <PrioritySelector value={editPriority} onChange={setEditPriority} />
            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60 flex items-center gap-1.5">
                <Link className="h-3 w-3" /> URL
              </Label>
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..."
                className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60 flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" /> Image URL
              </Label>
              <Input value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="https://image..."
                className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-mono text-xs" />
              {editImageUrl && (
                <div className="h-16 w-16 border border-cyan-500/15 overflow-hidden bg-slate-900/50" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
                  <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-3 border border-amber-500/20 bg-amber-500/5" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
              <div className="space-y-0.5">
                <p className="text-sm font-rajdhani font-semibold text-amber-400/90">Required for Pact</p>
                <p className="text-xs text-muted-foreground">Mark necessities that support goal completion.</p>
              </div>
              <Switch checked={editType === "required"} onCheckedChange={(v) => setEditType(v ? "required" : "optional")} />
            </div>
            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Link to Goal</Label>
              <Select value={editGoalId} onValueChange={setEditGoalId}>
                <SelectTrigger className="bg-slate-900/60 border-cyan-500/15"><SelectValue placeholder="Select a goal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No goal</SelectItem>
                  {goals.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Notes</Label>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Why is this needed?" rows={3}
                className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-rajdhani" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-slate-700 hover:bg-slate-800 font-mono text-xs tracking-wider">Cancel</Button>
              <Button onClick={() => saveEdit()} disabled={!editName.trim() || updateItem.isPending}
                className="flex-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 font-mono text-xs tracking-wider">
                <Check className="h-4 w-4 mr-2" /> SAVE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative z-10 max-w-6xl mx-auto page-px py-6 md:py-8 space-y-6">
        <ModuleHeader
          systemLabel="ACQUISITION_PLAN // SYS.ACTIVE"
          title="WISH "
          titleAccent="LIST"
          badges={[]}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}
              className={`font-mono text-[10px] tracking-[0.12em] border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/5 rounded-sm ${bulkMode ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-400" : "text-slate-400"}`}
            >
              <ListChecks className="h-4 w-4 mr-2" /> {bulkMode ? "EXIT BULK" : "BULK"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="font-mono text-[10px] tracking-[0.12em] border-cyan-500/20 hover:border-cyan-400/40 hover:bg-cyan-500/5 text-slate-400 rounded-sm"
            >
              <Globe className="h-4 w-4 mr-2" /> IMPORT
            </Button>
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 font-mono text-[10px] tracking-[0.12em] rounded-sm">
                  <Plus className="h-4 w-4 mr-2" /> ADD ITEM
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950/95 backdrop-blur-2xl border-cyan-500/20 shadow-[0_0_40px_rgba(0,200,255,0.08)]">
                <DialogHeader>
                  <DialogTitle className="font-mono text-cyan-400 tracking-[0.15em] uppercase text-sm">▸ New Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">
                      Name <span className="text-cyan-400">*</span>
                    </Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Running shoes"
                      className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-rajdhani" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Est. cost</Label>
                      <Input value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="0" inputMode="decimal"
                        className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Category</Label>
                      <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Equipment"
                        className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-rajdhani" />
                    </div>
                  </div>
                  <PrioritySelector value={newPriority} onChange={setNewPriority} />
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60">Link to Goal</Label>
                    <Select value={newGoalId} onValueChange={setNewGoalId}>
                      <SelectTrigger className="bg-slate-900/60 border-cyan-500/15"><SelectValue placeholder="Select a goal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No goal</SelectItem>
                        {goals.map((g) => (<SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60 flex items-center gap-1.5">
                      <Link className="h-3 w-3" /> URL
                    </Label>
                    <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..."
                      className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono uppercase text-[10px] tracking-[0.15em] text-cyan-500/60 flex items-center gap-1.5">
                      <ImageIcon className="h-3 w-3" /> Image URL
                    </Label>
                    <Input value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="https://image..."
                      className="bg-slate-900/60 border-cyan-500/15 focus:border-cyan-400/50 font-mono text-xs" />
                    {newImageUrl && (
                      <div className="h-16 w-16 border border-cyan-500/15 overflow-hidden bg-slate-900/50" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
                        <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 border border-amber-500/20 bg-amber-500/5" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
                    <div className="space-y-0.5">
                      <p className="text-sm font-rajdhani font-semibold text-amber-400/90">Required for Pact</p>
                      <p className="text-xs text-muted-foreground">Use this for goal-linked necessities.</p>
                    </div>
                    <Switch checked={newType === "required"} onCheckedChange={(v) => setNewType(v ? "required" : "optional")} />
                  </div>
                  <Button onClick={() => createNew()} disabled={!newName.trim() || createItem.isPending}
                    className="w-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 font-mono text-[10px] tracking-[0.12em]">
                    <Plus className="h-4 w-4 mr-2" /> ADD TO WISHLIST
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </ModuleHeader>

        {/* Stats header */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Active Items", value: String(derived.active.length), icon: ShoppingBag },
            { label: "Total Cost", value: formatCurrency(derived.totals.required + derived.totals.optional, currency), icon: Package },
            { label: "Project Total", value: formatCurrency(financeProjectTotal, currency), icon: Package },
            { label: "Acquired", value: String(derived.acquired.length), icon: Check },
            { label: "Acquired Cost", value: formatCurrency(derived.totals.acquired, currency), icon: Package },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 border border-cyan-500/10 bg-slate-950/60 backdrop-blur-sm"
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="h-3.5 w-3.5 text-cyan-500/50" />
                <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-cyan-500/50">{stat.label}</p>
              </div>
              <p className="font-mono text-lg font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Need vs Want */}
        <NeedVsWantChart
          requiredTotal={derived.totals.required} optionalTotal={derived.totals.optional}
          acquiredTotal={derived.totals.acquired} currency={currency}
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item, category, or goal…"
            className="bg-slate-900/60 backdrop-blur-sm border-cyan-500/15 focus:border-cyan-400/40 font-rajdhani"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="md:w-48 bg-slate-900/60 backdrop-blur-sm border-cyan-500/15">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="required">Required</SelectItem>
              <SelectItem value="optional">Optional</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="md:w-48 bg-slate-900/60 backdrop-blur-sm border-cyan-500/15">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="cost_desc">Cost ↓</SelectItem>
              <SelectItem value="cost_asc">Cost ↑</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="manual">Manual (drag)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isManualSort && (
          <div className="flex items-center gap-2 px-3 py-2 border border-cyan-500/15 bg-cyan-500/5 text-xs font-mono text-cyan-400/70 rounded-sm">
            <span className="tracking-[0.1em]">▸ MANUAL MODE — Drag cards to reorder</span>
          </div>
        )}

        {/* Active items grid with DnD */}
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground font-mono tracking-wider">Loading…</div>
        ) : derived.list.length === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed border-cyan-500/15 bg-slate-950/40 backdrop-blur-xl"
            style={{ clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))" }}>
            <p className="text-sm text-muted-foreground font-mono">No active wishlist items.</p>
            <p className="text-xs text-cyan-500/40 font-mono">Add an item or import from a URL to get started.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={derived.list.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {derived.list.map((item) => (
                    <WishlistItemCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      onEdit={openEdit}
                      onDelete={handleDeleteRequest}
                      onToggleAcquired={handleToggleAcquired}
                      bulkMode={bulkMode}
                      selected={bulkSelected.has(item.id)}
                      onSelect={toggleBulkSelect}
                      draggable={isManualSort}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Acquisition Archive with edit */}
        <AcquisitionArchive
          items={derived.acquired}
          currency={currency}
          onToggleAcquired={handleToggleAcquired}
          onEdit={openEdit}
        />
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {bulkMode && bulkSelected.size > 0 && (
          <WishlistBulkBar count={bulkSelected.size} onMarkAcquired={handleBulkAcquired} onDelete={handleBulkDelete} onCancel={cancelBulk} />
        )}
      </AnimatePresence>
    </div>
  );
}
