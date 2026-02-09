import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ArrowLeft,
  Check,
  Edit,
  Plus,
  ShoppingBag,
  Target,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  Zap,
  PackageOpen,
  MoreHorizontal,
} from "lucide-react";
import { DuplicateMergeDialog, type DuplicateMergePreview } from "@/components/wishlist/DuplicateMergeDialog";

// --- Helpers ---
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

  // States pour la création/édition
  const [newName, setNewName] = useState("");
  const [newCost, setNewCost] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const { data: pact } = usePact(user?.id);
  const { data: goals = [] } = useGoals(pact?.id);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editType, setEditType] = useState<PactWishlistItemType>("optional");
  const [editNotes, setEditNotes] = useState("");
  const [editGoalId, setEditGoalId] = useState("none");

  // Merge States
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeMode, setMergeMode] = useState<"create" | "edit" | null>(null);
  const [mergeDuplicateId, setMergeDuplicateId] = useState<string | null>(null);
  const [mergeExistingPreview, setMergeExistingPreview] = useState<DuplicateMergePreview | null>(null);
  const [mergeIncomingPreview, setMergeIncomingPreview] = useState<DuplicateMergePreview | null>(null);

  // --- Logic ---
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
      .filter((i) => i.item_type === "required" && !i.acquired)
      .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);
    const optionalTotal = items
      .filter((i) => i.item_type === "optional" && !i.acquired)
      .reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);
    const acquiredTotal = items.filter((i) => i.acquired).reduce((sum, i) => sum + Number(i.estimated_cost || 0), 0);

    return {
      list: sorted,
      totals: {
        required: requiredTotal,
        optional: optionalTotal,
        acquired: acquiredTotal,
        all: requiredTotal + optionalTotal,
      },
    };
  }, [items, filterType, sortBy, search]);

  const openEdit = (item: any) => {
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
      const dupe = findDuplicateByNameAndGoal({ items, name: trimmed, goalId: nextGoalId, excludeId: editId });
      if (dupe) {
        setMergeMode("edit");
        setMergeDuplicateId(dupe.id);
        setMergeOpen(true);
        // ... (Logique de preview identique au code original)
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

  const createNew = async (opts?: { skipDuplicateCheck?: boolean }) => {
    if (!user || !newName.trim()) return;
    const parsedCost = Number((newCost || "0").replace(",", "."));

    if (!opts?.skipDuplicateCheck) {
      const dupe = findDuplicateByNameAndGoal({ items, name: newName, goalId: null });
      if (dupe) {
        setMergeMode("create");
        setMergeDuplicateId(dupe.id);
        setMergeOpen(true);
        return;
      }
    }

    await createItem.mutateAsync({
      userId: user.id,
      name: newName.trim(),
      estimatedCost: Number.isFinite(parsedCost) ? parsedCost : 0,
      itemType: "optional",
    });

    setNewName("");
    setNewCost("");
    setNewOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#030711] text-slate-50 relative overflow-hidden font-rajdhani">
      <CyberBackground />

      {/* Glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 space-y-10">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 text-primary/60 hover:text-primary transition-colors mb-2"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs uppercase tracking-widest font-orbitron">Return to Hub</span>
            </button>
            <h1 className="text-5xl font-orbitron font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary/80 animate-gradient-x">
              WISH<span className="text-white">LIST</span>
            </h1>
            <p className="text-slate-400 max-w-md italic border-l-2 border-primary/30 pl-4 mt-2">
              Strategic procurement for your Pact. Differentiate assets from distractions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={newOpen} onOpenChange={setNewOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-5 w-5 mr-2" />
                  INITIALIZE ITEM
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-950 border-primary/20 backdrop-blur-2xl">
                <DialogHeader>
                  <DialogTitle className="font-orbitron text-xl">NEW ASSET ENTRY</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-primary/60">Asset Designation</Label>
                    <Input
                      className="bg-slate-900/50 border-white/10"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Neural Link 2.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-primary/60">Credit Estimation</Label>
                    <Input
                      className="bg-slate-900/50 border-white/10"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  </div>
                  <Button
                    className="w-full h-12 font-orbitron"
                    onClick={() => createNew()}
                    disabled={!newName || createItem.isPending}
                  >
                    CONFIRM ACQUISITION PLAN
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tactical Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3 bg-slate-900/40 backdrop-blur-md border-white/5 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-xs font-orbitron text-primary/60 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Financial Projections
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-3xl font-bold font-rajdhani">
                    {formatCurrency(derived.totals.required, currency)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">Vital Needs</p>
                </div>
                <div>
                  <p className="text-3xl font-bold font-rajdhani text-blue-400">
                    {formatCurrency(derived.totals.optional, currency)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">Optional Assets</p>
                </div>
                <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                  <p className="text-3xl font-bold font-rajdhani text-emerald-400">
                    {formatCurrency(derived.totals.acquired, currency)}
                  </p>
                  <p className="text-xs text-slate-500 uppercase">Total Invested</p>
                </div>
              </div>

              {/* Progress Bar visual */}
              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-[10px] uppercase tracking-tighter text-slate-500">
                  <span>Allocation Breakdown</span>
                  <span>{Math.round((derived.totals.required / (derived.totals.all || 1)) * 100)}% Vital</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(derived.totals.required / (derived.totals.all || 1)) * 100}%` }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(derived.totals.optional / (derived.totals.all || 1)) * 100}%` }}
                    className="h-full bg-blue-500 opacity-60"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/20 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center relative overflow-hidden group">
            <Zap className="h-12 w-12 text-primary mb-2 animate-pulse" />
            <p className="font-orbitron font-bold text-lg leading-tight">
              READY FOR
              <br />
              UPGRADE
            </p>
            <p className="text-[10px] text-primary/60 uppercase mt-2 tracking-widest">Inventory synced</p>
            <div className="absolute -bottom-2 -right-2 opacity-10 group-hover:scale-110 transition-transform">
              <ShoppingBag size={100} />
            </div>
          </Card>
        </div>

        {/* Filters & Search - Tactical Bar */}
        <div className="flex flex-col md:flex-row gap-4 bg-slate-900/60 p-2 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Query database (name, category, goal)..."
              className="pl-11 h-12 bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-slate-600"
            />
          </div>

          <Separator orientation="vertical" className="hidden md:block h-12 bg-white/5" />

          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full md:w-auto">
            <TabsList className="bg-transparent h-12 gap-1">
              <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-white/5">
                ALL
              </TabsTrigger>
              <TabsTrigger
                value="required"
                className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                VITAL
              </TabsTrigger>
              <TabsTrigger
                value="optional"
                className="rounded-xl data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                LUXURY
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full md:w-[180px] h-12 bg-white/5 border-none rounded-xl font-orbitron text-xs">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue placeholder="SORT BY" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-white/10">
              <SelectItem value="recent">CHRONOLOGICAL</SelectItem>
              <SelectItem value="cost_desc">HIGH VALUE</SelectItem>
              <SelectItem value="cost_asc">LOW VALUE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs uppercase tracking-[0.3em] text-primary animate-pulse">Scanning Inventory...</p>
            </div>
          ) : derived.list.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-3xl">
              <PackageOpen className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No assets detected</h3>
              <p className="text-sm text-slate-600 mt-1">
                Initiate your first acquisition plan to populate this sector.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence mode="popLayout">
                {derived.list.map((item) => {
                  const isRequired = item.item_type === "required";
                  const isAcquired = item.acquired;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group relative flex flex-col md:flex-row md:items-center gap-6 p-5 rounded-2xl border transition-all duration-300 ${
                        isAcquired
                          ? "bg-slate-900/20 border-emerald-500/20 opacity-60"
                          : "bg-slate-900/40 border-white/5 hover:border-primary/40 hover:bg-slate-900/60"
                      }`}
                    >
                      {/* Left: Status & Main Info */}
                      <div className="flex-1 min-w-0 flex items-start gap-4">
                        <div
                          className={`mt-1 p-2 rounded-lg border flex-shrink-0 transition-colors ${
                            isAcquired
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                              : "bg-white/5 border-white/10 text-slate-500"
                          }`}
                        >
                          {isAcquired ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-lg font-bold tracking-wide transition-all ${isAcquired ? "line-through text-slate-500" : "text-slate-100"}`}
                            >
                              {item.name}
                            </h3>
                            <Badge
                              className={`font-orbitron text-[10px] py-0 h-5 border-none ${
                                isRequired ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {isRequired ? "REQUIRED" : "OPTIONAL"}
                            </Badge>
                            {item.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 uppercase tracking-widest border border-white/5">
                                {item.category}
                              </span>
                            )}
                          </div>

                          {item.goal?.name && (
                            <button
                              onClick={() => navigate(`/goals/${item.goal_id}`)}
                              className="flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary transition-colors font-medium uppercase tracking-wider"
                            >
                              <Target className="h-3 w-3" />
                              Linked: {item.goal.name}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Pricing & Controls */}
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                        <div className="text-right">
                          <p
                            className={`text-xl font-bold font-rajdhani ${isAcquired ? "text-slate-500" : "text-white"}`}
                          >
                            {formatCurrency(Number(item.estimated_cost || 0), currency)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase text-slate-500 tracking-tighter">Acquired</span>
                            <Switch
                              checked={isAcquired}
                              onCheckedChange={(v) => {
                                if (!user) return;
                                updateItem.mutate({ userId: user.id, id: item.id, patch: { acquired: v } });
                              }}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => user && deleteItem.mutate({ userId: user.id, id: item.id })}
                            className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (Gardé pour les réglages profonds) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-950 border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" /> EDIT ASSET PARAMETERS
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Designation</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Credit Value</Label>
                <Input
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold uppercase tracking-wider">Vital Asset</p>
                  <p className="text-[10px] text-slate-500 uppercase">Critical for Pact success</p>
                </div>
                <Switch
                  checked={editType === "required"}
                  onCheckedChange={(v) => setEditType(v ? "required" : "optional")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Sector (Category)</Label>
                <Input
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Goal Linkage</Label>
                <Select value={editGoalId} onValueChange={setEditGoalId}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-white/10">
                    <SelectItem value="none">UNLINKED</SelectItem>
                    {goals.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500">Intelligence Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="bg-white/5 border-white/10 min-h-[100px]"
                  placeholder="Technical specifications or reasoning..."
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-white/10">
              ABORT
            </Button>
            <Button onClick={() => saveEdit()} className="flex-1 bg-primary text-primary-foreground font-bold">
              SAVE CHANGES
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DuplicateMergeDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        existing={mergeExistingPreview ?? ({} as any)}
        incoming={mergeIncomingPreview ?? ({} as any)}
        isBusy={mergeBusy}
        // ... passez les props onMerge et onKeepBoth
      />
    </div>
  );
}
